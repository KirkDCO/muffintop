import { getDb } from '../db/connection.js';
import { NotFoundError } from '../middleware/error-handler.js';
import {
  calculateNutrientsForFood,
  calculateNutrientsForCustomFood,
  sumNutrients,
} from '../utils/nutrient-calc.js';
import {
  getNutrientColumnsSql,
  getNutrientDbColumns,
  createEmptyNutrientValues,
  ALL_NUTRIENT_KEYS,
  NUTRIENT_REGISTRY,
  type NutrientValues,
  type Recipe,
  type RecipeSummary,
  type RecipeIngredient,
} from '@muffintop/shared/types';
import type {
  CreateRecipeInput,
  UpdateRecipeInput,
  RecipeQuery,
  ImportTblspRecipeInput,
} from '../models/recipe.js';

const NUTRIENT_COLUMNS_SQL = getNutrientColumnsSql();
const NUTRIENT_DB_COLUMNS = getNutrientDbColumns();

interface RecipeRow {
  id: number;
  user_id: number;
  name: string;
  servings: number;
  tblsp_recipe_id: number | null;
  is_shared: number;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface RecipeIngredientRow {
  id: number;
  recipe_id: number;
  food_id: number | null;
  custom_food_id: number | null;
  quantity_grams: number;
  display_quantity: string | null;
  position: number;
  food_name: string | null;
  custom_food_name: string | null;
}

/**
 * Convert a database row to NutrientValues
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
 * Calculate total nutrients from ingredients
 */
function calculateRecipeNutrients(
  ingredients: Array<{ foodId?: number; customFoodId?: number; quantityGrams: number }>,
  userId: number
): NutrientValues {
  const ingredientNutrients: NutrientValues[] = [];

  for (const ing of ingredients) {
    if (ing.foodId) {
      const result = calculateNutrientsForFood(ing.foodId, ing.quantityGrams);
      ingredientNutrients.push(result.nutrients);
    } else if (ing.customFoodId) {
      const result = calculateNutrientsForCustomFood(ing.customFoodId, ing.quantityGrams, userId);
      ingredientNutrients.push(result.nutrients);
    }
  }

  return sumNutrients(ingredientNutrients);
}

/**
 * Build nutrient columns for INSERT/UPDATE
 */
function buildNutrientColumns(): { columns: string; placeholders: string } {
  const columns = NUTRIENT_DB_COLUMNS.join(', ');
  const placeholders = NUTRIENT_DB_COLUMNS.map(() => '?').join(', ');
  return { columns, placeholders };
}

/**
 * Get nutrient values as array in column order
 */
function nutrientsToValues(nutrients: NutrientValues): (number | null)[] {
  return ALL_NUTRIENT_KEYS.map((key) => nutrients[key]);
}

export const recipeService = {
  /**
   * List user's recipes + shared recipes from others, with optional search
   */
  list(userId: number, query: RecipeQuery): RecipeSummary[] {
    const db = getDb();
    const { search, limit } = query;

    let sql: string;
    let params: (string | number)[];

    if (search && search.length >= 2) {
      // Use FTS search - user's own + shared from others
      sql = `
        SELECT r.id, r.user_id, r.name, r.servings, r.calories, r.is_shared, r.created_at
        FROM recipe r
        JOIN recipe_fts fts ON r.id = fts.rowid
        WHERE (r.user_id = ? OR r.is_shared = 1) AND recipe_fts MATCH ?
        ORDER BY rank
        LIMIT ?
      `;
      // Add wildcards for prefix matching
      const searchTerm = search
        .split(/\s+/)
        .map((term) => `${term}*`)
        .join(' ');
      params = [userId, searchTerm, limit];
    } else {
      // No search, return recent - user's own + shared from others
      sql = `
        SELECT id, user_id, name, servings, calories, is_shared, created_at
        FROM recipe
        WHERE user_id = ? OR is_shared = 1
        ORDER BY updated_at DESC
        LIMIT ?
      `;
      params = [userId, limit];
    }

    const rows = db.prepare(sql).all(...params) as Array<{
      id: number;
      user_id: number;
      name: string;
      servings: number;
      calories: number;
      is_shared: number;
      created_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      servings: row.servings,
      caloriesPerServing: row.servings > 0 ? Math.round(row.calories / row.servings) : 0,
      isShared: row.is_shared === 1,
      createdAt: row.created_at,
    }));
  },

  /**
   * Get single recipe with ingredients
   * Accessible if user owns it OR if it's shared
   */
  getById(userId: number, recipeId: number): Recipe {
    const db = getDb();

    // Get recipe - accessible if owner OR shared
    const recipe = db
      .prepare(
        `SELECT id, user_id, name, servings, tblsp_recipe_id, is_shared, created_at, updated_at, ${NUTRIENT_COLUMNS_SQL}
         FROM recipe WHERE id = ? AND (user_id = ? OR is_shared = 1)`
      )
      .get(recipeId, userId) as RecipeRow | undefined;

    if (!recipe) {
      throw new NotFoundError(`Recipe with id ${recipeId} not found`);
    }

    // Get ingredients with food names
    const ingredients = db
      .prepare(
        `SELECT ri.id, ri.recipe_id, ri.food_id, ri.custom_food_id,
                ri.quantity_grams, ri.display_quantity, ri.position,
                f.description as food_name,
                cf.name as custom_food_name
         FROM recipe_ingredient ri
         LEFT JOIN food f ON ri.food_id = f.fdc_id
         LEFT JOIN custom_food cf ON ri.custom_food_id = cf.id
         WHERE ri.recipe_id = ?
         ORDER BY ri.position`
      )
      .all(recipeId) as RecipeIngredientRow[];

    return {
      id: recipe.id,
      userId: recipe.user_id,
      name: recipe.name,
      servings: recipe.servings,
      nutrients: rowToNutrients(recipe),
      ingredients: ingredients.map((ing) => ({
        id: ing.id,
        foodId: ing.food_id,
        customFoodId: ing.custom_food_id,
        foodName: ing.food_name || ing.custom_food_name || 'Unknown',
        quantityGrams: ing.quantity_grams,
        displayQuantity: ing.display_quantity,
        position: ing.position,
      })),
      tblspRecipeId: recipe.tblsp_recipe_id,
      isShared: recipe.is_shared === 1,
      createdAt: recipe.created_at,
      updatedAt: recipe.updated_at,
    };
  },

  /**
   * Create recipe with ingredients
   */
  create(userId: number, input: CreateRecipeInput): Recipe {
    const db = getDb();

    // Calculate total nutrients from ingredients
    const nutrients = calculateRecipeNutrients(input.ingredients, userId);
    const { columns, placeholders } = buildNutrientColumns();
    const nutrientValues = nutrientsToValues(nutrients);

    // Insert recipe
    const result = db
      .prepare(
        `INSERT INTO recipe (user_id, name, servings, is_shared, ${columns})
         VALUES (?, ?, ?, ?, ${placeholders})`
      )
      .run(userId, input.name, input.servings, input.isShared ? 1 : 0, ...nutrientValues);

    const recipeId = result.lastInsertRowid as number;

    // Insert ingredients
    const insertIngredient = db.prepare(
      `INSERT INTO recipe_ingredient (recipe_id, food_id, custom_food_id, quantity_grams, display_quantity, position)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    for (let i = 0; i < input.ingredients.length; i++) {
      const ing = input.ingredients[i];
      insertIngredient.run(
        recipeId,
        ing.foodId ?? null,
        ing.customFoodId ?? null,
        ing.quantityGrams,
        ing.displayQuantity ?? null,
        i
      );
    }

    return this.getById(userId, recipeId);
  },

  /**
   * Update recipe (only owner can update)
   */
  update(userId: number, recipeId: number, input: UpdateRecipeInput): Recipe {
    const db = getDb();

    // Verify recipe exists and belongs to user (only owner can edit)
    const existing = db
      .prepare('SELECT id FROM recipe WHERE id = ? AND user_id = ?')
      .get(recipeId, userId);

    if (!existing) {
      throw new NotFoundError(`Recipe with id ${recipeId} not found`);
    }

    // Calculate total nutrients from ingredients
    const nutrients = calculateRecipeNutrients(input.ingredients, userId);
    const nutrientValues = nutrientsToValues(nutrients);

    // Build UPDATE statement for nutrients
    const nutrientUpdates = NUTRIENT_DB_COLUMNS.map((col) => `${col} = ?`).join(', ');

    // Update recipe
    db.prepare(
      `UPDATE recipe
       SET name = ?, servings = ?, is_shared = ?, ${nutrientUpdates}, updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`
    ).run(input.name, input.servings, input.isShared ? 1 : 0, ...nutrientValues, recipeId, userId);

    // Delete old ingredients and insert new
    db.prepare('DELETE FROM recipe_ingredient WHERE recipe_id = ?').run(recipeId);

    const insertIngredient = db.prepare(
      `INSERT INTO recipe_ingredient (recipe_id, food_id, custom_food_id, quantity_grams, display_quantity, position)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    for (let i = 0; i < input.ingredients.length; i++) {
      const ing = input.ingredients[i];
      insertIngredient.run(
        recipeId,
        ing.foodId ?? null,
        ing.customFoodId ?? null,
        ing.quantityGrams,
        ing.displayQuantity ?? null,
        i
      );
    }

    return this.getById(userId, recipeId);
  },

  /**
   * Delete recipe
   */
  delete(userId: number, recipeId: number): void {
    const db = getDb();

    const result = db
      .prepare('DELETE FROM recipe WHERE id = ? AND user_id = ?')
      .run(recipeId, userId);

    if (result.changes === 0) {
      throw new NotFoundError(`Recipe with id ${recipeId} not found`);
    }
  },

  /**
   * Search recipes by name (for food search integration)
   * Includes user's own + shared recipes
   */
  search(userId: number, searchTerm: string, limit: number = 10): RecipeSummary[] {
    const db = getDb();

    if (searchTerm.length < 2) {
      return [];
    }

    // Use FTS search with prefix matching - user's own + shared
    const formattedTerm = searchTerm
      .split(/\s+/)
      .map((term) => `${term}*`)
      .join(' ');

    const rows = db
      .prepare(
        `SELECT r.id, r.user_id, r.name, r.servings, r.calories, r.is_shared, r.created_at
         FROM recipe r
         JOIN recipe_fts fts ON r.id = fts.rowid
         WHERE (r.user_id = ? OR r.is_shared = 1) AND recipe_fts MATCH ?
         ORDER BY rank
         LIMIT ?`
      )
      .all(userId, formattedTerm, limit) as Array<{
      id: number;
      user_id: number;
      name: string;
      servings: number;
      calories: number;
      is_shared: number;
      created_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      servings: row.servings,
      caloriesPerServing: row.servings > 0 ? Math.round(row.calories / row.servings) : 0,
      isShared: row.is_shared === 1,
      createdAt: row.created_at,
    }));
  },

  /**
   * Import recipe from tblsp with mapped ingredients
   */
  importFromTblsp(userId: number, input: ImportTblspRecipeInput): Recipe {
    // Convert tblsp import input to create recipe input
    const createInput: CreateRecipeInput = {
      name: input.name,
      servings: input.servings,
      isShared: false,
      ingredients: input.ingredients.map((ing) => ({
        foodId: ing.foodId,
        customFoodId: ing.customFoodId,
        quantityGrams: ing.quantityGrams,
        displayQuantity: ing.displayQuantity,
      })),
    };

    const db = getDb();

    // Calculate total nutrients
    const nutrients = calculateRecipeNutrients(createInput.ingredients, userId);
    const { columns, placeholders } = buildNutrientColumns();
    const nutrientValues = nutrientsToValues(nutrients);

    // Insert recipe with tblsp reference
    const result = db
      .prepare(
        `INSERT INTO recipe (user_id, name, servings, tblsp_recipe_id, ${columns})
         VALUES (?, ?, ?, ?, ${placeholders})`
      )
      .run(userId, input.name, input.servings, input.tblspRecipeId, ...nutrientValues);

    const recipeId = result.lastInsertRowid as number;

    // Insert ingredients
    const insertIngredient = db.prepare(
      `INSERT INTO recipe_ingredient (recipe_id, food_id, custom_food_id, quantity_grams, display_quantity, position)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    for (let i = 0; i < createInput.ingredients.length; i++) {
      const ing = createInput.ingredients[i];
      insertIngredient.run(
        recipeId,
        ing.foodId ?? null,
        ing.customFoodId ?? null,
        ing.quantityGrams,
        ing.displayQuantity ?? null,
        i
      );
    }

    return this.getById(userId, recipeId);
  },
};
