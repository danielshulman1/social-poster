-- Create user_tiers table for tier management
-- Run this migration to set up the tier system

CREATE TABLE IF NOT EXISTS user_tiers (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_tier VARCHAR(50) NOT NULL DEFAULT 'free',
  setup_fee_paid BOOLEAN DEFAULT false,
  setup_fee_paid_at TIMESTAMP,
  subscription_start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  subscription_status VARCHAR(50) NOT NULL DEFAULT 'active',
  next_billing_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_tiers_user_id ON user_tiers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tiers_status ON user_tiers(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_tiers_next_billing ON user_tiers(next_billing_date);

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_tiers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS user_tiers_timestamp ON user_tiers;
CREATE TRIGGER user_tiers_timestamp
  BEFORE UPDATE ON user_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_user_tiers_timestamp();

-- Add comments for documentation
COMMENT ON TABLE user_tiers IS 'Stores user subscription tier information and status';
COMMENT ON COLUMN user_tiers.current_tier IS 'User''s current tier: free, starter, core, premium';
COMMENT ON COLUMN user_tiers.subscription_status IS 'Status: active, cancelled, expired';
COMMENT ON COLUMN user_tiers.next_billing_date IS 'When the next billing cycle starts (for Stripe integration)';
