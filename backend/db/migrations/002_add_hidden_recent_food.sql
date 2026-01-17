-- Track foods hidden from the quick add (recent foods) section
-- Users can hide specific foods they don't want cluttering the quick add area

CREATE TABLE IF NOT EXISTS hidden_recent_food (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  food_id INTEGER,
  custom_food_id INTEGER REFERENCES custom_food(id) ON DELETE CASCADE,
  recipe_id INTEGER REFERENCES recipe(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  -- Exactly one of food_id, custom_food_id, or recipe_id must be set
  CHECK (
    (food_id IS NOT NULL AND custom_food_id IS NULL AND recipe_id IS NULL) OR
    (food_id IS NULL AND custom_food_id IS NOT NULL AND recipe_id IS NULL) OR
    (food_id IS NULL AND custom_food_id IS NULL AND recipe_id IS NOT NULL)
  ),
  -- Unique constraint to prevent duplicate entries
  UNIQUE(user_id, food_id, custom_food_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_hidden_recent_food_user ON hidden_recent_food(user_id);
