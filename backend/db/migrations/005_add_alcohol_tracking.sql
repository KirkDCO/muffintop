-- Migration: Add alcohol intake tracking
-- Date: 2026-03-08
-- SQLite does not support modifying CHECK constraints, so we recreate the table.
-- Note: runner provides the transaction; do not include BEGIN/COMMIT here.

CREATE TABLE intake_log_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  log_date TEXT NOT NULL,
  intake_type TEXT NOT NULL CHECK (intake_type IN ('water', 'caffeine', 'alcohol')),
  amount REAL NOT NULL CHECK (amount > 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO intake_log_new SELECT * FROM intake_log;

DROP TABLE intake_log;

ALTER TABLE intake_log_new RENAME TO intake_log;

CREATE INDEX IF NOT EXISTS idx_intake_log_user_date_type
  ON intake_log(user_id, log_date, intake_type);
