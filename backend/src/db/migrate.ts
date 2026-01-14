/**
 * Database migration runner
 * Tracks and applies SQL migrations in order
 */

import { getDb, closeDb } from './connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.resolve(__dirname, '../../db/migrations');

interface MigrationRow {
  filename: string;
}

/**
 * Ensures the migrations tracking table exists
 */
function ensureMigrationsTable(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

/**
 * Gets the set of already-applied migration filenames
 */
function getAppliedMigrations(): Set<string> {
  const db = getDb();
  const rows = db.prepare('SELECT filename FROM _migrations').all() as MigrationRow[];
  return new Set(rows.map((r) => r.filename));
}

/**
 * Gets pending migration files sorted by name
 */
function getPendingMigrations(applied: Set<string>): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();

  return files.filter((f) => !applied.has(f));
}

/**
 * Applies a single migration file
 */
function applyMigration(filename: string): void {
  const db = getDb();
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filepath, 'utf-8');

  console.log(`Applying migration: ${filename}`);

  // Run migration in a transaction
  db.exec('BEGIN TRANSACTION');
  try {
    db.exec(sql);
    db.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(filename);
    db.exec('COMMIT');
    console.log(`  ✓ Applied successfully`);
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Runs all pending migrations
 * @returns Number of migrations applied
 */
export function runMigrations(): number {
  ensureMigrationsTable();

  const applied = getAppliedMigrations();
  const pending = getPendingMigrations(applied);

  if (pending.length === 0) {
    console.log('No pending migrations.');
    return 0;
  }

  console.log(`Found ${pending.length} pending migration(s)...`);

  for (const filename of pending) {
    applyMigration(filename);
  }

  console.log(`Applied ${pending.length} migration(s).`);
  return pending.length;
}

/**
 * Lists all migrations and their status
 */
export function listMigrations(): void {
  ensureMigrationsTable();

  const applied = getAppliedMigrations();

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('No migrations directory found.');
    return;
  }

  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();

  if (files.length === 0) {
    console.log('No migration files found.');
    return;
  }

  console.log('Migrations:');
  for (const file of files) {
    const status = applied.has(file) ? '✓' : '○';
    console.log(`  ${status} ${file}`);
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  try {
    if (command === 'list') {
      listMigrations();
    } else if (command === 'run' || !command) {
      const count = runMigrations();
      if (count > 0) {
        console.log('Migrations complete.');
      }
    } else {
      console.log('Usage: npx tsx src/db/migrate.ts [run|list]');
      console.log('  run  - Apply pending migrations (default)');
      console.log('  list - Show all migrations and status');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    closeDb();
  }
}
