-- ============================================================================
-- PHASE 3: Column-Level Encryption for Sensitive Data
-- ============================================================================
-- This migration enables pgcrypto and implements column-level encryption
-- for sensitive data like API keys and OAuth tokens.
--
-- Requirements:
-- 1. MASTER_ENCRYPTION_KEY must be stored in AWS KMS or HashiCorp Vault
-- 2. Never commit actual encryption keys to git
-- 3. Keys should be rotated quarterly
-- ============================================================================

-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- ENCRYPTION KEY MANAGEMENT TABLE
-- ============================================================================
-- Store encryption keys with rotation support

CREATE TABLE IF NOT EXISTS encryption_keys (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(255) UNIQUE NOT NULL,
  key_material BYTEA NOT NULL,
  algorithm VARCHAR(50) DEFAULT 'aes-256-cbc',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rotated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  description TEXT
);

ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;

-- Only superuser/admin can access encryption keys
CREATE POLICY "only_admins_access_keys"
  ON encryption_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE INDEX idx_encryption_keys_active ON encryption_keys(is_active);

-- ============================================================================
-- OAUTH CONNECTIONS: ENCRYPT TOKENS
-- ============================================================================
-- Add encrypted columns for storing tokens securely

ALTER TABLE oauth_connections
ADD COLUMN IF NOT EXISTS access_token_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS refresh_token_encrypted BYTEA;

-- Migrate existing data (if any) - in production, do this carefully
-- UPDATE oauth_connections
-- SET
--   access_token_encrypted = pgp_sym_encrypt(access_token, 'encryption_key'),
--   refresh_token_encrypted = pgp_sym_encrypt(refresh_token, 'encryption_key')
-- WHERE access_token IS NOT NULL;

-- Once migration is complete, drop old columns
-- ALTER TABLE oauth_connections DROP COLUMN access_token;
-- ALTER TABLE oauth_connections DROP COLUMN refresh_token;

-- Create decryption function for OAuth tokens
CREATE OR REPLACE FUNCTION decrypt_oauth_token(encrypted_token BYTEA)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_token, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ORG AI SETTINGS: ENCRYPT API KEYS
-- ============================================================================
-- Add encrypted columns for storing API keys securely

ALTER TABLE org_ai_settings
ADD COLUMN IF NOT EXISTS openai_api_key_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS anthropic_api_key_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS google_api_key_encrypted BYTEA;

-- Migrate existing data (if any)
-- UPDATE org_ai_settings
-- SET
--   openai_api_key_encrypted = pgp_sym_encrypt(openai_api_key, 'encryption_key'),
--   anthropic_api_key_encrypted = pgp_sym_encrypt(anthropic_api_key, 'encryption_key'),
--   google_api_key_encrypted = pgp_sym_encrypt(google_api_key, 'encryption_key')
-- WHERE openai_api_key IS NOT NULL;

-- Once migration is complete, drop old columns
-- ALTER TABLE org_ai_settings DROP COLUMN openai_api_key;
-- ALTER TABLE org_ai_settings DROP COLUMN anthropic_api_key;
-- ALTER TABLE org_ai_settings DROP COLUMN google_api_key;

-- Create decryption function for API keys
CREATE OR REPLACE FUNCTION decrypt_api_key(encrypted_key BYTEA)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_key, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MAILBOX PASSWORD ENCRYPTION
-- ============================================================================
-- Ensure IMAP/SMTP passwords are encrypted

ALTER TABLE mailboxes
ADD COLUMN IF NOT EXISTS password_encrypted_v2 BYTEA;

-- Migrate existing data
-- UPDATE mailboxes
-- SET password_encrypted_v2 = pgp_sym_encrypt(password_encrypted, 'encryption_key')
-- WHERE password_encrypted IS NOT NULL;

-- Create decryption function
CREATE OR REPLACE FUNCTION decrypt_mailbox_password(encrypted_password BYTEA)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_password, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT LOG FOR ENCRYPTION KEY ACCESS
-- ============================================================================
-- Track who accesses encrypted data

