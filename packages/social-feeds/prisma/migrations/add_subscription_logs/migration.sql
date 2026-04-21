-- Stripe subscription audit log for the social-feeds Prisma schema.
-- The app's user table is "User" and its ids are text/cuid values.

CREATE TABLE IF NOT EXISTS subscription_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  tier TEXT,
  stripe_subscription_id TEXT,
  stripe_session_id TEXT,
  status TEXT,
  trial_ends_at TIMESTAMP,
  subscription_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

ALTER TABLE subscription_logs
  ADD COLUMN IF NOT EXISTS user_id TEXT,
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS tier TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS metadata JSONB;

ALTER TABLE subscription_logs
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

ALTER TABLE subscription_logs
  DROP CONSTRAINT IF EXISTS subscription_logs_user_id_fkey;

ALTER TABLE subscription_logs
  ADD CONSTRAINT subscription_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_subscription_logs_user_id ON subscription_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_logs_created_at ON subscription_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_subscription_logs_stripe_subscription_id ON subscription_logs(stripe_subscription_id);
