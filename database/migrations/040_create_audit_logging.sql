-- ============================================================================
-- PHASE 3: Comprehensive Audit Logging System
-- ============================================================================
-- Creates audit trail for all sensitive operations
-- Tracks who did what, when, where, and from which IP address
-- ============================================================================

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================
-- Central audit trail for all sensitive operations

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,                -- e.g., 'login', 'oauth_connected', 'email_sent'
  table_name VARCHAR(100),                     -- Which table was affected
  record_id UUID,                              -- Which record
  old_values JSONB,                            -- Previous values
  new_values JSONB,                            -- New values
  ip_address INET,                             -- Source IP
  user_agent TEXT,                             -- Browser/client info
  status VARCHAR(20) DEFAULT 'success',        -- 'success' or 'failure'
  error_message TEXT,                          -- If status = 'failure'
  duration_ms INTEGER,                         -- Execution time
  org_id UUID REFERENCES organisations(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins of the organization can view audit logs
CREATE POLICY "admins_can_view_org_audit_logs"
  ON audit_logs FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Create indexes for efficient querying
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_org ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);

-- ============================================================================
-- AUTHENTICATION AUDIT LOGS
-- ============================================================================
-- Specific tracking for login/logout/registration events

CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255),
  action VARCHAR(50) NOT NULL,                 -- 'login_attempt', 'login_success', 'login_failure', 'logout', 'register', 'password_reset'
  success BOOLEAN,
  failure_reason TEXT,                         -- e.g., 'invalid_password', 'user_not_found'
  ip_address INET,
  user_agent TEXT,
  mfa_enabled BOOLEAN DEFAULT false            -- If MFA was used
);

ALTER TABLE auth_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own auth logs; admins can view all
CREATE POLICY "users_can_view_own_auth_logs"
  ON auth_audit_logs FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid() AND om.is_admin = true
    )
  );

CREATE INDEX idx_auth_audit_timestamp ON auth_audit_logs(timestamp DESC);
CREATE INDEX idx_auth_audit_user ON auth_audit_logs(user_id);
CREATE INDEX idx_auth_audit_action ON auth_audit_logs(action);
CREATE INDEX idx_auth_audit_email ON auth_audit_logs(email);
CREATE INDEX idx_auth_audit_ip ON auth_audit_logs(ip_address);

-- ============================================================================
-- PERMISSION CHANGE AUDIT LOGS
-- ============================================================================
-- Track administrative actions

CREATE TABLE IF NOT EXISTS permission_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,                -- 'user_added', 'user_removed', 'role_changed', etc.
  old_role VARCHAR(50),
  new_role VARCHAR(50),
  reason TEXT,                                 -- Why admin took this action
  ip_address INET,
  user_agent TEXT,
  timestamp_minutes_since_action INTEGER        -- For compliance retention
);

ALTER TABLE permission_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_can_view_org_permission_logs"
  ON permission_audit_logs FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE INDEX idx_permission_audit_timestamp ON permission_audit_logs(timestamp DESC);
CREATE INDEX idx_permission_audit_admin ON permission_audit_logs(admin_id);
CREATE INDEX idx_permission_audit_target_user ON permission_audit_logs(target_user_id);
CREATE INDEX idx_permission_audit_org ON permission_audit_logs(org_id);

-- ============================================================================
-- DATA EXPORT AUDIT LOGS
-- ============================================================================
-- Track when users export/download data

CREATE TABLE IF NOT EXISTS data_export_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
  export_type VARCHAR(50) NOT NULL,            -- 'emails', 'conversations', 'all_data', etc.
  record_count INTEGER,
  file_size_bytes BIGINT,
  ip_address INET,
  user_agent TEXT,
  download_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ                       -- When export link expires
);

ALTER TABLE data_export_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_exports"
  ON data_export_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "admins_can_view_org_exports"
  ON data_export_logs FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE INDEX idx_data_export_timestamp ON data_export_logs(timestamp DESC);
CREATE INDEX idx_data_export_user ON data_export_logs(user_id);
CREATE INDEX idx_data_export_org ON data_export_logs(org_id);

-- ============================================================================
-- AUDIT LOG TRIGGER FUNCTION
-- ============================================================================
-- Automatically creates audit log entries for important operations

CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_action VARCHAR,
  p_table_name VARCHAR,
  p_record_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_org_id UUID DEFAULT NULL,
  p_status VARCHAR DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_audit_id BIGINT;
