'use client';

import { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import ConnectionServiceChips from './ConnectionServiceChips';
import { CONNECTABLE_SERVICE_COUNT, CONNECTABLE_SERVICE_SUMMARY, TIER_CONFIG, formatPrice } from '../utils/tier-config';

export default function UpgradePlanModal({ isOpen, onClose, currentTier, getAuthToken }) {
  const [selectedTier, setSelectedTier] = useState('starter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tiers = ['starter', 'core', 'premium'];
  const tierConfigs = TIER_CONFIG;

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

              const isRecommended = tier === 'core';

              return (
                <div key={tier} className="relative">
                  {isRecommended && !isSelected && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="inline-block rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                        Recommended
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedTier(tier)}
                    disabled={isCurrent}
                    className={`h-full w-full flex flex-col text-left p-6 rounded-[1.6rem] border-2 transition-all ${
                      isSelected
                        ? isRecommended
                          ? 'border-blue-500/60 bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/20 dark:to-[#1E1E1E] shadow-[0_8px_30px_rgba(59,130,246,0.15)]'
                          : 'border-black dark:border-white bg-gray-50 dark:bg-gray-800 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.08)]'
                        : isCurrent
                        ? 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 cursor-not-allowed opacity-60'
                        : isRecommended
                        ? 'border-blue-200 dark:border-blue-800 bg-white dark:bg-[#1E1E1E] hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-[#1E1E1E]'
                    }`}
                  >
                    <div className="flex w-full items-start justify-between mb-4">
                      <h3 className="text-xl font-sora font-bold text-black dark:text-white capitalize">
                        {tier}
                      </h3>
                      {isSelected ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isRecommended ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-black text-white dark:bg-white dark:text-black'}`}>
                          Selected
                        </span>
                      ) : isCurrent ? (
                        <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold">
                          Current
                        </span>
                      ) : isRecommended ? (
                        <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                          Recommended
                        </span>
                      ) : null}
                    </div>

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
                  <div className="space-y-4">
                    <div className="flex gap-3 items-start">
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isRecommended ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                        <Check className="h-3 w-3" />
                      </span>
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Connect to {CONNECTABLE_SERVICE_SUMMARY}
                        </span>
                        <ConnectionServiceChips
                          className="mt-3"
                          label="All Available Connections"
                          labelClassName="text-gray-500 dark:text-gray-400"
                          chipClassName="border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isRecommended ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {config.features.maxPlatforms} platform{config.features.maxPlatforms !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex gap-3 items-start">
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isRecommended ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {config.features.postsPerWeek} posts/week
                      </span>
                    </div>

                    {config.features.voiceTraining && (
                      <div className="flex gap-3 items-start">
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isRecommended ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                          <Check className="h-3 w-3" />
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Voice training
                        </span>
                      </div>
                    )}

                    {config.features.prioritySupport && (
                      <div className="flex gap-3 items-start">
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isRecommended ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                          <Check className="h-3 w-3" />
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Priority support
                        </span>
                      </div>
                    )}

                    {config.features.checkInCallsPerMonth > 0 && (
                      <div className="flex gap-3 items-start">
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isRecommended ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                          <Check className="h-3 w-3" />
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {config.features.checkInCallsPerMonth} check-in call{config.features.checkInCallsPerMonth !== 1 ? 's' : ''}/month
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              </div>
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
              className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : selectedTier === currentTier ? (
                'Current Plan Selected'
              ) : (
                'Upgrade Now'
              )}
            </button>
          </div>
          <div className="text-center mt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
               Secure payment encrypted and processed by Stripe. You can cancel at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
