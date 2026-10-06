-- Phase: Legal / Compliance — versioned consent records + data-deletion requests.
-- Backward-compatible: new tables only. Each accepted policy version is stored as
-- its own immutable row (full audit trail), so re-acceptance after a policy update
-- adds a new row rather than overwriting the old one.

CREATE TABLE IF NOT EXISTS consents (
  id          TEXT PRIMARY KEY,
  parent_id   TEXT,
  version     TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_consents_parent_at ON consents(parent_id, at DESC);
CREATE INDEX IF NOT EXISTS idx_consents_version ON consents(version);

CREATE TABLE IF NOT EXISTS deletion_requests (
  id          TEXT PRIMARY KEY,
  parent_id   TEXT,
  status      TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_parent ON deletion_requests(parent_id, at DESC);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON deletion_requests(status);
