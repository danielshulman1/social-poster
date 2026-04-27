'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import ConnectionServiceChips from '../../components/ConnectionServiceChips';
import { CONNECTABLE_SERVICE_COUNT, CONNECTABLE_SERVICE_SUMMARY, TIER_CONFIG } from '../../utils/tier-config';

export default function SignUpPage() {
    const router = useRouter();
    const [step, setStep] = useState('plan');
    const [selectedTier, setSelectedTier] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const tiers = ['starter', 'core', 'premium'];

    const handlePlanSelect = (tier) => {
        setSelectedTier(tier);
        setStep('details');
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!hasAcceptedTerms) {
            setError('You must agree to the terms before creating an account.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    firstName: name,
                    selectedTier,
                    acceptedTerms: hasAcceptedTerms,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('auth_token', data.token);
                try {
                    const checkoutRes = await fetch('/api/stripe/create-checkout', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${data.token}`,
                        },
                        body: JSON.stringify({ tier: selectedTier, flow: 'signup' }),
                    });

                    const checkoutData = await checkoutRes.json().catch(() => ({}));
                    if (checkoutRes.ok && checkoutData.url) {
                        window.location.assign(checkoutData.url);
                        return;
                    }

                    console.warn('[signup] Checkout not started:', checkoutData);
                } catch (checkoutErr) {
                    console.warn('[signup] Checkout error:', checkoutErr);
                }

                router.push('/account/pending');
            } else {
                setError(data.error || 'Sign up failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        }

        setLoading(false);
    };

    // Step 1: Plan Selection
    if (step === 'plan') {
        return (
            <div className="app-page-shell bg-[#050505] flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-5xl">
                    <div className="text-center mb-12">
                        <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Choose Your Plan</p>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Select a Tier to Get Started</h1>
                        <p className="text-white/70 max-w-2xl mx-auto">
                            Pick the plan that fits your needs. Connect to {CONNECTABLE_SERVICE_SUMMARY} and more.
                            You can always upgrade or downgrade later.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        {tiers.map((tier) => {
                            const config = TIER_CONFIG[tier];
                            if (!config) return null;

                            return (
                                <div
                                    key={tier}
                                    onClick={() => handlePlanSelect(tier)}
                                    className="bg-gradient-to-br from-[#1a0033] to-[#0f0f0f] border border-purple-500/30 rounded-2xl p-8 cursor-pointer hover:border-purple-500/60 hover:shadow-xl transition-all"
                                >
                                    <h3 className="text-2xl font-bold text-white mb-2 capitalize">{config.name}</h3>
                                    <p className="text-white/60 text-sm mb-6">{config.description}</p>

                                    <div className="mb-6">
                                        <p className="text-4xl font-bold text-white">£{(config.monthlyPrice / 100).toFixed(2)}</p>
                                        <p className="text-white/50 text-sm">per month</p>
                                    </div>

                                    <ul className="space-y-3 mb-6">
                                        <li className="flex gap-2 items-start text-white/80 text-sm">
                                            <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                            <div className="min-w-0">
                                                <span>Connect to {CONNECTABLE_SERVICE_SUMMARY}</span>
                                                <ConnectionServiceChips className="mt-3" label="All Supported Connections" />
                                            </div>
                                        </li>
                                        <li className="flex gap-2 items-center text-white/80 text-sm">
                                            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                                            {config.features.maxPlatforms} platform{config.features.maxPlatforms > 1 ? 's' : ''}
                                        </li>
                                        <li className="flex gap-2 items-center text-white/80 text-sm">
                                            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                                            {config.features.postsPerWeek} posts per week
                                        </li>
                                        <li className="flex gap-2 items-center text-white/80 text-sm">
                                            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                                            Voice training
                                        </li>
                                        <li className="flex gap-2 items-center text-white/80 text-sm">
                                            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                                            Onboarding
                                        </li>
                                        {config.features.checkInCallsPerMonth > 0 && (
                                            <li className="flex gap-2 items-center text-white/80 text-sm">
                                                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                                                {config.features.checkInCallsPerMonth} check-in call{config.features.checkInCallsPerMonth > 1 ? 's' : ''}/month
                                            </li>
                                        )}
                                    </ul>

                                    <button type="button" className="w-full bg-white text-black font-semibold py-2 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2">
                                        Choose {config.name}
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-center">
                        <p className="text-white/60 text-sm">
                            Already have an account? <Link href="/login" className="text-white hover:underline">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: Account Details
    return (
        <div className="app-page-shell bg-[#050505] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-[#111111] border border-white/5 rounded-2xl p-8 space-y-6">
                    <div className="text-center">
                        <p className="text-white/60 text-sm mb-2">Step 2 of 2</p>
                        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                        <div className="bg-purple-500/15 border border-purple-500/30 rounded-lg p-3 mt-4">
                            <p className="text-white/70 text-sm">You selected <span className="font-semibold text-purple-300 capitalize">{selectedTier}</span> plan</p>
                            <button
                                onClick={() => setStep('plan')}
                                className="text-purple-400 hover:text-purple-300 text-xs mt-1 underline"
                            >
                                Change plan
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-white/70 mb-1">Full Name (optional)</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full px-4 py-2 rounded-lg bg-[#0b0b0b] border border-white/10 text-white placeholder-white/30"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-white/70 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                                className="w-full px-4 py-2 rounded-lg bg-[#0b0b0b] border border-white/10 text-white placeholder-white/30"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-white/70 mb-1">Password (min 8 characters)</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                placeholder="••••••••"
                                className="w-full px-4 py-2 rounded-lg bg-[#0b0b0b] border border-white/10 text-white placeholder-white/30"
                            />
                        </div>

                        <label
                            htmlFor="accepted-terms"
                            className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-[#0b0b0b] p-3 text-sm leading-6 text-white/70"
                        >
                            <input
                                id="accepted-terms"
                                type="checkbox"
                                checked={hasAcceptedTerms}
                                onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                                required
                                className="mt-1 h-4 w-4 flex-shrink-0 rounded border-white/20 bg-[#050505] accent-white"
                            />
                            <span>
                                I agree to the{' '}
                                <Link href="/terms" className="font-semibold text-white hover:underline">
                                    Terms and Conditions
                                </Link>{' '}
                                and{' '}
                                <Link href="/privacy" className="font-semibold text-white hover:underline">
                                    Privacy Policy
                                </Link>
                                .
                            </span>
                        </label>

                        <button
                            type="submit"
                            disabled={loading || !hasAcceptedTerms}
                            className="w-full bg-white text-black font-semibold py-2 rounded-lg hover:bg-gray-200 transition disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="text-center">
                        <p className="text-white/60 text-sm">
                            Already have an account? <Link href="/login" className="text-white hover:underline">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
