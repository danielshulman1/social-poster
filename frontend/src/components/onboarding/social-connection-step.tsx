'use client';

import { useState } from 'react';
import { CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import { WalkthroughHeader } from './walkthrough-header';

interface SocialConnectionStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface Platform {
  id: 'facebook' | 'instagram' | 'linkedin';
  name: string;
  icon: string;
  description: string;
  connected: boolean;
}

export function SocialConnectionStep({ onComplete, onSkip }: SocialConnectionStepProps) {
  const [platforms, setPlatforms] = useState<Platform[]>([
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '📘',
      description: 'Connect your Facebook business page to import posts and insights',
      connected: false,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📷',
      description: 'Import your Instagram posts and understand your audience',
      connected: false,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      description: 'Connect your LinkedIn profile for professional content analysis',
      connected: false,
    },
  ]);

  const [connecting, setConnecting] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'facebook' | 'instagram' | 'linkedin' | null>(null);

  const handleConnect = async (platformId: 'facebook' | 'instagram' | 'linkedin') => {
    setConnecting(platformId);
    try {
      const response = await fetch('/api/oauth/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId }),
      });

      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      console.error(`Failed to connect ${platformId}:`, error);
      setConnecting(null);
    }
  };

  const handlePlatformClick = (platformId: 'facebook' | 'instagram' | 'linkedin') => {
    setSelectedPlatform(platformId);
    setShowInstructions(true);
  };

  const getInstructions = () => {
    switch (selectedPlatform) {
      case 'facebook':
        return {
          title: 'How to Connect Facebook',
          steps: [
            'Click "Connect Facebook" button below',
            'You\'ll be redirected to Facebook\'s login page',
            'Log in with your Facebook account (if not already logged in)',
            'Click "Continue" when prompted to give our app access',
            'Select the Facebook page(s) you want to connect',
            'Click "Done" and you\'ll be redirected back',
          ],
          tips: [
            'Make sure you have admin access to the Facebook page',
            'Use a page with at least 5-10 recent posts for better analysis',
            'You can connect multiple pages if you manage several',
          ],
        };
      case 'instagram':
        return {
          title: 'How to Connect Instagram',
          steps: [
            'Click "Connect Instagram" button below',
            'Log in to your Instagram business account (if prompted)',
            'Review the requested permissions',
            'Click "Allow" to grant access to your posts and insights',
            'You\'ll be redirected back automatically',
          ],
          tips: [
            'Instagram requires a Business or Creator account',
            'If you have a regular account, you can convert it in Instagram settings',
            'Your connected account must have at least 5 posts for analysis',
          ],
        };
      case 'linkedin':
        return {
          title: 'How to Connect LinkedIn',
          steps: [
            'Click "Connect LinkedIn" button below',
            'Sign in to your LinkedIn account (if prompted)',
            'Review the requested permissions',
            'Click "Allow" to authorize the connection',
            'You\'ll be automatically redirected back',
          ],
          tips: [
            'Make sure your profile is public or visible to apps',
            'Include posts from your recent activity for best results',
            'You need at least 5 posts for persona analysis',
          ],
        };
      default:
        return { title: '', steps: [], tips: [] };
    }
  };

  const instructions = getInstructions();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4">
      <div className="w-full max-w-4xl mx-auto">
        <WalkthroughHeader
          currentStep={1}
          totalSteps={4}
          stepName="Connect Your Social Media"
          description="Let's import your existing posts so we can understand your unique voice and writing style"
        />

        {/* Instructions Modal */}
        {showInstructions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">
                    {platforms.find((p) => p.id === selectedPlatform)?.icon}
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {instructions.title}
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* Steps */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Steps to Connect:</h3>
                    <ol className="space-y-3">
                      {instructions.steps.map((step, idx) => (
                        <li key={idx} className="flex gap-4">
                          <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold">
                            {idx + 1}
                          </span>
                          <span className="text-gray-700 pt-1">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Tips */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      Tips & Requirements
                    </h3>
                    <ul className="space-y-2">
                      {instructions.tips.map((tip, idx) => (
                        <li key={idx} className="flex gap-3 text-gray-700">
                          <span className="text-blue-600 font-semibold">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowInstructions(false);
                        setSelectedPlatform(null);
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        setShowInstructions(false);
                        if (selectedPlatform) {
                          handleConnect(selectedPlatform);
                        }
                      }}
                      disabled={connecting === selectedPlatform}
                      className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {connecting === selectedPlatform && (
                        <Loader className="w-4 h-4 animate-spin" />
                      )}
                      Connect Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Left: Platform cards */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Choose platforms to connect
            </h2>

            {platforms.map((platform) => (
              <div
                key={platform.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handlePlatformClick(platform.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{platform.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                      <p className="text-sm text-gray-600">{platform.description}</p>
                    </div>
                  </div>
                  {platform.connected && (
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlatformClick(platform.id);
                  }}
                  disabled={connecting === platform.id}
                  className="w-full mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {connecting === platform.id && (
                    <Loader className="w-4 h-4 animate-spin" />
                  )}
                  {platform.connected ? 'Connected ✓' : 'View Instructions'}
                </button>
              </div>
            ))}
          </div>

          {/* Right: Info box */}
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Why Connect Social Media?</h3>
              <ul className="space-y-2 text-blue-900 text-sm">
                <li className="flex gap-3">
                  <span className="font-bold">✓</span>
                  <span>Analyze your existing posts to understand your voice</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">✓</span>
                  <span>Extract writing patterns and preferred topics</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">✓</span>
                  <span>Create a brand persona that matches your style</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">✓</span>
                  <span>Generate posts that sound authentically like you</span>
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="font-semibold text-amber-900 mb-3">Don't worry!</h3>
              <p className="text-amber-900 text-sm">
                You can skip this step and manually upload posts instead. However, connecting your
                accounts helps us understand your voice better and creates more accurate content.
              </p>
            </div>

            <div className="bg-gray-100 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">📱 Quick Checklist</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span>☐</span>
                  <span>Have admin access to your social accounts</span>
                </li>
                <li className="flex gap-2">
                  <span>☐</span>
                  <span>At least 5-10 recent posts to analyze</span>
                </li>
                <li className="flex gap-2">
                  <span>☐</span>
                  <span>Business or Creator account for Instagram</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-4 justify-between pt-8 border-t border-gray-200">
          <button
            onClick={onSkip}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Skip This Step
          </button>

          <button
            onClick={onComplete}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            I'll Connect Later → Next Step
          </button>
        </div>
      </div>
    </div>
  );
}
