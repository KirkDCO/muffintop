-- Remove foreign key constraint on food_id to allow logging USDA foods
-- USDA foods are stored in a separate database, so FK constraint cannot work

PRAGMA foreign_keys = OFF;

-- Create new table without FK on food_id
CREATE TABLE food_log_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  food_id INTEGER,  -- No FK - USDA foods are in separate database
  custom_food_id INTEGER REFERENCES custom_food(id),
  recipe_id INTEGER REFERENCES recipe(id),
  log_date TEXT NOT NULL,
  meal_category TEXT NOT NULL CHECK (meal_category IN ('breakfast', 'lunch', 'dinner', 'snack')),
  portion_amount REAL NOT NULL,
  portion_grams REAL NOT NULL,
  logged_food_name TEXT,
  calories REAL NOT NULL,
  protein REAL NOT NULL,
  carbs REAL NOT NULL,
  fiber REAL,
  added_sugar REAL,
  total_sugar REAL,
  total_fat REAL,
  saturated_fat REAL,
  trans_fat REAL,
  cholesterol REAL,
  sodium REAL,
  potassium REAL,
  calcium REAL,
  iron REAL,
  vitamin_a REAL,
  vitamin_c REAL,
  vitamin_d REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (
    (food_id IS NOT NULL AND custom_food_id IS NULL AND recipe_id IS NULL) OR
    (food_id IS NULL AND custom_food_id IS NOT NULL AND recipe_id IS NULL) OR
    (food_id IS NULL AND custom_food_id IS NULL AND recipe_id IS NOT NULL)
  )
);

-- Copy existing data
INSERT INTO food_log_new SELECT * FROM food_log;

-- Drop old table and rename new one
DROP TABLE food_log;
ALTER TABLE food_log_new RENAME TO food_log;

-- Recreate indexes
CREATE INDEX idx_food_log_user_date ON food_log(user_id, log_date);
CREATE INDEX idx_food_log_created ON food_log(created_at DESC);

PRAGMA foreign_keys = ON;
