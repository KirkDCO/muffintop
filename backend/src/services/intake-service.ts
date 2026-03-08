import { getDb } from '../db/connection.js';
import { NotFoundError } from '../middleware/error-handler.js';
import type { IntakeEntry, IntakeType } from '@muffintop/shared/types';
import type { CreateIntakeInput, IntakeQuery } from '../models/intake.js';

interface IntakeRow {
  id: number;
  user_id: number;
  log_date: string;
  intake_type: string;
  amount: number;
  created_at: string;
}

function rowToEntry(row: IntakeRow): IntakeEntry {
  return {
    id: row.id,
    logDate: row.log_date,
    intakeType: row.intake_type as IntakeType,
    amount: row.amount,
    createdAt: row.created_at,
  };
}

export const intakeService = {
  /**
   * Get intake entries and total for a specific date and type
   */
  getByDateAndType(
    userId: number,
    date: string,
    type: IntakeType
  ): { entries: IntakeEntry[]; total: number } {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT id, user_id, log_date, intake_type, amount, created_at
         FROM intake_log
         WHERE user_id = ? AND log_date = ? AND intake_type = ?
         ORDER BY created_at ASC`
      )
      .all(userId, date, type) as IntakeRow[];

    const entries = rows.map(rowToEntry);
    const total = entries.reduce((sum, e) => sum + e.amount, 0);
    return { entries, total };
  },

  /**
   * Get intake entries with optional filtering
   */
  getByQuery(userId: number, query: IntakeQuery): { entries: IntakeEntry[]; total: number } {
    const db = getDb();
    let sql =
      'SELECT id, user_id, log_date, intake_type, amount, created_at FROM intake_log WHERE user_id = ?';
    const params: (string | number)[] = [userId];

    if (query.date) {
      sql += ' AND log_date = ?';
      params.push(query.date);
    }

    if (query.type) {
      sql += ' AND intake_type = ?';
      params.push(query.type);
    }

    sql += ' ORDER BY created_at ASC';

    const rows = db.prepare(sql).all(...params) as IntakeRow[];
    const entries = rows.map(rowToEntry);
    const total = entries.reduce((sum, e) => sum + e.amount, 0);
    return { entries, total };
  },

  /**
   * Create a new intake entry (INSERT, not upsert - cumulative)
   */
  create(userId: number, input: CreateIntakeInput): IntakeEntry {
    const db = getDb();

    const result = db
      .prepare(
        `INSERT INTO intake_log (user_id, log_date, intake_type, amount)
         VALUES (?, ?, ?, ?)`
      )
      .run(userId, input.logDate, input.intakeType, input.amount);

    const row = db
      .prepare(
        'SELECT id, user_id, log_date, intake_type, amount, created_at FROM intake_log WHERE id = ?'
      )
      .get(result.lastInsertRowid) as IntakeRow;

    return rowToEntry(row);
  },

  /**
   * Delete a specific intake entry
   */
  delete(userId: number, entryId: number): void {
    const db = getDb();
    const result = db
      .prepare('DELETE FROM intake_log WHERE id = ? AND user_id = ?')
      .run(entryId, userId);

    if (result.changes === 0) {
      throw new NotFoundError('Intake entry', entryId);
    }
  },
};
