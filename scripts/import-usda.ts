/**
 * USDA FoodData Central Import Script
 *
 * Downloads and imports USDA food data into SQLite database.
 * Data sources:
 * - Foundation Foods
 * - SR Legacy
 * - Branded Foods
 *
 * Usage:
 *   npm run usda:download   # Download CSV files
 *   npm run usda:import     # Import into SQLite
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const USDA_DB_PATH = process.env.USDA_DATABASE_PATH || './backend/db/usda/fooddata.db';

// Nutrient IDs from USDA
const NUTRIENT_IDS = {
  calories: 1008,
  protein: 1003,
  carbs: 1005,
  addedSugar: 1235,
  totalSugar: 2000, // Fallback if added sugar not available
};

interface FoodRow {
  fdc_id: number;
  description: string;
  data_type: string;
  brand_owner?: string;
}

interface NutrientRow {
  fdc_id: number;
  nutrient_id: number;
  amount: number;
}

export async function importUsdaData(csvDir: string): Promise<void> {
  const dbPath = path.resolve(USDA_DB_PATH);
  const dir = path.dirname(dbPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  console.log(`Creating USDA database at ${dbPath}...`);

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Create schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS food (
      fdc_id INTEGER PRIMARY KEY,
      description TEXT NOT NULL,
      data_type TEXT NOT NULL,
      brand_owner TEXT,
      calories REAL,
      protein REAL,
      carbs REAL,
      added_sugar REAL
    );

    CREATE INDEX IF NOT EXISTS idx_food_data_type ON food(data_type);

    CREATE VIRTUAL TABLE IF NOT EXISTS food_fts USING fts5(
      description,
      content='food',
      content_rowid='fdc_id'
    );

    CREATE TABLE IF NOT EXISTS food_portion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fdc_id INTEGER NOT NULL,
      gram_weight REAL NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 1,
      FOREIGN KEY (fdc_id) REFERENCES food(fdc_id)
    );

    CREATE INDEX IF NOT EXISTS idx_food_portion_fdc ON food_portion(fdc_id);
  `);

  // Import logic would go here - reading CSV files and inserting data
  // This is a placeholder - full implementation would parse USDA CSV files

  console.log('USDA import complete.');
  console.log('Note: This is a placeholder. Full CSV import not yet implemented.');

  db.close();
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const csvDir = process.argv[2] || './backend/db/usda/csv';

  importUsdaData(csvDir)
    .then(() => {
      console.log('Import finished.');
    })
    .catch((error) => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}
