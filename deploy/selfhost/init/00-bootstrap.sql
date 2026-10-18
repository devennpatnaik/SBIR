-- Self-host bootstrap: roles + auth.user_id() expected by product migrations.
-- Runs before prisma migrations via docker-entrypoint-initdb.d.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE ROLE anon NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE ROLE authenticated NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'authenticator';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER ROLE authenticator WITH LOGIN PASSWORD 'authenticator';

GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator;
GRANT CREATE ON SCHEMA public TO authenticator;

CREATE SCHEMA IF NOT EXISTS auth;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, authenticator;

-- PostgREST sets request.jwt.claim.* and/or request.jwt.claims JSON.
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.sub', true), ''),
    NULLIF((NULLIF(current_setting('request.jwt.claims', true), '')::json ->> 'sub'), '')
  );
$$;
GRANT EXECUTE ON FUNCTION auth.user_id() TO anon, authenticated, authenticator;

-- Bourne/Neon policies call auth.session() -> 'o' ->> 'id' for org scope.
-- Self-host has no orgs; return a minimal session document.
CREATE OR REPLACE FUNCTION auth.session() RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  SELECT jsonb_build_object(
    'sub', auth.user_id(),
    'o', NULL
  );
$$;
GRANT EXECUTE ON FUNCTION auth.session() TO anon, authenticated, authenticator;

-- Local accounts for self-host auth (API uses this; not exposed via PostgREST by default).
CREATE TABLE IF NOT EXISTS app_users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON TABLE app_users FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE app_users TO authenticator;