BEGIN
  INSERT INTO audit_logs (
    user_id, action, table_name, record_id,
    old_values, new_values, org_id,
    ip_address, user_agent,
    status, error_message,
    duration_ms
  ) VALUES (
    p_user_id, p_action, p_table_name, p_record_id,
    p_old_values, p_new_values, p_org_id,
    inet_client_addr(),
    current_setting('app.user_agent'),
    p_status, p_error_message,
    p_duration_ms
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- LOG LOGIN ATTEMPT FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION log_login_attempt(
  p_email VARCHAR,
  p_user_id UUID,
  p_success BOOLEAN,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO auth_audit_logs (
    email, user_id, action,
    success, failure_reason,
    ip_address, user_agent
  ) VALUES (
    p_email, p_user_id,
    CASE WHEN p_success THEN 'login_success' ELSE 'login_failure' END,
    p_success, p_failure_reason,
    inet_client_addr(),
    current_setting('app.user_agent')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- LOG PERMISSION CHANGE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION log_permission_change(
  p_admin_id UUID,
  p_target_user_id UUID,
  p_org_id UUID,
  p_action VARCHAR,
  p_old_role VARCHAR DEFAULT NULL,
  p_new_role VARCHAR DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO permission_audit_logs (
    admin_id, target_user_id, org_id,
    action, old_role, new_role, reason,
    ip_address, user_agent
  ) VALUES (
    p_admin_id, p_target_user_id, p_org_id,
    p_action, p_old_role, p_new_role, p_reason,
    inet_client_addr(),
    current_setting('app.user_agent')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT LOG RETENTION POLICY
-- ============================================================================
-- Delete old audit logs based on compliance requirements

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  v_deleted BIGINT;
BEGIN
  -- Keep audit logs for 90 days (adjust per your compliance requirements)
  DELETE FROM audit_logs
  WHERE timestamp < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- Keep auth logs for 180 days
  DELETE FROM auth_audit_logs
  WHERE timestamp < NOW() - INTERVAL '180 days';

  -- Keep permission logs for 1 year
  DELETE FROM permission_audit_logs
  WHERE timestamp < NOW() - INTERVAL '1 year';

  -- Clean up old data exports
  DELETE FROM data_export_logs
  WHERE expires_at < NOW();

  RETURN QUERY SELECT v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SCHEDULE AUDIT LOG CLEANUP
-- ============================================================================
-- Runs cleanup job weekly (requires pg_cron extension)

-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-audit-logs', '0 2 * * 0', 'SELECT cleanup_old_audit_logs()');

-- ============================================================================
-- AUDIT LOG REPORTING VIEWS
-- ============================================================================

-- Failed login attempts (for security monitoring)
CREATE OR REPLACE VIEW failed_login_attempts AS
SELECT
  email,
  COUNT(*) as attempt_count,
  MAX(timestamp) as last_attempt,
  ARRAY_AGG(DISTINCT ip_address) as ip_addresses
FROM auth_audit_logs
WHERE success = false
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY email
HAVING COUNT(*) >= 5;

-- Suspicious activity (multiple failed logins)
CREATE OR REPLACE VIEW suspicious_activity_report AS
SELECT
  user_id,
  COUNT(*) as event_count,
  COUNT(CASE WHEN status = 'failure' THEN 1 END) as failure_count,
  ARRAY_AGG(DISTINCT action) as actions,
  ARRAY_AGG(DISTINCT ip_address) as ip_addresses,
  MAX(timestamp) as last_activity
FROM audit_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY user_id
HAVING COUNT(CASE WHEN status = 'failure' THEN 1 END) >= 5;

-- Admin activity report
CREATE OR REPLACE VIEW admin_activity_report AS
SELECT
  admin_id,
  COUNT(*) as action_count,
  ARRAY_AGG(DISTINCT action) as actions,
  MAX(timestamp) as last_action
FROM permission_audit_logs
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY admin_id;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- ✅ Comprehensive audit logging implemented
-- ✅ Tracks authentication, permissions, data exports
-- ✅ RLS policies restrict audit log access
-- ✅ Automated log cleanup based on retention policy
-- ✅ Reporting views for security monitoring
-- ✅ Functions for easy audit log creation
--
-- NEXT STEPS:
-- 1. Call log_login_attempt() on authentication
-- 2. Call create_audit_log() on important data changes
-- 3. Call log_permission_change() on admin actions
-- 4. Monitor suspicious_activity_report view
-- 5. Generate reports monthly for compliance
