-- Phase 5 — Family Relationship Layer & Child Device Registry.
-- Storage model: each row keeps its full JSON document in `data` (so the existing
-- schemaless Repo API is preserved unchanged), plus typed, indexed key columns
-- for fast lookups + relational integrity. Idempotent (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS families (
  id          TEXT PRIMARY KEY,
  owner_id    TEXT REFERENCES parents(id) ON DELETE CASCADE,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_families_owner ON families(owner_id);

CREATE TABLE IF NOT EXISTS family_members (
  id          TEXT PRIMARY KEY,
  family_id   TEXT REFERENCES families(id) ON DELETE CASCADE,
  user_id     TEXT REFERENCES parents(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_family_members_unique ON family_members(family_id, user_id);

CREATE TABLE IF NOT EXISTS family_invitations (
  id          TEXT PRIMARY KEY,
  family_id   TEXT REFERENCES families(id) ON DELETE CASCADE,
  code        TEXT UNIQUE NOT NULL,
  status      TEXT NOT NULL,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_family_invitations_family ON family_invitations(family_id);
CREATE INDEX IF NOT EXISTS idx_family_invitations_code ON family_invitations(code);
