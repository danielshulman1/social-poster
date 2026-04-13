'use client';

import { useState, useEffect } from 'react';
import { Zap, ArrowRight, Loader2 } from 'lucide-react';
import UpgradePlanModal from './UpgradePlanModal';
import { getTierConfig, formatPrice, getTierLimit } from '../utils/tier-config';

export default function TierStatusCard() {
  const [user, setUser] = useState(null);
  const [tier, setTier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const getAuthToken = () => localStorage.getItem('auth_token');

  useEffect(() => {
    loadTierInfo();
  }, []);

  const loadTierInfo = async () => {
    try {
      const token = getAuthToken();

      // Get user info
      const meRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      }

      // Get tier info
      const tierRes = await fetch('/api/auth/tier-check', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (tierRes.ok) {
        const tierData = await tierRes.json();
        setTier(tierData);
      }
    } catch (error) {
      console.error('Failed to load tier info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-[#0f0f0f] border border-white/5 p-8 flex items-center justify-center min-h-32">
        <Loader2 className="w-6 h-6 animate-spin text-white/50" />
      </div>
    );
  }

  if (!tier) {
    return null;
  }

  const tierConfig = getTierConfig(tier.current_tier);
  const isFreeTier = tier.current_tier === 'free';

  return (
    <>
      <div className="rounded-2xl bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/10 p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/50 mb-2">Current Plan</p>
            <h2 className="text-2xl font-sora font-bold text-white capitalize">
              {tier.current_tier} Tier
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white">{tier.subscription_status}</span>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-8 pb-8 border-b border-white/5">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-white">
              £{(tierConfig.monthlyPrice / 100).toFixed(2)}
            </span>
            <span className="text-white/50">/month</span>
          </div>

          {tierConfig.setupFee > 0 && (
            <p className="text-sm text-white/60">
              + £{(tierConfig.setupFee / 100).toFixed(2)} setup fee (one-time)
            </p>
          )}

          {tier.next_billing_date && (
            <p className="text-sm text-white/60 mt-3">
              Next billing: {new Date(tier.next_billing_date).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-gradient-accent" />
            <span className="text-white/80">
              {tierConfig.features.maxPlatforms} platform{tierConfig.features.maxPlatforms !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-gradient-accent" />
            <span className="text-white/80">
              {tierConfig.features.postsPerWeek} posts per week
            </span>
          </div>

          {tierConfig.features.voiceTraining && (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-accent" />
              <span className="text-white/80">Voice training included</span>
            </div>
          )}

          {tierConfig.features.prioritySupport && (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-accent" />
              <span className="text-white/80">Priority support</span>
            </div>
          )}

          {tierConfig.features.checkInCallsPerMonth && (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-accent" />
              <span className="text-white/80">
                {tierConfig.features.checkInCallsPerMonth} check-in call{tierConfig.features.checkInCallsPerMonth !== 1 ? 's' : ''} per month
              </span>
            </div>
          )}

          {tierConfig.features.strategyCalls && (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-accent" />
              <span className="text-white/80">Strategy calls included</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isFreeTier ? (
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="w-full px-6 py-3 rounded-full bg-gradient-accent text-white font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            Upgrade Plan
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full px-6 py-3 rounded-full border border-white/20 text-white font-plus-jakarta font-semibold hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              Change Plan
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-xs text-white/50 text-center">
              Already subscribed • {tier.subscription_status} • {new Date(tier.subscription_start_date).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      <UpgradePlanModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={tier.current_tier}
        getAuthToken={getAuthToken}
      />
    </>
  );
}
