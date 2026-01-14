import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;
let usdaDb: Database.Database | null = null;
let tblspDb: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || './db/muffintop.db';
    const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);

    // Ensure directory exists
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(absolutePath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function getUsdaDb(): Database.Database {
  if (!usdaDb) {
    const dbPath = process.env.USDA_DATABASE_PATH || './db/usda/fooddata.db';
    const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`USDA database not found at ${absolutePath}. Run 'npm run usda:import' first.`);
    }

    usdaDb = new Database(absolutePath, { readonly: true });
  }
  return usdaDb;
}

export function getTblspDb(): Database.Database | null {
  if (tblspDb === null) {
    const dbPath = process.env.TBLSP_DATABASE_PATH;

    if (!dbPath) {
      return null;
    }

    const absolutePath = path.isAbsolute(dbPath)
      ? dbPath
      : path.resolve(process.cwd(), dbPath.replace('~', process.env.HOME || ''));

    if (!fs.existsSync(absolutePath)) {
      console.warn(`tblsp database not found at ${absolutePath}. Recipe import disabled.`);
      return null;
    }

    tblspDb = new Database(absolutePath, { readonly: true });
  }
  return tblspDb;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
  if (usdaDb) {
    usdaDb.close();
    usdaDb = null;
  }
  if (tblspDb) {
    tblspDb.close();
    tblspDb = null;
  }
}

// For testing - allows resetting database connection
export function resetDb(): void {
  closeDb();
}
