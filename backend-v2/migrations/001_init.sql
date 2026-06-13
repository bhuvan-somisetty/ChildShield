-- AlphaGuard V2 — initial PostgreSQL schema.
-- Storage model: each row keeps its full JSON document in `data` (so the existing
-- schemaless Repo API is preserved unchanged), plus typed, indexed key columns
-- for fast lookups + relational integrity. Idempotent (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS parents (
  id          TEXT PRIMARY KEY,
  email       TEXT UNIQUE,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS children (
  id          TEXT PRIMARY KEY,
  parent_id   TEXT REFERENCES parents(id) ON DELETE CASCADE,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_children_parent ON children(parent_id);

CREATE TABLE IF NOT EXISTS pairings (
  id          TEXT PRIMARY KEY,
  parent_id   TEXT REFERENCES parents(id) ON DELETE CASCADE,
  child_id    TEXT,
  code        TEXT,
  status      TEXT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pairings_parent ON pairings(parent_id);
CREATE INDEX IF NOT EXISTS idx_pairings_child  ON pairings(child_id);
CREATE INDEX IF NOT EXISTS idx_pairings_code   ON pairings(code);
CREATE INDEX IF NOT EXISTS idx_pairings_status ON pairings(status);

CREATE TABLE IF NOT EXISTS devices (
  id          TEXT PRIMARY KEY,
  owner_id    TEXT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_devices_owner ON devices(owner_id);

CREATE TABLE IF NOT EXISTS messages (
  id          TEXT PRIMARY KEY,
  pairing_id  TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_pairing_at ON messages(pairing_id, at);

CREATE TABLE IF NOT EXISTS sos (
  id          TEXT PRIMARY KEY,
  parent_id   TEXT,
  child_id    TEXT,
  pairing_id  TEXT,
  status      TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sos_parent_at ON sos(parent_id, at DESC);
CREATE INDEX IF NOT EXISTS idx_sos_child ON sos(child_id);

CREATE TABLE IF NOT EXISTS locations (
  id          TEXT PRIMARY KEY,
  child_id    TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_locations_child ON locations(child_id);

CREATE TABLE IF NOT EXISTS battery (
  id          TEXT PRIMARY KEY,
  child_id    TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_battery_child ON battery(child_id);

CREATE TABLE IF NOT EXISTS permissions (
  id          TEXT PRIMARY KEY,
  owner_id    TEXT,
  key         TEXT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_permissions_owner ON permissions(owner_id);

CREATE TABLE IF NOT EXISTS notifications (
  id          TEXT PRIMARY KEY,
  parent_id   TEXT,
  type        TEXT,
  read        BOOLEAN,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_parent_at ON notifications(parent_id, at DESC);

CREATE TABLE IF NOT EXISTS app_requests (
  id          TEXT PRIMARY KEY,
  parent_id   TEXT,
  child_id    TEXT,
  pairing_id  TEXT,
  type        TEXT,
  status      TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_app_requests_parent ON app_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_app_requests_status ON app_requests(status);

CREATE TABLE IF NOT EXISTS security_alerts (
  id          TEXT PRIMARY KEY,
  parent_id   TEXT,
  child_id    TEXT,
  kind        TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_security_parent_at ON security_alerts(parent_id, at DESC);

CREATE TABLE IF NOT EXISTS safe_zones (
  id          TEXT PRIMARY KEY,
  parent_id   TEXT,
  child_id    TEXT,
  pairing_id  TEXT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_safe_zones_child ON safe_zones(child_id);
CREATE INDEX IF NOT EXISTS idx_safe_zones_parent ON safe_zones(parent_id);

CREATE TABLE IF NOT EXISTS zone_events (
  id          TEXT PRIMARY KEY,
  parent_id   TEXT,
  child_id    TEXT,
  pairing_id  TEXT,
  zone_id     TEXT,
  type        TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_zone_events_parent_at ON zone_events(parent_id, at DESC);
CREATE INDEX IF NOT EXISTS idx_zone_events_zone ON zone_events(zone_id);

-- Settings: currently held client-side (localStorage); table provided so parent/
-- child preferences can be persisted server-side without further migrations.
CREATE TABLE IF NOT EXISTS settings (
  id          TEXT PRIMARY KEY,
  owner_id    TEXT,
  key         TEXT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_settings_owner ON settings(owner_id);
