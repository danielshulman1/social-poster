/**
 * API Route: Submit interview answer
 * POST /api/onboarding/interview/answer
 *
 * Save answer and return next question
 */

import { requireAuth } from '../../../../utils/auth';
import { getInterviewProgress, updateInterviewProgress } from '../../../../utils/persona-db';
import { INTERVIEW_QUESTIONS } from '../../../../lib/openai-persona';

export async function POST(request) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, answer } = body;

    if (!questionId || !answer) {
      return Response.json(
        { error: 'questionId and answer are required' },
        { status: 400 }
      );
    }

    // Get current progress
    const progress = await getInterviewProgress(user.id);
    if (!progress) {
      return Response.json(
        { error: 'Interview not started' },
        { status: 400 }
      );
    }

    // Save answer
    const updatedAnswers = {
      ...progress.interview_answers,
      [questionId]: answer,
    };

    const currentQuestion = INTERVIEW_QUESTIONS.find(q => q.id === questionId);
    const currentIndex = INTERVIEW_QUESTIONS.findIndex(q => q.id === questionId);
    const nextIndex = currentIndex + 1;

    let nextQuestion = null;
    let isComplete = false;

    if (nextIndex < INTERVIEW_QUESTIONS.length) {
      nextQuestion = INTERVIEW_QUESTIONS[nextIndex];
    } else {
      isComplete = true;
    }

    // Update progress
    await updateInterviewProgress(user.id, {
      interviewAnswers: updatedAnswers,
      currentStep: isComplete ? 2 : 1,
    });

    return Response.json({
      success: true,
      answerSaved: true,
      questionAnswered: currentIndex + 1,
      totalQuestions: INTERVIEW_QUESTIONS.length,
      nextQuestion: nextQuestion,
      interviewComplete: isComplete,
      progress: {
        currentQuestion: currentIndex + 1,
        totalQuestions: INTERVIEW_QUESTIONS.length,
        percentage: Math.round(((currentIndex + 1) / INTERVIEW_QUESTIONS.length) * 100),
      },
    });
  } catch (error) {
    console.error('[interview-answer] Error:', error.message);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
