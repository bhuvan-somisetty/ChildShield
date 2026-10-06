-- Phase 4 — Safety & Monitoring: push device tokens, location history (a real
-- time-series, not just the latest fix), and password-reset tokens. All additive.

CREATE TABLE IF NOT EXISTS device_tokens (
  id          TEXT PRIMARY KEY,
  owner_id    TEXT,
  owner_type  TEXT,
  token       TEXT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_device_tokens_owner ON device_tokens(owner_id, owner_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(token);

CREATE TABLE IF NOT EXISTS location_history (
  id          TEXT PRIMARY KEY,
  child_id    TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_location_history_child_at ON location_history(child_id, at DESC);

CREATE TABLE IF NOT EXISTS password_resets (
  id          TEXT PRIMARY KEY,
  parent_id   TEXT,
  expires_at  BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_password_resets_parent ON password_resets(parent_id);
