import { getDb, closeDb } from './connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function initializeDatabase(reset = false): void {
  const db = getDb();

  if (reset) {
    console.log('Resetting database...');
    // Drop all tables in reverse dependency order
    db.exec(`
      DROP TABLE IF EXISTS body_metric;
      DROP TABLE IF EXISTS activity_log;
      DROP TABLE IF EXISTS daily_target;
      DROP TABLE IF EXISTS recipe_ingredient;
      DROP TABLE IF EXISTS recipe;
      DROP TABLE IF EXISTS food_log;
      DROP TABLE IF EXISTS custom_food;
      DROP TABLE IF EXISTS food_portion;
      DROP TABLE IF EXISTS food_fts;
      DROP TABLE IF EXISTS food;
      DROP TABLE IF EXISTS user;
    `);
  }

  // Read and execute schema
  const schemaPath = path.resolve(__dirname, '../../db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  console.log('Initializing database schema...');
  db.exec(schema);
  console.log('Database schema initialized successfully.');

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

  // Insert sample foods (per 100g values)
  const insertFood = db.prepare(`
    INSERT INTO food (fdc_id, description, data_type, brand_owner, calories, protein, carbs, added_sugar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleFoods = [
    // Fruits
    [170567, 'Banana, raw', 'foundation', null, 89, 1.1, 23, 0],
    [171688, 'Apple, raw, with skin', 'foundation', null, 52, 0.3, 14, 0],
    [167762, 'Orange, raw', 'foundation', null, 47, 0.9, 12, 0],
    [171711, 'Strawberries, raw', 'foundation', null, 32, 0.7, 8, 0],
    // Proteins
    [171534, 'Chicken breast, grilled, skinless', 'foundation', null, 165, 31, 0, 0],
    [175167, 'Beef, ground, 90% lean, cooked', 'foundation', null, 176, 26, 0, 0],
    [175139, 'Salmon, Atlantic, cooked', 'foundation', null, 208, 20, 0, 0],
    [173423, 'Eggs, whole, scrambled', 'foundation', null, 149, 10, 2, 0],
    [174288, 'Tofu, firm', 'foundation', null, 144, 17, 3, 0],
    // Grains
    [168880, 'Rice, white, cooked', 'sr_legacy', null, 130, 2.7, 28, 0],
    [168873, 'Rice, brown, cooked', 'sr_legacy', null, 112, 2.3, 24, 0],
    [168936, 'Bread, whole wheat', 'sr_legacy', null, 247, 13, 41, 4],
    [169761, 'Pasta, cooked', 'sr_legacy', null, 131, 5, 25, 0],
    [169705, 'Oatmeal, cooked', 'sr_legacy', null, 68, 2.4, 12, 0],
    // Vegetables
    [170406, 'Broccoli, cooked', 'foundation', null, 35, 2.4, 7, 0],
    [169986, 'Spinach, raw', 'foundation', null, 23, 2.9, 4, 0],
    [170476, 'Carrots, raw', 'foundation', null, 41, 0.9, 10, 0],
    [168483, 'Potato, baked, with skin', 'foundation', null, 93, 2.5, 21, 0],
    [169228, 'Sweet potato, baked', 'foundation', null, 90, 2, 21, 0],
    // Dairy
    [171265, 'Milk, 2% fat', 'sr_legacy', null, 50, 3.3, 5, 0],
    [170903, 'Greek yogurt, plain, nonfat', 'sr_legacy', null, 59, 10, 4, 0],
    [173414, 'Cheese, cheddar', 'sr_legacy', null, 403, 23, 3, 0],
    // Branded examples
    [2047563, 'KIND Bar, Dark Chocolate Nuts', 'branded', 'KIND', 210, 6, 17, 5],
    [2003586, 'Chobani Greek Yogurt, Vanilla', 'branded', 'Chobani', 120, 12, 15, 11],
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
