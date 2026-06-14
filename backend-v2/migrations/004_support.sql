-- Help & Support ecosystem — tickets, comments, history, attachments, feature
-- requests, announcements, changelog, ratings. Backward-compatible: new tables
-- only. Rows stored as JSONB `data` with indexed key columns.

CREATE TABLE IF NOT EXISTS support_tickets (
  id            TEXT PRIMARY KEY,
  family_id     TEXT,
  user_id       TEXT,
  ticket_number INTEGER,
  status        TEXT,
  priority      TEXT,
  data          JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tickets_family_user ON support_tickets(family_id, user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status, priority);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_number ON support_tickets(ticket_number);

CREATE TABLE IF NOT EXISTS ticket_comments (
  id          TEXT PRIMARY KEY,
  ticket_id   TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_comments ON ticket_comments(ticket_id, at);

CREATE TABLE IF NOT EXISTS ticket_history (
  id          TEXT PRIMARY KEY,
  ticket_id   TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_history ON ticket_history(ticket_id, at);

CREATE TABLE IF NOT EXISTS ticket_attachments (
  id          TEXT PRIMARY KEY,
  ticket_id   TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments ON ticket_attachments(ticket_id, at);

CREATE TABLE IF NOT EXISTS feature_requests (
  id          TEXT PRIMARY KEY,
  family_id   TEXT,
  user_id     TEXT,
  status      TEXT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feature_requests ON feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_family ON feature_requests(family_id, user_id);

CREATE TABLE IF NOT EXISTS announcements (
  id          TEXT PRIMARY KEY,
  status      TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_announcements_status_at ON announcements(status, at DESC);

CREATE TABLE IF NOT EXISTS changelog (
  id          TEXT PRIMARY KEY,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_changelog_at ON changelog(at DESC);

CREATE TABLE IF NOT EXISTS app_ratings (
  id          TEXT PRIMARY KEY,
  family_id   TEXT,
  user_id     TEXT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_app_ratings ON app_ratings(family_id, user_id);
