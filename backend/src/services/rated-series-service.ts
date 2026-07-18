import { getDb } from '../db/connection.js';
import type { RatedEventSeries, UpsertRatedSeriesInput } from '@muffintop/shared/types';

interface SeriesRow {
  id: number;
  description: string;
  direction: string;
  color: string;
  created_at: string;
}

function rowToSeries(row: SeriesRow): RatedEventSeries {
  return {
    id: row.id,
    description: row.description,
    direction: row.direction as RatedEventSeries['direction'],
    color: row.color,
    createdAt: row.created_at,
  };
}

export const ratedSeriesService = {
  /** List all rated series for a user, ordered by name. */
  list(userId: number): RatedEventSeries[] {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT id, description, direction, color, created_at
         FROM rated_event_series WHERE user_id = ? ORDER BY description ASC`
      )
      .all(userId) as SeriesRow[];
    return rows.map(rowToSeries);
  },

  /** Create or update a series' metadata (keyed by user + description). */
  upsert(userId: number, input: UpsertRatedSeriesInput): RatedEventSeries {
    const db = getDb();
    db.prepare(
      `INSERT INTO rated_event_series (user_id, description, direction, color)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, description)
       DO UPDATE SET direction = excluded.direction, color = excluded.color`
    ).run(userId, input.description, input.direction, input.color);

    const row = db
      .prepare(
        `SELECT id, description, direction, color, created_at
         FROM rated_event_series WHERE user_id = ? AND description = ?`
      )
      .get(userId, input.description) as SeriesRow;
    return rowToSeries(row);
  },

  /** Remove series metadata. Ratings in user_event are left untouched. */
  delete(userId: number, description: string): void {
    const db = getDb();
    db.prepare(
      `DELETE FROM rated_event_series WHERE user_id = ? AND description = ?`
    ).run(userId, description);
  },
};
