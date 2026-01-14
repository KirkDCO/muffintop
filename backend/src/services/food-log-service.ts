import { getDb } from '../db/connection.js';
import { NotFoundError, ValidationError } from '../middleware/error-handler.js';
import {
  calculateNutrientsForFood,
  calculateNutrientsForCustomFood,
  calculateNutrientsForRecipe,
} from '../utils/nutrient-calc.js';
import {
  NUTRIENT_REGISTRY,
  ALL_NUTRIENT_KEYS,
  getNutrientDbColumns,
  createEmptyNutrientValues,
  type FoodLogEntry,
  type RecentFood,
  type NutrientValues,
} from '@muffintop/shared/types';
import type { CreateFoodLogInput, UpdateFoodLogInput, FoodLogQuery } from '../models/food-log.js';

// Pre-compute nutrient column names
const NUTRIENT_DB_COLUMNS = getNutrientDbColumns();

// Generate nutrient columns with table prefix for SQL queries with joins
function getNutrientColumnsSqlWithPrefix(prefix: string): string {
  return NUTRIENT_DB_COLUMNS.map((col) => `${prefix}.${col}`).join(', ');
}

// For food_log queries (with joins to other tables that have nutrient columns)
const FL_NUTRIENT_COLUMNS_SQL = getNutrientColumnsSqlWithPrefix('fl');

function rowToNutrients(row: Record<string, unknown>): NutrientValues {
  const nutrients = createEmptyNutrientValues();

  for (const key of ALL_NUTRIENT_KEYS) {
    const dbColumn = NUTRIENT_REGISTRY[key].dbColumn;
    const value = row[dbColumn];
    nutrients[key] = typeof value === 'number' ? value : null;
  }

  return nutrients;
}

function rowToFoodLogEntry(row: Record<string, unknown>): FoodLogEntry {
  return {
    id: row.id as number,
    logDate: row.log_date as string,
    mealCategory: row.meal_category as FoodLogEntry['mealCategory'],
    foodName: (row.food_name as string) || 'Unknown',
    portionAmount: row.portion_amount as number,
    portionGrams: row.portion_grams as number,
    nutrients: rowToNutrients(row),
    foodId: row.food_id as number | null,
    customFoodId: row.custom_food_id as number | null,
    recipeId: row.recipe_id as number | null,
    createdAt: row.created_at as string,
  };
}

/**
 * Build the INSERT column list and placeholders for nutrients
 */
function buildNutrientInsertSql(): { columns: string; placeholders: string } {
  const columns = NUTRIENT_DB_COLUMNS.join(', ');
  const placeholders = NUTRIENT_DB_COLUMNS.map(() => '?').join(', ');
  return { columns, placeholders };
}

/**
 * Extract nutrient values as array for INSERT statement
 */
function nutrientsToParams(nutrients: NutrientValues): (number | null)[] {
  return ALL_NUTRIENT_KEYS.map((key) => nutrients[key]);
}

/**
 * Build the UPDATE SET clause for nutrients
 */
function buildNutrientUpdateSql(): string {
  return NUTRIENT_DB_COLUMNS.map((col) => `${col} = ?`).join(', ');
}

