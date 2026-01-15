-- Migration: Add flexible nutrient targets with directions
-- Date: 2026-01-14
-- Description: Replaces fixed target columns with JSON storage for per-nutrient targets with direction

-- Add nutrient_targets column to store per-nutrient targets with directions
-- Format: { "protein": { "value": 150, "direction": "min" }, "addedSugar": { "value": 25, "direction": "max" } }
ALTER TABLE daily_target ADD COLUMN nutrient_targets TEXT NOT NULL DEFAULT '{}';

-- Migrate existing data from old columns to new format
UPDATE daily_target
SET nutrient_targets = (
  SELECT json_group_object(key, value)
  FROM (
    SELECT 'protein' as key, json_object('value', protein_target, 'direction', 'min') as value
    WHERE protein_target IS NOT NULL
    UNION ALL
    SELECT 'carbs' as key, json_object('value', carbs_target, 'direction', 'max') as value
    WHERE carbs_target IS NOT NULL
    UNION ALL
    SELECT 'addedSugar' as key, json_object('value', sugar_target, 'direction', 'max') as value
    WHERE sugar_target IS NOT NULL
  )
)
WHERE protein_target IS NOT NULL OR carbs_target IS NOT NULL OR sugar_target IS NOT NULL;

-- Note: Old columns (protein_target, carbs_target, sugar_target) are kept for backwards compatibility
-- They can be dropped in a future migration after verifying data integrity
