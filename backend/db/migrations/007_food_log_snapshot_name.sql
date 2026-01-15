-- Migration: 007_food_log_snapshot_name.sql
-- Add updated_at to custom_food and logged_food_name to food_log for snapshot tracking

-- Add updated_at to custom_food (default to created_at for existing records)
ALTER TABLE custom_food ADD COLUMN updated_at TEXT;

-- Set updated_at to created_at for existing records
UPDATE custom_food SET updated_at = created_at WHERE updated_at IS NULL;

-- Add logged_food_name to food_log to store the name at time of logging
-- This includes a date suffix for recipes/custom foods, e.g., "Protein Shake (Jan 10, 2026)"
ALTER TABLE food_log ADD COLUMN logged_food_name TEXT;

-- Populate logged_food_name for existing entries (without date suffix since we don't know original dates)
UPDATE food_log
SET logged_food_name = (
  SELECT COALESCE(
    (SELECT f.description FROM food f WHERE f.fdc_id = food_log.food_id),
    (SELECT cf.name FROM custom_food cf WHERE cf.id = food_log.custom_food_id),
    (SELECT r.name FROM recipe r WHERE r.id = food_log.recipe_id)
  )
)
WHERE logged_food_name IS NULL;
