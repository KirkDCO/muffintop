-- Add sharing capability to recipes
-- Shared recipes are visible to all users but only editable by owner

ALTER TABLE recipe ADD COLUMN is_shared INTEGER NOT NULL DEFAULT 0;

-- Index for efficient queries on shared recipes
CREATE INDEX idx_recipe_is_shared ON recipe(is_shared);
