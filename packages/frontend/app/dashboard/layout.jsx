'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardSidebar from '../components/DashboardSidebar';
import Footer from '../components/Footer';
import dynamic from 'next/dynamic';
import { Menu, Loader2 } from 'lucide-react';

const HelpCenterButton = dynamic(() => import('../components/HelpCenterButton'), {
    ssr: false,
});

function SubscriptionGate({ children }) {
    const router = useRouter();
    const [isValid, setIsValid] = useState(null);

    useEffect(() => {
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        try {
            const token = localStorage.getItem('auth_token');

            if (!token) {
                router.replace('/login');
                return;
            }

            // Get user info first
            const meRes = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!meRes.ok) {
                router.replace('/login');
                return;
            }

            const meData = await meRes.json();
            // Allow admins to access dashboard even if subscription is pending
            if (meData.user.isAdmin || meData.user.isSuperadmin) {
                setIsValid(true);
                return;
            }

            // For regular users, check subscription status
            const res = await fetch('/api/auth/tier-check', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                // Only allow access if subscription is active
                if (data.subscription_status === 'active') {
                    setIsValid(true);
                } else {
                    router.replace('/account/pending');
                }
            } else {
                router.replace('/login');
            }
        } catch (error) {
            console.error('Subscription check failed:', error);
            router.replace('/login');
        }
    };

    if (isValid === null) {
        return (
            <div className="min-h-screen bg-[#050c1b] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
            </div>
        );
    }

    if (!isValid) {
        return null;
    }

    return children;
}

export default function DashboardLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <SubscriptionGate>
            <div className="min-h-screen bg-[#050c1b] text-white flex flex-col">
                <DashboardSidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
                {isSidebarOpen && (
                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                        aria-label="Close navigation"
                    />
                )}
                <div className="lg:ml-64 flex-1 flex flex-col">
                    <div className="lg:hidden px-6 pt-6">
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white"
                            aria-label="Open navigation"
                        >
                            <Menu className="h-4 w-4" />
                            Menu
                        </button>
                    </div>
                    <main className="flex-1 px-6 lg:px-10 py-8">
                        {children}
                    </main>
                    <HelpCenterButton />
                </div>
                <Footer />
            </div>
        </SubscriptionGate>
    );
}
