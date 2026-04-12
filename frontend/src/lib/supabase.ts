import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for Supabase tables
export interface UserPersona {
  id: string;
  user_id: string;
  persona_data: PersonaData;
  platforms_connected: string[];
  posts_analysed_count: number;
  interview_data?: InterviewData;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonaData {
  brandVoiceSummary: string;
  writingStyle: {
    postLength: string;
    emojiUsage: string;
    punctuationHabits: string;
    paragraphStructure: string;
  };
  recurringThemes: string[];
  powerWordsAndPhrases: string[];
  wordsToAvoid: string[];
  idealPostStructures: {
    [platform: string]: string;
  };
  hashtagStyle: string;
  engagementStyle: string;
  contentPillars: string[];
  samplePosts: {
    [platform: string]: string;
  };
}

export interface InterviewData {
  businessDescription: string;
  problemsSolved: string;
  brandPersonality: string;
  toneOfVoice: string;
  topicsToPostAbout: string;
  topicsToAvoid: string;
  achievements: string;
  phraseFrequency: string;
  phrasesToAvoid: string;
  idealCustomer: string;
  platformsActive: string[];
  businessGoals: string;
}

export interface UserOnboardingProgress {
  id: string;
  user_id: string;
  current_step: number; // 1: interview, 2: posts, 3: generating, 4: confirmation
  interview_responses: InterviewData;
  collected_posts: CollectedPost[];
  created_at: string;
  updated_at: string;
}

export interface CollectedPost {
  content: string;
  platform?: string;
  datePosted?: string;
  hashtags?: string[];
  engagement?: {
    likes?: number;
    comments?: number;
  };
}

export interface UserSocialConnection {
  id: string;
  user_id: string;
  platform: 'facebook' | 'instagram' | 'linkedin';
  access_token: string;
  refresh_token?: string;
  platform_user_id: string;
  posts_imported_count: number;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

// Helper functions
export async function getUserPersona(userId: string): Promise<UserPersona | null> {
  const { data, error } = await supabase
    .from('user_personas')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data || null;
}

export async function saveUserPersona(
  userId: string,
  personaData: PersonaData,
  interviewData: InterviewData,
  platformsConnected: string[],
  postsCount: number
): Promise<UserPersona> {
  const { data, error } = await supabase
    .from('user_personas')
    .upsert(
      {
        user_id: userId,
        persona_data: personaData,
        interview_data: interviewData,
        platforms_connected: platformsConnected,
        posts_analysed_count: postsCount,
        onboarding_complete: true,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getOrCreateOnboardingProgress(
  userId: string
): Promise<UserOnboardingProgress> {
  const { data: existing } = await supabase
    .from('user_onboarding_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    return existing;
  }

  const { data: newProgress, error } = await supabase
    .from('user_onboarding_progress')
    .insert({
      user_id: userId,
      current_step: 1,
      interview_responses: {},
      collected_posts: [],
    })
    .select()
    .single();

  if (error) throw error;
  return newProgress;
}

export async function updateOnboardingProgress(
  userId: string,
  step: number,
  interviewResponses?: Partial<InterviewData>,
  collectedPosts?: CollectedPost[]
): Promise<UserOnboardingProgress> {
  const { data, error } = await supabase
    .from('user_onboarding_progress')
    .update({
      current_step: step,
      ...(interviewResponses && { interview_responses: interviewResponses }),
      ...(collectedPosts && { collected_posts: collectedPosts }),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveSocialConnection(
  userId: string,
  platform: 'facebook' | 'instagram' | 'linkedin',
  accessToken: string,
  platformUserId: string,
  refreshToken?: string
): Promise<UserSocialConnection> {
  const { data, error } = await supabase
    .from('user_social_connections')
    .upsert(
      {
        user_id: userId,
        platform,
        access_token: accessToken,
        refresh_token: refreshToken,
        platform_user_id: platformUserId,
      },
      { onConflict: 'user_id, platform' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserSocialConnections(
  userId: string
): Promise<UserSocialConnection[]> {
  const { data, error } = await supabase
    .from('user_social_connections')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}
