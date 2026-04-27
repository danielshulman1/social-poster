-- Fix Supabase Security Advisor warning: "Function Search Path Mutable"
-- Ensures trigger functions have an explicit, safe search_path.
--
-- Safe to run multiple times (idempotent).

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'update_user_tiers_timestamp',
        'update_updated_at_column',
        'update_interview_progress_timestamp'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = pg_catalog',
      fn.schema_name,
      fn.function_name,
      fn.args
    );
  END LOOP;
END
$$;

