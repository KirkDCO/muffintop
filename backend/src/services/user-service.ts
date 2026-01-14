import { getDb } from '../db/connection.js';
import { ConflictError, NotFoundError } from '../middleware/error-handler.js';
import type { User } from '@feedbag/shared/types';
import type { CreateUserInput } from '../models/user.js';

interface UserRow {
  id: number;
  name: string;
  created_at: string;
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

  create(input: CreateUserInput): User {
    const db = getDb();

    // Check for duplicate name
    const existing = db.prepare('SELECT id FROM user WHERE name = ?').get(input.name);
    if (existing) {
      throw new ConflictError(`User with name "${input.name}" already exists`);
    }

    const result = db.prepare('INSERT INTO user (name) VALUES (?)').run(input.name);

    return this.getById(Number(result.lastInsertRowid));
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
};
