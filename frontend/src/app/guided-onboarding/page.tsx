'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SocialConnectionStep } from '@/components/onboarding/social-connection-step';
import { PersonaCreationStep } from '@/components/onboarding/persona-creation-step';
import { FlowsSetupStep } from '@/components/onboarding/flows-setup-step';
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

type GuidedStep =
  | 'welcome'
  | 'social-connection'
  | 'persona-intro'
  | 'interview'
  | 'posts'
  | 'generating'
  | 'confirmation'
  | 'flows-setup'
  | 'complete';

export default function GuidedOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<GuidedStep>('welcome');
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
          router.push('/login?redirect=/guided-onboarding');
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
      } catch (err) {
        console.error('Auth check error:', err);
        setError('Failed to load onboarding. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSocialConnectionComplete = () => {
    setCurrentStep('persona-intro');
  };

  const handleSocialConnectionSkip = () => {
    setCurrentStep('persona-intro');
  };

  const handlePersonaIntroComplete = () => {
    setCurrentStep('interview');
  };

  const handleInterviewComplete = async (answers: Partial<InterviewData>) => {
    if (!userId) return;

    try {
      setLoading(true);
      await updateOnboardingProgress(userId, 2, answers as InterviewData);
      setProgress((prev) =>
        prev ? { ...prev, interview_responses: answers as InterviewData } : null
      );
      setCurrentStep('posts');
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
      setCurrentStep('generating');

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
      setCurrentStep('confirmation');
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Error generating persona:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to generate persona. Please try again.'
      );
      setCurrentStep('posts');
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirmationComplete = () => {
    setCurrentStep('flows-setup');
  };

  const handleFlowsSetupComplete = () => {
    setCurrentStep('complete');
  };

  const handleCompleteOnboarding = () => {
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

  if (error && currentStep !== 'posts' && currentStep !== 'interview') {
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

  // Render steps
  if (currentStep === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4 sm:p-6">
        <div className="w-full max-w-4xl mx-auto flex flex-col justify-center min-h-screen">
          {/* Logo/Brand */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-3 sm:mb-4">
              Welcome! 👋
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-2 px-2">
              Let's get your social media content engine running
            </p>
            <p className="text-sm sm:text-base text-gray-600 px-2">
              This guided tour will take about 15-20 minutes
            </p>
          </div>

          {/* What you'll do */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
            <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Here's What We'll Do</h2>

              <div className="space-y-4 sm:space-y-6">
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Connect Social Media</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Import your existing posts to understand your voice
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Create Brand Persona</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Answer questions about your business and brand voice
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Set Up Content Flows</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Create automated schedules for AI-generated posts
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Start Posting</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Your AI starts generating content in your voice
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
                <h3 className="font-semibold text-green-900 mb-3 text-sm sm:text-base">✓ What You'll Get</h3>
                <ul className="space-y-2 text-green-900 text-xs sm:text-sm">
                  <li>• AI that writes like you, not like a robot</li>
                  <li>• Automated posting on your schedule</li>
                  <li>• More time for what matters</li>
                  <li>• Consistent brand voice across all posts</li>
                  <li>• Full control and approval before posting</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                <h3 className="font-semibold text-blue-900 mb-3 text-sm sm:text-base">⏱️ Time Required</h3>
                <p className="text-blue-900 text-xs sm:text-sm mb-4">
                  <strong>Total: 15-20 minutes</strong>
                </p>
                <ul className="space-y-2 text-blue-900 text-xs sm:text-sm">
                  <li>• Social connection: 3-5 min (optional)</li>
                  <li>• Interview: 5-10 min</li>
                  <li>• Posts upload: 2-5 min</li>
                  <li>• Review: 1-2 min</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 sm:p-6">
                <h3 className="font-semibold text-amber-900 mb-3 text-sm sm:text-base">ℹ️ Pro Tip</h3>
                <p className="text-amber-900 text-xs sm:text-sm">
                  You can pause and continue later. Your progress is automatically saved at each step.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              Maybe Later
            </button>

            <button
              onClick={() => setCurrentStep('social-connection')}
              className="px-4 sm:px-8 py-2 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Let's Get Started →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'social-connection') {
    return (
      <SocialConnectionStep
        onComplete={handleSocialConnectionComplete}
        onSkip={handleSocialConnectionSkip}
      />
    );
  }

  if (currentStep === 'persona-intro') {
    return (
      <PersonaCreationStep onComplete={handlePersonaIntroComplete} />
    );
  }

  if (currentStep === 'interview' && progress) {
    return (
      <InterviewStep
        onComplete={handleInterviewComplete}
        initialData={progress.interview_responses as Partial<InterviewData>}
      />
    );
  }

  if (currentStep === 'posts' && progress) {
    return (
      <PostsStep
        onComplete={handlePostsComplete}
        initialPosts={progress.collected_posts}
      />
    );
  }

  if (currentStep === 'generating') {
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

  if (currentStep === 'confirmation') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4">
        <div className="w-full max-w-4xl mx-auto">
          {/* You'll need to fetch the actual persona here */}
          <PersonaConfirmation
            persona={{} as PersonaData}
            platformsConnected={[]}
            postsAnalyzed={0}
            onComplete={handleConfirmationComplete}
          />
        </div>
      </div>
    );
  }

  if (currentStep === 'flows-setup') {
    return (
      <FlowsSetupStep onComplete={handleFlowsSetupComplete} />
    );
  }

  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4">
        <div className="w-full max-w-4xl mx-auto flex flex-col justify-center min-h-screen">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <span className="text-5xl">🎉</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              You're All Set!
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-2">
              Your brand persona is ready and your first content flow is configured
            </p>
            <p className="text-gray-600">
              Your AI will start generating content based on your schedule
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Content Generator</h3>
              <p className="text-sm text-gray-600">
                Creates posts in your voice on your schedule
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
              <div className="text-3xl mb-3">✅</div>
              <h3 className="font-semibold text-gray-900 mb-2">Review & Approve</h3>
              <p className="text-sm text-gray-600">
                Check each post before it goes live
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">Track Performance</h3>
              <p className="text-sm text-gray-600">
                See how your AI-generated content performs
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Next Steps</h2>
            <ol className="space-y-3 text-blue-900">
              <li className="flex gap-3">
                <span className="font-bold">1.</span>
                <span>Your first batch of posts will be generated within 24 hours</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">2.</span>
                <span>You'll get a notification when they're ready for review</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">3.</span>
                <span>Review, customize, and approve them from your dashboard</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">4.</span>
                <span>Posts will automatically schedule and post on your timeline</span>
              </li>
            </ol>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/settings/persona')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Edit Persona
            </button>

            <button
              onClick={handleCompleteOnboarding}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
