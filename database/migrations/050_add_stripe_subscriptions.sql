-- Add Stripe subscription fields to the Prisma User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

-- Create subscription logs table
CREATE TABLE IF NOT EXISTS subscription_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_subscription_logs_user_id ON subscription_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_logs_created_at ON subscription_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_stripe_customer_id ON "User"(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscription_status ON "User"(subscription_status);
