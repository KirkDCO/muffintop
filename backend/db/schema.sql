-- FeedBag Database Schema
-- Version: 1.0.0
-- Date: 2026-01-13

-- ============================================
-- User Management
-- ============================================

CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- USDA Food Data (Read-only reference data)
-- ============================================

CREATE TABLE IF NOT EXISTS food (
  fdc_id INTEGER PRIMARY KEY,
  description TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('foundation', 'sr_legacy', 'branded')),
  brand_owner TEXT,
  calories REAL,
  protein REAL,
  carbs REAL,
  added_sugar REAL
);

-- FTS5 index for food search
CREATE VIRTUAL TABLE IF NOT EXISTS food_fts USING fts5(
  description,
  content='food',
  content_rowid='fdc_id'
);

-- Triggers to keep FTS index in sync
CREATE TRIGGER IF NOT EXISTS food_ai AFTER INSERT ON food BEGIN
  INSERT INTO food_fts(rowid, description) VALUES (new.fdc_id, new.description);
END;

CREATE TRIGGER IF NOT EXISTS food_ad AFTER DELETE ON food BEGIN
  INSERT INTO food_fts(food_fts, rowid, description) VALUES('delete', old.fdc_id, old.description);
END;

CREATE TRIGGER IF NOT EXISTS food_au AFTER UPDATE ON food BEGIN
  INSERT INTO food_fts(food_fts, rowid, description) VALUES('delete', old.fdc_id, old.description);
  INSERT INTO food_fts(rowid, description) VALUES (new.fdc_id, new.description);
END;

CREATE INDEX IF NOT EXISTS idx_food_data_type ON food(data_type);

CREATE TABLE IF NOT EXISTS food_portion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fdc_id INTEGER NOT NULL REFERENCES food(fdc_id) ON DELETE CASCADE,
  gram_weight REAL NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_food_portion_fdc ON food_portion(fdc_id);

-- ============================================
-- User Custom Foods
-- ============================================

CREATE TABLE IF NOT EXISTS custom_food (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories REAL NOT NULL,
  protein REAL NOT NULL,
  carbs REAL NOT NULL,
  added_sugar REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_custom_food_user ON custom_food(user_id);

-- ============================================
-- Food Logging
-- ============================================

CREATE TABLE IF NOT EXISTS food_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  food_id INTEGER REFERENCES food(fdc_id),
  custom_food_id INTEGER REFERENCES custom_food(id),
  recipe_id INTEGER REFERENCES recipe(id),
  log_date TEXT NOT NULL,
  meal_category TEXT NOT NULL CHECK (meal_category IN ('breakfast', 'lunch', 'dinner', 'snack')),
  portion_amount REAL NOT NULL,
  portion_grams REAL NOT NULL,
  calories REAL NOT NULL,
  protein REAL NOT NULL,
  carbs REAL NOT NULL,
  added_sugar REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (
    (food_id IS NOT NULL AND custom_food_id IS NULL AND recipe_id IS NULL) OR
    (food_id IS NULL AND custom_food_id IS NOT NULL AND recipe_id IS NULL) OR
    (food_id IS NULL AND custom_food_id IS NULL AND recipe_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_food_log_user_date ON food_log(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_food_log_created ON food_log(created_at DESC);

-- ============================================
-- Recipes
-- ============================================

CREATE TABLE IF NOT EXISTS recipe (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  servings INTEGER NOT NULL DEFAULT 1 CHECK (servings >= 1),
  calories REAL NOT NULL,
  protein REAL NOT NULL,
  carbs REAL NOT NULL,
  added_sugar REAL,
  tblsp_recipe_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_recipe_user ON recipe(user_id);

CREATE TABLE IF NOT EXISTS recipe_ingredient (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
  food_id INTEGER REFERENCES food(fdc_id),
  custom_food_id INTEGER REFERENCES custom_food(id),
  quantity_grams REAL NOT NULL CHECK (quantity_grams > 0),
  display_quantity TEXT,
  position INTEGER NOT NULL,
  CHECK (
    (food_id IS NOT NULL AND custom_food_id IS NULL) OR
    (food_id IS NULL AND custom_food_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredient_recipe ON recipe_ingredient(recipe_id);

-- ============================================
-- Targets and Activity
-- ============================================

CREATE TABLE IF NOT EXISTS daily_target (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES user(id) ON DELETE CASCADE,
  basal_calories INTEGER NOT NULL CHECK (basal_calories >= 500 AND basal_calories <= 10000),
  protein_target INTEGER CHECK (protein_target >= 0),
  carbs_target INTEGER CHECK (carbs_target >= 0),
  sugar_target INTEGER CHECK (sugar_target >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  log_date TEXT NOT NULL,
  activity_calories INTEGER NOT NULL CHECK (activity_calories >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_date ON activity_log(user_id, log_date);

-- ============================================
-- Body Metrics
-- ============================================

CREATE TABLE IF NOT EXISTS body_metric (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  metric_date TEXT NOT NULL,
  weight_value REAL NOT NULL CHECK (weight_value >= 20 AND weight_value <= 1000),
  weight_unit TEXT NOT NULL CHECK (weight_unit IN ('kg', 'lb')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_body_metric_user_date ON body_metric(user_id, metric_date);
