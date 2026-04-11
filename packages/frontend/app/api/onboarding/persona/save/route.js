/**
 * API Route: Save completed persona
 * POST /api/onboarding/persona/save
 *
 * Save persona to database and complete onboarding
 */

import { requireAuth } from '../../../../utils/auth';
import { getInterviewProgress, savePersona, clearInterviewProgress, ensureUserPersonasTable } from '../../../../utils/persona-db';
import { sendOnboardingCompleteEmail } from '../../../../lib/email';

export async function POST(request) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { persona } = body;

    if (!persona) {
      return Response.json(
        { error: 'persona object required' },
        { status: 400 }
      );
    }

    // Ensure table exists
    await ensureUserPersonasTable();

    // Get progress to extract info
    const progress = await getInterviewProgress(user.id);

    if (!progress) {
      return Response.json(
        { error: 'Interview progress not found' },
        { status: 400 }
      );
    }

    const platformsConnected = progress.social_credentials?.platforms || [];
    const postsCount = progress.collected_posts?.length || 0;

    // Save persona
    const saved = await savePersona(
      user.id,
      persona,
      platformsConnected,
      postsCount
    );

    // Clear interview progress
    await clearInterviewProgress(user.id);

    // Send confirmation email
    try {
      await sendOnboardingCompleteEmail({
        email: user.email,
        personaSummary: persona.brandVoice?.summary || 'Your AI persona',
      });
    } catch (emailError) {
      console.log('[persona-save] Email failed but persona saved:', emailError.message);
    }

    return Response.json({
      success: true,
      message: 'Onboarding complete! Your persona is ready.',
      persona: {
        id: saved.id,
        onboardingComplete: saved.onboarding_complete,
        platformsConnected: saved.platforms_connected,
        postsAnalysed: saved.posts_analysed_count,
      },
    });
  } catch (error) {
    console.error('[persona-save] Error:', error.message);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
