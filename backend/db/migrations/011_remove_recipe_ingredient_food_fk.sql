-- Remove foreign key constraint on recipe_ingredient.food_id
-- USDA foods are stored in a separate database, so FK constraint cannot work

PRAGMA foreign_keys = OFF;

-- Create new table without FK on food_id
CREATE TABLE recipe_ingredient_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
  food_id INTEGER,  -- No FK - USDA foods are in separate database
  custom_food_id INTEGER REFERENCES custom_food(id),
  ingredient_recipe_id INTEGER REFERENCES recipe(id) ON DELETE RESTRICT,
  quantity_grams REAL NOT NULL CHECK (quantity_grams > 0),
  display_quantity TEXT,
  position INTEGER NOT NULL,
  -- Exactly one of food_id, custom_food_id, or ingredient_recipe_id must be set
  CHECK (
    (food_id IS NOT NULL AND custom_food_id IS NULL AND ingredient_recipe_id IS NULL) OR
    (food_id IS NULL AND custom_food_id IS NOT NULL AND ingredient_recipe_id IS NULL) OR
    (food_id IS NULL AND custom_food_id IS NULL AND ingredient_recipe_id IS NOT NULL)
  ),
  -- Prevent self-referential recipes
  CHECK (recipe_id != ingredient_recipe_id)
);

-- Copy existing data
INSERT INTO recipe_ingredient_new SELECT * FROM recipe_ingredient;

-- Drop old table and rename new one
DROP TABLE recipe_ingredient;
ALTER TABLE recipe_ingredient_new RENAME TO recipe_ingredient;

-- Recreate indexes
CREATE INDEX idx_recipe_ingredient_recipe ON recipe_ingredient(recipe_id);
CREATE INDEX idx_recipe_ingredient_ingredient_recipe ON recipe_ingredient(ingredient_recipe_id);

PRAGMA foreign_keys = ON;
