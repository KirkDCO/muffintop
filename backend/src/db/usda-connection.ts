/**
 * USDA FoodData Central database connection
 * Separate read-only database for food search
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const USDA_DB_PATH = process.env.USDA_DATABASE_PATH || path.join(__dirname, '../../db/usda/fooddata.db');

let usdaDb: Database.Database | null = null;
let checkedExists = false;

/**
 * Get the USDA database connection
 * Returns null if USDA database doesn't exist (fallback to main db)
 */
export function getUsdaDb(): Database.Database | null {
  if (usdaDb) return usdaDb;

  if (checkedExists) return null;
  checkedExists = true;

  if (!fs.existsSync(USDA_DB_PATH)) {
    console.log('USDA database not found at:', USDA_DB_PATH);
    console.log('Food search will use sample data from main database.');
    console.log('Run "npm run usda:import" to download and import full USDA dataset.');
    return null;
  }

  try {
    usdaDb = new Database(USDA_DB_PATH, { readonly: true });
    usdaDb.pragma('journal_mode = WAL');

    // Verify database has data
    const count = usdaDb.prepare('SELECT COUNT(*) as c FROM food').get() as { c: number };
    console.log(`Connected to USDA database: ${count.c} foods available`);

    return usdaDb;
  } catch (error) {
    console.error('Failed to connect to USDA database:', error);
    return null;
  }
}

/**
 * Close the USDA database connection
 */
export function closeUsdaDb(): void {
  if (usdaDb) {
    usdaDb.close();
    usdaDb = null;
    checkedExists = false;
  }
}

/**
 * Check if USDA database is available
 */
export function hasUsdaDb(): boolean {
  return fs.existsSync(USDA_DB_PATH);
}

/**
 * Get USDA database path (for diagnostics)
 */
export function getUsdaDbPath(): string {
  return USDA_DB_PATH;
}
