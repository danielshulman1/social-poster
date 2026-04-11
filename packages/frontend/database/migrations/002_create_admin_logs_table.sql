-- Create admin_logs table for audit trail
-- Run this migration to set up admin logging

CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_logs_user_id ON admin_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);

-- Add comments for documentation
COMMENT ON TABLE admin_logs IS 'Audit trail of all admin actions taken in the system';
COMMENT ON COLUMN admin_logs.action IS 'Type of action: persona_reset, tier_upgrade, tier_downgrade, etc';
COMMENT ON COLUMN admin_logs.reason IS 'Optional notes from admin about why the action was taken';
COMMENT ON COLUMN admin_logs.metadata IS 'Additional data about the action as JSON';
