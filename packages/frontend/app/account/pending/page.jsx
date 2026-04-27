'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, LogOut } from 'lucide-react';
import { getTierConfig } from '../../utils/tier-config';

export default function PendingPage() {
    const router = useRouter();
    const [tier, setTier] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentError, setPaymentError] = useState('');

    const getAuthToken = () => localStorage.getItem('auth_token');

    useEffect(() => {
        loadTierInfo();
    }, []);

    const loadTierInfo = async () => {
        try {
            const token = getAuthToken();
            if (!token) {
                router.push('/login');
                return;
            }

            const res = await fetch('/api/auth/tier-check', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setTier(data);

                // If subscription is already active, redirect to dashboard
                if (data.subscription_status === 'active') {
                    router.push('/dashboard');
                }
            }
        } catch (error) {
            console.error('Failed to load tier info:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem('auth_token');
        router.push('/login');
    };

    const handleContinueToPayment = async () => {
        setPaymentError('');
        setPaymentLoading(true);

        try {
            const token = getAuthToken();
            if (!token) {
                router.push('/login');
                return;
            }

            const checkoutRes = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ tier: tier?.current_tier, flow: 'signup' }),
            });

            const data = await checkoutRes.json().catch(() => ({}));

            if (!checkoutRes.ok || !data.url) {
                throw new Error(data.error || 'Failed to start checkout');
            }

            window.location.assign(data.url);
        } catch (error) {
            setPaymentError(error?.message || 'Failed to start checkout');
        } finally {
            setPaymentLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="app-page-shell bg-[#050505] flex items-center justify-center">
                <div className="text-white/50">Loading...</div>
            </div>
        );
    }

    const tierConfig = tier ? getTierConfig(tier.current_tier) : null;

    return (
        <div className="app-page-shell bg-[#050505] flex items-center justify-center px-4 sm:px-6 py-12">
            <div className="w-full max-w-xl relative">
                <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/8 via-transparent to-transparent blur-3xl"
                />
                <div className="relative bg-[#111111] border border-white/5 rounded-[28px] shadow-[0_20px_80px_rgba(0,0,0,0.55)] px-6 sm:px-10 py-8 sm:py-12 space-y-8">
                    {/* Icon */}
                    <div className="flex justify-center">
                        <div className="rounded-full bg-orange-500/15 border border-orange-500/30 p-4">
                            <Clock className="w-8 h-8 text-orange-400" />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center space-y-3">
                        <h1 className="text-3xl sm:text-4xl font-bold text-white">Account Pending</h1>
                        <p className="text-white/70">Your account is waiting for activation</p>
                    </div>

                    {/* Plan Info */}
                    {tier && tierConfig && (
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
                            <div>
                                <p className="text-white/60 text-sm mb-1">Selected Plan</p>
                                <p className="text-xl font-semibold text-white capitalize">{tierConfig.name} Plan</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                <div>
                                    <p className="text-white/60 text-xs mb-1">Monthly Cost</p>
                                    <p className="text-lg font-semibold text-white">£{(tierConfig.monthlyPrice / 100).toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-white/60 text-xs mb-1">Setup Fee</p>
                                    <p className="text-lg font-semibold text-white">£{(tierConfig.setupFee / 100).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status Info */}
                    <div className="space-y-4 text-center">
                        <p className="text-white/80">
                            Your account is pending activation. This typically takes less than 24 hours.
                        </p>
                        <p className="text-white/60 text-sm">
                            Payment or admin approval is required to access your account.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        {tier?.subscription_status === 'pending_payment' && tier?.current_tier && tier.current_tier !== 'free' && (
                            <button
                                onClick={handleContinueToPayment}
                                disabled={paymentLoading}
                                className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {paymentLoading ? 'Opening payment...' : 'Continue to Payment'}
                            </button>
                        )}
                        {paymentError && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
                                {paymentError}
                            </div>
                        )}
                        <button
                            onClick={loadTierInfo}
                            className="w-full py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/15 transition-all"
                        >
                            Check Status
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="w-full py-3 rounded-xl border border-white/20 text-white/70 font-semibold hover:border-white/40 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>

                    {/* Contact Info */}
                    <div className="pt-4 border-t border-white/5">
                        <p className="text-white/50 text-sm text-center">
                            Questions? Contact{' '}
                            <a href="mailto:support@example.com" className="text-white/70 hover:text-white underline">
                                support
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
