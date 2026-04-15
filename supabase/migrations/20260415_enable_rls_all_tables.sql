-- Lock down Prisma-managed public tables exposed through the Supabase Data API.
-- These tables use app-managed identifiers and are not intended for direct
-- anon/authenticated API access. Enabling RLS without public policies blocks
-- access while keeping direct database access for server-side Prisma code.
--
-- Target project observed on 2026-04-15:
--   cjwhglwnbsrkidgvngqr

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'Account',
    'ExecutionStep',
    'ExternalConnection',
    'PublishResult',
    'ScheduleRule',
    'Session',
    'SourceItem',
    'Subscription',
    'User',
    'UserOnboardingProgress',
    'UserPersona',
    'VerificationToken',
    'Workflow',
    'WorkflowExecution',
    '_prisma_migrations'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', tbl);
    END IF;
  END LOOP;
END
$$;
