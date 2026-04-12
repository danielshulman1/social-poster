import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase, PersonaData, InterviewData, CollectedPost } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generatePersonaWithOpenAI(
  interviewData: InterviewData,
  posts: CollectedPost[]
): Promise<PersonaData> {
  const postsText = posts.map((p) => `- ${p.content}`).join('\n');

  const prompt = `You are an expert brand voice analyst. Based on the following interview answers and social media post history, build a detailed personal brand persona.

INTERVIEW DATA:
- Business: ${interviewData.businessDescription}
- Problems Solved: ${interviewData.problemsSolved}
- Brand Personality: ${interviewData.brandPersonality}
- Tone of Voice: ${interviewData.toneOfVoice}
- Topics to Post About: ${interviewData.topicsToPostAbout}
- Topics to Avoid: ${interviewData.topicsToAvoid}
- Achievements: ${interviewData.achievements}
- Phrases/Words They Use: ${interviewData.phraseFrequency}
- Phrases/Words to Avoid: ${interviewData.phrasesToAvoid}
- Ideal Customer: ${interviewData.idealCustomer}
- Platforms Active On: ${Array.isArray(interviewData.platformsActive) ? interviewData.platformsActive.join(', ') : interviewData.platformsActive}
- Business Goals: ${interviewData.businessGoals}

EXISTING POSTS (${posts.length} posts):
${postsText || 'No posts provided'}

Create a detailed brand persona that includes:
1. Brand voice summary (2-3 sentences)
2. Writing style analysis (short/long posts, emoji usage, punctuation, paragraph structure)
3. Recurring themes and topics
4. Power words and phrases they naturally use
5. Words and phrases to avoid
6. Ideal post structure for each platform they're active on
7. Hashtag style and preferences
8. Engagement style (questions, CTAs, etc)
9. Content pillars (3-5 main topics to post about)
10. Sample posts for each platform in their exact voice

Return the response as a valid JSON object with this structure:
{
  "brandVoiceSummary": "string",
  "writingStyle": {
    "postLength": "string",
    "emojiUsage": "string",
    "punctuationHabits": "string",
    "paragraphStructure": "string"
  },
  "recurringThemes": ["string"],
  "powerWordsAndPhrases": ["string"],
  "wordsToAvoid": ["string"],
  "idealPostStructures": {
    "facebook": "string",
    "instagram": "string",
    "linkedin": "string",
    "twitter": "string"
  },
  "hashtagStyle": "string",
  "engagementStyle": "string",
  "contentPillars": ["string"],
  "samplePosts": {
    "facebook": "string",
    "instagram": "string",
    "linkedin": "string",
    "twitter": "string"
  }
}

IMPORTANT: Return ONLY valid JSON, no markdown code blocks, no explanations.`;

  const message = await openai.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    // Remove markdown code blocks if present
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const personaData = JSON.parse(cleanedResponse) as PersonaData;
    return personaData;
  } catch (error) {
    console.error('Failed to parse OpenAI response:', responseText);
    throw new Error('Failed to generate persona from OpenAI response');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { interviewData, posts, userId } = await request.json();

    if (!interviewData || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate persona using OpenAI
    const personaData = await generatePersonaWithOpenAI(interviewData, posts || []);

    // Save persona to Supabase
    const platforms = Array.isArray(interviewData.platformsActive)
      ? interviewData.platformsActive
      : interviewData.platformsActive?.split(',').map((p: string) => p.trim()) || [];

    const { data: persona, error } = await supabase
      .from('user_personas')
      .upsert(
        {
          user_id: userId,
          persona_data: personaData,
          interview_data: interviewData,
          platforms_connected: platforms,
          posts_analysed_count: posts?.length || 0,
          onboarding_complete: true,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save persona' },
        { status: 500 }
      );
    }

    // Clean up onboarding progress
    await supabase
      .from('user_onboarding_progress')
      .delete()
      .eq('user_id', userId);

    return NextResponse.json({
      success: true,
      persona,
    });
  } catch (error) {
    console.error('Error in generate-persona:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
