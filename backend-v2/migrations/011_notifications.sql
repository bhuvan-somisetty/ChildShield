-- Migration 011: Notification Settings (per-parent per-category preferences)
-- and enhancement of the notifications table with family_id and deliveries columns.

-- Per-parent notification preferences (one row per parent).
CREATE TABLE IF NOT EXISTS notification_settings (
  id          TEXT PRIMARY KEY,
  parent_id   TEXT NOT NULL,
  prefs       JSONB NOT NULL DEFAULT '{}',
  data        JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS notification_settings_parent ON notification_settings(parent_id);

-- Add family_id and deliveries columns to notifications (idempotent).
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS family_id  TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS deliveries JSONB DEFAULT '[]';
