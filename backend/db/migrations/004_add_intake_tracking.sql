-- Migration: Add intake tracking (water, caffeine)
-- Date: 2026-03-08

CREATE TABLE IF NOT EXISTS intake_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  log_date TEXT NOT NULL,
  intake_type TEXT NOT NULL CHECK (intake_type IN ('water', 'caffeine')),
  amount REAL NOT NULL CHECK (amount > 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_intake_log_user_date_type
  ON intake_log(user_id, log_date, intake_type);

ALTER TABLE daily_target ADD COLUMN intake_targets TEXT NOT NULL DEFAULT '{}';

ALTER TABLE user_nutrient_preferences ADD COLUMN water_unit TEXT NOT NULL DEFAULT 'ml'
  CHECK (water_unit IN ('ml', 'fl_oz'));
