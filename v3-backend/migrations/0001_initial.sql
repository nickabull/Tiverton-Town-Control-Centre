-- Tivvy Programme V3.2 - initial D1 migration
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS programme_issues (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','review','approved','archived')),
  current_version INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS issue_revisions (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL REFERENCES programme_issues(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  actor TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(issue_id,version)
);
CREATE INDEX IF NOT EXISTS idx_issue_revisions_issue ON issue_revisions(issue_id,version DESC);

CREATE TABLE IF NOT EXISTS activity_events (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL REFERENCES programme_issues(id) ON DELETE RESTRICT,
  revision_id TEXT REFERENCES issue_revisions(id) ON DELETE SET NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target_page_id TEXT,
  target_layer_id TEXT,
  before_json TEXT,
  after_json TEXT,
  detail_json TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activity_issue_time ON activity_events(issue_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_issue_page ON activity_events(issue_id,target_page_id,created_at DESC);

CREATE TABLE IF NOT EXISTS programme_assets (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL REFERENCES programme_issues(id) ON DELETE RESTRICT,
  r2_key TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  is_original INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_assets_issue ON programme_assets(issue_id);

CREATE TABLE IF NOT EXISTS programme_members (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  role TEXT NOT NULL CHECK(role IN ('admin','editor','reviewer','viewer')),
  active INTEGER NOT NULL DEFAULT 1,
  added_at TEXT NOT NULL
);

-- No automatic admin user: identity and the first approved user are configured explicitly.
