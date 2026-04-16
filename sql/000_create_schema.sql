-- ============================================================
-- NutriLog — PostgreSQL Schema
-- Jalankan di: Supabase Dashboard > SQL Editor > New Query
-- Aman untuk dijalankan ulang (IF NOT EXISTS / ON CONFLICT)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS admin_config (
  id         SERIAL PRIMARY KEY,
  key        TEXT UNIQUE NOT NULL,
  value      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO admin_config (key, value) VALUES
  ('default_daily_limit', '5'),
  ('admin_password_hash', ''),
  ('anthropic_api_key',   '')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  daily_limit   INT         DEFAULT NULL,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

CREATE TABLE IF NOT EXISTS meals (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dish_names     TEXT[]       NOT NULL DEFAULT '{}',
  total_calories INT          NOT NULL DEFAULT 0,
  total_protein  NUMERIC(7,2) NOT NULL DEFAULT 0,
  total_carbs    NUMERIC(7,2) NOT NULL DEFAULT 0,
  total_fat      NUMERIC(7,2) NOT NULL DEFAULT 0,
  image_url      TEXT,
  raw_analysis   JSONB,
  logged_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meals_user_id   ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_logged_at ON meals(logged_at DESC);

CREATE TABLE IF NOT EXISTS daily_usage (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date    DATE NOT NULL DEFAULT CURRENT_DATE,
  count   INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS reports (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  username   TEXT,
  message    TEXT        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

CREATE TABLE IF NOT EXISTS maintenance_config (
  id          SERIAL      PRIMARY KEY,
  enabled     BOOLEAN     NOT NULL DEFAULT FALSE,
  title       TEXT        NOT NULL DEFAULT 'NutriLog sedang dalam perbaikan',
  description TEXT        NOT NULL DEFAULT 'Kami sedang melakukan peningkatan sistem.',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO maintenance_config (id, enabled) VALUES (1, FALSE)
ON CONFLICT (id) DO NOTHING;

SELECT 'Schema berhasil dibuat!' AS status;
