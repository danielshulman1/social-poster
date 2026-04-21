'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import OnboardingProgress from '../../components/OnboardingProgress';
import PersonaInterview from '../../components/PersonaInterview';
import PostUploader from '../../components/PostUploader';
import PersonaPreview from '../../components/PersonaPreview';

export default function PersonaOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBuilding, setIsBuilding] = useState(false);

  const getAuthToken = () => localStorage.getItem('auth_token');

  useEffect(() => {
    checkAuthAndStatus();
  }, []);

  const checkAuthAndStatus = async () => {
    try {
      const token = getAuthToken();

      if (!token) {
        router.replace('/login');
        return;
      }

      // Check if user is authenticated
      const meRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!meRes.ok) {
        localStorage.removeItem('auth_token');
        router.replace('/login');
        return;
      }

      const userData = await meRes.json();
      setUser(userData.user);

      if (userData.user?.isAdmin || userData.user?.isSuperadmin) {
        router.replace('/dashboard');
        return;
      }

      // Check tier status
      const tierRes = await fetch('/api/auth/tier-check', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (tierRes.ok) {
        const tierData = await tierRes.json();

        // If onboarding is already complete, redirect to dashboard
        if (tierData.persona?.onboarding_complete) {
          router.replace('/dashboard');
          return;
        }

        // If setup fee is not paid, show message
        if (!tierData.setup_fee_paid) {
          setError('Setup fee required to complete onboarding');
          setLoading(false);
          return;
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Auth check error:', err);
      setError('Failed to load onboarding');
      setLoading(false);
    }
  };

  const handleInterviewComplete = () => {
    setCurrentStep(2);
  };

  const handlePostsComplete = () => {
    setCurrentStep(3);
    setIsBuilding(true);
  };

  const handleBuildingComplete = () => {
    setCurrentStep(4);
    setIsBuilding(false);
  };

  const handleRebuild = () => {
    setCurrentStep(3);
    setIsBuilding(true);
  };

  const handleOnboardingComplete = () => {
    setCurrentStep(5);
    // Redirect after success screen
    setTimeout(() => router.replace('/dashboard'), 2000);
  };

  if (loading) {
    return (
      <div className="app-page-shell bg-white dark:bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-black dark:text-white" />
          <p className="text-gray-600 dark:text-gray-400">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  if (error && error.includes('Setup fee')) {
    return (
      <div className="app-page-shell bg-white dark:bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="w-full max-w-2xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-accent mb-6">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-sora font-bold text-black dark:text-white mb-4">
            Setup Fee Required
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 font-inter mb-8">
            You need to complete your setup fee payment to unlock the persona builder.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold text-lg hover:scale-[0.98] transition-transform"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-page-shell bg-white dark:bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-2xl font-sora font-bold text-black dark:text-white mb-4">
            Something Went Wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page-shell bg-white dark:bg-[#0A0A0A] p-6">
      <div className="max-w-4xl mx-auto py-12">
        {/* Header - only show before step 5 */}
        {currentStep !== 5 && (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-sora font-bold text-black dark:text-white mb-3">
                {currentStep === 1 && 'Let\'s Build Your AI Persona'}
                {currentStep === 2 && 'Share Your Voice'}
                {currentStep === 3 && 'Creating Your Persona'}
                {currentStep === 4 && 'Review Your Persona'}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 font-inter">
                {currentStep === 1 && 'Answer a few questions about your brand and we\'ll create a personalized AI that matches your voice'}
                {currentStep === 2 && 'Upload some of your existing posts so we can analyze your unique style'}
                {currentStep === 3 && 'Our AI is analyzing your responses and posts...'}
                {currentStep === 4 && 'Here\'s your generated AI persona. Review it and confirm when ready.'}
              </p>
            </div>

            <OnboardingProgress currentStep={currentStep} totalSteps={5} />
          </>
        )}

        {/* Step Content */}
        {currentStep === 1 && (
          <PersonaInterview onComplete={handleInterviewComplete} getAuthToken={getAuthToken} />
        )}

        {currentStep === 2 && (
          <PostUploader onComplete={handlePostsComplete} getAuthToken={getAuthToken} />
        )}

        {currentStep === 3 && (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-black dark:text-white" />
            <p className="text-gray-600 dark:text-gray-400">Building your persona...</p>
          </div>
        )}

        {currentStep === 4 && (
          <PersonaPreview
            onComplete={handleOnboardingComplete}
            onRebuild={handleRebuild}
            getAuthToken={getAuthToken}
            isBuilding={isBuilding}
          />
        )}

        {/* Step 5: Success Screen */}
        {currentStep === 5 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-accent mb-6">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-sora font-bold text-black dark:text-white mb-3">
              🎉 Welcome!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-inter mb-8">
              Your AI persona is ready. Redirecting you to your dashboard...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
