-- App lifecycle / update system — backend-managed version config.
-- Single-row config table (id='current') holding the current released version
-- and the minimum supported version (clients below it are force-updated).
-- Release notes are NOT duplicated here: they are resolved from the existing
-- `changelog` table by version, integrating with that infrastructure.

CREATE TABLE IF NOT EXISTS app_version (
  id          TEXT PRIMARY KEY,
  version     TEXT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
