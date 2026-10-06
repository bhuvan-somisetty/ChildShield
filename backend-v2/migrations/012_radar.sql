-- Migration 012: Family Radar
-- Adds radar_events table for persistent device/location/zone event timeline.
-- Also adds speed column to location_history for route analytics.

-- Radar event timeline — one row per event, severity-classified.
-- Designed for future consumption by AI Reports, Safety Insights, Family Analytics,
-- and the Android Agent (type + data JSONB schema is stable and extensible).
CREATE TABLE IF NOT EXISTS radar_events (
  id          TEXT PRIMARY KEY,
  child_id    TEXT NOT NULL,
  parent_id   TEXT NOT NULL,
  type        TEXT NOT NULL,   -- 'zone_enter'|'zone_exit'|'sos'|'device_online'|'device_offline'
                               -- |'battery_low'|'battery_critical'|'location_disabled'|'location_revoked'
  severity    TEXT NOT NULL DEFAULT 'info',   -- 'info'|'warning'|'critical'
  title       TEXT,
  body        TEXT,
  data        JSONB NOT NULL DEFAULT '{}',
  at          BIGINT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_radar_events_child_at ON radar_events(child_id, at DESC);
CREATE INDEX IF NOT EXISTS idx_radar_events_parent_at ON radar_events(parent_id, at DESC);
CREATE INDEX IF NOT EXISTS idx_radar_events_severity ON radar_events(severity);

-- Add speed column to location_history (idempotent).
ALTER TABLE location_history ADD COLUMN IF NOT EXISTS speed FLOAT;
