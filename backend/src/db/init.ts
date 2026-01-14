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
