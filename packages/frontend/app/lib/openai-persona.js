/**
 * OpenAI Persona Generation
 * Generates detailed brand personas from interview data and social media posts
 */

import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Interview questions for the persona builder
 */
export const INTERVIEW_QUESTIONS = [
  {
    id: 'business_description',
    question: 'What does your business do and who do you serve?',
    placeholder: 'e.g., I help small businesses grow their online presence...',
  },
  {
    id: 'problems_solved',
    question: 'What problems do you solve for your customers?',
    placeholder: 'e.g., We help them reach more people and convert leads...',
  },
  {
    id: 'brand_personality',
    question: 'How would you describe your brand personality? (fun, professional, inspirational, educational, etc)',
    placeholder: 'e.g., Professional but approachable, with a touch of humor...',
  },
  {
    id: 'tone',
    question: 'What tone do you want for your posts? (formal, casual, conversational, etc)',
    placeholder: 'e.g., Conversational and friendly, not too corporate...',
  },
  {
    id: 'topics',
    question: 'What topics do you want to post about?',
    placeholder: 'e.g., Business growth, marketing tips, customer success stories...',
  },
  {
    id: 'avoid_topics',
    question: 'What topics do you never want to post about?',
    placeholder: 'e.g., Politics, personal drama, controversial issues...',
  },
  {
    id: 'achievements',
    question: 'What are your biggest achievements or results you want to share?',
    placeholder: 'e.g., Helped 100+ clients, 50% revenue growth, won industry award...',
  },
  {
    id: 'catchphrases',
    question: 'Do you have any favorite phrases or words you use a lot?',
    placeholder: 'e.g., "Game changer", "Level up", "The secret sauce"...',
  },
  {
    id: 'avoid_words',
    question: 'Are there any words or phrases you never want to use?',
    placeholder: 'e.g., "Just", "Actually", overused buzzwords...',
  },
  {
    id: 'ideal_customer',
    question: 'Who is your ideal customer?',
    placeholder: 'e.g., Entrepreneurs age 25-45, bootstrapped startups...',
  },
  {
    id: 'platforms',
    question: 'Which platforms will you be posting on?',
    placeholder: 'e.g., LinkedIn, Instagram, Facebook...',
  },
  {
    id: 'social_media_goal',
    question: 'What do you want social media to do for your business? (leads, awareness, authority, etc)',
    placeholder: 'e.g., Build authority and generate qualified leads...',
  },
];

/**
 * Build persona from interview answers and posts
 */
export async function buildPersonaFromData(interviewAnswers, posts, platformsConnected) {
  try {
    const prompt = buildPersonaPrompt(interviewAnswers, posts, platformsConnected);

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert brand voice analyst and copywriter. Your task is to build detailed, actionable brand personas based on interview data and social media analysis.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const personaText = response.choices[0].message.content;
    const persona = JSON.parse(extractJsonFromResponse(personaText));

    return persona;
  } catch (error) {
    console.error('[buildPersonaFromData] Error:', error.message);
    throw error;
  }
}

/**
 * Build the prompt for OpenAI
 */
function buildPersonaPrompt(interviewAnswers, posts, platformsConnected) {
  return `You are an expert brand voice analyst. Based on the following interview answers and social media post history, build a detailed brand persona.

INTERVIEW ANSWERS:
${formatInterviewAnswers(interviewAnswers)}

SOCIAL MEDIA POST ANALYSIS:
${formatPostsForAnalysis(posts)}

CONNECTED PLATFORMS: ${platformsConnected.join(', ')}

Please analyze this data and return a comprehensive brand persona as a valid JSON object with this exact structure (no markdown, just raw JSON):

{
  "brandVoice": {
    "summary": "2-3 sentences describing the overall tone and style",
    "tone": ["list", "of", "tone", "words"],
    "personality": ["list", "of", "personality", "traits"]
  },
  "writingStyle": {
    "postLength": "short/medium/long",
    "useEmojis": true/false,
    "punctuationStyle": "description of punctuation habits",
    "paragraphStructure": "description of how they structure text"
  },
  "themes": [
    {
      "topic": "main topic",
      "keywords": ["keyword1", "keyword2"],
      "frequency": "how often posted about"
    }
  ],
  "powerWords": ["word1", "word2", "word3"],
  "avoidWords": ["word1", "word2"],
  "contentPillars": ["pillar1", "pillar2", "pillar3"],
  "platformGuides": {
    "facebook": {
      "postStructure": "How they structure Facebook posts",
      "hashtags": "hashtag strategy",
      "samplePost": "A sample post in their voice for Facebook (100-150 words)"
    },
    "instagram": {
      "postStructure": "How they structure Instagram posts",
      "hashtags": "hashtag strategy",
      "samplePost": "A sample post in their voice for Instagram (50-100 words)"
    },
    "linkedin": {
      "postStructure": "How they structure LinkedIn posts",
      "hashtags": "hashtag strategy",
      "samplePost": "A sample post in their voice for LinkedIn (150-200 words)"
    }
  },
  "engagementStyle": {
    "asksQuestions": true/false,
    "usesCallsToAction": true/false,
    "respondsToCom ments": true/false,
    "example": "Example of engagement approach"
  }
}

Return ONLY valid JSON, no other text.`;
}

/**
 * Format interview answers for the prompt
 */
function formatInterviewAnswers(answers) {
  const questions = {
    business_description: 'What they do:',
    problems_solved: 'Problems they solve:',
    brand_personality: 'Brand personality:',
    tone: 'Desired tone:',
    topics: 'Topics to post about:',
    avoid_topics: 'Topics to avoid:',
    achievements: 'Key achievements:',
    catchphrases: 'Favorite phrases:',
    avoid_words: 'Words to avoid:',
    ideal_customer: 'Ideal customer:',
    platforms: 'Platforms:',
    social_media_goal: 'Social media goals:',
  };

  return Object.entries(questions)
    .map(([key, label]) => `${label} ${answers[key] || 'Not provided'}`)
    .join('\n');
}

/**
 * Format posts for analysis
 */
function formatPostsForAnalysis(posts) {
  if (!posts || posts.length === 0) {
    return 'No posts provided for analysis.';
  }

  return posts
    .slice(0, 50) // Limit to 50 posts to avoid token limits
    .map((post, idx) => {
      return `[Post ${idx + 1}] Platform: ${post.platform || 'unknown'} | Date: ${post.date || 'unknown'}\n${post.content}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Extract JSON from response (handles markdown code blocks)
 */
function extractJsonFromResponse(response) {
  // Try to find JSON in markdown code blocks first
  const jsonMatch = response.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    return jsonMatch[1];
  }

  // Try to find JSON object directly
  const objectMatch = response.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }

  throw new Error('Could not extract JSON from response');
}

/**
 * Validate persona structure
 */
export function validatePersona(persona) {
  const requiredFields = ['brandVoice', 'writingStyle', 'themes', 'contentPillars'];

  for (const field of requiredFields) {
    if (!persona[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return true;
}
