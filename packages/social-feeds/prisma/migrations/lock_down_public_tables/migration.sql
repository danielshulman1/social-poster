-- Fix Supabase Security Advisor finding: rls_disabled_in_public
-- "Table publicly accessible" means `anon` / `authenticated` can access a
-- `public.*` table while Row Level Security (RLS) is disabled.
--
-- This app primarily uses Prisma via a server-side DB role and does not intend
-- to expose Prisma-managed tables through the Supabase Data API.
--
-- We *exclude* the small set of tables that are accessed via the Supabase JS
-- client (they should keep their explicit RLS policies + GRANTs).

DO $$
DECLARE
  tbl record;
  allowlist text[] := ARRAY[
    'user_personas',
    'user_onboarding_progress',
    'user_social_connections'
  ];
  has_supabase_roles boolean;
BEGIN
  -- These roles exist on Supabase projects. For local/dev Postgres instances
  -- they may not, and this migration should be a no-op there.
  SELECT
    EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
    AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
  INTO has_supabase_roles;

  IF NOT has_supabase_roles THEN
    RAISE NOTICE 'Skipping RLS lockdown: Supabase roles not found.';
    RETURN;
  END IF;

  -- Prevent future tables created by this migration role from being implicitly
  -- accessible to `anon` / `authenticated` via default privileges.
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated';
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated';

  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    IF tbl.tablename = ANY(allowlist) THEN
      CONTINUE;
    END IF;

    -- Enabling RLS without policies blocks Data API access for anon/authenticated,
    -- while server-side roles (table owners / BYPASSRLS roles) keep working.
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', tbl.tablename);
  END LOOP;
END
$$;
