import { getDb, closeDb } from './connection.js';
import { runMigrations, markAllMigrationsApplied } from './migrate.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function initializeDatabase(reset = false): void {
  const db = getDb();

  // Check if this is a fresh database (no tables exist yet)
  const tableCheck = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user'")
    .get();
  const isFreshDatabase = !tableCheck;

  if (reset) {
    console.log('Resetting database...');
    // Disable foreign keys for drop operations
    db.pragma('foreign_keys = OFF');
    // Drop all tables in reverse dependency order
    db.exec(`
      DROP TABLE IF EXISTS _migrations;
      DROP TABLE IF EXISTS user_nutrient_preferences;
      DROP TABLE IF EXISTS body_metric;
      DROP TABLE IF EXISTS activity_log;
      DROP TABLE IF EXISTS daily_target;
      DROP TABLE IF EXISTS recipe_ingredient;
      DROP TABLE IF EXISTS recipe_fts;
      DROP TABLE IF EXISTS recipe;
      DROP TABLE IF EXISTS food_log;
      DROP TABLE IF EXISTS custom_food_portion;
      DROP TABLE IF EXISTS custom_food_fts;
      DROP TABLE IF EXISTS custom_food;
      DROP TABLE IF EXISTS food_portion;
      DROP TABLE IF EXISTS food_fts;
      DROP TABLE IF EXISTS food;
      DROP TABLE IF EXISTS user;
    `);
    // Re-enable foreign keys
    db.pragma('foreign_keys = ON');
  }

  // Read and execute schema
  const schemaPath = path.resolve(__dirname, '../../db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  console.log('Initializing database schema...');
  db.exec(schema);
  console.log('Database schema initialized successfully.');

  // Handle migrations
  if (reset || isFreshDatabase) {
    // Fresh schema is already at latest version, just mark migrations as applied
    console.log('Marking migrations as applied (fresh schema is current)...');
    markAllMigrationsApplied();
  } else {
    // Run any pending migrations for existing databases
    console.log('Checking for pending migrations...');
    runMigrations();
  }

  // Seed sample data for testing
  seedSampleData(db);
}

