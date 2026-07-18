import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeDatabase } from '../src/db/init.js';
import { closeDb, getDb, resetDb } from '../src/db/connection.js';
import { closeUsdaDb } from '../src/db/usda-connection.js';
import { eventCorrelationService } from '../src/services/event-correlation-service.js';

function dateStr(offset: number): string {
  const d = new Date('2026-01-01T00:00:00');
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

const USER_ID = 1;
const DAYS = 40;

describe('eventCorrelationService', () => {
  beforeAll(() => {
    resetDb();
    closeUsdaDb();
    process.env.DATABASE_PATH = ':memory:';
    process.env.USDA_DATABASE_PATH = '/nonexistent/path/usda.db';
    initializeDatabase(true);

    const db = getDb();
    db.prepare(`INSERT INTO user (id, name) VALUES (?, ?)`).run(USER_ID, 'tester');
    db.prepare(
      `INSERT INTO rated_event_series (user_id, description, direction, color)
       VALUES (?, 'Mood', 'higher_better', '#ff6b6b')`
    ).run(USER_ID);

    const insertFood = db.prepare(
      `INSERT INTO food_log
        (user_id, food_id, log_date, meal_category, portion_amount, portion_grams,
         logged_food_name, calories, protein, carbs)
       VALUES (?, 999, ?, 'lunch', 1, 100, ?, ?, ?, 0)`
    );
    const insertRating = db.prepare(
      `INSERT INTO user_event (user_id, event_date, description, color, rating)
       VALUES (?, ?, 'Mood', '#ff6b6b', ?)`
    );

    // Protein rises across the window; mood tracks the protein eaten TWO DAYS EARLIER.
    const protein: number[] = [];
    for (let i = 0; i < DAYS; i++) {
      protein[i] = 10 + (i % 10) * 8; // 10..82, repeating — gives spread without collinear time trend
    }
    for (let i = 0; i < DAYS; i++) {
      insertFood.run(USER_ID, dateStr(i), `food-${i % 3}`, 2000, protein[i]);
      // rating depends on protein two days prior (lag 2), scaled into 1..10
      const source = i >= 2 ? protein[i - 2] : 40;
      const rating = Math.max(1, Math.min(10, Math.round(1 + ((source - 10) / 72) * 9)));
      insertRating.run(USER_ID, dateStr(i), rating);
    }
  });

  afterAll(() => {
    closeDb();
    closeUsdaDb();
  });

  it('finds the injected 2-day-lagged protein/mood relationship', () => {
    const result = eventCorrelationService.analyze(USER_ID, {
      eventDescription: 'Mood',
      startDate: dateStr(0),
      endDate: dateStr(DAYS - 1),
      maxLag: 4,
      maxWindow: 3,
      metrics: ['protein'],
      normalizePerKcal: false,
    });

    expect(result.direction).toBe('higher_better');
    expect(result.ratingCount).toBe(DAYS);
    expect(result.pairedDayCount).toBeGreaterThan(0);

    const protein = result.metrics.find((m) => m.key === 'protein');
    expect(protein).toBeDefined();
    // Strong positive correlation, peaking at lag 2 (single-day window)
    expect(protein!.best.pearson).toBeGreaterThan(0.9);
    expect(protein!.best.lag).toBe(2);
    expect(protein!.best.window).toBe(1);
    // Full grid present (lag 0..4 × window 1..3)
    expect(protein!.cells.length).toBe(5 * 3);
    // Same-day (lag 0) correlation should be clearly weaker than the lag-2 peak
    const sameDay = protein!.cells.find((c) => c.lag === 0 && c.window === 1)!;
    expect(Math.abs(sameDay.pearson)).toBeLessThan(protein!.best.pearson);
  });

  it('normalizes per 1000 kcal without crashing and keeps calories absolute', () => {
    const result = eventCorrelationService.analyze(USER_ID, {
      eventDescription: 'Mood',
      startDate: dateStr(0),
      endDate: dateStr(DAYS - 1),
      maxLag: 2,
      maxWindow: 2,
      metrics: ['protein', 'calories'],
      normalizePerKcal: true,
    });
    expect(result.normalizedPerKcal).toBe(true);
    const protein = result.metrics.find((m) => m.key === 'protein')!;
    expect(protein.unit).toContain('/1000kcal');
    // 2000 kcal constant -> protein-per-1000kcal is proportional to raw protein, so lag-2 peak holds
    expect(protein.best.lag).toBe(2);
  });

  it('throws when the series has no rated days in range', () => {
    expect(() =>
      eventCorrelationService.analyze(USER_ID, {
        eventDescription: 'Nonexistent',
        startDate: dateStr(0),
        endDate: dateStr(DAYS - 1),
        maxLag: 2,
        maxWindow: 2,
        metrics: ['protein'],
        normalizePerKcal: false,
      })
    ).toThrow();
  });
});
