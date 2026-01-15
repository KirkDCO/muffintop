import { getDb } from '../db/connection.js';
import { NotFoundError } from '../middleware/error-handler.js';
import type { DailyTarget, NutrientTarget, NutrientKey } from '@muffintop/shared/types';
import type { CreateDailyTargetInput, UpdateDailyTargetInput } from '../models/daily-target.js';

interface TargetRow {
  id: number;
  user_id: number;
  basal_calories: number;
  nutrient_targets: string;
  created_at: string;
  updated_at: string;
}

function rowToTarget(row: TargetRow): DailyTarget {
  let nutrientTargets: Partial<Record<NutrientKey, NutrientTarget>> = {};

  try {
    nutrientTargets = JSON.parse(row.nutrient_targets || '{}');
  } catch {
    nutrientTargets = {};
  }

  return {
    id: row.id,
    basalCalories: row.basal_calories,
    nutrientTargets,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const targetService = {
  /**
   * Get targets for a user
   * Returns null if no targets are set
   */
  getByUserId(userId: number): DailyTarget | null {
    const db = getDb();
    const row = db
      .prepare(
        'SELECT id, user_id, basal_calories, nutrient_targets, created_at, updated_at FROM daily_target WHERE user_id = ?'
      )
      .get(userId) as TargetRow | undefined;

    return row ? rowToTarget(row) : null;
  },

  /**
   * Create or replace targets for a user (upsert)
   */
  create(userId: number, input: CreateDailyTargetInput): DailyTarget {
    const db = getDb();
    const nutrientTargetsJson = JSON.stringify(input.nutrientTargets || {});

    db.prepare(
      `INSERT INTO daily_target (user_id, basal_calories, nutrient_targets)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         basal_calories = excluded.basal_calories,
         nutrient_targets = excluded.nutrient_targets,
         updated_at = datetime('now')`
    ).run(userId, input.basalCalories, nutrientTargetsJson);

    return this.getByUserId(userId)!;
  },

  /**
   * Update targets for a user (partial update with merge)
   */
  update(userId: number, input: UpdateDailyTargetInput): DailyTarget {
    const existing = this.getByUserId(userId);
    if (!existing) {
      throw new NotFoundError('Daily target', userId);
    }

    const db = getDb();
    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (input.basalCalories !== undefined) {
      updates.push('basal_calories = ?');
      params.push(input.basalCalories);
    }

    if (input.nutrientTargets !== undefined) {
      // Merge with existing targets (allows partial updates)
      const merged = { ...existing.nutrientTargets, ...input.nutrientTargets };
      // Remove any null/undefined values (allows clearing targets)
      for (const key of Object.keys(merged)) {
        if (merged[key as NutrientKey] === null || merged[key as NutrientKey] === undefined) {
          delete merged[key as NutrientKey];
        }
      }
      updates.push('nutrient_targets = ?');
      params.push(JSON.stringify(merged));
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(userId);

      db.prepare(`UPDATE daily_target SET ${updates.join(', ')} WHERE user_id = ?`).run(...params);
    }

    return this.getByUserId(userId)!;
  },

  /**
   * Delete targets for a user
   */
  delete(userId: number): void {
    const db = getDb();
    const result = db.prepare('DELETE FROM daily_target WHERE user_id = ?').run(userId);

    if (result.changes === 0) {
      throw new NotFoundError('Daily target', userId);
    }
  },
};
