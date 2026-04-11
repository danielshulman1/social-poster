/**
 * API Route: Start interview onboarding
 * POST /api/onboarding/interview/start
 *
 * Initialize interview progress and return first question
 */

import { requireAuth } from '../../../../utils/auth';
import { createInterviewProgress, getUserPersona, ensureUserPersonasTable, ensureInterviewProgressTable } from '../../../../utils/persona-db';
import { getUserTier } from '../../../../utils/tier-db';
import { INTERVIEW_QUESTIONS } from '../../../../lib/openai-persona';

export async function POST(request) {
  try {
    // Check auth
    const user = await requireAuth(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure tables exist
    await ensureUserPersonasTable();
    await ensureInterviewProgressTable();

    // Check setup fee paid
    const tierInfo = await getUserTier(user.id);
    if (!tierInfo.setup_fee_paid) {
      return Response.json(
        { error: 'Setup fee must be paid first', code: 'SETUP_FEE_REQUIRED' },
        { status: 403 }
      );
    }

    // Check if already onboarded
    const existingPersona = await getUserPersona(user.id);
    if (existingPersona?.onboarding_complete) {
      return Response.json(
        { error: 'Already onboarded', code: 'ALREADY_ONBOARDED' },
        { status: 400 }
      );
    }

    // Create interview progress
    const progress = await createInterviewProgress(user.id);

    // Return first question
    const firstQuestion = INTERVIEW_QUESTIONS[0];

    return Response.json({
      success: true,
      step: 1,
      totalSteps: 5,
      currentQuestion: firstQuestion,
      questionsCount: INTERVIEW_QUESTIONS.length,
    });
  } catch (error) {
    console.error('[interview-start] Error:', error.message);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
