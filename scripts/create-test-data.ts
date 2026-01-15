/**
 * Script to create a test user with 6 months of historical data
 * for testing the longitudinal trend chart.
 *
 * Run with: npx tsx scripts/create-test-data.ts
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../backend/db/muffintop.db');

const db = new Database(dbPath);

// Test user name
const TEST_USER_NAME = 'TestUser';

// Targets
const BASAL_CALORIES = 2000;
const PROTEIN_TARGET = 150;
const ADDED_SUGAR_TARGET = 25;

// Weight simulation: start at 185 lb, gradually decrease to ~175 lb over 6 months
const STARTING_WEIGHT = 185;
const WEIGHT_CHANGE_RATE = -0.05; // lb per day on average

// Generate a random number with some gaussian-like distribution
function randomVariation(base: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return base + z * stdDev;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

async function main() {
  console.log('Creating test user with historical data...');
  console.log(`Database: ${dbPath}`);

  // Check if test user already exists
  const existingUser = db.prepare('SELECT id FROM user WHERE name = ?').get(TEST_USER_NAME) as { id: number } | undefined;

  let userId: number;
  if (existingUser) {
    userId = existingUser.id;
    console.log(`Test user "${TEST_USER_NAME}" already exists with id ${userId}`);

    // Clear existing data for this user
    console.log('Clearing existing data...');
    db.prepare('DELETE FROM food_log WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM body_metric WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM activity_log WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM daily_target WHERE user_id = ?').run(userId);
  } else {
    // Create test user
    const result = db.prepare('INSERT INTO user (name) VALUES (?)').run(TEST_USER_NAME);
    userId = result.lastInsertRowid as number;
    console.log(`Created test user "${TEST_USER_NAME}" with id ${userId}`);
  }

  // Set up targets
  const nutrientTargets = JSON.stringify({
    protein: { value: PROTEIN_TARGET, comparator: 'gte' },
    addedSugar: { value: ADDED_SUGAR_TARGET, comparator: 'lte' },
  });

  db.prepare(`
    INSERT INTO daily_target (user_id, basal_calories, nutrient_targets)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      basal_calories = excluded.basal_calories,
      nutrient_targets = excluded.nutrient_targets
  `).run(userId, BASAL_CALORIES, nutrientTargets);
  console.log(`Set targets: ${BASAL_CALORIES} cal, ${PROTEIN_TARGET}g protein, ${ADDED_SUGAR_TARGET}g added sugar`);

  // Generate 6 months of data
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);

  const foodLogStmt = db.prepare(`
    INSERT INTO food_log (
      user_id, food_id, log_date, meal_category, portion_amount, portion_grams,
      calories, protein, carbs, total_fat, fiber, added_sugar, total_sugar,
      saturated_fat, trans_fat, cholesterol, sodium, potassium, calcium, iron,
      vitamin_a, vitamin_c, vitamin_d
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?
    )
  `);

  const weightStmt = db.prepare(`
    INSERT INTO body_metric (user_id, metric_date, weight_value, weight_unit)
    VALUES (?, ?, ?, ?)
  `);

  const activityStmt = db.prepare(`
    INSERT INTO activity_log (user_id, log_date, activity_calories)
    VALUES (?, ?, ?)
  `);

  let dayCount = 0;
  let weightEntryCount = 0;
  let foodLogCount = 0;
  const currentDate = new Date(startDate);

  // Get some sample food IDs from the database
  const sampleFoods = db.prepare(`
    SELECT fdc_id, calories, protein, carbs, total_fat, fiber, added_sugar, total_sugar
    FROM food
    WHERE calories > 0 AND calories < 1000
    LIMIT 50
  `).all() as Array<{
    fdc_id: number;
    calories: number;
    protein: number;
    carbs: number;
    total_fat: number;
    fiber: number;
    added_sugar: number;
    total_sugar: number;
  }>;

  if (sampleFoods.length === 0) {
    console.error('No foods found in database. Run USDA import first.');
    process.exit(1);
  }

  console.log(`Found ${sampleFoods.length} sample foods`);

  while (currentDate <= endDate) {
    const dateStr = formatDate(currentDate);
    dayCount++;

    // Skip some days randomly (simulate missed logging days)
    const logToday = Math.random() > 0.15; // 85% chance of logging

    if (logToday) {
      // Generate 3-6 food entries per day
      const entryCount = Math.floor(Math.random() * 4) + 3;
      const meals: ('breakfast' | 'lunch' | 'dinner' | 'snack')[] = ['breakfast', 'lunch', 'dinner', 'snack'];

      // Target daily calories with some variation
      const targetCalories = randomVariation(BASAL_CALORIES, 300);
      let remainingCalories = targetCalories;

      for (let i = 0; i < entryCount && remainingCalories > 100; i++) {
        const food = sampleFoods[Math.floor(Math.random() * sampleFoods.length)];
        const meal = meals[Math.min(i, meals.length - 1)];

        // Portion size to roughly hit target
        const targetEntryCalories = remainingCalories / (entryCount - i);
        const portionMultiplier = food.calories > 0 ? targetEntryCalories / food.calories : 1;
        const adjustedMultiplier = Math.max(0.5, Math.min(3, portionMultiplier * randomVariation(1, 0.3)));

        const calories = Math.round(food.calories * adjustedMultiplier);
        const protein = Math.round((food.protein || 0) * adjustedMultiplier * 10) / 10;
        const carbs = Math.round((food.carbs || 0) * adjustedMultiplier * 10) / 10;
        const totalFat = Math.round((food.total_fat || 0) * adjustedMultiplier * 10) / 10;
        const fiber = Math.round((food.fiber || 0) * adjustedMultiplier * 10) / 10;
        const addedSugar = Math.round((food.added_sugar || 0) * adjustedMultiplier * 10) / 10;
        const totalSugar = Math.round((food.total_sugar || 0) * adjustedMultiplier * 10) / 10;

        foodLogStmt.run(
          userId, food.fdc_id, dateStr, meal, adjustedMultiplier, 100 * adjustedMultiplier,
          calories, protein, carbs, totalFat, fiber, addedSugar, totalSugar,
          0, 0, 0, 0, 0, 0, 0,
          0, 0, 0
        );

        remainingCalories -= calories;
        foodLogCount++;
      }

      // Add activity calories on some days (60% chance)
      if (Math.random() > 0.4) {
        const activityCal = Math.floor(randomVariation(300, 150));
        if (activityCal > 50) {
          activityStmt.run(userId, dateStr, activityCal);
        }
      }
    }

    // Log weight periodically (roughly every 5-10 days)
    const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const shouldLogWeight = daysSinceStart % 7 === 0 || (Math.random() > 0.85);

    if (shouldLogWeight) {
      // Calculate expected weight with some daily variation
      const expectedWeight = STARTING_WEIGHT + (daysSinceStart * WEIGHT_CHANGE_RATE);
      const actualWeight = Math.round(randomVariation(expectedWeight, 1.5) * 10) / 10;

      weightStmt.run(userId, dateStr, actualWeight, 'lb');
      weightEntryCount++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`\nGenerated data for ${dayCount} days:`);
  console.log(`- ${foodLogCount} food log entries`);
  console.log(`- ${weightEntryCount} weight entries`);
  console.log(`\nTest user "${TEST_USER_NAME}" is ready to use!`);

  db.close();
}

main().catch(console.error);
