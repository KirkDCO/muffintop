-- Migration: Add user_event table for health event tracking
-- Multiple events per day are allowed (unique constraint on user + date + description combo)

CREATE TABLE IF NOT EXISTS user_event (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  event_date TEXT NOT NULL,
  description TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#ff6b6b',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, event_date, description)
);

CREATE INDEX IF NOT EXISTS idx_user_event_user_date ON user_event(user_id, event_date);
