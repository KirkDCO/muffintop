/**
 * USDA FoodData Central Import Script
 *
 * Downloads and imports USDA food data into SQLite database.
 * Data sources:
 * - Foundation Foods (~2,800 whole foods with detailed nutrients)
 * - SR Legacy (~7,800 standard reference foods)
 * - Branded Foods (~400,000 packaged products)
 *
 * Usage:
 *   npx tsx scripts/import-usda.ts              # Download and import
 *   npx tsx scripts/import-usda.ts --skip-download  # Import from existing CSV
 *   npx tsx scripts/import-usda.ts --foundation-only # Only foundation foods
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createUnzip } from 'zlib';
import {
  NUTRIENT_REGISTRY,
  ALL_NUTRIENT_KEYS,
  getNutrientDbColumns,
  type NutrientKey,
} from '@muffintop/shared/types';

// Configuration
const USDA_DOWNLOAD_URL = 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_csv_2024-10-31.zip';
const DATA_DIR = './backend/db/usda';
const ZIP_PATH = path.join(DATA_DIR, 'FoodData_Central.zip');
const CSV_DIR = path.join(DATA_DIR, 'csv');
const DB_PATH = path.join(DATA_DIR, 'fooddata.db');

// Build nutrient ID to key mapping from the registry
const NUTRIENT_ID_TO_KEY = new Map<number, NutrientKey>();
for (const key of ALL_NUTRIENT_KEYS) {
  NUTRIENT_ID_TO_KEY.set(NUTRIENT_REGISTRY[key].usdaId, key);
}

// Data types to import
type DataType = 'foundation' | 'sr_legacy' | 'branded';
const DATA_TYPE_MAP: Record<string, DataType> = {
  'foundation_food': 'foundation',
  'sr_legacy_food': 'sr_legacy',
  'branded_food': 'branded',
};

interface ImportOptions {
  skipDownload: boolean;
  foundationOnly: boolean;
  brandedLimit?: number;
}

/**
 * Download USDA data file
 */
async function downloadUsdaData(): Promise<void> {
  console.log('Downloading USDA FoodData Central...');
  console.log(`URL: ${USDA_DOWNLOAD_URL}`);

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const response = await fetch(USDA_DOWNLOAD_URL);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  const totalBytes = parseInt(response.headers.get('content-length') || '0', 10);
  let downloadedBytes = 0;
  let lastPercent = 0;

  const fileStream = createWriteStream(ZIP_PATH);
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    fileStream.write(value);
    downloadedBytes += value.length;

    if (totalBytes > 0) {
      const percent = Math.floor((downloadedBytes / totalBytes) * 100);
      if (percent >= lastPercent + 10) {
        console.log(`  ${percent}% (${Math.round(downloadedBytes / 1024 / 1024)}MB)`);
        lastPercent = percent;
      }
    }
  }

  fileStream.end();
  console.log(`Download complete: ${Math.round(downloadedBytes / 1024 / 1024)}MB`);
}

/**
 * Extract ZIP file
 */
async function extractZip(): Promise<void> {
  console.log('Extracting ZIP file...');

  // Use unzip command (more reliable for large files)
  const { execSync } = await import('child_process');

  if (!fs.existsSync(CSV_DIR)) {
    fs.mkdirSync(CSV_DIR, { recursive: true });
  }

  try {
    execSync(`unzip -o "${ZIP_PATH}" -d "${CSV_DIR}"`, {
      stdio: 'inherit',
      maxBuffer: 50 * 1024 * 1024,
    });
  } catch {
    // Try alternative extraction
    console.log('unzip failed, trying alternative method...');
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip(ZIP_PATH);
    zip.extractAllTo(CSV_DIR, true);
  }

  console.log('Extraction complete.');
}

/**
 * Parse CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Read CSV file line by line
 */
async function* readCSV(filename: string): AsyncGenerator<Record<string, string>> {
  const filepath = findCSVFile(filename);
  if (!filepath) {
    console.log(`  Warning: ${filename} not found, skipping`);
    return;
  }

  const fileStream = createReadStream(filepath);
  const rl = createInterface({ input: fileStream, crlfDelay: Infinity });

  let headers: string[] = [];
  let lineNum = 0;

  for await (const line of rl) {
    lineNum++;
    if (lineNum === 1) {
      headers = parseCSVLine(line).map((h) => h.toLowerCase().trim());
      continue;
    }

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = values[i] || '';
    }
    yield row;
  }
}

/**
 * Find CSV file (handles nested directories from ZIP extraction)
 */
