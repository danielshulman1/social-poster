export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
import { getApiAuthContext, unauthorizedText } from '@/lib/apiAuth';

/**
 * Debug endpoint to check if OpenAI API is configured
 */
export async function GET(req: NextRequest) {
  const auth = await getApiAuthContext(req);
  if (!auth?.userId) return unauthorizedText('Unauthorized');

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const hasApiKey = !!apiKey;
    const apiKeyStart = apiKey ? apiKey.substring(0, 10) : '';

    // Test the API key by making a simple models request
    let apiWorks = false;
    let apiError = '';

    if (hasApiKey) {
      try {
        const testResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        apiWorks = testResponse.ok;
        if (!testResponse.ok) {
          apiError = `API returned ${testResponse.status}: ${testResponse.statusText}`;
        }
      } catch (e: any) {
        apiError = e.message;
      }
    }

    return NextResponse.json({
      status: 'ok',
      config: {
        hasOpenAiKey: hasApiKey,
        apiKeyPrefix: apiKeyStart + '...',
        apiWorks,
        apiError: apiError || null,
      },
      message: hasApiKey
        ? apiWorks
          ? 'OpenAI API is properly configured and working'
          : `OpenAI API key is set but not working: ${apiError}`
        : 'OpenAI API key is NOT configured - set OPENAI_API_KEY environment variable',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
