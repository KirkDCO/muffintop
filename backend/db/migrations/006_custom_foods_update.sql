-- Migration: 006_custom_foods_update.sql
-- Add sharing support, serving_grams, custom portions, and FTS for custom foods

-- Add sharing support to custom_food
ALTER TABLE custom_food ADD COLUMN is_shared INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_custom_food_is_shared ON custom_food(is_shared);

-- Add serving_grams for reference (optional)
ALTER TABLE custom_food ADD COLUMN serving_grams REAL;

-- Custom food portions table
CREATE TABLE IF NOT EXISTS custom_food_portion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_food_id INTEGER NOT NULL REFERENCES custom_food(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  serving_multiplier REAL NOT NULL DEFAULT 1,
  gram_weight REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_custom_food_portion_food ON custom_food_portion(custom_food_id);

-- FTS5 index for custom food search
CREATE VIRTUAL TABLE IF NOT EXISTS custom_food_fts USING fts5(
  name,
  content='custom_food',
  content_rowid='id'
);

-- Triggers to keep FTS index in sync
CREATE TRIGGER IF NOT EXISTS custom_food_ai AFTER INSERT ON custom_food BEGIN
  INSERT INTO custom_food_fts(rowid, name) VALUES (new.id, new.name);
END;

CREATE TRIGGER IF NOT EXISTS custom_food_ad AFTER DELETE ON custom_food BEGIN
  INSERT INTO custom_food_fts(custom_food_fts, rowid, name) VALUES('delete', old.id, old.name);
END;

CREATE TRIGGER IF NOT EXISTS custom_food_au AFTER UPDATE ON custom_food BEGIN
  INSERT INTO custom_food_fts(custom_food_fts, rowid, name) VALUES('delete', old.id, old.name);
  INSERT INTO custom_food_fts(rowid, name) VALUES (new.id, new.name);
END;

-- Populate FTS index with existing custom foods
INSERT INTO custom_food_fts(rowid, name)
SELECT id, name FROM custom_food;
