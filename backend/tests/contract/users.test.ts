import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { initializeDatabase } from '../../src/db/init.js';
import { closeDb, getDb } from '../../src/db/connection.js';
import type { Express } from 'express';

describe('Users API', () => {
  let app: Express;

  beforeAll(() => {
    process.env.DATABASE_PATH = ':memory:';
    initializeDatabase();
    app = createApp();
  });

  afterAll(() => {
    closeDb();
  });

  beforeEach(() => {
    // Clear users table before each test
    const db = getDb();
    db.exec('DELETE FROM user');
  });

  describe('GET /api/v1/users', () => {
    it('returns empty list when no users exist', async () => {
      const response = await request(app).get('/api/v1/users');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ users: [] });
    });

    it('returns list of users', async () => {
      const db = getDb();
      db.prepare('INSERT INTO user (name) VALUES (?)').run('Alice');
      db.prepare('INSERT INTO user (name) VALUES (?)').run('Bob');

      const response = await request(app).get('/api/v1/users');

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(2);
      expect(response.body.users[0]).toMatchObject({ name: 'Alice' });
      expect(response.body.users[1]).toMatchObject({ name: 'Bob' });
    });
  });

  describe('POST /api/v1/users', () => {
    it('creates a new user', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .send({ name: 'Charlie' });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: 'Charlie',
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('returns 400 for empty name', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 409 for duplicate name', async () => {
      const db = getDb();
      db.prepare('INSERT INTO user (name) VALUES (?)').run('Existing');

      const response = await request(app)
        .post('/api/v1/users')
        .send({ name: 'Existing' });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('CONFLICT');
    });
  });

  describe('GET /api/v1/users/:userId', () => {
    it('returns user details', async () => {
      const db = getDb();
      const result = db.prepare('INSERT INTO user (name) VALUES (?)').run('Dave');
      const userId = result.lastInsertRowid;

      const response = await request(app).get(`/api/v1/users/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: Number(userId),
        name: 'Dave',
      });
    });

    it('returns 404 for non-existent user', async () => {
      const response = await request(app).get('/api/v1/users/999');

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/users/:userId', () => {
    it('deletes user and all associated data', async () => {
      const db = getDb();
      const result = db.prepare('INSERT INTO user (name) VALUES (?)').run('ToDelete');
      const userId = result.lastInsertRowid;

      const response = await request(app).delete(`/api/v1/users/${userId}`);

      expect(response.status).toBe(204);

      // Verify user is deleted
      const user = db.prepare('SELECT * FROM user WHERE id = ?').get(userId);
      expect(user).toBeUndefined();
    });

    it('returns 404 for non-existent user', async () => {
      const response = await request(app).delete('/api/v1/users/999');

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('cascades delete to user data', async () => {
      const db = getDb();
      const userResult = db.prepare('INSERT INTO user (name) VALUES (?)').run('WithData');
      const userId = userResult.lastInsertRowid;

      // Add some user data
      db.prepare(
        'INSERT INTO daily_target (user_id, basal_calories) VALUES (?, ?)'
      ).run(userId, 2000);

      // Delete user
      await request(app).delete(`/api/v1/users/${userId}`);

      // Verify cascade
      const target = db.prepare('SELECT * FROM daily_target WHERE user_id = ?').get(userId);
      expect(target).toBeUndefined();
    });
  });
});
