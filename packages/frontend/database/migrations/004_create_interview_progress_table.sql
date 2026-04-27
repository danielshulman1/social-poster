-- Create interview_progress table for multi-step onboarding tracking
-- Allows users to pause and resume onboarding

CREATE TABLE IF NOT EXISTS interview_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  interview_answers JSONB DEFAULT '{}'::jsonb,
  posts_choice VARCHAR(50),
  collected_posts JSONB DEFAULT '[]'::jsonb,
  social_credentials JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_interview_progress_user_id ON interview_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_progress_current_step ON interview_progress(current_step);

-- Add trigger to auto-update timestamp
CREATE OR REPLACE FUNCTION update_interview_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog;

DROP TRIGGER IF EXISTS interview_progress_timestamp ON interview_progress;
CREATE TRIGGER interview_progress_timestamp
  BEFORE UPDATE ON interview_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_interview_progress_timestamp();

-- Add comments
COMMENT ON TABLE interview_progress IS 'Tracks multi-step onboarding progress for persona builder';
COMMENT ON COLUMN interview_progress.current_step IS 'Current step: 1=interview, 2=collect posts, 3=analyze, 4=build, 5=confirm';
COMMENT ON COLUMN interview_progress.interview_answers IS 'JSON object storing all Q&A responses';
COMMENT ON COLUMN interview_progress.posts_choice IS 'manual or oauth';
COMMENT ON COLUMN interview_progress.collected_posts IS 'Array of post objects with content, date, platform';
COMMENT ON COLUMN interview_progress.social_credentials IS 'OAuth tokens and credentials (encrypted in production)';
