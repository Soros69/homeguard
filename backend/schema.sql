-- Run this once against your PostgreSQL database
-- e.g: psql $DATABASE_URL -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users (minimal data — GDPR data minimisation)
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

-- Devices discovered on the home network
CREATE TABLE IF NOT EXISTS devices (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  mac         TEXT        NOT NULL,      -- MAC address (hardware identifier)
  ip          TEXT        NOT NULL,      -- last known local IP
  type        TEXT        NOT NULL DEFAULT 'unknown', -- phone/laptop/tv/tablet/unknown
  blocked     BOOLEAN     NOT NULL DEFAULT FALSE,
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, mac)                  -- one record per device per household
);

CREATE INDEX IF NOT EXISTS devices_user_idx ON devices (user_id);

-- Audit log — required for GDPR accountability
-- Stores WHAT happened, not personal data content
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL   PRIMARY KEY,
  user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,  -- e.g. 'device.blocked', 'account.deleted'
  device_id   UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-purge audit logs older than 90 days (run as a cron job)
-- DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '90 days';
