import { getDb } from '../db/connection.js';
import { ConflictError, NotFoundError } from '../middleware/error-handler.js';
import {
  DEFAULT_VISIBLE_NUTRIENTS,
  type User,
  type UserWithPreferences,
  type NutrientKey,
  type NutrientPreferences,
} from '@muffintop/shared/types';
import type { CreateUserInput } from '../models/user.js';

interface UserRow {
  id: number;
  name: string;
  created_at: string;
}

interface PreferencesRow {
  user_id: number;
  visible_nutrients: string;
  created_at: string;
  updated_at: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

export const userService = {
  list(): User[] {
    const db = getDb();
    const rows = db.prepare('SELECT id, name, created_at FROM user ORDER BY name').all() as UserRow[];
    return rows.map(rowToUser);
  },

  getById(id: number): User {
    const db = getDb();
    const row = db.prepare('SELECT id, name, created_at FROM user WHERE id = ?').get(id) as UserRow | undefined;

    if (!row) {
      throw new NotFoundError('User', id);
    }

    return rowToUser(row);
  },

  getWithPreferences(id: number): UserWithPreferences {
    const user = this.getById(id);
    const visibleNutrients = this.getPreferences(id);

    return {
      ...user,
      visibleNutrients,
    };
  },

  create(input: CreateUserInput): UserWithPreferences {
    const db = getDb();

    // Check for duplicate name
    const existing = db.prepare('SELECT id FROM user WHERE name = ?').get(input.name);
    if (existing) {
      throw new ConflictError(`User with name "${input.name}" already exists`);
    }

    const result = db.prepare('INSERT INTO user (name) VALUES (?)').run(input.name);
    const userId = Number(result.lastInsertRowid);

    // Set initial nutrient preferences
    const visibleNutrients = input.visibleNutrients || [...DEFAULT_VISIBLE_NUTRIENTS];
    this.setPreferences(userId, visibleNutrients);

    return this.getWithPreferences(userId);
  },

  delete(id: number): void {
    const db = getDb();

    // Check if user exists
    const existing = db.prepare('SELECT id FROM user WHERE id = ?').get(id);
    if (!existing) {
      throw new NotFoundError('User', id);
    }

    // Delete user (cascades to all user data due to FK constraints)
    db.prepare('DELETE FROM user WHERE id = ?').run(id);
  },

  /**
   * Get user's nutrient display preferences
   * Returns default preferences if none are set
   */
  getPreferences(userId: number): NutrientKey[] {
    const db = getDb();

    const row = db
      .prepare('SELECT visible_nutrients FROM user_nutrient_preferences WHERE user_id = ?')
      .get(userId) as { visible_nutrients: string } | undefined;

    if (!row) {
      return [...DEFAULT_VISIBLE_NUTRIENTS];
    }

    try {
      return JSON.parse(row.visible_nutrients) as NutrientKey[];
    } catch {
      return [...DEFAULT_VISIBLE_NUTRIENTS];
    }
  },

  /**
   * Set user's nutrient display preferences
   */
  setPreferences(userId: number, visibleNutrients: NutrientKey[]): NutrientPreferences {
    const db = getDb();

    // Verify user exists
    this.getById(userId);

    const nutrientsJson = JSON.stringify(visibleNutrients);

    db.prepare(
      `INSERT INTO user_nutrient_preferences (user_id, visible_nutrients, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET
         visible_nutrients = excluded.visible_nutrients,
         updated_at = datetime('now')`
    ).run(userId, nutrientsJson);

    // Fetch the updated row
    const row = db
      .prepare(
        'SELECT user_id, visible_nutrients, created_at, updated_at FROM user_nutrient_preferences WHERE user_id = ?'
      )
      .get(userId) as PreferencesRow;

    return {
      userId: row.user_id,
      visibleNutrients: JSON.parse(row.visible_nutrients) as NutrientKey[],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  /**
   * Get full preferences object including timestamps
   */
  getFullPreferences(userId: number): NutrientPreferences {
    const db = getDb();

    const row = db
      .prepare(
        'SELECT user_id, visible_nutrients, created_at, updated_at FROM user_nutrient_preferences WHERE user_id = ?'
      )
      .get(userId) as PreferencesRow | undefined;

    if (!row) {
      // Return default preferences with current timestamp
      const now = new Date().toISOString();
      return {
        userId,
        visibleNutrients: [...DEFAULT_VISIBLE_NUTRIENTS],
        createdAt: now,
        updatedAt: now,
      };
    }

    return {
      userId: row.user_id,
      visibleNutrients: JSON.parse(row.visible_nutrients) as NutrientKey[],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
};
