-- Football Analytics Database Schema

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR(100) UNIQUE,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),          -- NULL for OAuth-only users
  google_id  VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_cache (
  cache_key  VARCHAR(255) PRIMARY KEY,
  data       JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS predictions (
  match_id   INTEGER PRIMARY KEY,
  data       JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_cache (expires_at);
