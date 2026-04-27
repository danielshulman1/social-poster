'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import BrandMark from '../components/BrandMark';

const Link = NextLink as any;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to sign in');
        setLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="app-page-shell relative flex items-center justify-center overflow-hidden bg-[#050c1b] px-6 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-8%] h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute bottom-[-12%] right-[-6%] h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
      </div>

      <div className="relative grid w-full max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6 text-white">
          <BrandMark withWordmark className="text-white" priority />
          <div className="space-y-4">
            <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
              Operon
            </span>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight text-white md:text-5xl">
              Sign in to manage your workflows, team activity, and AI operations.
            </h1>
            <p className="max-w-xl text-base leading-7 text-white/70 md:text-lg">
              Access your workspace, automation controls, reporting, and support tools from one place.
            </p>
          </div>

          {/* Security & Compliance Features */}
          <div className="mt-12 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Enterprise Security</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="mt-1 text-lg">🔐</div>
                <div>
                  <p className="text-xs font-semibold text-white">Bcrypt Encryption</p>
                  <p className="text-xs text-white/60">12-round password hashing</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="mt-1 text-lg">🔑</div>
                <div>
                  <p className="text-xs font-semibold text-white">JWT Tokens</p>
                  <p className="text-xs text-white/60">7-day secure access tokens</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="mt-1 text-lg">📋</div>
                <div>
                  <p className="text-xs font-semibold text-white">Audit Logging</p>
                  <p className="text-xs text-white/60">Full activity tracking</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="mt-1 text-lg">⚡</div>
                <div>
                  <p className="text-xs font-semibold text-white">Rate Limiting</p>
                  <p className="text-xs text-white/60">DDoS & brute force protection</p>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Badges */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Compliance</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-green-400/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300">
                <span>✓</span> GDPR
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-green-400/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300">
                <span>✓</span> CCPA
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-green-400/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300">
                <span>✓</span> SOC 2
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                <span>🔒</span> Encrypted
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] md:p-8">
          <div className="mb-6 space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">Account access</p>
            <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
            <p className="text-sm text-slate-600">Use your email and password to open the Operon dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="you@company.com"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-2xl bg-[#0b5cff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#094de0] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Continue'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link className="text-sm font-medium text-slate-600 transition hover:text-slate-900" href="/dashboard">
              Skip to dashboard (demo)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