CREATE TABLE IF NOT EXISTS encryption_audit_log (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  action VARCHAR(100) NOT NULL, -- 'decrypt_token', 'decrypt_api_key', etc.
  table_name VARCHAR(100),
  record_id UUID,
  success BOOLEAN,
  error_message TEXT,
  ip_address INET
);

ALTER TABLE encryption_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_can_view_audit_log"
  ON encryption_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE INDEX idx_encryption_audit_timestamp ON encryption_audit_log(timestamp DESC);
CREATE INDEX idx_encryption_audit_user ON encryption_audit_log(user_id);
CREATE INDEX idx_encryption_audit_action ON encryption_audit_log(action);

-- Create function to log encryption access
CREATE OR REPLACE FUNCTION log_encryption_access(
  p_action VARCHAR,
  p_table_name VARCHAR,
  p_record_id UUID,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO encryption_audit_log (user_id, action, table_name, record_id, success, error_message, ip_address)
  VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_success,
    p_error_message,
    inet_client_addr()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- KEY ROTATION HELPER FUNCTIONS
-- ============================================================================

-- Function to rotate encryption keys
CREATE OR REPLACE FUNCTION rotate_encryption_key(
  p_key_name VARCHAR,
  p_new_key_material BYTEA,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
BEGIN
  -- Deactivate old key
  UPDATE encryption_keys SET is_active = false WHERE key_name = p_key_name;

  -- Create new key
  INSERT INTO encryption_keys (key_name, key_material, is_active, description, rotated_at)
  VALUES (p_key_name, p_new_key_material, true, p_description, NOW());

  RETURN QUERY SELECT true, format('Key %s rotated successfully', p_key_name);
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, format('Failed to rotate key: %s', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ENCRYPTION KEY INITIALIZATION
-- ============================================================================
-- Insert default encryption key (use for development only!)
-- In production, use AWS KMS or Vault to generate and store keys

INSERT INTO encryption_keys (key_name, key_material, is_active, description)
VALUES (
  'default',
  gen_random_bytes(32), -- 256-bit random key
  true,
  'Default encryption key for column-level encryption'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DECRYPTION VIEWS (for convenience in development/admin tools)
-- ============================================================================
-- These views decrypt sensitive data - use with extreme care!
-- Only admins should have access

CREATE OR REPLACE VIEW oauth_connections_decrypted AS
SELECT
  id,
  org_id,
  user_id,
  provider,
  pgp_sym_decrypt(access_token_encrypted, current_setting('app.encryption_key'))::TEXT AS access_token,
  pgp_sym_decrypt(refresh_token_encrypted, current_setting('app.encryption_key'))::TEXT AS refresh_token,
  token_expires_at,
  scopes,
  created_at,
  updated_at
FROM oauth_connections;

CREATE OR REPLACE VIEW org_ai_settings_decrypted AS
SELECT
  id,
  org_id,
  provider,
  model,
  pgp_sym_decrypt(openai_api_key_encrypted, current_setting('app.encryption_key'))::TEXT AS openai_api_key,
  pgp_sym_decrypt(anthropic_api_key_encrypted, current_setting('app.encryption_key'))::TEXT AS anthropic_api_key,
  pgp_sym_decrypt(google_api_key_encrypted, current_setting('app.encryption_key'))::TEXT AS google_api_key,
  created_at,
  updated_at
FROM org_ai_settings;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- ✅ pgcrypto extension enabled
-- ✅ Encryption key management table created
-- ✅ OAuth tokens can be encrypted
-- ✅ API keys can be encrypted
-- ✅ Mailbox passwords can be encrypted
-- ✅ Audit logging for encryption access
-- ✅ Key rotation support
--
-- NEXT STEPS:
-- 1. Set app.encryption_key in application startup
-- 2. Migrate existing plaintext data to encrypted columns
-- 3. Drop old plaintext columns
-- 4. Implement key rotation schedule (quarterly minimum)
-- 5. Store master key in AWS KMS or HashiCorp Vault
