-- Migration: Add FTS5 index for recipe search
-- Date: 2026-01-14
-- Description: Enables full-text search on recipe names

-- FTS5 index for recipe search
CREATE VIRTUAL TABLE IF NOT EXISTS recipe_fts USING fts5(
  name,
  content='recipe',
  content_rowid='id'
);

-- Trigger: Insert into FTS when recipe is created
CREATE TRIGGER IF NOT EXISTS recipe_ai AFTER INSERT ON recipe BEGIN
  INSERT INTO recipe_fts(rowid, name) VALUES (new.id, new.name);
END;

-- Trigger: Remove from FTS when recipe is deleted
CREATE TRIGGER IF NOT EXISTS recipe_ad AFTER DELETE ON recipe BEGIN
  INSERT INTO recipe_fts(recipe_fts, rowid, name) VALUES('delete', old.id, old.name);
END;

-- Trigger: Update FTS when recipe is updated
CREATE TRIGGER IF NOT EXISTS recipe_au AFTER UPDATE ON recipe BEGIN
  INSERT INTO recipe_fts(recipe_fts, rowid, name) VALUES('delete', old.id, old.name);
  INSERT INTO recipe_fts(rowid, name) VALUES (new.id, new.name);
END;
