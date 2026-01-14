import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { initializeDatabase } from '../../src/db/init.js';
import { closeDb, getDb } from '../../src/db/connection.js';
import type { Express } from 'express';

describe('Foods API', () => {
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
    // Set up test food data
    const db = getDb();
    db.exec('DELETE FROM food_portion');
    db.exec('DELETE FROM food');

    // Insert test foods
    db.prepare(`
      INSERT INTO food (fdc_id, description, data_type, brand_owner, calories, protein, carbs, added_sugar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(123456, 'Chicken breast, grilled', 'foundation', null, 165, 31, 0, 0);

    db.prepare(`
      INSERT INTO food (fdc_id, description, data_type, brand_owner, calories, protein, carbs, added_sugar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(123457, 'Chicken thigh, roasted', 'sr_legacy', null, 209, 26, 0, 0);

    db.prepare(`
      INSERT INTO food (fdc_id, description, data_type, brand_owner, calories, protein, carbs, added_sugar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(123458, 'Organic Chicken Nuggets', 'branded', 'Tyson', 280, 14, 18, 2);

    // Insert portions for first food
    db.prepare(`
      INSERT INTO food_portion (fdc_id, gram_weight, description, amount)
      VALUES (?, ?, ?, ?)
    `).run(123456, 100, '100 grams', 1);

    db.prepare(`
      INSERT INTO food_portion (fdc_id, gram_weight, description, amount)
      VALUES (?, ?, ?, ?)
    `).run(123456, 172, '1 breast', 1);

    // Rebuild FTS index
    db.exec("INSERT INTO food_fts(food_fts) VALUES('rebuild')");
  });

  describe('GET /api/v1/foods/search', () => {
    it('returns matching foods for search query', async () => {
      const response = await request(app).get('/api/v1/foods/search?q=chicken');

      expect(response.status).toBe(200);
      expect(response.body.foods).toHaveLength(3);
      expect(response.body.total).toBe(3);
    });

    it('filters by data type', async () => {
      const response = await request(app).get('/api/v1/foods/search?q=chicken&dataType=foundation');

      expect(response.status).toBe(200);
      expect(response.body.foods).toHaveLength(1);
      expect(response.body.foods[0].dataType).toBe('foundation');
    });

    it('respects limit parameter', async () => {
      const response = await request(app).get('/api/v1/foods/search?q=chicken&limit=2');

      expect(response.status).toBe(200);
      expect(response.body.foods).toHaveLength(2);
      expect(response.body.total).toBe(3);
    });

    it('returns 400 for search query less than 2 characters', async () => {
      const response = await request(app).get('/api/v1/foods/search?q=c');

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns empty array for no matches', async () => {
      const response = await request(app).get('/api/v1/foods/search?q=zzznotfound');

      expect(response.status).toBe(200);
      expect(response.body.foods).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });
  });

  describe('GET /api/v1/foods/:fdcId', () => {
    it('returns food details with portions', async () => {
      const response = await request(app).get('/api/v1/foods/123456');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        fdcId: 123456,
        description: 'Chicken breast, grilled',
        dataType: 'foundation',
        calories: 165,
        protein: 31,
        carbs: 0,
        addedSugar: 0,
      });
      expect(response.body.portions).toHaveLength(2);
      expect(response.body.portions[0]).toMatchObject({
        gramWeight: 100,
        description: '100 grams',
      });
    });

    it('returns 404 for non-existent food', async () => {
      const response = await request(app).get('/api/v1/foods/999999');

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('returns branded food with brand owner', async () => {
      const response = await request(app).get('/api/v1/foods/123458');

      expect(response.status).toBe(200);
      expect(response.body.brandOwner).toBe('Tyson');
      expect(response.body.dataType).toBe('branded');
    });
  });
});
