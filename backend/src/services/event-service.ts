import { getDb } from '../db/connection.js';
import { NotFoundError } from '../middleware/error-handler.js';
import type { UserEvent } from '@muffintop/shared/types';
import type { CreateEventInput, EventQuery } from '../models/user-event.js';

interface EventRow {
  id: number;
  user_id: number;
  event_date: string;
  description: string;
  color: string;
  created_at: string;
}

function rowToUserEvent(row: EventRow): UserEvent {
  return {
    id: row.id,
    eventDate: row.event_date,
    description: row.description,
    color: row.color,
    createdAt: row.created_at,
  };
}

export const eventService = {
  /**
   * Get events with optional date filtering
   */
  getByQuery(userId: number, query: EventQuery): UserEvent[] {
    const db = getDb();
    let sql =
      'SELECT id, user_id, event_date, description, color, created_at FROM user_event WHERE user_id = ?';
    const params: (string | number)[] = [userId];

    if (query.startDate && query.endDate) {
      sql += ' AND event_date >= ? AND event_date <= ?';
      params.push(query.startDate, query.endDate);
    } else if (query.startDate) {
      sql += ' AND event_date >= ?';
      params.push(query.startDate);
    } else if (query.endDate) {
      sql += ' AND event_date <= ?';
      params.push(query.endDate);
    }

    sql += ' ORDER BY event_date DESC, created_at DESC';

    const rows = db.prepare(sql).all(...params) as EventRow[];
    return rows.map(rowToUserEvent);
  },

  /**
   * Get a single event by ID
   */
  getById(userId: number, eventId: number): UserEvent {
    const db = getDb();
    const row = db
      .prepare(
        'SELECT id, user_id, event_date, description, color, created_at FROM user_event WHERE id = ? AND user_id = ?'
      )
      .get(eventId, userId) as EventRow | undefined;

    if (!row) {
      throw new NotFoundError('Event', eventId);
    }

    return rowToUserEvent(row);
  },

  /**
   * Create a new event
   */
  create(userId: number, input: CreateEventInput): UserEvent {
    const db = getDb();

    const result = db
      .prepare(
        `INSERT INTO user_event (user_id, event_date, description, color)
         VALUES (?, ?, ?, ?)`
      )
      .run(userId, input.eventDate, input.description, input.color);

    return this.getById(userId, Number(result.lastInsertRowid));
  },

  /**
   * Delete an event
   */
  delete(userId: number, eventId: number): void {
    const db = getDb();
    const result = db
      .prepare('DELETE FROM user_event WHERE id = ? AND user_id = ?')
      .run(eventId, userId);

    if (result.changes === 0) {
      throw new NotFoundError('Event', eventId);
    }
  },
};
