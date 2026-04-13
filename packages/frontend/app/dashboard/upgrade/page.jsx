'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Loader2, Check } from 'lucide-react';
import UpgradePlanModal from '../../components/UpgradePlanModal';
import { TIER_CONFIG, getTierLimit } from '../../utils/tier-config';

export default function UpgradePage() {
  const [user, setUser] = useState(null);
  const [tier, setTier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState('starter');

  const getAuthToken = () => localStorage.getItem('auth_token');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
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
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  const tiers = ['starter', 'core', 'premium'];

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 mb-12">
        <p className="text-xs uppercase tracking-[0.18em] text-white/50">Plans & Pricing</p>
        <h1 className="text-4xl font-bold text-white">Choose Your Plan</h1>
        <p className="text-white/70 max-w-2xl mx-auto">
          Start with our Free tier and upgrade whenever you're ready. All paid plans include voice training and onboarding session.
        </p>
      </div>

      {/* Current Plan Badge */}
      {tier && (
        <div className="rounded-2xl bg-blue-500/15 border border-blue-500/30 p-6 text-center">
          <p className="text-white/70 text-sm mb-2">Currently on</p>
          <p className="text-2xl font-bold text-blue-300 capitalize">{tier.current_tier} Plan</p>
          {tier.current_tier !== 'free' && tier.next_billing_date && (
            <p className="text-sm text-white/60 mt-2">
              Next billing: {new Date(tier.next_billing_date).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Free Tier */}
        <div className="rounded-2xl bg-[#0f0f0f] border border-white/5 p-8 flex flex-col">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Free</h2>
            <p className="text-white/60 text-sm">Perfect for trying it out</p>
          </div>

          <div className="mb-8">
            <div className="text-4xl font-bold text-white">£0</div>
            <p className="text-white/50 text-sm mt-2">Forever free</p>
          </div>

          <ul className="space-y-3 mb-8 flex-grow">
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-white/80">1 platform</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-white/80">1 post per week</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 flex-shrink-0" />
              <span className="text-white/50">Voice training</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 flex-shrink-0" />
              <span className="text-white/50">Onboarding session</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 flex-shrink-0" />
              <span className="text-white/50">Check-in calls</span>
            </li>
          </ul>

          {tier?.current_tier === 'free' && (
            <button disabled className="w-full py-3 rounded-full bg-white/10 text-white font-semibold cursor-default opacity-60">
              Current Plan
            </button>
          )}
        </div>

        {/* Paid Tiers */}
        {tiers.map((tierName) => {
          const config = TIER_CONFIG[tierName];
          const isCurrentTier = tier?.current_tier === tierName;
          const isHigherTier = tierName === 'core' || tierName === 'premium';

          return (
            <div
              key={tierName}
              className={`rounded-2xl p-8 flex flex-col ${
                isHigherTier
                  ? 'bg-gradient-to-br from-[#1a0033] to-[#0f0f0f] border border-purple-500/30'
                  : 'bg-[#0f0f0f] border border-white/5'
              }`}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2 capitalize">{config.name}</h2>
                <p className="text-white/60 text-sm">{config.description}</p>
              </div>

              <div className="mb-8">
                <div className="text-4xl font-bold text-white">£{(config.monthlyPrice / 100).toFixed(2)}</div>
                <p className="text-white/50 text-sm mt-2">/month + £{(config.setupFee / 100).toFixed(2)} setup</p>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-white/80">{config.features.maxPlatforms} platforms</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-white/80">{config.features.postsPerWeek} posts per week</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-white/80">Voice training</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-white/80">Onboarding session</span>
                </li>
                {config.features.checkInCallsPerMonth && (
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-white/80">{config.features.checkInCallsPerMonth} check-in call{config.features.checkInCallsPerMonth !== 1 ? 's' : ''} per month</span>
                  </li>
                )}
                {config.features.strategyCalls && (
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-white/80">Monthly strategy call</span>
                  </li>
                )}
                {config.features.prioritySupport && (
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-white/80">Priority support</span>
                  </li>
                )}
              </ul>

              {isCurrentTier ? (
                <button disabled className="w-full py-3 rounded-full bg-white/10 text-white font-semibold cursor-default opacity-60">
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedTier(tierName);
                    setShowUpgradeModal(true);
                  }}
                  className={`w-full py-3 rounded-full font-semibold flex items-center justify-center gap-2 transition-all ${
                    isHigherTier
                      ? 'bg-gradient-to-b from-white to-[#dcdcdc] text-black hover:brightness-105'
                      : 'border border-white/20 text-white hover:bg-white/5'
                  }`}
                >
                  Upgrade Now
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Features Comparison */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white mb-6">Feature Comparison</h2>
        <div className="rounded-2xl border border-white/5 bg-[#0f0f0f] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-left text-white font-semibold">Feature</th>
                <th className="px-6 py-4 text-center text-white/70 text-sm">Free</th>
                <th className="px-6 py-4 text-center text-white/70 text-sm">Starter</th>
                <th className="px-6 py-4 text-center text-white/70 text-sm">Core</th>
                <th className="px-6 py-4 text-center text-white/70 text-sm">Premium</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="px-6 py-4 text-white">Platforms</td>
                <td className="px-6 py-4 text-center text-white/70">1</td>
                <td className="px-6 py-4 text-center text-white/70">3</td>
                <td className="px-6 py-4 text-center text-white/70">3</td>
                <td className="px-6 py-4 text-center text-white/70">5</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-6 py-4 text-white">Posts per week</td>
                <td className="px-6 py-4 text-center text-white/70">1</td>
                <td className="px-6 py-4 text-center text-white/70">3</td>
                <td className="px-6 py-4 text-center text-white/70">5</td>
                <td className="px-6 py-4 text-center text-white/70">7 (Daily)</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-6 py-4 text-white">Voice training</td>
                <td className="px-6 py-4 text-center text-white/70">—</td>
                <td className="px-6 py-4 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-6 py-4 text-white">Onboarding session</td>
                <td className="px-6 py-4 text-center text-white/70">—</td>
                <td className="px-6 py-4 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-6 py-4 text-white">Check-in calls</td>
                <td className="px-6 py-4 text-center text-white/70">—</td>
                <td className="px-6 py-4 text-center text-white/70">—</td>
                <td className="px-6 py-4 text-center text-white/70">1/month</td>
                <td className="px-6 py-4 text-center text-white/70">4/month</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-white">Priority support</td>
                <td className="px-6 py-4 text-center text-white/70">—</td>
                <td className="px-6 py-4 text-center text-white/70">—</td>
                <td className="px-6 py-4 text-center text-white/70">—</td>
                <td className="px-6 py-4 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-[#0f0f0f] border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Can I change plans?</h3>
            <p className="text-white/70 text-sm">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
          </div>
          <div className="rounded-2xl bg-[#0f0f0f] border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-2">What's the setup fee for?</h3>
            <p className="text-white/70 text-sm">The setup fee includes your onboarding session and voice training to analyze your tone and style.</p>
          </div>
          <div className="rounded-2xl bg-[#0f0f0f] border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Can I cancel anytime?</h3>
            <p className="text-white/70 text-sm">Yes, cancel your subscription at any time. You'll revert to the Free plan immediately.</p>
          </div>
          <div className="rounded-2xl bg-[#0f0f0f] border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Do you offer discounts?</h3>
            <p className="text-white/70 text-sm">Contact our team for annual plan discounts and custom enterprise solutions.</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-8">
        <p className="text-white/70 mb-4">Ready to upgrade?</p>
        <button
          onClick={() => {
            setSelectedTier('starter');
            setShowUpgradeModal(true);
          }}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-b from-white to-[#dcdcdc] text-black font-plus-jakarta font-semibold hover:brightness-105 transition-all"
        >
          Get Started
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <UpgradePlanModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={tier?.current_tier}
        getAuthToken={getAuthToken}
      />
    </div>
  );
}
