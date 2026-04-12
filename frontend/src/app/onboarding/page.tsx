'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { InterviewStep } from '@/components/onboarding/interview-step';
import { PostsStep } from '@/components/onboarding/posts-step';
import { PersonaConfirmation } from '@/components/onboarding/persona-confirmation';
import {
  supabase,
  getUserPersona,
  getOrCreateOnboardingProgress,
  updateOnboardingProgress,
  PersonaData,
  InterviewData,
  CollectedPost,
  UserOnboardingProgress,
} from '@/lib/supabase';
import { Loader } from 'lucide-react';

type OnboardingStep = 'interview' | 'posts' | 'generating' | 'confirmation';

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<OnboardingStep>('interview');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [progress, setProgress] = useState<UserOnboardingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Initialize and check auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login?redirect=/onboarding');
          return;
        }

        setUserId(user.id);

        // Check if onboarding already complete
        const persona = await getUserPersona(user.id);
        if (persona && persona.onboarding_complete) {
          router.push('/dashboard');
          return;
        }

        // Get or create onboarding progress
        const onboarding = await getOrCreateOnboardingProgress(user.id);
        setProgress(onboarding);

        // Set step from URL or progress
        const urlStep = searchParams.get('step') as OnboardingStep;
        if (urlStep && ['interview', 'posts', 'generating', 'confirmation'].includes(urlStep)) {
          setStep(urlStep);
        } else {
          setStep('interview');
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError('Failed to load onboarding. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, searchParams]);

  const handleInterviewComplete = async (answers: Partial<InterviewData>) => {
    if (!userId) return;

    try {
      setLoading(true);
      await updateOnboardingProgress(userId, 2, answers as InterviewData);
      setStep('posts');
    } catch (err) {
      console.error('Error saving interview:', err);
      setError('Failed to save your answers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostsComplete = async (posts: CollectedPost[]) => {
    if (!userId || !progress) return;

    try {
      setGenerating(true);
      setStep('generating');

      const response = await fetch('/api/onboarding/generate-persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${await supabase.auth.getSession().then((s) => s.data?.session?.access_token || '')}`,
        },
        body: JSON.stringify({
          userId,
          interviewData: progress.interview_responses as InterviewData,
          posts,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate persona');
      }

      const { persona } = await response.json();

      setStep('confirmation');
      // Scroll to top
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Error generating persona:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to generate persona. Please try again.'
      );
      setStep('posts');
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirmationComplete = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Setting up your onboarding...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 p-4">
        <div className="max-w-md w-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Oops!</h2>
            <p className="text-red-700 mb-6">{error}</p>
            <button
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate step
  if (step === 'interview' && progress) {
    return (
      <InterviewStep
        onComplete={handleInterviewComplete}
        initialData={progress.interview_responses as Partial<InterviewData>}
        onProgress={(p) => {
          // Optional: track progress
        }}
      />
    );
  }

  if (step === 'posts' && progress) {
    return (
      <PostsStep
        onComplete={handlePostsComplete}
        initialPosts={progress.collected_posts}
        onProgress={(p) => {
          // Optional: track progress
        }}
      />
    );
  }

  if (step === 'generating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Generating Your Persona</h2>
          <p className="text-gray-600">
            Our AI is analyzing your interview and posts to create your unique brand voice...
          </p>
        </div>
      </div>
    );
  }

  // Render confirmation (step 4)
  // Note: You'll need to fetch the persona here if it exists
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
      <div className="text-center">
        <p className="text-gray-600">
          Persona confirmation step will display the generated persona here
        </p>
      </div>
    </div>
  );
}