export const foodLogService = {
  getByQuery(userId: number, query: FoodLogQuery): FoodLogEntry[] {
    const db = getDb();

    let sql = `
      SELECT fl.id, fl.user_id, fl.food_id, fl.custom_food_id, fl.recipe_id,
             fl.log_date, fl.meal_category, fl.portion_amount, fl.portion_grams,
             fl.created_at, ${FL_NUTRIENT_COLUMNS_SQL},
             COALESCE(f.description, cf.name, r.name) as food_name
      FROM food_log fl
      LEFT JOIN food f ON fl.food_id = f.fdc_id
      LEFT JOIN custom_food cf ON fl.custom_food_id = cf.id
      LEFT JOIN recipe r ON fl.recipe_id = r.id
      WHERE fl.user_id = ?
    `;
    const params: (string | number)[] = [userId];

    if (query.date) {
      sql += ' AND fl.log_date = ?';
      params.push(query.date);
    } else if (query.startDate && query.endDate) {
      sql += ' AND fl.log_date >= ? AND fl.log_date <= ?';
      params.push(query.startDate, query.endDate);
    }

    sql += ' ORDER BY fl.log_date DESC, fl.created_at DESC';

    const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
    return rows.map(rowToFoodLogEntry);
  },

  getById(userId: number, entryId: number): FoodLogEntry {
    const db = getDb();

    const row = db
      .prepare(
        `SELECT fl.id, fl.user_id, fl.food_id, fl.custom_food_id, fl.recipe_id,
                fl.log_date, fl.meal_category, fl.portion_amount, fl.portion_grams,
                fl.created_at, ${FL_NUTRIENT_COLUMNS_SQL},
                COALESCE(f.description, cf.name, r.name) as food_name
         FROM food_log fl
         LEFT JOIN food f ON fl.food_id = f.fdc_id
         LEFT JOIN custom_food cf ON fl.custom_food_id = cf.id
         LEFT JOIN recipe r ON fl.recipe_id = r.id
         WHERE fl.id = ? AND fl.user_id = ?`
      )
      .get(entryId, userId) as Record<string, unknown> | undefined;

    if (!row) {
      throw new NotFoundError('Food log entry', entryId);
    }

    return rowToFoodLogEntry(row);
  },

  create(userId: number, input: CreateFoodLogInput): FoodLogEntry {
    const db = getDb();

    // Calculate nutrients based on food source
    let nutrients: NutrientValues;

    if (input.foodId) {
      const result = calculateNutrientsForFood(input.foodId, input.portionGrams);
      nutrients = result.nutrients;
    } else if (input.customFoodId) {
      const result = calculateNutrientsForCustomFood(input.customFoodId, input.portionGrams, userId);
      nutrients = result.nutrients;
    } else if (input.recipeId) {
      const result = calculateNutrientsForRecipe(input.recipeId, input.portionGrams, userId);
      nutrients = result.nutrients;
    } else {
      throw new ValidationError('One of foodId, customFoodId, or recipeId is required');
    }

    const { columns: nutrientColumns, placeholders: nutrientPlaceholders } = buildNutrientInsertSql();

    const result = db
      .prepare(
        `INSERT INTO food_log (
          user_id, food_id, custom_food_id, recipe_id,
          log_date, meal_category, portion_amount, portion_grams,
          ${nutrientColumns}
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${nutrientPlaceholders})`
      )
      .run(
        userId,
        input.foodId || null,
        input.customFoodId || null,
        input.recipeId || null,
        input.logDate,
        input.mealCategory,
        input.portionAmount,
        input.portionGrams,
        ...nutrientsToParams(nutrients)
      );

    return this.getById(userId, Number(result.lastInsertRowid));
  },

  update(userId: number, entryId: number, input: UpdateFoodLogInput): FoodLogEntry {
    const db = getDb();

    // Get existing entry
    const existing = this.getById(userId, entryId);

    // If portion changed, recalculate nutrients
    let nutrients = existing.nutrients;

    if (input.portionGrams && input.portionGrams !== existing.portionGrams) {
      if (existing.foodId) {
        const result = calculateNutrientsForFood(existing.foodId, input.portionGrams);
        nutrients = result.nutrients;
      } else if (existing.customFoodId) {
        const result = calculateNutrientsForCustomFood(existing.customFoodId, input.portionGrams, userId);
        nutrients = result.nutrients;
      } else if (existing.recipeId) {
        const result = calculateNutrientsForRecipe(existing.recipeId, input.portionGrams, userId);
        nutrients = result.nutrients;
      }
    }

    const nutrientUpdateSql = buildNutrientUpdateSql();

    db.prepare(
      `UPDATE food_log SET
        log_date = COALESCE(?, log_date),
        meal_category = COALESCE(?, meal_category),
        portion_amount = COALESCE(?, portion_amount),
        portion_grams = COALESCE(?, portion_grams),
        ${nutrientUpdateSql}
       WHERE id = ? AND user_id = ?`
    ).run(
      input.logDate || null,
      input.mealCategory || null,
      input.portionAmount || null,
      input.portionGrams || null,
      ...nutrientsToParams(nutrients),
      entryId,
      userId
    );

    return this.getById(userId, entryId);
  },

  delete(userId: number, entryId: number): void {
    const db = getDb();

    const result = db
      .prepare('DELETE FROM food_log WHERE id = ? AND user_id = ?')
      .run(entryId, userId);

    if (result.changes === 0) {
      throw new NotFoundError('Food log entry', entryId);
    }
  },

  getRecent(userId: number): RecentFood[] {
    const db = getDb();

    // Get foods logged in last 7 days, grouped by food source
    const rows = db
      .prepare(
        `SELECT
          food_id, custom_food_id, recipe_id,
          COALESCE(f.description, cf.name, r.name) as name,
          MAX(fl.created_at) as last_logged_at,
          AVG(portion_grams) as typical_portion_grams
         FROM food_log fl
         LEFT JOIN food f ON fl.food_id = f.fdc_id
         LEFT JOIN custom_food cf ON fl.custom_food_id = cf.id
         LEFT JOIN recipe r ON fl.recipe_id = r.id
         WHERE fl.user_id = ?
           AND fl.log_date >= date('now', '-7 days')
         GROUP BY food_id, custom_food_id, recipe_id
         ORDER BY last_logged_at DESC
         LIMIT 20`
      )
      .all(userId) as {
      food_id: number | null;
      custom_food_id: number | null;
      recipe_id: number | null;
      name: string;
      last_logged_at: string;
      typical_portion_grams: number;
    }[];

    return rows.map((row) => ({
      foodId: row.food_id,
      customFoodId: row.custom_food_id,
      recipeId: row.recipe_id,
      name: row.name,
      lastLoggedAt: row.last_logged_at,
      typicalPortionGrams: row.typical_portion_grams,
    }));
  },
};
