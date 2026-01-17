-- Add portion_description column to food_log table
-- This stores the human-readable portion description (e.g., "1 cup", "2 servings")
-- instead of always displaying grams

ALTER TABLE food_log ADD COLUMN portion_description TEXT;

-- Backfill existing entries with gram-based descriptions
UPDATE food_log SET portion_description = CAST(ROUND(portion_grams) AS TEXT) || 'g'
WHERE portion_description IS NULL;
