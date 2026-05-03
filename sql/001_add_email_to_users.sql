-- Migration: Add email column to users table
-- Run this manually in Supabase SQL Editor
-- Date: 2026-05-03

ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