function findCSVFile(filename: string): string | null {
  // Direct path
  const direct = path.join(CSV_DIR, filename);
  if (fs.existsSync(direct)) return direct;

  // Search in subdirectories
  const entries = fs.readdirSync(CSV_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const nested = path.join(CSV_DIR, entry.name, filename);
      if (fs.existsSync(nested)) return nested;
    }
  }

  return null;
}

/**
 * Import USDA data into SQLite
 */
async function importToDatabase(options: ImportOptions): Promise<void> {
  console.log(`\nCreating database at ${DB_PATH}...`);

  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = OFF');
  db.pragma('cache_size = -64000'); // 64MB cache

  // Build nutrient column definitions
  const nutrientColumns = getNutrientDbColumns()
    .map((col) => `${col} REAL`)
    .join(',\n      ');

  // Create schema
  console.log('Creating schema...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS food (
      fdc_id INTEGER PRIMARY KEY,
      description TEXT NOT NULL,
      data_type TEXT NOT NULL,
      brand_owner TEXT,
      ${nutrientColumns}
    );

    CREATE TABLE IF NOT EXISTS food_portion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fdc_id INTEGER NOT NULL,
      gram_weight REAL NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 1,
      FOREIGN KEY (fdc_id) REFERENCES food(fdc_id)
    );
  `);

  // Phase 1: Import foods
  console.log('\nPhase 1: Importing foods...');

  const allowedTypes = options.foundationOnly
    ? ['foundation_food']
    : Object.keys(DATA_TYPE_MAP);

  // Build insert statement with all nutrient columns
  const nutrientCols = getNutrientDbColumns();
  const insertFoodSql = `
    INSERT OR REPLACE INTO food (fdc_id, description, data_type, brand_owner, ${nutrientCols.join(', ')})
    VALUES (?, ?, ?, ?, ${nutrientCols.map(() => '?').join(', ')})
  `;
  const insertFood = db.prepare(insertFoodSql);

  // Collect food IDs and their basic info
  const foods = new Map<number, { description: string; dataType: DataType; brandOwner: string | null }>();
  let foodCount = 0;

  for await (const row of readCSV('food.csv')) {
    const dataType = DATA_TYPE_MAP[row.data_type];
    if (!dataType || !allowedTypes.includes(row.data_type)) continue;

    // Apply branded limit if set
    if (dataType === 'branded' && options.brandedLimit && foodCount >= options.brandedLimit) {
      continue;
    }

    const fdcId = parseInt(row.fdc_id, 10);
    if (isNaN(fdcId)) continue;

    foods.set(fdcId, {
      description: row.description || 'Unknown',
      dataType,
      brandOwner: null,
    });

    foodCount++;
    if (foodCount % 50000 === 0) {
      console.log(`  Read ${foodCount} foods...`);
    }
  }

  console.log(`  Found ${foods.size} foods to import`);

  // Phase 2: Get brand owners for branded foods
  console.log('\nPhase 2: Loading brand information...');
  let brandCount = 0;

  for await (const row of readCSV('branded_food.csv')) {
    const fdcId = parseInt(row.fdc_id, 10);
    const food = foods.get(fdcId);
    if (food && row.brand_owner) {
      food.brandOwner = row.brand_owner;
      brandCount++;
    }
  }
  console.log(`  Loaded ${brandCount} brand owners`);

  // Phase 3: Load nutrients
  console.log('\nPhase 3: Loading nutrients...');
  const nutrients = new Map<number, Map<NutrientKey, number>>();
  let nutrientCount = 0;

  for await (const row of readCSV('food_nutrient.csv')) {
    const fdcId = parseInt(row.fdc_id, 10);
    if (!foods.has(fdcId)) continue;

    const nutrientId = parseInt(row.nutrient_id, 10);
    const key = NUTRIENT_ID_TO_KEY.get(nutrientId);
    if (!key) continue;

    const amount = parseFloat(row.amount);
    if (isNaN(amount)) continue;

    if (!nutrients.has(fdcId)) {
      nutrients.set(fdcId, new Map());
    }
    nutrients.get(fdcId)!.set(key, amount);
    nutrientCount++;

    if (nutrientCount % 500000 === 0) {
      console.log(`  Processed ${nutrientCount} nutrient values...`);
    }
  }
  console.log(`  Loaded ${nutrientCount} nutrient values`);

  // Phase 4: Insert foods with nutrients
  console.log('\nPhase 4: Inserting foods into database...');
  let insertCount = 0;

  const insertTransaction = db.transaction(() => {
    for (const [fdcId, food] of foods) {
      const foodNutrients = nutrients.get(fdcId);

      // Build nutrient values array
      const nutrientValues = ALL_NUTRIENT_KEYS.map((key) => {
        const value = foodNutrients?.get(key);
        return value !== undefined ? value : null;
      });

      insertFood.run(fdcId, food.description, food.dataType, food.brandOwner, ...nutrientValues);
      insertCount++;

      if (insertCount % 50000 === 0) {
        console.log(`  Inserted ${insertCount} foods...`);
      }
    }
  });

  insertTransaction();
  console.log(`  Inserted ${insertCount} foods`);

  // Phase 5: Load portions
  console.log('\nPhase 5: Loading portions...');
  const insertPortion = db.prepare(`
    INSERT INTO food_portion (fdc_id, gram_weight, description, amount)
    VALUES (?, ?, ?, ?)
  `);

  let portionCount = 0;

  const portionTransaction = db.transaction(() => {
    // We need to iterate through the generator synchronously within the transaction
    // So we'll collect portions first, then insert
  });

  // Collect portions
  const portions: Array<{ fdcId: number; gramWeight: number; description: string; amount: number }> = [];

  for await (const row of readCSV('food_portion.csv')) {
    const fdcId = parseInt(row.fdc_id, 10);
    if (!foods.has(fdcId)) continue;

    const gramWeight = parseFloat(row.gram_weight);
    if (isNaN(gramWeight) || gramWeight <= 0) continue;

    const amount = parseFloat(row.amount) || 1;
    const description = row.portion_description || row.modifier || `${gramWeight}g`;

    portions.push({ fdcId, gramWeight, description, amount });
  }

  // Insert portions in transaction
  const insertPortions = db.transaction((items: typeof portions) => {
    for (const p of items) {
      insertPortion.run(p.fdcId, p.gramWeight, p.description, p.amount);
      portionCount++;
    }
  });

  insertPortions(portions);
  console.log(`  Inserted ${portionCount} portions`);

  // Phase 6: Create indexes
  console.log('\nPhase 6: Creating indexes...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_food_data_type ON food(data_type);
    CREATE INDEX IF NOT EXISTS idx_food_portion_fdc ON food_portion(fdc_id);
  `);

  // Phase 7: Create FTS index
  console.log('\nPhase 7: Creating full-text search index...');
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS food_fts USING fts5(
      description,
      brand_owner,
      content='food',
      content_rowid='fdc_id'
    );

    INSERT INTO food_fts(food_fts) VALUES('rebuild');
  `);

  // Final stats
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM food) as total_foods,
      (SELECT COUNT(*) FROM food WHERE data_type = 'foundation') as foundation,
      (SELECT COUNT(*) FROM food WHERE data_type = 'sr_legacy') as sr_legacy,
      (SELECT COUNT(*) FROM food WHERE data_type = 'branded') as branded,
      (SELECT COUNT(*) FROM food_portion) as portions
  `).get() as Record<string, number>;

  console.log('\n=== Import Complete ===');
  console.log(`Total foods: ${stats.total_foods}`);
  console.log(`  - Foundation: ${stats.foundation}`);
  console.log(`  - SR Legacy: ${stats.sr_legacy}`);
  console.log(`  - Branded: ${stats.branded}`);
  console.log(`Total portions: ${stats.portions}`);

  const dbSize = fs.statSync(DB_PATH).size / (1024 * 1024);
  console.log(`Database size: ${dbSize.toFixed(1)}MB`);

  db.close();
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const options: ImportOptions = {
    skipDownload: args.includes('--skip-download'),
    foundationOnly: args.includes('--foundation-only'),
    brandedLimit: args.includes('--branded-limit')
      ? parseInt(args[args.indexOf('--branded-limit') + 1], 10)
      : undefined,
  };

  console.log('=== USDA FoodData Central Import ===\n');
  console.log('Options:', options);

  // Step 1: Download if needed
  if (!options.skipDownload) {
    if (fs.existsSync(ZIP_PATH)) {
      console.log(`Using existing download: ${ZIP_PATH}`);
    } else {
      await downloadUsdaData();
    }

    // Step 2: Extract
    await extractZip();
  } else {
    console.log('Skipping download, using existing CSV files...');
  }

  // Step 3: Import
  await importToDatabase(options);

  console.log('\nDone! You can now use the USDA database.');
  console.log(`Database location: ${path.resolve(DB_PATH)}`);
}

main().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
