'use client';

import { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { getTierConfig, formatPrice } from '../utils/tier-config';

export default function UpgradePlanModal({ isOpen, onClose, currentTier, getAuthToken }) {
  const [selectedTier, setSelectedTier] = useState('starter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tiers = ['starter', 'core', 'premium'];
  const tierConfigs = getTierConfig();

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tier: selectedTier }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create checkout');
      }

      const data = await res.json();

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-sora font-bold text-black dark:text-white">
            Upgrade Your Plan
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {tiers.map((tier) => {
              const config = tierConfigs[tier];
              const isSelected = selectedTier === tier;
              const isCurrent = tier === currentTier;

              return (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  disabled={isCurrent}
                  className={`text-left p-6 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? 'border-black dark:border-white bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900'
                      : isCurrent
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed opacity-60'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                  }`}
                >
                  {/* Current badge */}
                  {isCurrent && (
                    <span className="inline-block px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold mb-3">
                      Current Plan
                    </span>
                  )}

                  <h3 className="text-xl font-sora font-bold text-black dark:text-white capitalize mb-2">
                    {tier}
                  </h3>

                  <div className="mb-6">
                    <span className="text-3xl font-bold text-black dark:text-white">
                      {formatPrice(config.monthlyPrice)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">/month</span>

                    {config.setupFee > 0 && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        + {formatPrice(config.setupFee)} setup fee
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <div className="flex gap-2 items-start">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {config.maxPlatforms} platform{config.maxPlatforms !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex gap-2 items-start">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {config.postsPerWeek} posts/week
                      </span>
                    </div>

                    {config.voiceTraining && (
                      <div className="flex gap-2 items-start">
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Voice training
                        </span>
                      </div>
                    )}

                    {config.prioritySupport && (
                      <div className="flex gap-2 items-start">
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Priority support
                        </span>
                      </div>
                    )}

                    {config.checkInCalls > 0 && (
                      <div className="flex gap-2 items-start">
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {config.checkInCalls} check-in call{config.checkInCalls !== 1 ? 's' : ''}/month
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-full bg-gray-100 dark:bg-gray-800 text-black dark:text-white font-plus-jakarta font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>

            <button
              onClick={handleUpgrade}
              disabled={loading || selectedTier === currentTier}
              className="flex-1 px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : selectedTier === currentTier ? (
                'Current Plan'
              ) : (
                'Upgrade Now'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
