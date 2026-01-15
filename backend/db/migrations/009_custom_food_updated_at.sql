-- Migration: Ensure updated_at column exists on custom_food table
-- This migration is idempotent - safe to run whether column exists or not

-- Disable foreign keys temporarily for table recreation
PRAGMA foreign_keys = OFF;

-- Create a temporary table with the desired structure
CREATE TABLE custom_food_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories REAL NOT NULL,
  protein REAL NOT NULL,
  carbs REAL NOT NULL,
  fiber REAL NOT NULL DEFAULT 0,
  added_sugar REAL NOT NULL DEFAULT 0,
  total_sugar REAL NOT NULL DEFAULT 0,
  total_fat REAL NOT NULL DEFAULT 0,
  saturated_fat REAL NOT NULL DEFAULT 0,
  trans_fat REAL NOT NULL DEFAULT 0,
  cholesterol REAL NOT NULL DEFAULT 0,
  sodium REAL NOT NULL DEFAULT 0,
  potassium REAL NOT NULL DEFAULT 0,
  calcium REAL NOT NULL DEFAULT 0,
  iron REAL NOT NULL DEFAULT 0,
  vitamin_a REAL NOT NULL DEFAULT 0,
  vitamin_c REAL NOT NULL DEFAULT 0,
  vitamin_d REAL NOT NULL DEFAULT 0,
  serving_grams REAL,
  is_shared INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Copy data, using created_at as updated_at if column doesn't exist
-- This works by using COALESCE - if updated_at exists it uses its value,
-- if it doesn't exist (would be null), it uses created_at
INSERT INTO custom_food_new (
  id, user_id, name, calories, protein, carbs, fiber, added_sugar, total_sugar,
  total_fat, saturated_fat, trans_fat, cholesterol, sodium, potassium,
  calcium, iron, vitamin_a, vitamin_c, vitamin_d, serving_grams, is_shared,
  created_at, updated_at
)
SELECT
  id, user_id, name, calories, protein, carbs, fiber, added_sugar, total_sugar,
  total_fat, saturated_fat, trans_fat, cholesterol, sodium, potassium,
  calcium, iron, vitamin_a, vitamin_c, vitamin_d, serving_grams, is_shared,
  created_at, COALESCE(updated_at, created_at)
FROM custom_food;

-- Drop the old table
DROP TABLE custom_food;

-- Rename new table
ALTER TABLE custom_food_new RENAME TO custom_food;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_custom_food_user ON custom_food(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_food_is_shared ON custom_food(is_shared);

-- Recreate FTS triggers
DROP TRIGGER IF EXISTS custom_food_ai;
DROP TRIGGER IF EXISTS custom_food_ad;
DROP TRIGGER IF EXISTS custom_food_au;

CREATE TRIGGER custom_food_ai AFTER INSERT ON custom_food BEGIN
  INSERT INTO custom_food_fts(rowid, name) VALUES (new.id, new.name);
END;

CREATE TRIGGER custom_food_ad AFTER DELETE ON custom_food BEGIN
  INSERT INTO custom_food_fts(custom_food_fts, rowid, name) VALUES('delete', old.id, old.name);
END;

CREATE TRIGGER custom_food_au AFTER UPDATE ON custom_food BEGIN
  INSERT INTO custom_food_fts(custom_food_fts, rowid, name) VALUES('delete', old.id, old.name);
  INSERT INTO custom_food_fts(rowid, name) VALUES (new.id, new.name);
END;

-- Re-enable foreign keys
PRAGMA foreign_keys = ON;