function seedSampleData(db: ReturnType<typeof getDb>): void {
  // Check if sample data already exists
  const existing = db.prepare('SELECT COUNT(*) as count FROM food').get() as { count: number };
  if (existing.count > 0) {
    console.log('Sample data already exists, skipping seed.');
    return;
  }

  console.log('Seeding sample food data...');

  // Insert sample foods (per 100g values) with all nutrients
  // Format: [fdc_id, description, data_type, brand_owner,
  //          calories, protein, carbs, fiber, added_sugar, total_sugar,
  //          total_fat, saturated_fat, trans_fat, cholesterol, sodium, potassium,
  //          calcium, iron, vitamin_a, vitamin_c, vitamin_d]
  const insertFood = db.prepare(`
    INSERT INTO food (
      fdc_id, description, data_type, brand_owner,
      calories, protein, carbs, fiber, added_sugar, total_sugar,
      total_fat, saturated_fat, trans_fat, cholesterol, sodium, potassium,
      calcium, iron, vitamin_a, vitamin_c, vitamin_d
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleFoods = [
    // Fruits [fdc_id, desc, type, brand, cal, pro, carb, fib, addSug, totSug, totFat, satFat, transFat, chol, sodium, potass, calc, iron, vitA, vitC, vitD]
    [170567, 'Banana, raw', 'foundation', null, 89, 1.1, 23, 2.6, 0, 12.2, 0.3, 0.1, 0, 0, 1, 358, 5, 0.3, 3, 8.7, 0],
    [171688, 'Apple, raw, with skin', 'foundation', null, 52, 0.3, 14, 2.4, 0, 10.4, 0.2, 0, 0, 0, 1, 107, 6, 0.1, 3, 4.6, 0],
    [167762, 'Orange, raw', 'foundation', null, 47, 0.9, 12, 2.4, 0, 9.4, 0.1, 0, 0, 0, 0, 181, 40, 0.1, 11, 53.2, 0],
    [171711, 'Strawberries, raw', 'foundation', null, 32, 0.7, 8, 2.0, 0, 4.9, 0.3, 0, 0, 0, 1, 153, 16, 0.4, 1, 58.8, 0],
    // Proteins
    [171534, 'Chicken breast, grilled, skinless', 'foundation', null, 165, 31, 0, 0, 0, 0, 3.6, 1.0, 0, 85, 74, 256, 15, 1.0, 6, 0, 0],
    [175167, 'Beef, ground, 90% lean, cooked', 'foundation', null, 176, 26, 0, 0, 0, 0, 10, 4.0, 0.5, 78, 66, 318, 18, 2.5, 0, 0, 0],
    [175139, 'Salmon, Atlantic, cooked', 'foundation', null, 208, 20, 0, 0, 0, 0, 13, 3.0, 0, 55, 59, 363, 12, 0.3, 40, 0, 11],
    [173423, 'Eggs, whole, scrambled', 'foundation', null, 149, 10, 2, 0, 0, 1.4, 11, 3.3, 0, 352, 145, 138, 50, 1.5, 160, 0, 1.1],
    [174288, 'Tofu, firm', 'foundation', null, 144, 17, 3, 0.9, 0, 0.6, 9, 1.3, 0, 0, 14, 237, 683, 2.7, 0, 0.2, 0],
    // Grains
    [168880, 'Rice, white, cooked', 'sr_legacy', null, 130, 2.7, 28, 0.4, 0, 0, 0.3, 0.1, 0, 0, 1, 35, 10, 1.2, 0, 0, 0],
    [168873, 'Rice, brown, cooked', 'sr_legacy', null, 112, 2.3, 24, 1.8, 0, 0, 0.9, 0.2, 0, 0, 5, 43, 10, 0.4, 0, 0, 0],
    [168936, 'Bread, whole wheat', 'sr_legacy', null, 247, 13, 41, 6.0, 4, 5.6, 3.4, 0.7, 0, 0, 400, 250, 107, 2.5, 0, 0, 0],
    [169761, 'Pasta, cooked', 'sr_legacy', null, 131, 5, 25, 1.8, 0, 0.6, 1.1, 0.2, 0, 0, 1, 44, 7, 1.3, 0, 0, 0],
    [169705, 'Oatmeal, cooked', 'sr_legacy', null, 68, 2.4, 12, 1.7, 0, 0.3, 1.4, 0.2, 0, 0, 49, 61, 9, 1.4, 0, 0, 0],
    // Vegetables
    [170406, 'Broccoli, cooked', 'foundation', null, 35, 2.4, 7, 3.3, 0, 1.4, 0.4, 0.1, 0, 0, 41, 293, 40, 0.7, 77, 64.9, 0],
    [169986, 'Spinach, raw', 'foundation', null, 23, 2.9, 4, 2.2, 0, 0.4, 0.4, 0.1, 0, 0, 79, 558, 99, 2.7, 469, 28.1, 0],
    [170476, 'Carrots, raw', 'foundation', null, 41, 0.9, 10, 2.8, 0, 4.7, 0.2, 0, 0, 0, 69, 320, 33, 0.3, 835, 5.9, 0],
    [168483, 'Potato, baked, with skin', 'foundation', null, 93, 2.5, 21, 2.2, 0, 1.0, 0.1, 0, 0, 0, 10, 535, 15, 1.1, 1, 9.6, 0],
    [169228, 'Sweet potato, baked', 'foundation', null, 90, 2, 21, 3.3, 0, 6.5, 0.1, 0, 0, 0, 36, 475, 38, 0.7, 961, 19.6, 0],
    // Dairy
    [171265, 'Milk, 2% fat', 'sr_legacy', null, 50, 3.3, 5, 0, 0, 5.1, 2.0, 1.2, 0, 8, 41, 150, 120, 0, 47, 0.2, 1.3],
    [170903, 'Greek yogurt, plain, nonfat', 'sr_legacy', null, 59, 10, 4, 0, 0, 3.2, 0.4, 0.1, 0, 5, 47, 141, 110, 0.1, 0, 0, 0],
    [173414, 'Cheese, cheddar', 'sr_legacy', null, 403, 23, 3, 0, 0, 0.5, 33, 19, 1, 99, 653, 76, 710, 0.1, 265, 0, 0.6],
    // Branded examples
    [2047563, 'KIND Bar, Dark Chocolate Nuts', 'branded', 'KIND', 210, 6, 17, 3, 5, 8, 16, 3.5, 0, 0, 15, 200, 40, 1.4, 0, 0, 0],
    [2003586, 'Chobani Greek Yogurt, Vanilla', 'branded', 'Chobani', 120, 12, 15, 0, 11, 12, 0, 0, 0, 5, 55, 180, 150, 0, 0, 0, 0],
  ];

  for (const food of sampleFoods) {
    insertFood.run(...food);
  }

  // Insert common portions for sample foods
  const insertPortion = db.prepare(`
    INSERT INTO food_portion (fdc_id, description, gram_weight, amount)
    VALUES (?, ?, ?, ?)
  `);

  const samplePortions = [
    // Banana portions
    [170567, 'medium (7" to 7-7/8" long)', 118, 1],
    [170567, 'large (8" to 8-7/8" long)', 136, 1],
    // Apple portions
    [171688, 'medium (3" dia)', 182, 1],
    [171688, 'small (2-3/4" dia)', 149, 1],
    // Chicken breast
    [171534, '1 breast', 172, 1],
    [171534, '3 oz', 85, 1],
    // Ground beef
    [175167, '1 patty (4 oz raw)', 85, 1],
    // Rice
    [168880, '1 cup', 158, 1],
    [168873, '1 cup', 195, 1],
    // Bread
    [168936, '1 slice', 43, 1],
    // Eggs
    [173423, '1 large egg', 61, 1],
    [173423, '2 eggs', 122, 2],
    // Milk
    [171265, '1 cup', 244, 1],
    [171265, '8 fl oz', 244, 1],
    // Greek yogurt
    [170903, '1 container (170g)', 170, 1],
    [2003586, '1 container (150g)', 150, 1],
    // Broccoli
    [170406, '1 cup chopped', 156, 1],
    // Potato
    [168483, '1 medium (2-1/4" to 3-1/4" dia)', 173, 1],
    // Oatmeal
    [169705, '1 cup', 234, 1],
    // KIND Bar
    [2047563, '1 bar (40g)', 40, 1],
  ];

  for (const portion of samplePortions) {
    insertPortion.run(...portion);
  }

  console.log(`Seeded ${sampleFoods.length} sample foods with ${samplePortions.length} portions.`);
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const reset = process.argv.includes('--reset');

  try {
    initializeDatabase(reset);
    console.log('Database ready.');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    closeDb();
  }
}
