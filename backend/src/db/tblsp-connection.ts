/**
 * tblsp Database Connection
 *
 * Connects to the tblsp database as a read-only attached database.
 * The TBLSP_DATABASE_PATH environment variable must be set to the path
 * of the tblsp database file.
 */

import { getDb } from './connection.js';

let isAttached = false;

/**
 * Get the tblsp database path from environment
 */
export function getTblspDatabasePath(): string | null {
  return process.env.TBLSP_DATABASE_PATH || null;
}

/**
 * Check if tblsp database is configured
 */
export function isTblspConfigured(): boolean {
  return getTblspDatabasePath() !== null;
}

/**
 * Attach the tblsp database for read-only access
 * This attaches it as 'tblsp' so tables are accessed as tblsp.recipe, etc.
 */
export function attachTblspDatabase(): boolean {
  if (isAttached) {
    return true;
  }

  const tblspPath = getTblspDatabasePath();
  if (!tblspPath) {
    console.log('tblsp database not configured (TBLSP_DATABASE_PATH not set)');
    return false;
  }

  try {
    const db = getDb();
    // Attach the database (we only perform SELECT queries, so effectively read-only)
    db.exec(`ATTACH DATABASE '${tblspPath}' AS tblsp`);
    isAttached = true;
    console.log(`Attached tblsp database from: ${tblspPath}`);
    return true;
  } catch (error) {
    console.error('Failed to attach tblsp database:', error);
    return false;
  }
}

/**
 * Detach the tblsp database
 */
export function detachTblspDatabase(): void {
  if (!isAttached) {
    return;
  }

  try {
    const db = getDb();
    db.exec('DETACH DATABASE tblsp');
    isAttached = false;
  } catch (error) {
    console.error('Failed to detach tblsp database:', error);
  }
}

/**
 * Check if tblsp database is currently attached
 */
export function isTblspAttached(): boolean {
  return isAttached;
}
