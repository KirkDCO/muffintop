import { getDb } from '../db/connection.js';
import {
  NUTRIENT_REGISTRY,
  ALL_NUTRIENT_KEYS,
  getNutrientColumnsSql,
  createEmptyNutrientValues,
  type NutrientValues,
  type NutrientKey,
} from '@muffintop/shared/types';

// Pre-compute the nutrient columns SQL for queries
const NUTRIENT_COLUMNS_SQL = getNutrientColumnsSql();

export interface FoodNutrientResult {
  nutrients: NutrientValues;
  foodName: string;
}

/**
 * Convert a database row to NutrientValues
 * Extracts nutrient values from row using the registry's dbColumn mapping
 */
function rowToNutrients(row: Record<string, unknown>): NutrientValues {
  const nutrients = createEmptyNutrientValues();

  for (const key of ALL_NUTRIENT_KEYS) {
    const dbColumn = NUTRIENT_REGISTRY[key].dbColumn;
    const value = row[dbColumn];
    nutrients[key] = typeof value === 'number' ? value : null;
  }

  return nutrients;
}

/**
 * Scale all nutrients by a factor (e.g., for portion size calculation)
 */
function scaleNutrients(nutrients: NutrientValues, factor: number): NutrientValues {
  const scaled = createEmptyNutrientValues();

  for (const key of ALL_NUTRIENT_KEYS) {
    const value = nutrients[key];
    scaled[key] = value !== null ? value * factor : null;
  }

  return scaled;
}

/**
 * Sum multiple nutrient objects together
 */
export function sumNutrients(nutrientArrays: NutrientValues[]): NutrientValues {
  const totals = createEmptyNutrientValues();

  // Initialize all to 0
  for (const key of ALL_NUTRIENT_KEYS) {
    totals[key] = 0;
  }

  for (const nutrients of nutrientArrays) {
    for (const key of ALL_NUTRIENT_KEYS) {
      const value = nutrients[key];
      if (value !== null) {
        totals[key] = (totals[key] ?? 0) + value;
      }
    }
  }

  return totals;
}

/**
 * Calculate nutrients for a given portion of a food item
 */
export function calculateNutrientsForFood(
  fdcId: number,
  portionGrams: number
): FoodNutrientResult {
  const db = getDb();

  const food = db
    .prepare(
      `SELECT description, ${NUTRIENT_COLUMNS_SQL}
       FROM food WHERE fdc_id = ?`
    )
    .get(fdcId) as Record<string, unknown> | undefined;

  if (!food) {
    throw new Error(`Food with id ${fdcId} not found`);
  }

  const baseNutrients = rowToNutrients(food);
  const factor = portionGrams / 100;

  return {
    nutrients: scaleNutrients(baseNutrients, factor),
    foodName: food.description as string,
  };
}

/**
 * Calculate nutrients for a custom food
 * Note: Custom food nutrients are stored per 1 serving.
 * The servingsConsumed parameter is the number of servings eaten.
 * Accessible if user owns it OR if it's shared.
 */
export function calculateNutrientsForCustomFood(
  customFoodId: number,
  servingsConsumed: number,
  userId: number
): FoodNutrientResult {
  const db = getDb();

  // Accessible if owner OR shared
  const food = db
    .prepare(
      `SELECT name, ${NUTRIENT_COLUMNS_SQL}
       FROM custom_food WHERE id = ? AND (user_id = ? OR is_shared = 1)`
    )
    .get(customFoodId, userId) as Record<string, unknown> | undefined;

  if (!food) {
    throw new Error(`Custom food with id ${customFoodId} not found`);
  }

  const baseNutrients = rowToNutrients(food);
  // Nutrients are per 1 serving, scale by servings consumed
  const factor = servingsConsumed;

  return {
    nutrients: scaleNutrients(baseNutrients, factor),
    foodName: food.name as string,
  };
}

/**
 * Calculate nutrients for a recipe
 * Note: Recipe nutrients are stored as totals for the entire recipe.
 * The servingsConsumed parameter represents servings consumed.
 * For example, if a recipe has 4 servings and user eats 1.5 servings,
 * servingsConsumed = 1.5 and we return 1.5/4 = 37.5% of total nutrients.
 * Accessible if user owns it OR if it's shared.
 */
export function calculateNutrientsForRecipe(
  recipeId: number,
  servingsConsumed: number,
  userId: number
): FoodNutrientResult {
  const db = getDb();

  // Accessible if owner OR shared
  const recipe = db
    .prepare(
      `SELECT name, servings, ${NUTRIENT_COLUMNS_SQL}
       FROM recipe WHERE id = ? AND (user_id = ? OR is_shared = 1)`
    )
    .get(recipeId, userId) as Record<string, unknown> | undefined;

  if (!recipe) {
    throw new Error(`Recipe with id ${recipeId} not found`);
  }

  const totalNutrients = rowToNutrients(recipe);
  const totalServings = recipe.servings as number;

  // Scale nutrients by (servingsConsumed / totalServings)
  const factor = servingsConsumed / totalServings;

  return {
    nutrients: scaleNutrients(totalNutrients, factor),
    foodName: recipe.name as string,
  };
}

/**
 * Get nutrient values for a food without scaling (per 100g)
 */
export function getFoodBaseNutrients(fdcId: number): NutrientValues {
  const db = getDb();

  const food = db
    .prepare(
      `SELECT ${NUTRIENT_COLUMNS_SQL}
       FROM food WHERE fdc_id = ?`
    )
    .get(fdcId) as Record<string, unknown> | undefined;

  if (!food) {
    throw new Error(`Food with id ${fdcId} not found`);
  }

  return rowToNutrients(food);
}
