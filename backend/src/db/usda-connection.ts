/**
 * USDA FoodData Central database connection
 * Separate read-only database for food search
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_USDA_DB_PATH = path.join(__dirname, '../../db/usda/fooddata.db');

let usdaDbPath: string | null = null;
let usdaDb: Database.Database | null = null;
let checkedExists = false;

function getUsdaDbPath(): string {
  if (usdaDbPath === null) {
    usdaDbPath = process.env.USDA_DATABASE_PATH || DEFAULT_USDA_DB_PATH;
  }
  return usdaDbPath;
}

/**
 * Get the USDA database connection
 * Returns null if USDA database doesn't exist (fallback to main db)
 */
export function getUsdaDb(): Database.Database | null {
  if (usdaDb) return usdaDb;

  if (checkedExists) return null;
  checkedExists = true;

  const dbPath = getUsdaDbPath();
  if (!fs.existsSync(dbPath)) {
    console.log('USDA database not found at:', dbPath);
    console.log('Food search will use sample data from main database.');
    console.log('Run "npm run usda:import" to download and import full USDA dataset.');
    return null;
  }

  try {
    usdaDb = new Database(dbPath, { readonly: true });
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
  }
  checkedExists = false;
  usdaDbPath = null;
}

/**
 * Check if USDA database is available
 */
export function hasUsdaDb(): boolean {
  return fs.existsSync(getUsdaDbPath());
}

/**
 * Get USDA database path (for diagnostics)
 */
export function getCurrentUsdaDbPath(): string {
  return getUsdaDbPath();
}
