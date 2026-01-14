-- Migration: Add extended nutrient columns and user preferences
-- Date: 2026-01-13
-- Description: Adds 13 new nutrient columns to support configurable nutrient tracking

-- ============================================
-- Add new nutrient columns to food table
-- (existing: calories, protein, carbs, added_sugar)
-- ============================================

ALTER TABLE food ADD COLUMN fiber REAL;
ALTER TABLE food ADD COLUMN total_sugar REAL;
ALTER TABLE food ADD COLUMN total_fat REAL;
ALTER TABLE food ADD COLUMN saturated_fat REAL;
ALTER TABLE food ADD COLUMN trans_fat REAL;
ALTER TABLE food ADD COLUMN cholesterol REAL;
ALTER TABLE food ADD COLUMN sodium REAL;
ALTER TABLE food ADD COLUMN potassium REAL;
ALTER TABLE food ADD COLUMN calcium REAL;
ALTER TABLE food ADD COLUMN iron REAL;
ALTER TABLE food ADD COLUMN vitamin_a REAL;
ALTER TABLE food ADD COLUMN vitamin_c REAL;
ALTER TABLE food ADD COLUMN vitamin_d REAL;

-- ============================================
-- Add new nutrient columns to custom_food table
-- ============================================

ALTER TABLE custom_food ADD COLUMN fiber REAL NOT NULL DEFAULT 0;
ALTER TABLE custom_food ADD COLUMN total_sugar REAL NOT NULL DEFAULT 0;
ALTER TABLE custom_food ADD COLUMN total_fat REAL NOT NULL DEFAULT 0;
ALTER TABLE custom_food ADD COLUMN saturated_fat REAL NOT NULL DEFAULT 0;
ALTER TABLE custom_food ADD COLUMN trans_fat REAL NOT NULL DEFAULT 0;
ALTER TABLE custom_food ADD COLUMN cholesterol REAL NOT NULL DEFAULT 0;
ALTER TABLE custom_food ADD COLUMN sodium REAL NOT NULL DEFAULT 0;
ALTER TABLE custom_food ADD COLUMN potassium REAL NOT NULL DEFAULT 0;
ALTER TABLE custom_food ADD COLUMN calcium REAL NOT NULL DEFAULT 0;
ALTER TABLE custom_food ADD COLUMN iron REAL NOT NULL DEFAULT 0;
ALTER TABLE custom_food ADD COLUMN vitamin_a REAL NOT NULL DEFAULT 0;
ALTER TABLE custom_food ADD COLUMN vitamin_c REAL NOT NULL DEFAULT 0;
ALTER TABLE custom_food ADD COLUMN vitamin_d REAL NOT NULL DEFAULT 0;

-- ============================================
-- Add new nutrient columns to food_log table
-- ============================================

ALTER TABLE food_log ADD COLUMN fiber REAL;
ALTER TABLE food_log ADD COLUMN total_sugar REAL;
ALTER TABLE food_log ADD COLUMN total_fat REAL;
ALTER TABLE food_log ADD COLUMN saturated_fat REAL;
ALTER TABLE food_log ADD COLUMN trans_fat REAL;
ALTER TABLE food_log ADD COLUMN cholesterol REAL;
ALTER TABLE food_log ADD COLUMN sodium REAL;
ALTER TABLE food_log ADD COLUMN potassium REAL;
ALTER TABLE food_log ADD COLUMN calcium REAL;
ALTER TABLE food_log ADD COLUMN iron REAL;
ALTER TABLE food_log ADD COLUMN vitamin_a REAL;
ALTER TABLE food_log ADD COLUMN vitamin_c REAL;
ALTER TABLE food_log ADD COLUMN vitamin_d REAL;

-- ============================================
-- Add new nutrient columns to recipe table
-- ============================================

ALTER TABLE recipe ADD COLUMN fiber REAL;
ALTER TABLE recipe ADD COLUMN total_sugar REAL;
ALTER TABLE recipe ADD COLUMN total_fat REAL;
ALTER TABLE recipe ADD COLUMN saturated_fat REAL;
ALTER TABLE recipe ADD COLUMN trans_fat REAL;
ALTER TABLE recipe ADD COLUMN cholesterol REAL;
ALTER TABLE recipe ADD COLUMN sodium REAL;
ALTER TABLE recipe ADD COLUMN potassium REAL;
ALTER TABLE recipe ADD COLUMN calcium REAL;
ALTER TABLE recipe ADD COLUMN iron REAL;
ALTER TABLE recipe ADD COLUMN vitamin_a REAL;
ALTER TABLE recipe ADD COLUMN vitamin_c REAL;
ALTER TABLE recipe ADD COLUMN vitamin_d REAL;

-- ============================================
-- User nutrient display preferences
-- ============================================

CREATE TABLE IF NOT EXISTS user_nutrient_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  visible_nutrients TEXT NOT NULL DEFAULT '["calories","protein","carbs","totalFat","saturatedFat","fiber","addedSugar"]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
