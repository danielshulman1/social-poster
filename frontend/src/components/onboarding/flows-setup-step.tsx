'use client';

import { ChevronRight, Clock, Target, Zap } from 'lucide-react';
import { useState } from 'react';
import { WalkthroughHeader } from './walkthrough-header';

interface FlowsSetupStepProps {
  onComplete: () => void;
}

interface FlowExample {
  title: string;
  description: string;
  frequency: string;
  platforms: string[];
  icon: string;
}

const FLOW_EXAMPLES: FlowExample[] = [
  {
    title: 'Daily Posts',
    description: 'Generate and post one new piece of content each day across your platforms',
    frequency: 'Every day at a time you choose',
    platforms: ['Facebook', 'Instagram', 'LinkedIn'],
    icon: '📅',
  },
  {
    title: 'Weekly Newsletter',
    description: 'Create a weekly roundup of your best insights and news from your industry',
    frequency: 'Every Monday at 9 AM',
    platforms: ['LinkedIn', 'Email'],
    icon: '📰',
  },
  {
    title: 'Thought Leadership',
    description: 'Post in-depth articles and professional insights on LinkedIn',
    frequency: 'Every Wednesday & Friday',
    platforms: ['LinkedIn'],
    icon: '💡',
  },
  {
    title: 'Engagement Posts',
    description: 'Short, conversational posts designed to spark discussion with your audience',
    frequency: 'Every 2-3 days',
    platforms: ['Facebook', 'Instagram'],
    icon: '💬',
  },
];

const PERSONALIZATION_OPTIONS = [
  {
    title: 'Content Topics',
    description: 'Choose which topics your flows should focus on (industry updates, tips, stories, promotions, etc.)',
  },
  {
    title: 'Posting Frequency',
    description: 'Decide how often you want content: daily, weekly, custom schedule, or on-demand',
  },
  {
    title: 'Platform Selection',
    description: 'Choose where each flow posts: Facebook, Instagram, LinkedIn, Twitter, or multiple platforms',
  },
  {
    title: 'Tone & Style',
    description: 'Make sure the generated content matches your brand voice and personality',
  },
  {
    title: 'Call-to-Action',
    description: 'Add consistent CTAs like "Visit our blog", "Book a demo", or questions to engage followers',
  },
  {
    title: 'Approval Process',
    description: 'Set whether posts go live automatically or require your approval first',
  },
];

