'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { TIER_CONFIG } from '../utils/tier-config';

const PLANS = ['starter', 'core', 'premium'];

export default function SignUpPage() {
    const router = useRouter();
    const [step, setStep] = useState('plan'); // 'plan' or 'details'
    const [selectedTier, setSelectedTier] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePlanSelect = (tier) => {
        setSelectedTier(tier);
        setStep('details');
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
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
                }),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('auth_token', data.token);
                router.push('/account/pending');
            } else {
                setError(data.error || 'Sign up failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        }

        setLoading(false);
    };

    if (step === 'plan') {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 sm:px-6 py-12">
                <div className="w-full max-w-6xl">
                    <div className="text-center space-y-4 mb-12">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/60">Get Started</p>
                        <h1 className="text-3xl sm:text-5xl font-bold text-white">Choose Your Plan</h1>
                        <p className="text-white/70 max-w-2xl mx-auto">
                            Select the plan that works best for you. You can upgrade or downgrade anytime.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {PLANS.map((tier) => {
                            const config = TIER_CONFIG[tier];
                            return (
                                <div
                                    key={tier}
                                    onClick={() => handlePlanSelect(tier)}
                                    className="rounded-2xl bg-gradient-to-br from-[#1a0033] to-[#0f0f0f] border border-purple-500/30 p-8 flex flex-col cursor-pointer hover:border-purple-500/60 transition-all hover:shadow-[0_20px_60px_rgba(168,85,247,0.15)]"
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
                                    </ul>

                                    <button
                                        type="button"
                                        className="w-full py-3 rounded-full bg-gradient-to-b from-white to-[#dcdcdc] text-black font-semibold hover:brightness-105 transition-all flex items-center justify-center gap-2"
                                    >
                                        Choose {config.name}
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-center pt-12">
                        <p className="text-white/60 text-sm">
                            Already have an account?{' '}
                            <Link href="/login" className="text-white hover:underline font-semibold">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 sm:px-6 py-12">
            <div className="w-full max-w-xl relative">
                <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/8 via-transparent to-transparent blur-3xl"
                />
                <div className="relative bg-[#111111] border border-white/5 rounded-[28px] shadow-[0_20px_80px_rgba(0,0,0,0.55)] px-6 sm:px-10 py-8 sm:py-12 space-y-8">
                    {/* Title */}
                    <div className="text-center space-y-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/60">Step 2 of 2</p>
                        <h1 className="text-2xl sm:text-4xl font-bold text-white break-words">Create Account</h1>
                    </div>

                    {/* Selected Plan Badge */}
                    <div className="rounded-xl bg-purple-500/15 border border-purple-500/30 p-4 flex items-center justify-between">
                        <div>
                            <p className="text-white/70 text-sm">Selected Plan</p>
                            <p className="text-purple-300 font-semibold capitalize">{selectedTier} Plan</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setStep('plan');
                                setError('');
                            }}
                            className="text-white/50 hover:text-white text-sm underline"
                        >
                            Change
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <label className="block text-sm text-white/70">
                                Name (optional)
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                                placeholder="shelly"
                                className="w-full px-4 py-3.5 rounded-xl bg-[#0b0b0b] border border-white/8 text-white placeholder-white/30 focus:outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10 transition-all text-[15px] shadow-[0_10px_50px_rgba(0,0,0,0.35)]"
                            />
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="block text-sm text-white/70">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                placeholder="Enter your email"
                                className="w-full px-4 py-3.5 rounded-xl bg-[#0b0b0b] border border-white/8 text-white placeholder-white/30 focus:outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10 transition-all text-[15px] shadow-[0_10px_50px_rgba(0,0,0,0.35)]"
                            />
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="block text-sm text-white/70">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                autoComplete="new-password"
                                placeholder="Create a password"
                                className="w-full px-4 py-3.5 rounded-xl bg-[#0b0b0b] border border-white/8 text-white placeholder-white/30 focus:outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10 transition-all text-[15px] shadow-[0_10px_50px_rgba(0,0,0,0.35)]"
                            />
                        </div>

                        {/* Sign Up Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-b from-white to-[#dcdcdc] text-black font-semibold shadow-[0_12px_45px_rgba(0,0,0,0.35)] hover:brightness-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Sign In Link */}
                    <div className="text-center pt-2">
                        <p className="text-white/60 text-sm">
                            Already have an account?{' '}
                            <Link href="/login" className="text-white hover:underline font-semibold">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
