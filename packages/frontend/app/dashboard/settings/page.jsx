'use client';

import { useState, useEffect } from 'react';
import { Settings, AlertCircle, Loader2 } from 'lucide-react';
import TierStatusCard from '../../components/TierStatusCard';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setError('Failed to load user data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-white/70" />
          <p className="text-xs uppercase tracking-[0.18em] text-white/50">Settings</p>
        </div>
        <h1 className="text-4xl font-bold text-white">Account Settings</h1>
      </header>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* User Profile Section */}
      {user && (
        <section className="rounded-2xl bg-[#0f0f0f] border border-white/5 p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Profile Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Email</label>
              <p className="text-white font-medium">{user.email}</p>
            </div>

            {user.first_name && (
              <div>
                <label className="block text-sm text-white/60 mb-2">First Name</label>
                <p className="text-white font-medium">{user.first_name}</p>
              </div>
            )}

            {user.last_name && (
              <div>
                <label className="block text-sm text-white/60 mb-2">Last Name</label>
                <p className="text-white font-medium">{user.last_name}</p>
              </div>
            )}

            {user.role && (
              <div>
                <label className="block text-sm text-white/60 mb-2">Role</label>
                <p className="text-white font-medium capitalize">{user.role}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Subscription Section */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-6">Subscription & Billing</h2>
        <TierStatusCard />
      </section>

      {/* Support Section */}
      <section className="rounded-2xl bg-[#0f0f0f] border border-white/5 p-8">
        <h2 className="text-lg font-semibold text-white mb-4">Need Help?</h2>
        <p className="text-white/70 mb-6">
          If you have any questions or need assistance, please don't hesitate to reach out to our support team.
        </p>
        <a
          href="mailto:support@yourdomain.com"
          className="inline-flex px-6 py-3 rounded-full bg-white/10 text-white font-semibold hover:bg-white/15 transition-all"
        >
          Contact Support
        </a>
      </section>
    </div>
  );
}
