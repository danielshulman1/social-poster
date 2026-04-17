export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, NextRequest } from 'next/server';
import { getApiAuthContext, unauthorizedText } from '@/lib/apiAuth';
import {
  buildReferenceDocumentMetadata,
  clampReferenceDocumentsForPrompt,
  sanitizeReferenceDocuments,
} from '@/lib/persona-reference-documents';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

interface InterviewAnswerInput {
  question: string;
  answer: string;
}

interface GeneratedPersonaData {
  brandVoiceSummary: string;
  contentPillars: string[];
  referenceDocuments?: ReturnType<typeof buildReferenceDocumentMetadata>;
}

type RouteError = Error & {
  code?: string;
  status?: number;
  type?: string;
};

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
    const { interviewAnswers, postSamples, referenceDocuments } = body;

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
    const normalizedInterviewAnswers = interviewAnswers
      .filter(
        (answer: unknown): answer is InterviewAnswerInput =>
          !!answer &&
          typeof answer === 'object' &&
          'question' in answer &&
          'answer' in answer &&
          typeof answer.question === 'string' &&
          typeof answer.answer === 'string'
      );

    const normalizedPosts = Array.isArray(postSamples)
      ? postSamples.filter((post): post is string => typeof post === 'string' && post.trim().length > 0)
      : [];

    const interviewText = normalizedInterviewAnswers
      .map((answer, i) => `Q${i + 1}: ${answer.question}\nA: ${answer.answer}`)
      .join('\n\n');

    const postsText = normalizedPosts.length > 0
      ? `\n\nRecent posts:\n${normalizedPosts.map((post) => `- ${post}`).join('\n')}`
      : '';

    const normalizedReferenceDocuments = sanitizeReferenceDocuments(referenceDocuments);
    const promptReferenceDocuments = clampReferenceDocumentsForPrompt(normalizedReferenceDocuments);
    const referenceText = promptReferenceDocuments.length > 0
      ? `\n\nReference documents:\n${promptReferenceDocuments
          .map((document, index) => {
            const kindLabel = document.kind === 'brand-guidelines'
              ? 'Brand guidelines'
              : document.kind === 'master-prompt'
                ? 'Master prompt'
                : 'Reference material';

            return `[Document ${index + 1}] ${document.name} (${kindLabel})\n${document.content}`;
          })
          .join('\n\n')}`
      : '';

    const prompt = `Based on the following interview answers, recent posts, and optional reference documents, analyze this person's brand voice, communication style, and content themes. Generate a structured persona.

Use the materials in this order of priority:
1. Brand guidelines and master prompts for explicit voice, messaging, and positioning rules.
2. Interview answers for intent, goals, and audience.
3. Recent posts for real-world phrasing and tone examples.

If the recent posts conflict with the brand guidelines or master prompts, prefer the uploaded reference documents.

${interviewText}${postsText}${referenceText}

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
    let personaData: Partial<GeneratedPersonaData> | null = null;

    try {
      // Try to parse the entire response first
      personaData = JSON.parse(responseText);
    } catch {
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
          } catch {
            // Continue trying
          }
        }

        if (!personaData) {
          throw new Error('Failed to parse JSON: ' + parseError);
        }
      }
    }

    // Validate the response
    if (
      !personaData ||
      typeof personaData.brandVoiceSummary !== 'string' ||
      !Array.isArray(personaData.contentPillars) ||
      !personaData.contentPillars.every((pillar): pillar is string => typeof pillar === 'string')
    ) {
      throw new Error('Invalid persona data structure - missing brandVoiceSummary or contentPillars');
    }

    const finalPersonaData: GeneratedPersonaData = {
      brandVoiceSummary: personaData.brandVoiceSummary.trim(),
      contentPillars: personaData.contentPillars.map((pillar) => pillar.trim()).filter(Boolean),
      referenceDocuments: buildReferenceDocumentMetadata(normalizedReferenceDocuments),
    };

    // Mark audit as used and clear authorization (it's been consumed)
    await prisma.userPersona.upsert({
      where: { userId: auth.userId },
      update: {
        personaData: finalPersonaData,
        auditUsed: true,
        auditAuthorizedAt: null, // Clear the authorization after using
      },
      create: {
        userId: auth.userId,
        personaData: finalPersonaData,
        auditUsed: true,
      },
    });

    return NextResponse.json(finalPersonaData);
  } catch (error: unknown) {
    const routeError: RouteError =
      error instanceof Error ? (error as RouteError) : new Error('Failed to generate persona');

    console.error('Error generating persona:', {
      message: routeError.message,
      code: routeError.code,
      status: routeError.status,
      type: routeError.type,
      fullError: routeError,
    });

    // Provide helpful error messages
    let errorMessage = 'Failed to generate persona';

    if (routeError.message?.includes('API')) {
      errorMessage = 'OpenAI API error - check your API key configuration';
    } else if (routeError.message?.includes('401') || routeError.message?.includes('Unauthorized')) {
      errorMessage = 'Invalid OpenAI API key - please check your configuration';
    } else if (routeError.message?.includes('429')) {
      errorMessage = 'OpenAI rate limit exceeded - please try again in a moment';
    } else if (routeError.message?.includes('JSON')) {
      errorMessage = 'Invalid response format from AI - please try again';
    } else if (routeError.message) {
      errorMessage = routeError.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: routeError.status || 500 }
    );
  }
}
