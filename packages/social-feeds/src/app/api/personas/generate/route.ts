export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
import { getApiAuthContext, unauthorizedText } from '@/lib/apiAuth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  const auth = await getApiAuthContext(req);
  if (!auth?.userId) return unauthorizedText('Unauthorized');

  try {
    const body = await req.json();
    const { interviewAnswers, postSamples } = body;

    if (!interviewAnswers || !Array.isArray(interviewAnswers) || interviewAnswers.length === 0) {
      return NextResponse.json(
        { error: 'interviewAnswers array is required' },
        { status: 400 }
      );
    }

    // Get user's API key or fall back to server one
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { openaiApiKey: true },
    });

    const apiKey = user?.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // Build the prompt for persona generation
    const interviewText = interviewAnswers
      .map((answer: { question: string; answer: string }, i: number) => `Q${i + 1}: ${answer.question}\nA: ${answer.answer}`)
      .join('\n\n');

    const postsText = postSamples && Array.isArray(postSamples) && postSamples.length > 0
      ? `\n\nRecent posts:\n${postSamples.map((post: any) => `- ${post}`).join('\n')}`
      : '';

    const prompt = `Based on the following interview answers and recent posts, analyze this person's brand voice, communication style, and content themes. Generate a structured persona.

${interviewText}${postsText}

Create a JSON response with:
- brandVoiceSummary: A 2-3 sentence summary of their communication style and brand personality
- contentPillars: An array of 4-5 key content themes they care about

Example format:
{
  "brandVoiceSummary": "Direct and practical advice giver with a conversational tone. Blends technical expertise with relatable humor.",
  "contentPillars": ["Web Development", "Best Practices", "Career Growth", "Tech Industry Trends"]
}`;

    const message = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.choices[0].message.content || '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from OpenAI');
    }

    const personaData = JSON.parse(jsonMatch[0]);

    // Validate the response
    if (!personaData.brandVoiceSummary || !Array.isArray(personaData.contentPillars)) {
      throw new Error('Invalid persona data structure');
    }

    return NextResponse.json(personaData);
  } catch (error: any) {
    console.error('Error generating persona:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate persona' },
      { status: 500 }
    );
  }
}