export function FlowsSetupStep({ onComplete }: FlowsSetupStepProps) {
  const [expandedFlow, setExpandedFlow] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4 sm:p-6">
      <div className="w-full max-w-4xl mx-auto">
        <WalkthroughHeader
          currentStep={3}
          totalSteps={4}
          stepName="Set Up Your Content Flows"
          description="Create automated content schedules that will generate posts in your voice at the frequency you choose"
        />

        {/* What are flows? */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 sm:p-8 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">What Are Content Flows?</h2>
          <p className="text-gray-700 mb-4 sm:mb-6 text-xs sm:text-base">
            Flows are automated content pipelines that generate and post content on your schedule. Each flow
            has its own topic focus, posting schedule, and platforms. For example, you could have a "Daily
            Tips" flow that posts every morning, and a "Weekly Roundup" flow that posts every Monday.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-purple-200">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mb-2 sm:mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Scheduled</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Set frequency: daily, weekly, or custom schedule
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-purple-200">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mb-2 sm:mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Automated</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                AI generates content in your voice automatically
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-purple-200">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mb-2 sm:mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Customizable</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Full control over topics, tone, and platforms
              </p>
            </div>
          </div>
        </div>

        {/* Flow Examples */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-8 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Example Flows</h2>
          <p className="text-gray-600 mb-4 sm:mb-6 text-xs sm:text-base">
            Here are some common flow setups you can create. You'll start with one simple flow and can add
            more later.
          </p>

          <div className="space-y-3 sm:space-y-4">
            {FLOW_EXAMPLES.map((flow, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-3 sm:p-6 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setExpandedFlow(expandedFlow === idx ? null : idx)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <span className="text-xl sm:text-2xl flex-shrink-0">{flow.icon}</span>
                      <h3 className="text-sm sm:text-lg font-semibold text-gray-900">{flow.title}</h3>
                    </div>
                    <p className="text-gray-700 mb-2 sm:mb-3 text-xs sm:text-base">{flow.description}</p>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="line-clamp-1">{flow.frequency}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="font-semibold flex-shrink-0">Platforms:</span>
                        <span className="line-clamp-1">{flow.platforms.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-400 transition-transform flex-shrink-0 mt-0.5 ${
                      expandedFlow === idx ? 'rotate-90' : ''
                    }`}
                  />
                </div>

                {expandedFlow === idx && (
                  <div className="mt-3 sm:mt-6 pt-3 sm:pt-6 border-t border-gray-200">
                    <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                      <p className="text-xs sm:text-sm text-blue-900">
                        <strong>How it works:</strong> Every {flow.frequency.toLowerCase()}, our AI analyzes
                        trending topics and your brand expertise, then generates a new post in your voice. You
                        can preview and approve before it posts, or set it to auto-publish if you trust your
                        persona.
                      </p>
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">What you'd set up:</h4>
                    <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                      <li className="flex gap-2">
                        <span className="text-blue-600">•</span>
                        <span>
                          <strong>Name:</strong> Meaningful name for this flow
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-blue-600">•</span>
                        <span>
                          <strong>Frequency:</strong> When posts should be generated
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-blue-600">•</span>
                        <span>
                          <strong>Topics:</strong> What to write about
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-blue-600">•</span>
                        <span>
                          <strong>Platforms:</strong> Where to post
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-blue-600">•</span>
                        <span>
                          <strong>Approval:</strong> Auto-publish or require review
                        </span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Customization */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-8 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">How to Customize Your Flows</h2>
          <p className="text-gray-600 mb-4 sm:mb-6 text-xs sm:text-base">
            Every flow you create is fully customizable. You'll set these options for each flow:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {PERSONALIZATION_OPTIONS.map((option, idx) => (
              <div key={idx} className="flex gap-3 sm:gap-4">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{option.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* First Flow */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-8 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-green-900 mb-3 sm:mb-4">Your First Flow</h2>
          <p className="text-green-900 mb-4 sm:mb-6 text-xs sm:text-base">
            After onboarding, we'll help you create your first flow. You'll start with something simple
            like:
          </p>

          <div className="bg-white rounded-lg p-3 sm:p-6 border border-green-200 mb-4 sm:mb-6">
            <div className="space-y-2 sm:space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-600">Name</p>
                <p className="text-gray-900">Daily Social Post</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Frequency</p>
                <p className="text-gray-900">Every day at 9:00 AM</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Topics</p>
                <p className="text-gray-900">Industry news, tips, customer stories</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Platforms</p>
                <p className="text-gray-900">Facebook, Instagram, LinkedIn</p>
              </div>
            </div>
          </div>

          <p className="text-green-900">
            Once you're comfortable, you can add more flows for different content types and schedules!
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-8 mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-bold text-blue-900 mb-3 sm:mb-4">Benefits of Using Flows</h3>
          <ul className="space-y-2 sm:space-y-3 text-blue-900 text-xs sm:text-base">
            <li className="flex gap-3">
              <span className="font-bold text-lg">✓</span>
              <span>
                <strong>Consistency:</strong> Regular posting schedule keeps your audience engaged
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-lg">✓</span>
              <span>
                <strong>Time-saving:</strong> No more manual writing - AI generates content while you
                focus on your business
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-lg">✓</span>
              <span>
                <strong>Authentic voice:</strong> All content sounds like you, maintaining your brand
                consistency
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-lg">✓</span>
              <span>
                <strong>Flexibility:</strong> Pause, edit, or adjust flows anytime as your business
                changes
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-lg">✓</span>
              <span>
                <strong>Multi-platform:</strong> One flow can post to multiple platforms simultaneously
              </span>
            </li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between pt-6 sm:pt-8 border-t border-gray-200">
          <button
            onClick={() => window.history.back()}
            className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            ← Back
          </button>

          <button
            onClick={onComplete}
            className="px-4 sm:px-8 py-2 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            Ready → Complete Onboarding
          </button>
        </div>
      </div>
    </div>
  );
}
