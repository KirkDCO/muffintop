import { getDb } from '../db/connection.js';
import { NotFoundError } from '../middleware/error-handler.js';
import type { FoodSummary, FoodDetail, FoodPortion, FoodSearchResult } from '@muffintop/shared/types';
import type { FoodSearchQuery } from '../models/food.js';

interface FoodRow {
  fdc_id: number;
  description: string;
  data_type: string;
  brand_owner: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  added_sugar: number | null;
}

interface FoodPortionRow {
  id: number;
  gram_weight: number;
  description: string;
  amount: number;
}

function rowToFoodSummary(row: FoodRow): FoodSummary {
  return {
    fdcId: row.fdc_id,
    description: row.description,
    dataType: row.data_type as 'foundation' | 'sr_legacy' | 'branded',
    brandOwner: row.brand_owner,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    addedSugar: row.added_sugar,
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
    const db = getDb();

    // Use FTS5 for search
    let sql = `
      SELECT f.fdc_id, f.description, f.data_type, f.brand_owner,
             f.calories, f.protein, f.carbs, f.added_sugar
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

    const rows = db.prepare(sql).all(...params) as FoodRow[];

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
    const db = getDb();

    const foodRow = db
      .prepare(
        `SELECT fdc_id, description, data_type, brand_owner,
                calories, protein, carbs, added_sugar
         FROM food WHERE fdc_id = ?`
      )
      .get(fdcId) as FoodRow | undefined;

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
