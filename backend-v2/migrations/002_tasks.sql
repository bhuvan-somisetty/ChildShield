-- Phase 1 — Shared parent/child Task system + per-task edit history.
-- Rows are stored as JSONB `data` (consistent with the rest of the store); the
-- typed columns below are the indexed keys the cache write-through populates.

CREATE TABLE IF NOT EXISTS tasks (
  id               TEXT PRIMARY KEY,
  family_id        TEXT,
  child_id         TEXT,
  completion_state TEXT,
  data             JSONB NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tasks_family_child ON tasks(family_id, child_id);
CREATE INDEX IF NOT EXISTS idx_tasks_child_state ON tasks(child_id, completion_state);

CREATE TABLE IF NOT EXISTS task_history (
  id          TEXT PRIMARY KEY,
  family_id   TEXT,
  task_id     TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_task_history_task_at ON task_history(task_id, at);
CREATE INDEX IF NOT EXISTS idx_task_history_family ON task_history(family_id);
