/**
 * tblsp Service
 *
 * Provides read-only access to recipes in the tblsp database.
 */

import { getDb } from '../db/connection.js';
import {
  isTblspConfigured,
  attachTblspDatabase,
  isTblspAttached,
} from '../db/tblsp-connection.js';
import { NotFoundError } from '../middleware/error-handler.js';

/**
 * tblsp Recipe summary (for listing)
 */
export interface TblspRecipeSummary {
  id: number;
  title: string;
  rating: number | null;
  createdAt: string;
}

/**
 * tblsp Ingredient
 */
export interface TblspIngredient {
  id: number;
  name: string;
  quantity: string | null;
  originalText: string;
  position: number;
}

/**
 * tblsp Recipe with ingredients
 */
export interface TblspRecipe {
  id: number;
  title: string;
  ingredientsRaw: string | null;
  instructions: string | null;
  notes: string | null;
  sourceUrl: string | null;
  rating: number | null;
  createdAt: string;
  ingredients: TblspIngredient[];
}

/**
 * Query parameters for listing tblsp recipes
 */
export interface TblspRecipeQuery {
  search?: string;
  limit?: number;
}

export const tblspService = {
  /**
   * Check if tblsp is available
   */
  isAvailable(): boolean {
    if (!isTblspConfigured()) {
      return false;
    }

    // Try to attach if not already attached
    if (!isTblspAttached()) {
      return attachTblspDatabase();
    }

    return true;
  },

  /**
   * List/search tblsp recipes
   */
  list(query: TblspRecipeQuery = {}): TblspRecipeSummary[] {
    if (!this.isAvailable()) {
      return [];
    }

    const db = getDb();
    const { search, limit = 50 } = query;

    let sql: string;
    let params: (string | number)[];

    if (search && search.length >= 2) {
      // Search by title (using LIKE since tblsp may not have FTS)
      sql = `
        SELECT id, title, rating, created_at
        FROM tblsp.recipe
        WHERE title LIKE ? AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT ?
      `;
      params = [`%${search}%`, limit];
    } else {
      // Return recent recipes
      sql = `
        SELECT id, title, rating, created_at
        FROM tblsp.recipe
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT ?
      `;
      params = [limit];
    }

    try {
      const rows = db.prepare(sql).all(...params) as Array<{
        id: number;
        title: string;
        rating: number | null;
        created_at: string;
      }>;

      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        rating: row.rating,
        createdAt: row.created_at,
      }));
    } catch (error) {
      console.error('Error listing tblsp recipes:', error);
      return [];
    }
  },

  /**
   * Get single tblsp recipe with ingredients
   */
  getById(recipeId: number): TblspRecipe {
    if (!this.isAvailable()) {
      throw new NotFoundError('tblsp database not available');
    }

    const db = getDb();

    // Get recipe
    const recipe = db
      .prepare(
        `SELECT id, title, ingredients_raw, instructions, notes, source_url, rating, created_at
         FROM tblsp.recipe
         WHERE id = ? AND deleted_at IS NULL`
      )
      .get(recipeId) as
      | {
          id: number;
          title: string;
          ingredients_raw: string | null;
          instructions: string | null;
          notes: string | null;
          source_url: string | null;
          rating: number | null;
          created_at: string;
        }
      | undefined;

    if (!recipe) {
      throw new NotFoundError(`tblsp recipe with id ${recipeId} not found`);
    }

    // Get ingredients
    const ingredients = db
      .prepare(
        `SELECT id, name, quantity, original_text, position
         FROM tblsp.ingredient
         WHERE recipe_id = ?
         ORDER BY position`
      )
      .all(recipeId) as Array<{
      id: number;
      name: string;
      quantity: string | null;
      original_text: string;
      position: number;
    }>;

    return {
      id: recipe.id,
      title: recipe.title,
      ingredientsRaw: recipe.ingredients_raw,
      instructions: recipe.instructions,
      notes: recipe.notes,
      sourceUrl: recipe.source_url,
      rating: recipe.rating,
      createdAt: recipe.created_at,
      ingredients: ingredients.map((ing) => ({
        id: ing.id,
        name: ing.name,
        quantity: ing.quantity,
        originalText: ing.original_text,
        position: ing.position,
      })),
    };
  },
};
