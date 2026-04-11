'use client';

import { useState, useEffect } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';

export default function PersonaPreview({ onComplete, onRebuild, getAuthToken, isBuilding = false }) {
  const [persona, setPersona] = useState(null);
  const [loading, setLoading] = useState(isBuilding);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isBuilding) {
      buildPersona();
    }
  }, [isBuilding]);

  const buildPersona = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const res = await fetch('/api/onboarding/persona/build', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to build persona');
      }

      const data = await res.json();
      setPersona(data.persona);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const token = getAuthToken();
      const res = await fetch('/api/onboarding/persona/save', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ persona }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save persona');
      }

      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-black dark:text-white" />
          <h2 className="text-2xl font-sora font-bold text-black dark:text-white mb-2">
            Building Your Persona
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Analyzing your answers and posts with AI...
          </p>
        </div>
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-sora font-bold text-black dark:text-white mb-3">
          No Persona Data
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Something went wrong. Please try again.
        </p>
        <button
          onClick={onRebuild}
          className="px-8 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h1 className="text-4xl font-sora font-bold text-black dark:text-white text-center mb-12">
        Your AI Persona
      </h1>

      {/* Brand Voice */}
      {persona.brandVoice && (
        <section className="mb-10">
          <h2 className="text-2xl font-sora font-bold text-black dark:text-white mb-4">
            Brand Voice
          </h2>
          <div className="bg-gray-100 dark:bg-[#1E1E1E] rounded-2xl p-6">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {persona.brandVoice.summary || 'Your unique brand voice profile'}
            </p>
          </div>
        </section>
      )}

      {/* Writing Style */}
      {persona.writingStyle && (
        <section className="mb-10">
          <h2 className="text-2xl font-sora font-bold text-black dark:text-white mb-4">
            Writing Style
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-100 dark:bg-[#1E1E1E] rounded-2xl p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Post Length</p>
              <p className="text-lg font-semibold text-black dark:text-white">
                {persona.writingStyle.postLength || 'Medium'}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-[#1E1E1E] rounded-2xl p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Emojis</p>
              <p className="text-lg font-semibold text-black dark:text-white">
                {persona.writingStyle.useEmojis ? 'Frequently used' : 'Rarely used'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Content Pillars */}
      {persona.contentPillars && persona.contentPillars.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-sora font-bold text-black dark:text-white mb-4">
            Content Pillars
          </h2>
          <div className="space-y-2">
            {persona.contentPillars.map((pillar, idx) => (
              <div key={idx} className="bg-gray-100 dark:bg-[#1E1E1E] rounded-xl p-4">
                <p className="text-gray-700 dark:text-gray-300">{pillar}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sample Posts */}
      {persona.platformGuides && Object.keys(persona.platformGuides).length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-sora font-bold text-black dark:text-white mb-4">
            Sample Posts
          </h2>
          <div className="space-y-6">
            {Object.entries(persona.platformGuides).map(([platform, guide]) => (
              <div key={platform} className="border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-3 capitalize">
                  {platform}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic">
                  "{guide.samplePost || 'Sample post coming...'}"
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 pt-8">
        <button
          onClick={onRebuild}
          className="flex-1 px-8 py-4 rounded-full bg-gray-100 dark:bg-gray-800 text-black dark:text-white font-plus-jakarta font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
        >
          Rebuild
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-8 py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Complete Onboarding
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
