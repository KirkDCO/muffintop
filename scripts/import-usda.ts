/**
 * USDA FoodData Central Import Script
 *
 * Downloads and imports USDA food data into SQLite database.
 * Data sources:
 * - Foundation Foods
 * - SR Legacy
 * - Branded Foods
 *
 * Nutrients imported (17 total):
 * - Energy: calories
 * - Macros: protein, carbs, totalFat
 * - Fats: saturatedFat, transFat, cholesterol
 * - Carbs: fiber, totalSugar, addedSugar
 * - Minerals: sodium, potassium, calcium, iron
 * - Vitamins: vitaminA, vitaminC, vitaminD
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
import {
  NUTRIENT_REGISTRY,
  ALL_NUTRIENT_KEYS,
  getNutrientDbColumns,
  type NutrientKey,
} from '@muffintop/shared/types';

const USDA_DB_PATH = process.env.USDA_DATABASE_PATH || './backend/db/usda/fooddata.db';

// Build nutrient ID to key mapping from the registry
const NUTRIENT_ID_TO_KEY = new Map<number, NutrientKey>();
for (const key of ALL_NUTRIENT_KEYS) {
  NUTRIENT_ID_TO_KEY.set(NUTRIENT_REGISTRY[key].usdaId, key);
}

// Get all USDA nutrient IDs we're interested in
const USDA_NUTRIENT_IDS = ALL_NUTRIENT_KEYS.map((k) => NUTRIENT_REGISTRY[k].usdaId);

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

  // Build nutrient column definitions dynamically
  const nutrientColumns = getNutrientDbColumns().map((col) => `${col} REAL`).join(',\n      ');

  // Create schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS food (
      fdc_id INTEGER PRIMARY KEY,
      description TEXT NOT NULL,
      data_type TEXT NOT NULL,
      brand_owner TEXT,
      ${nutrientColumns}
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
