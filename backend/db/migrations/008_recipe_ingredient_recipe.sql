-- Migration: Add support for recipes as ingredients in other recipes
-- This allows "nested" recipes like sauces, spice blends, etc.

-- SQLite doesn't support modifying CHECK constraints, so we recreate the table

-- Step 1: Create new table with updated constraint
CREATE TABLE recipe_ingredient_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
  food_id INTEGER REFERENCES food(fdc_id),
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
  -- Prevent self-referential recipes (recipe cannot contain itself as ingredient)
  CHECK (recipe_id != ingredient_recipe_id)
);

-- Step 2: Copy existing data
INSERT INTO recipe_ingredient_new (id, recipe_id, food_id, custom_food_id, quantity_grams, display_quantity, position)
SELECT id, recipe_id, food_id, custom_food_id, quantity_grams, display_quantity, position
FROM recipe_ingredient;

-- Step 3: Drop old table
DROP TABLE recipe_ingredient;

-- Step 4: Rename new table
ALTER TABLE recipe_ingredient_new RENAME TO recipe_ingredient;

-- Step 5: Recreate index
CREATE INDEX IF NOT EXISTS idx_recipe_ingredient_recipe ON recipe_ingredient(recipe_id);

-- Step 6: Create index for ingredient_recipe_id lookups (for cascade checks)
CREATE INDEX IF NOT EXISTS idx_recipe_ingredient_ingredient_recipe ON recipe_ingredient(ingredient_recipe_id);
