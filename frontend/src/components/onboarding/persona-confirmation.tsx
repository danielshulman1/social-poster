'use client';

import { PersonaData } from '@/lib/supabase';
import { Copy, Check, Download } from 'lucide-react';
import { useState } from 'react';

interface PersonaConfirmationProps {
  persona: PersonaData;
  platformsConnected: string[];
  postsAnalyzed: number;
  onComplete: () => void;
}

export function PersonaConfirmation({
  persona,
  platformsConnected,
  postsAnalyzed,
  onComplete,
}: PersonaConfirmationProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyPost = (index: number) => {
    const platforms = Object.keys(persona.samplePosts);
    const platform = platforms[index];
    const post = persona.samplePosts[platform];

    navigator.clipboard.writeText(post);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadPersona = () => {
    const personaJSON = JSON.stringify(persona, null, 2);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(personaJSON));
    element.setAttribute('download', 'brand-persona.json');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4 sm:p-6">
      <div className="w-full max-w-4xl mx-auto">
        {/* Success header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full mb-3 sm:mb-4">
            <Check className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">Your Persona is Ready!</h1>
          <p className="text-base sm:text-xl text-gray-600">
            Your AI-powered brand persona has been created and saved.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-12">
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
            <p className="text-gray-600 text-xs sm:text-sm">Posts Analyzed</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{postsAnalyzed}</p>
          </div>
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
            <p className="text-gray-600 text-xs sm:text-sm">Platforms Connected</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{platformsConnected.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
            <p className="text-gray-600 text-xs sm:text-sm">Content Pillars</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{persona.contentPillars.length}</p>
          </div>
        </div>

        {/* Persona Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-8 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Your Brand Voice</h2>

          <div className="space-y-6 sm:space-y-8">
            {/* Brand Voice Summary */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Brand Voice Summary</h3>
              <p className="text-gray-700 leading-relaxed">{persona.brandVoiceSummary}</p>
            </section>

            {/* Writing Style */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Writing Style</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Post Length</p>
                  <p className="text-gray-900">{persona.writingStyle.postLength}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Emoji Usage</p>
                  <p className="text-gray-900">{persona.writingStyle.emojiUsage}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Punctuation Habits</p>
                  <p className="text-gray-900">{persona.writingStyle.punctuationHabits}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Paragraph Structure</p>
                  <p className="text-gray-900">{persona.writingStyle.paragraphStructure}</p>
                </div>
              </div>
            </section>

            {/* Content Pillars */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Content Pillars</h3>
              <div className="space-y-2">
                {persona.contentPillars.map((pillar, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="inline-block w-6 h-6 bg-blue-600 text-white rounded-full text-sm flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-gray-700">{pillar}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Power Words */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Power Words & Phrases</h3>
              <div className="flex flex-wrap gap-2">
                {persona.powerWordsAndPhrases.slice(0, 10).map((phrase, idx) => (
                  <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {phrase}
                  </span>
                ))}
              </div>
            </section>

            {/* Words to Avoid */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Words to Avoid</h3>
              <div className="flex flex-wrap gap-2">
                {persona.wordsToAvoid.slice(0, 10).map((word, idx) => (
                  <span key={idx} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                    {word}
                  </span>
                ))}
              </div>
            </section>

            {/* Engagement Style */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Engagement Style</h3>
              <p className="text-gray-700">{persona.engagementStyle}</p>
            </section>
          </div>
        </div>

        {/* Sample Posts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-8 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Sample Posts in Your Voice</h2>

          <div className="space-y-4 sm:space-y-6">
            {Object.entries(persona.samplePosts).map(([platform, post], idx) => (
              <div key={platform} className="border border-gray-200 rounded-lg p-3 sm:p-6">
                <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 capitalize">
                    {platform} Post
                  </h4>
                  <button
                    onClick={() => handleCopyPost(idx)}
                    className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors whitespace-nowrap"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Copied!</span>
                        <span className="sm:hidden">OK</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Copy</span>
                        <span className="sm:hidden">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap text-xs sm:text-base">{post}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2 sm:mb-3">What Happens Next?</h3>
          <ul className="space-y-1 sm:space-y-2 text-blue-900 text-xs sm:text-base">
            <li className="flex gap-3">
              <span className="font-semibold">1.</span>
              <span>Your brand persona has been saved to your account</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold">2.</span>
              <span>We'll use this persona to generate social media posts in your voice</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold">3.</span>
              <span>Your first set of posts will be ready within 24 hours</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold">4.</span>
              <span>You can update your persona anytime from your settings</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <button
            onClick={handleDownloadPersona}
            className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-xs sm:text-base"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
            Download Persona
          </button>

          <button
            onClick={onComplete}
            className="px-4 sm:px-8 py-2 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-xs sm:text-base"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
