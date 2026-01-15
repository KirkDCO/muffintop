import { getDb } from '../db/connection.js';
import { NotFoundError } from '../middleware/error-handler.js';
import type { ActivityEntry } from '@muffintop/shared/types';
import type { CreateActivityInput, ActivityQuery } from '../models/activity-log.js';

interface ActivityRow {
  id: number;
  user_id: number;
  log_date: string;
  activity_calories: number;
  created_at: string;
}

function rowToActivity(row: ActivityRow): ActivityEntry {
  return {
    id: row.id,
    logDate: row.log_date,
    activityCalories: row.activity_calories,
    createdAt: row.created_at,
  };
}

export const activityService = {
  /**
   * Get activity entry for a specific date
   */
  getByDate(userId: number, date: string): ActivityEntry | null {
    const db = getDb();
    const row = db
      .prepare(
        'SELECT id, user_id, log_date, activity_calories, created_at FROM activity_log WHERE user_id = ? AND log_date = ?'
      )
      .get(userId, date) as ActivityRow | undefined;

    return row ? rowToActivity(row) : null;
  },

  /**
   * Get activity entries with optional date filtering
   */
  getByQuery(userId: number, query: ActivityQuery): ActivityEntry[] {
    const db = getDb();
    let sql =
      'SELECT id, user_id, log_date, activity_calories, created_at FROM activity_log WHERE user_id = ?';
    const params: (string | number)[] = [userId];

    if (query.date) {
      sql += ' AND log_date = ?';
      params.push(query.date);
    } else if (query.startDate && query.endDate) {
      sql += ' AND log_date >= ? AND log_date <= ?';
      params.push(query.startDate, query.endDate);
    } else if (query.startDate) {
      sql += ' AND log_date >= ?';
      params.push(query.startDate);
    } else if (query.endDate) {
      sql += ' AND log_date <= ?';
      params.push(query.endDate);
    }

    sql += ' ORDER BY log_date DESC';

    const rows = db.prepare(sql).all(...params) as ActivityRow[];
    return rows.map(rowToActivity);
  },

  /**
   * Create or update activity for a date (upsert)
   */
  upsert(userId: number, input: CreateActivityInput): ActivityEntry {
    const db = getDb();

    db.prepare(
      `INSERT INTO activity_log (user_id, log_date, activity_calories)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id, log_date) DO UPDATE SET
         activity_calories = excluded.activity_calories`
    ).run(userId, input.logDate, input.activityCalories);

    return this.getByDate(userId, input.logDate)!;
  },

  /**
   * Delete activity entry for a specific date
   */
  delete(userId: number, date: string): void {
    const db = getDb();
    const result = db
      .prepare('DELETE FROM activity_log WHERE user_id = ? AND log_date = ?')
      .run(userId, date);

    if (result.changes === 0) {
      throw new NotFoundError('Activity entry', date);
    }
  },
};
