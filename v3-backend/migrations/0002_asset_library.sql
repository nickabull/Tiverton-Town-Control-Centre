-- V3.9 persistent asset library, soft deletion, 90-day recovery and full audit.
-- Applied automatically only by an authenticated admin bootstrap route until CI has D1 migration credentials.
CREATE TABLE IF NOT EXISTS asset_library (
  id TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  tags_json TEXT NOT NULL DEFAULT '[]',
  category TEXT NOT NULL DEFAULT '',
  credit TEXT NOT NULL DEFAULT '',
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  sha256 TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','trash','purging')),
  trashed_at TEXT,
  purge_after TEXT,
  trashed_by TEXT,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_asset_library_status ON asset_library(status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_asset_library_trash ON asset_library(status,purge_after);
CREATE TABLE IF NOT EXISTS asset_library_events (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  detail_json TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_asset_events_id_time ON asset_library_events(asset_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_asset_events_time ON asset_library_events(created_at DESC);
