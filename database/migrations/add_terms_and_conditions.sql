-- Add Terms and Conditions acceptance tracking
-- This ensures users must accept T&C before creating an account

-- Create table to store T&C versions
CREATE TABLE IF NOT EXISTS terms_and_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT false
);

-- Track which users have accepted which T&C versions
CREATE TABLE IF NOT EXISTS user_tc_acceptance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tc_id UUID NOT NULL REFERENCES terms_and_conditions(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  UNIQUE(user_id, tc_id)
);

-- Add column to track if user has accepted current T&C
ALTER TABLE users
ADD COLUMN IF NOT EXISTS tc_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tc_accepted_at TIMESTAMPTZ;

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_terms_and_conditions_active ON terms_and_conditions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_tc_acceptance_user ON user_tc_acceptance(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tc_acceptance_tc ON user_tc_acceptance(tc_id);
CREATE INDEX IF NOT EXISTS idx_users_tc_accepted ON users(tc_accepted);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_terms_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS terms_timestamp ON terms_and_conditions;
CREATE TRIGGER terms_timestamp
  BEFORE UPDATE ON terms_and_conditions
  FOR EACH ROW
  EXECUTE FUNCTION update_terms_timestamp();

-- Add table comments
COMMENT ON TABLE terms_and_conditions IS 'Stores different versions of Terms and Conditions documents';
COMMENT ON TABLE user_tc_acceptance IS 'Audit trail of user T&C acceptance with timestamp and metadata';
COMMENT ON COLUMN user_tc_acceptance.ip_address IS 'IP address from which user accepted T&C (for audit purposes)';
COMMENT ON COLUMN user_tc_acceptance.user_agent IS 'Browser user agent at time of acceptance (for audit purposes)';

-- Insert initial T&C (update content as needed)
INSERT INTO terms_and_conditions (version, title, content, is_active) VALUES (
  '1.0.0',
  'Terms and Conditions of Service',
  '# Terms and Conditions

## 1. Acceptance of Terms
By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.

## 2. Use License
Permission is granted to temporarily download one copy of the materials (information or software) on this application for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
- Modifying or copying the materials
- Using the materials for any commercial purpose
- Attempting to decompile or reverse engineer any software contained on the application
- Removing any copyright or other proprietary notations from the materials
- Transferring the materials to another person or "mirroring" the materials on any other server

## 3. Disclaimer
The materials on this application are provided on an "as is" basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.

## 4. Limitations
In no event shall this application or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on this application, even if we or an authorized representative has been notified orally or in writing of the possibility of such damage.

## 5. Accuracy of Materials
The materials appearing on this application could include technical, typographical, or photographic errors. We do not warrant that any of the materials on this application are accurate, complete, or current. We may make changes to the materials contained on this application at any time without notice.

## 6. Links
We have not reviewed all of the sites linked to our website and are not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by us of the site. Use of any such linked website is at the user''s own risk.

## 7. Modifications
We may revise these terms of service for our application at any time without notice. By using this application, you are agreeing to be bound by the then current version of these terms of service.

## 8. Governing Law
These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which the application is operated, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.

Last Updated: April 17, 2026',
  true  -- This is the active version
);

-- Create function to check if user must accept T&C
CREATE OR REPLACE FUNCTION check_user_tc_acceptance(user_id_param UUID)
RETURNS TABLE(must_accept BOOLEAN, tc_version VARCHAR, tc_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT
    NOT COALESCE(u.tc_accepted, false) as must_accept,
    COALESCE(t.version, '1.0.0') as tc_version,
    t.id as tc_id
  FROM users u
  CROSS JOIN terms_and_conditions t
  WHERE u.id = user_id_param
  AND t.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to accept T&C (call this after user checks the box)
CREATE OR REPLACE FUNCTION accept_terms_and_conditions(
  user_id_param UUID,
  tc_id_param UUID,
  ip_address_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
BEGIN
  -- Insert acceptance record
  INSERT INTO user_tc_acceptance (user_id, tc_id, ip_address, user_agent)
  VALUES (user_id_param, tc_id_param, ip_address_param, user_agent_param)
  ON CONFLICT (user_id, tc_id) DO NOTHING;

  -- Update user record
  UPDATE users
  SET tc_accepted = true, tc_accepted_at = NOW()
  WHERE id = user_id_param;

  RETURN QUERY SELECT true as success, 'Terms and conditions accepted' as message;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false as success, 'Error accepting terms and conditions' as message;
END;
$$ LANGUAGE plpgsql;
