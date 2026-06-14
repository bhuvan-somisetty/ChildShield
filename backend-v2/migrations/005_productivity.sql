-- Phase 2.5 — Productivity & Planning. Backward-compatible: new tables only.
-- Tasks keep their existing JSONB shape; category/recurrence/dueAt are additive
-- fields already supported by the row JSON.

CREATE TABLE IF NOT EXISTS task_categories (
  id          TEXT PRIMARY KEY,
  family_id   TEXT,
  name        TEXT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_task_categories_family ON task_categories(family_id);

CREATE TABLE IF NOT EXISTS task_comments (
  id          TEXT PRIMARY KEY,
  task_id     TEXT,
  family_id   TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_at ON task_comments(task_id, at);

CREATE TABLE IF NOT EXISTS recurring_tasks (
  id          TEXT PRIMARY KEY,
  family_id   TEXT,
  child_id    TEXT,
  status      TEXT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recurring_family_child ON recurring_tasks(family_id, child_id, status);

CREATE TABLE IF NOT EXISTS calendar_events (
  id          TEXT PRIMARY KEY,
  family_id   TEXT,
  child_id    TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_calendar_family_child_at ON calendar_events(family_id, child_id, at);
