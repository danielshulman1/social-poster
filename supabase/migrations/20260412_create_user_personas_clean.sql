-- Drop existing triggers first (if they exist)
DROP TRIGGER IF EXISTS update_user_personas_updated_at ON user_personas CASCADE;
DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON user_onboarding_progress CASCADE;
DROP TRIGGER IF EXISTS update_social_connections_updated_at ON user_social_connections CASCADE;

-- Drop existing policies (if they exist)
DROP POLICY IF EXISTS "Users can view own personas" ON user_personas;
DROP POLICY IF EXISTS "Users can insert own personas" ON user_personas;
DROP POLICY IF EXISTS "Users can update own personas" ON user_personas;
DROP POLICY IF EXISTS "Users can view own onboarding progress" ON user_onboarding_progress;
DROP POLICY IF EXISTS "Users can insert own onboarding progress" ON user_onboarding_progress;
DROP POLICY IF EXISTS "Users can update own onboarding progress" ON user_onboarding_progress;
DROP POLICY IF EXISTS "Users can view own social connections" ON user_social_connections;
DROP POLICY IF EXISTS "Users can insert own social connections" ON user_social_connections;
DROP POLICY IF EXISTS "Users can update own social connections" ON user_social_connections;

-- Drop existing tables (if they exist)
DROP TABLE IF EXISTS user_social_connections CASCADE;
DROP TABLE IF EXISTS user_onboarding_progress CASCADE;
DROP TABLE IF EXISTS user_personas CASCADE;

-- Drop function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Now create the tables fresh

-- Create user_personas table for AI-generated brand personas
CREATE TABLE user_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Persona data stored as JSONB for flexibility
  persona_data JSONB NOT NULL,

  -- Metadata about the persona generation
  platforms_connected TEXT[] DEFAULT ARRAY[]::TEXT[],
  posts_analysed_count INTEGER DEFAULT 0,

  -- Interview data stored for potential future use/updates
  interview_data JSONB,

  -- Status tracking
  onboarding_complete BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Indexes for common queries
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX idx_user_personas_user_id ON user_personas(user_id);
CREATE INDEX idx_user_personas_created_at ON user_personas(created_at);

-- Create table to store temporary interview progress (for saving progress mid-flow)
CREATE TABLE user_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  current_step INTEGER DEFAULT 1,
  interview_responses JSONB DEFAULT '{}'::JSONB,
  collected_posts JSONB DEFAULT '[]'::JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX idx_onboarding_progress_user_id ON user_onboarding_progress(user_id);

-- Create table for social media platform connections
CREATE TABLE user_social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  platform VARCHAR(50) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  platform_user_id VARCHAR(255),

  posts_imported_count INTEGER DEFAULT 0,
  last_synced_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, platform)
);

-- Create indexes
CREATE INDEX idx_social_connections_user_id ON user_social_connections(user_id);
CREATE INDEX idx_social_connections_platform ON user_social_connections(user_id, platform);

-- Enable Row Level Security
ALTER TABLE user_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_social_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_personas
CREATE POLICY "Users can view own personas"
  ON user_personas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personas"
  ON user_personas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personas"
  ON user_personas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own personas"
  ON user_personas FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_onboarding_progress
CREATE POLICY "Users can view own onboarding progress"
  ON user_onboarding_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding progress"
  ON user_onboarding_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding progress"
  ON user_onboarding_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own onboarding progress"
  ON user_onboarding_progress FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_social_connections
CREATE POLICY "Users can view own social connections"
  ON user_social_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social connections"
  ON user_social_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social connections"
  ON user_social_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own social connections"
  ON user_social_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_user_personas_updated_at
  BEFORE UPDATE ON user_personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON user_onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_connections_updated_at
  BEFORE UPDATE ON user_social_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_personas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_onboarding_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_social_connections TO authenticated;
