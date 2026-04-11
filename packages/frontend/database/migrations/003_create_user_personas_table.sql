-- Create user_personas table for storing AI-generated personas
-- Run this migration after user_tiers table

CREATE TABLE IF NOT EXISTS user_personas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  persona_data JSONB NOT NULL,
  platforms_connected VARCHAR(100)[] DEFAULT '{}',
  posts_analysed_count INTEGER DEFAULT 0,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_personas_user_id ON user_personas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_personas_onboarding_complete ON user_personas(onboarding_complete);

-- Add trigger to auto-update timestamp
CREATE OR REPLACE FUNCTION update_user_personas_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS user_personas_timestamp ON user_personas;
CREATE TRIGGER user_personas_timestamp
  BEFORE UPDATE ON user_personas
  FOR EACH ROW
  EXECUTE FUNCTION update_user_personas_timestamp();

-- Add comments
COMMENT ON TABLE user_personas IS 'Stores AI-generated brand personas for users';
COMMENT ON COLUMN user_personas.persona_data IS 'Complete persona JSON object';
COMMENT ON COLUMN user_personas.platforms_connected IS 'Array of platforms: facebook, instagram, linkedin, tiktok, twitter';
COMMENT ON COLUMN user_personas.posts_analysed_count IS 'Number of posts analysed to build persona';
