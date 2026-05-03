-- Migration 002: add last_login_at column to users
-- Run once on production DB before deploying the code changes

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN users.last_login_at IS 'Timestamp of the most recent successful login for this user';
