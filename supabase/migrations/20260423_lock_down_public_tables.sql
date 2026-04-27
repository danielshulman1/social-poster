-- Fix Supabase Security Advisor finding: rls_disabled_in_public
-- Locks down any `public.*` tables that are not meant to be accessed via the
-- Supabase Data API by enabling RLS and revoking anon/authenticated privileges.
--
-- Safe to run multiple times (idempotent).

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
  SELECT
    EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
    AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
  INTO has_supabase_roles;

  IF NOT has_supabase_roles THEN
    RAISE NOTICE 'Skipping RLS lockdown: Supabase roles not found.';
    RETURN;
  END IF;

  -- Prevent new tables from being implicitly granted to anon/authenticated.
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

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', tbl.tablename);
  END LOOP;
END
$$;
