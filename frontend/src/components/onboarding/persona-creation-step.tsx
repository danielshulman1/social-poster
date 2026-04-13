'use client';

import { ChevronDown, Lightbulb, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { WalkthroughHeader } from './walkthrough-header';

interface PersonaCreationStepProps {
  onComplete: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'What is a brand persona?',
    answer:
      'A brand persona is a detailed description of your unique voice, writing style, and values. It includes your tone, preferred topics, common phrases, and how you engage with your audience. We use this to generate authentic content that sounds like you.',
  },
  {
    question: 'How do we create my persona?',
    answer:
      'We analyze your answers to interview questions and your existing social media posts (if you connected accounts). Our AI identifies patterns in your writing, your favorite topics, your tone, and your engagement style, then creates a comprehensive persona guide.',
  },
  {
    question: 'Can I edit my persona later?',
    answer:
      'Yes! After onboarding, you can visit your settings and edit your brand persona at any time. You can update your voice, adjust topics, or refine any aspect of your persona.',
  },
  {
    question: 'Do I need to connect social media to create a persona?',
    answer:
      'No, it\'s optional. If you don\'t connect your accounts, we\'ll create your persona purely from your interview answers. However, analyzing your existing posts helps us understand your voice much better.',
  },
  {
    question: 'What happens after I create a persona?',
    answer:
      'After creating your persona, you\'ll set up your content flows. These are the schedules and topics for automatically generated posts. You\'ll see sample posts in your voice and can customize them before they go live.',
  },
  {
    question: 'Can I have multiple personas?',
    answer:
      'Currently, each account has one primary persona. However, you can update it to reflect different aspects of your brand or different content strategies.',
  },
];

export function PersonaCreationStep({ onComplete }: PersonaCreationStepProps) {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4">
      <div className="w-full max-w-4xl mx-auto">
        <WalkthroughHeader
          currentStep={2}
          totalSteps={4}
          stepName="Create Your Brand Persona"
          description="Answer a few questions about your business and voice to help us understand how to write like you"
        />

        {/* What We'll Do */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Here's What Happens Next</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Interview Questions</h3>
                <p className="text-gray-700">
                  You'll answer 12 questions about your business, brand personality, target audience, and
                  content goals. This takes about 5-10 minutes.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Post Collection</h3>
                <p className="text-gray-700">
                  If you connected social media, we'll analyze your posts. If not, you can manually upload
                  5-10 of your best posts.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">AI Analysis</h3>
                <p className="text-gray-700">
                  Our AI analyzes your answers and posts to extract your voice, style, and patterns. This
                  usually takes less than a minute.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Review & Confirm</h3>
                <p className="text-gray-700">
                  You'll see your complete brand persona with voice summary, writing style, content
                  pillars, and sample posts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interview Questions Preview */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sample Interview Questions</h2>
          <p className="text-gray-600 mb-6">
            Here are some of the questions you'll be asked during the interview:
          </p>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-600">
              <p className="text-gray-900 font-medium mb-2">
                "What does your business do and who does it serve?"
              </p>
              <p className="text-sm text-gray-600">
                Help us understand your core offering and target audience
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-600">
              <p className="text-gray-900 font-medium mb-2">
                "What is your brand personality?"
              </p>
              <p className="text-sm text-gray-600">
                Is your brand fun, professional, inspirational, educational, etc.?
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-600">
              <p className="text-gray-900 font-medium mb-2">
                "What tone do you want for your social media?"
              </p>
              <p className="text-sm text-gray-600">
                Formal, casual, conversational, or something else?
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-600">
              <p className="text-gray-900 font-medium mb-2">
                "What topics do you want to post about?"
              </p>
              <p className="text-sm text-gray-600">
                And are there any topics you want to avoid?
              </p>
            </div>

            <p className="text-center text-gray-600 text-sm mt-6">
              + 8 more questions covering achievements, phrases, ideal customers, platforms, and goals
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 mb-8">
          <div className="flex gap-3 mb-4">
            <Lightbulb className="w-6 h-6 text-green-700 flex-shrink-0 mt-0.5" />
            <h3 className="text-xl font-bold text-green-900">Tips for Best Results</h3>
          </div>

          <ul className="space-y-3 text-green-900">
            <li className="flex gap-3">
              <span className="font-bold">✓</span>
              <span>Be honest and specific in your answers. The better you describe yourself, the better
                the persona.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">✓</span>
              <span>If you have social media connected, make sure it has at least 5-10 recent posts for
                better analysis.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">✓</span>
              <span>Include specific examples, catchphrases, or phrases you use regularly.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">✓</span>
              <span>Think about how you want to sound compared to your competitors.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">✓</span>
              <span>You can update your persona anytime after onboarding if your brand evolves.</span>
            </li>
          </ul>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>

          <div className="space-y-3">
            {FAQS.map((item, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 text-left">{item.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ml-4 ${
                      expandedFAQ === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedFAQ === idx && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-700">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Expected Time */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-8">
          <div className="flex gap-3">
            <MessageSquare className="w-6 h-6 text-indigo-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-indigo-900 mb-2">⏱️ How long does this take?</h3>
              <p className="text-indigo-900">
                The entire persona creation process takes about <strong>10-15 minutes</strong>: Interview (5-10 min) + Post
                collection/upload (2-5 min) + AI analysis (1 min) + Review (1-2 min). You can complete it all in one
                session.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 justify-between pt-8 border-t border-gray-200">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            ← Back
          </button>

          <button
            onClick={onComplete}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Let's Get Started → Interview
          </button>
        </div>
      </div>
    </div>
  );
}
