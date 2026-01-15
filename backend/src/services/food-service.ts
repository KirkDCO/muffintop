import { getDb } from '../db/connection.js';
import { getUsdaDb } from '../db/usda-connection.js';
import { NotFoundError } from '../middleware/error-handler.js';
import {
  NUTRIENT_REGISTRY,
  ALL_NUTRIENT_KEYS,
  getNutrientColumnsSql,
  createEmptyNutrientValues,
  type FoodSummary,
  type FoodDetail,
  type FoodPortion,
  type FoodSearchResult,
  type NutrientValues,
} from '@muffintop/shared/types';
import type { FoodSearchQuery } from '../models/food.js';

/**
 * Get the database to use for food queries
 * Prefers USDA database if available, falls back to main db
 */
function getFoodDb() {
  return getUsdaDb() || getDb();
}

// Pre-compute nutrient columns for SQL
const NUTRIENT_COLUMNS_SQL = getNutrientColumnsSql();

interface FoodPortionRow {
  id: number;
  gram_weight: number;
  description: string;
  amount: number;
}

function rowToNutrients(row: Record<string, unknown>): NutrientValues {
  const nutrients = createEmptyNutrientValues();

  for (const key of ALL_NUTRIENT_KEYS) {
    const dbColumn = NUTRIENT_REGISTRY[key].dbColumn;
    const value = row[dbColumn];
    nutrients[key] = typeof value === 'number' ? value : null;
  }

  return nutrients;
}

function rowToFoodSummary(row: Record<string, unknown>): FoodSummary {
  return {
    fdcId: row.fdc_id as number,
    description: row.description as string,
    dataType: row.data_type as 'foundation' | 'sr_legacy' | 'branded',
    brandOwner: row.brand_owner as string | null,
    nutrients: rowToNutrients(row),
  };
}

function rowToFoodPortion(row: FoodPortionRow): FoodPortion {
  return {
    id: row.id,
    gramWeight: row.gram_weight,
    description: row.description,
    amount: row.amount,
  };
}

export const foodService = {
  search(query: FoodSearchQuery): FoodSearchResult {
    const db = getFoodDb();

    // Use FTS5 for search
    let sql = `
      SELECT f.fdc_id, f.description, f.data_type, f.brand_owner,
             ${NUTRIENT_COLUMNS_SQL}
      FROM food f
      JOIN food_fts fts ON f.fdc_id = fts.rowid
      WHERE food_fts MATCH ?
    `;

    const params: (string | number)[] = [query.q];

    if (query.dataType && query.dataType !== 'all') {
      sql += ' AND f.data_type = ?';
      params.push(query.dataType);
    }

    sql += ' ORDER BY rank LIMIT ?';
    params.push(query.limit);

    const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];

    // Get total count
    let countSql = `
      SELECT COUNT(*) as count
      FROM food f
      JOIN food_fts fts ON f.fdc_id = fts.rowid
      WHERE food_fts MATCH ?
    `;
    const countParams: string[] = [query.q];

    if (query.dataType && query.dataType !== 'all') {
      countSql += ' AND f.data_type = ?';
      countParams.push(query.dataType);
    }

    const countResult = db.prepare(countSql).get(...countParams) as { count: number };

    return {
      foods: rows.map(rowToFoodSummary),
      total: countResult.count,
    };
  },

  getById(fdcId: number): FoodDetail {
    const db = getFoodDb();

    const foodRow = db
      .prepare(
        `SELECT fdc_id, description, data_type, brand_owner,
                ${NUTRIENT_COLUMNS_SQL}
         FROM food WHERE fdc_id = ?`
      )
      .get(fdcId) as Record<string, unknown> | undefined;

    if (!foodRow) {
      throw new NotFoundError('Food', fdcId);
    }

    const portionRows = db
      .prepare(
        `SELECT id, gram_weight, description, amount
         FROM food_portion WHERE fdc_id = ?
         ORDER BY gram_weight`
      )
      .all(fdcId) as FoodPortionRow[];

    return {
      ...rowToFoodSummary(foodRow),
      portions: portionRows.map(rowToFoodPortion),
    };
  },
};
