-- Migration: Add rated events (1-10 daily ratings) for continuous correlation analysis
-- Ratings reuse the existing user_event table via a nullable `rating` column
-- (discrete events keep rating = NULL). Per-series metadata (direction, color)
-- lives in the new rated_event_series table, keyed by (user_id, description).

ALTER TABLE user_event ADD COLUMN rating INTEGER; -- nullable; NULL = discrete event

CREATE TABLE IF NOT EXISTS rated_event_series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  description TEXT NOT NULL,                          -- series name; matches user_event.description
  direction TEXT NOT NULL DEFAULT 'higher_better',   -- 'higher_better' | 'higher_worse'
  color TEXT NOT NULL DEFAULT '#ff6b6b',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, description)
);

CREATE INDEX IF NOT EXISTS idx_rated_event_series_user ON rated_event_series(user_id);
