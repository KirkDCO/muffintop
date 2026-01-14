import { getDb } from '../db/connection.js';

interface NutrientData {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  added_sugar: number | null;
}

interface FoodNutrients {
  calories: number;
  protein: number;
  carbs: number;
  addedSugar: number | null;
  foodName: string;
}

/**
 * Calculate nutrients for a given portion of a food item
 */
export function calculateNutrientsForFood(
  fdcId: number,
  portionGrams: number
): FoodNutrients {
  const db = getDb();

  const food = db
    .prepare(
      `SELECT description, calories, protein, carbs, added_sugar
       FROM food WHERE fdc_id = ?`
    )
    .get(fdcId) as (NutrientData & { description: string }) | undefined;

  if (!food) {
    throw new Error(`Food with id ${fdcId} not found`);
  }

  const factor = portionGrams / 100;

  return {
    calories: (food.calories ?? 0) * factor,
    protein: (food.protein ?? 0) * factor,
    carbs: (food.carbs ?? 0) * factor,
    addedSugar: food.added_sugar !== null ? food.added_sugar * factor : null,
    foodName: food.description,
  };
}

/**
 * Calculate nutrients for a custom food
 */
export function calculateNutrientsForCustomFood(
  customFoodId: number,
  portionGrams: number,
  userId: number
): FoodNutrients {
  const db = getDb();

  const food = db
    .prepare(
      `SELECT name, calories, protein, carbs, added_sugar
       FROM custom_food WHERE id = ? AND user_id = ?`
    )
    .get(customFoodId, userId) as (NutrientData & { name: string }) | undefined;

  if (!food) {
    throw new Error(`Custom food with id ${customFoodId} not found`);
  }

  const factor = portionGrams / 100;

  return {
    calories: (food.calories ?? 0) * factor,
    protein: (food.protein ?? 0) * factor,
    carbs: (food.carbs ?? 0) * factor,
    addedSugar: food.added_sugar !== null ? food.added_sugar * factor : null,
    foodName: food.name,
  };
}

/**
 * Calculate nutrients for a recipe
 */
export function calculateNutrientsForRecipe(
  recipeId: number,
  portionGrams: number,
  userId: number
): FoodNutrients {
  const db = getDb();

  const recipe = db
    .prepare(
      `SELECT name, servings, calories, protein, carbs, added_sugar
       FROM recipe WHERE id = ? AND user_id = ?`
    )
    .get(recipeId, userId) as (NutrientData & { name: string; servings: number }) | undefined;

  if (!recipe) {
    throw new Error(`Recipe with id ${recipeId} not found`);
  }

  // Recipe nutrients are stored as totals, calculate per gram
  // Total weight would need to be tracked separately; for now use portion directly
  // This assumes portionGrams represents amount of recipe consumed
  // A more sophisticated approach would track total recipe weight

  return {
    calories: recipe.calories ?? 0,
    protein: recipe.protein ?? 0,
    carbs: recipe.carbs ?? 0,
    addedSugar: recipe.added_sugar,
    foodName: recipe.name,
  };
}
