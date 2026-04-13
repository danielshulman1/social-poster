export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
import { getApiAuthContext, unauthorizedText } from '@/lib/apiAuth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  const auth = await getApiAuthContext(req);
  if (!auth?.userId) return unauthorizedText('Unauthorized');

  try {
    // Check if user has already used their audit
    const existingPersona = await prisma.userPersona.findUnique({
      where: { userId: auth.userId },
    });

    if (existingPersona?.auditUsed && !existingPersona?.auditAuthorizedAt) {
      return NextResponse.json(
        { error: 'Persona audit has already been used. Admin authorization required to run again.' },
        { status: 403 }
      );
    }

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

    // Extract and parse JSON from response
    let personaData: any = null;

    try {
      // Try to parse the entire response first
      personaData = JSON.parse(responseText);
    } catch (e) {
      // If that fails, try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from OpenAI - no JSON found');
      }

      try {
        personaData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        // Try to clean up the JSON by finding the last closing brace
        const jsonStr = jsonMatch[0];
        for (let i = jsonStr.length - 1; i >= 0; i--) {
          try {
            const cleaned = jsonStr.substring(0, i + 1);
            personaData = JSON.parse(cleaned);
            break;
          } catch (e) {
            // Continue trying
          }
        }

        if (!personaData) {
          throw new Error('Failed to parse JSON: ' + parseError);
        }
      }
    }

    // Validate the response
    if (!personaData.brandVoiceSummary || !Array.isArray(personaData.contentPillars)) {
      throw new Error('Invalid persona data structure - missing brandVoiceSummary or contentPillars');
    }

    // Mark audit as used and clear authorization (it's been consumed)
    await prisma.userPersona.upsert({
      where: { userId: auth.userId },
      update: {
        personaData,
        auditUsed: true,
        auditAuthorizedAt: null, // Clear the authorization after using
      },
      create: {
        userId: auth.userId,
        personaData,
        auditUsed: true,
      },
    });

    return NextResponse.json(personaData);
  } catch (error: any) {
    console.error('Error generating persona:', {
      message: error.message,
      code: error.code,
      status: error.status,
      type: error.type,
      fullError: error,
    });

    // Provide helpful error messages
    let errorMessage = 'Failed to generate persona';

    if (error.message?.includes('API')) {
      errorMessage = 'OpenAI API error - check your API key configuration';
    } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      errorMessage = 'Invalid OpenAI API key - please check your configuration';
    } else if (error.message?.includes('429')) {
      errorMessage = 'OpenAI rate limit exceeded - please try again in a moment';
    } else if (error.message?.includes('JSON')) {
      errorMessage = 'Invalid response format from AI - please try again';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: error.status || 500 }
    );
  }
}
