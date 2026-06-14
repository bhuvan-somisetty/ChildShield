-- Phase 2 — Targets, Rewards/Promises, Streaks, Achievements, AI reports.
-- Backward-compatible: only new tables. Rows stored as JSONB `data` with the
-- indexed key columns the cache write-through populates. Tasks/task_history are
-- unchanged (enhanced task fields are additive JSONB, no migration needed).

CREATE TABLE IF NOT EXISTS targets (
  id          TEXT PRIMARY KEY,
  family_id   TEXT,
  child_id    TEXT,
  status      TEXT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_targets_family_child ON targets(family_id, child_id);
CREATE INDEX IF NOT EXISTS idx_targets_child_status ON targets(child_id, status);

CREATE TABLE IF NOT EXISTS target_history (
  id          TEXT PRIMARY KEY,
  family_id   TEXT,
  target_id   TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_target_history_target_at ON target_history(target_id, at);

CREATE TABLE IF NOT EXISTS rewards (
  id          TEXT PRIMARY KEY,
  family_id   TEXT,
  child_id    TEXT,
  target_id   TEXT,
  status      TEXT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rewards_family_child ON rewards(family_id, child_id);
CREATE INDEX IF NOT EXISTS idx_rewards_target ON rewards(target_id);

CREATE TABLE IF NOT EXISTS reward_history (
  id          TEXT PRIMARY KEY,
  family_id   TEXT,
  reward_id   TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reward_history_reward_at ON reward_history(reward_id, at);

CREATE TABLE IF NOT EXISTS achievements (
  id          TEXT PRIMARY KEY,
  family_id   TEXT,
  child_id    TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_achievements_child ON achievements(child_id, at DESC);

CREATE TABLE IF NOT EXISTS streaks (
  id          TEXT PRIMARY KEY,
  child_id    TEXT,
  kind        TEXT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_streaks_child_kind ON streaks(child_id, kind);

CREATE TABLE IF NOT EXISTS ai_reports (
  id          TEXT PRIMARY KEY,
  family_id   TEXT,
  child_id    TEXT,
  period      TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_reports_child_period ON ai_reports(child_id, period, at DESC);
