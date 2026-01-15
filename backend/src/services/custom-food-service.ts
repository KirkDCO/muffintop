import { getDb } from '../db/connection.js';
import { NotFoundError } from '../middleware/error-handler.js';
import {
  getNutrientDbColumns,
  createEmptyNutrientValues,
  ALL_NUTRIENT_KEYS,
  NUTRIENT_REGISTRY,
  type NutrientValues,
  type CustomFood,
  type CustomFoodSummary,
  type CustomFoodPortion,
} from '@muffintop/shared/types';
import type {
  CreateCustomFoodInput,
  UpdateCustomFoodInput,
  CustomFoodQuery,
} from '../models/custom-food.js';

const NUTRIENT_DB_COLUMNS = getNutrientDbColumns();

interface CustomFoodRow {
  id: number;
  user_id: number;
  name: string;
  serving_grams: number | null;
  is_shared: number;
  created_at: string;
  [key: string]: unknown;
}

interface CustomFoodPortionRow {
  id: number;
  custom_food_id: number;
  description: string;
  serving_multiplier: number;
  gram_weight: number | null;
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
 * Build nutrient columns for INSERT/UPDATE
 */
function buildNutrientColumns(): { columns: string; placeholders: string } {
  const columns = NUTRIENT_DB_COLUMNS.join(', ');
  const placeholders = NUTRIENT_DB_COLUMNS.map(() => '?').join(', ');
  return { columns, placeholders };
}

/**
 * Get nutrient values as array in column order (with defaults for optional values)
 */
function nutrientsToValues(nutrients: Partial<NutrientValues>): (number | null)[] {
  return ALL_NUTRIENT_KEYS.map((key) => {
    const value = nutrients[key];
    // For required fields (big 4), they must have values
    // For optional fields, default to 0 if not provided
    return typeof value === 'number' ? value : 0;
  });
}

export const customFoodService = {
  /**
   * List user's custom foods + shared custom foods from others, with optional search
   */
  list(userId: number, query: CustomFoodQuery): CustomFoodSummary[] {
    const db = getDb();
    const { search, limit } = query;

    let sql: string;
    let params: (string | number)[];

    if (search && search.length >= 2) {
      // Use FTS search - user's own + shared from others
      sql = `
        SELECT cf.id, cf.user_id, cf.name, cf.calories, cf.is_shared, cf.created_at
        FROM custom_food cf
        JOIN custom_food_fts fts ON cf.id = fts.rowid
        WHERE (cf.user_id = ? OR cf.is_shared = 1) AND custom_food_fts MATCH ?
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
        SELECT id, user_id, name, calories, is_shared, created_at
        FROM custom_food
        WHERE user_id = ? OR is_shared = 1
        ORDER BY created_at DESC
        LIMIT ?
      `;
      params = [userId, limit];
    }

    const rows = db.prepare(sql).all(...params) as Array<{
      id: number;
      user_id: number;
      name: string;
      calories: number;
      is_shared: number;
      created_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      caloriesPerServing: row.calories,  // Already per-serving
      isShared: row.is_shared === 1,
      createdAt: row.created_at,
    }));
  },

  /**
   * Get single custom food with portions
   * Accessible if user owns it OR if it's shared
   */
  getById(userId: number, customFoodId: number): CustomFood {
    const db = getDb();

    // Get custom food - accessible if owner OR shared
    const nutrientColumns = NUTRIENT_DB_COLUMNS.join(', ');
    const customFood = db
      .prepare(
        `SELECT id, user_id, name, serving_grams, is_shared, created_at, ${nutrientColumns}
         FROM custom_food WHERE id = ? AND (user_id = ? OR is_shared = 1)`
      )
      .get(customFoodId, userId) as CustomFoodRow | undefined;

    if (!customFood) {
      throw new NotFoundError(`Custom food with id ${customFoodId} not found`);
    }

    // Get portions
    const portions = db
      .prepare(
        `SELECT id, custom_food_id, description, serving_multiplier, gram_weight
         FROM custom_food_portion
         WHERE custom_food_id = ?
         ORDER BY id`
      )
      .all(customFoodId) as CustomFoodPortionRow[];

    return {
      id: customFood.id,
      userId: customFood.user_id,
      name: customFood.name,
      servingGrams: customFood.serving_grams,
      nutrients: rowToNutrients(customFood),
      portions: portions.map((p) => ({
        id: p.id,
        description: p.description,
        servingMultiplier: p.serving_multiplier,
        gramWeight: p.gram_weight,
      })),
      isShared: customFood.is_shared === 1,
      createdAt: customFood.created_at,
    };
  },

  /**
   * Create custom food with optional portions
   */
  create(userId: number, input: CreateCustomFoodInput): CustomFood {
    const db = getDb();

    const { columns, placeholders } = buildNutrientColumns();
    const nutrientValues = nutrientsToValues(input.nutrients);

    // Insert custom food
    const result = db
      .prepare(
        `INSERT INTO custom_food (user_id, name, serving_grams, is_shared, ${columns})
         VALUES (?, ?, ?, ?, ${placeholders})`
      )
      .run(
        userId,
        input.name,
        input.servingGrams ?? null,
        input.isShared ? 1 : 0,
        ...nutrientValues
      );

    const customFoodId = result.lastInsertRowid as number;

    // Insert portions if provided
    if (input.portions && input.portions.length > 0) {
      const insertPortion = db.prepare(
        `INSERT INTO custom_food_portion (custom_food_id, description, serving_multiplier, gram_weight)
         VALUES (?, ?, ?, ?)`
      );

      for (const portion of input.portions) {
        insertPortion.run(
          customFoodId,
          portion.description,
          portion.servingMultiplier,
          portion.gramWeight ?? null
        );
      }
    }

    return this.getById(userId, customFoodId);
  },

  /**
   * Update custom food (only owner can update)
   */
  update(userId: number, customFoodId: number, input: UpdateCustomFoodInput): CustomFood {
    const db = getDb();

    // Verify custom food exists and belongs to user (only owner can edit)
    const existing = db
      .prepare('SELECT id FROM custom_food WHERE id = ? AND user_id = ?')
      .get(customFoodId, userId);

    if (!existing) {
      throw new NotFoundError(`Custom food with id ${customFoodId} not found`);
    }

    const nutrientValues = nutrientsToValues(input.nutrients);

    // Build UPDATE statement for nutrients
    const nutrientUpdates = NUTRIENT_DB_COLUMNS.map((col) => `${col} = ?`).join(', ');

    // Update custom food
    db.prepare(
      `UPDATE custom_food
       SET name = ?, serving_grams = ?, is_shared = ?, ${nutrientUpdates}
       WHERE id = ? AND user_id = ?`
    ).run(
      input.name,
      input.servingGrams ?? null,
      input.isShared ? 1 : 0,
      ...nutrientValues,
      customFoodId,
      userId
    );

    // Delete old portions and insert new
    db.prepare('DELETE FROM custom_food_portion WHERE custom_food_id = ?').run(customFoodId);

    if (input.portions && input.portions.length > 0) {
      const insertPortion = db.prepare(
        `INSERT INTO custom_food_portion (custom_food_id, description, serving_multiplier, gram_weight)
         VALUES (?, ?, ?, ?)`
      );

      for (const portion of input.portions) {
        insertPortion.run(
          customFoodId,
          portion.description,
          portion.servingMultiplier,
          portion.gramWeight ?? null
        );
      }
    }

    return this.getById(userId, customFoodId);
  },

  /**
   * Delete custom food (only owner can delete)
   */
  delete(userId: number, customFoodId: number): void {
    const db = getDb();

    const result = db
      .prepare('DELETE FROM custom_food WHERE id = ? AND user_id = ?')
      .run(customFoodId, userId);

    if (result.changes === 0) {
      throw new NotFoundError(`Custom food with id ${customFoodId} not found`);
    }
  },

  /**
   * Search custom foods by name (for food search integration)
   * Includes user's own + shared custom foods
   */
  search(userId: number, searchTerm: string, limit: number = 10): CustomFoodSummary[] {
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
        `SELECT cf.id, cf.user_id, cf.name, cf.calories, cf.is_shared, cf.created_at
         FROM custom_food cf
         JOIN custom_food_fts fts ON cf.id = fts.rowid
         WHERE (cf.user_id = ? OR cf.is_shared = 1) AND custom_food_fts MATCH ?
         ORDER BY rank
         LIMIT ?`
      )
      .all(userId, formattedTerm, limit) as Array<{
      id: number;
      user_id: number;
      name: string;
      calories: number;
      is_shared: number;
      created_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      caloriesPerServing: row.calories,
      isShared: row.is_shared === 1,
      createdAt: row.created_at,
    }));
  },
};
