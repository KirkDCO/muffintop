import { getDb } from '../db/connection.js';
import { NotFoundError } from '../middleware/error-handler.js';
import type { WeightEntry, WeightHistory, WeightTrend, WeightUnit } from '@muffintop/shared/types';
import type { CreateWeightInput, WeightQuery } from '../models/body-metric.js';

interface WeightRow {
  id: number;
  user_id: number;
  metric_date: string;
  weight_value: number;
  weight_unit: string;
  created_at: string;
}

function rowToWeightEntry(row: WeightRow): WeightEntry {
  return {
    id: row.id,
    metricDate: row.metric_date,
    weightValue: row.weight_value,
    weightUnit: row.weight_unit as WeightUnit,
    createdAt: row.created_at,
  };
}

/**
 * Convert weight to kg for trend comparison
 */
function toKg(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? value * 0.453592 : value;
}

/**
 * Calculate trend from recent entries
 * Uses linear regression on last 7 entries to determine trend
 */
function calculateTrend(entries: WeightEntry[]): WeightTrend | null {
  if (entries.length < 2) {
    return null;
  }

  // Take last 7 entries for trend calculation
  const recent = entries.slice(0, 7);

  // Convert all to kg for comparison
  const values = recent.map((e) => toKg(e.weightValue, e.weightUnit));

  // Calculate average change between consecutive entries
  let totalChange = 0;
  for (let i = 0; i < values.length - 1; i++) {
    totalChange += values[i] - values[i + 1]; // newer - older
  }
  const avgChange = totalChange / (values.length - 1);

  // Threshold: 0.1 kg average change is considered significant
  const threshold = 0.1;

  if (avgChange > threshold) {
    return 'up';
  } else if (avgChange < -threshold) {
    return 'down';
  }
  return 'stable';
}

export const metricService = {
  /**
   * Get weight entry for a specific date
   */
  getByDate(userId: number, date: string): WeightEntry | null {
    const db = getDb();
    const row = db
      .prepare(
        'SELECT id, user_id, metric_date, weight_value, weight_unit, created_at FROM body_metric WHERE user_id = ? AND metric_date = ?'
      )
      .get(userId, date) as WeightRow | undefined;

    return row ? rowToWeightEntry(row) : null;
  },

  /**
   * Get weight entries with optional date filtering
   */
  getByQuery(userId: number, query: WeightQuery): WeightEntry[] {
    const db = getDb();
    let sql =
      'SELECT id, user_id, metric_date, weight_value, weight_unit, created_at FROM body_metric WHERE user_id = ?';
    const params: (string | number)[] = [userId];

    if (query.startDate && query.endDate) {
      sql += ' AND metric_date >= ? AND metric_date <= ?';
      params.push(query.startDate, query.endDate);
    } else if (query.startDate) {
      sql += ' AND metric_date >= ?';
      params.push(query.startDate);
    } else if (query.endDate) {
      sql += ' AND metric_date <= ?';
      params.push(query.endDate);
    }

    sql += ' ORDER BY metric_date DESC';

    const rows = db.prepare(sql).all(...params) as WeightRow[];
    return rows.map(rowToWeightEntry);
  },

  /**
   * Get weight history with latest value and trend
   */
  getHistory(userId: number, query: WeightQuery = {}): WeightHistory {
    const entries = this.getByQuery(userId, query);

    const latest = entries[0] || null;

    return {
      entries,
      latestValue: latest?.weightValue ?? null,
      latestUnit: latest?.weightUnit ?? null,
      trend: calculateTrend(entries),
    };
  },

  /**
   * Create or update weight for a date (upsert)
   */
  upsert(userId: number, input: CreateWeightInput): WeightEntry {
    const db = getDb();

    db.prepare(
      `INSERT INTO body_metric (user_id, metric_date, weight_value, weight_unit)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, metric_date) DO UPDATE SET
         weight_value = excluded.weight_value,
         weight_unit = excluded.weight_unit`
    ).run(userId, input.metricDate, input.weightValue, input.weightUnit);

    return this.getByDate(userId, input.metricDate)!;
  },

  /**
   * Delete weight entry for a specific date
   */
  delete(userId: number, date: string): void {
    const db = getDb();
    const result = db
      .prepare('DELETE FROM body_metric WHERE user_id = ? AND metric_date = ?')
      .run(userId, date);

    if (result.changes === 0) {
      throw new NotFoundError('Weight entry', date);
    }
  },
};
