'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/config/api';
import { SpinnerIcon, SparklesIcon, CheckIcon } from '@/components/ui/Icons';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for success message from registration query parameter
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('registered') === 'true') {
        setSuccessMessage('Account created successfully! Please sign in with your credentials.');
      }
    }
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        setMessage('Invalid email or password.');
        return;
      }

      const data = await response.json();

      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', email);

      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      setMessage('Unable to connect to the backend service.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-600/30 text-white font-bold text-xl mb-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Lead Scraper</h1>
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
              PRO
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Sign in to access B2B lead intelligence and employee discovery
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#0f172a]/80 border border-slate-800/90 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
          {successMessage && (
            <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-300 font-medium flex items-center space-x-2">
              <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {message && (
            <div className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300 font-medium flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Work Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                required
                className="w-full px-3.5 py-2.5 bg-[#0b1120] border border-slate-700/80 hover:border-slate-600 focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 bg-[#0b1120] border border-slate-700/80 hover:border-slate-600 focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <SpinnerIcon className="w-4 h-4 text-white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In to Platform</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400 pt-5 border-t border-slate-800/80">
            Don't have an account yet?{' '}
            <Link
              href="/register"
              className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Feature Highlights Footer */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 font-medium">
          <div className="flex items-center justify-center gap-1">
            <CheckIcon className="w-3 h-3 text-emerald-400" />
            <span>AI Search</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <CheckIcon className="w-3 h-3 text-emerald-400" />
            <span>Domain Discovery</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <CheckIcon className="w-3 h-3 text-emerald-400" />
            <span>Verified Emails</span>
          </div>
        </div>
      </div>
    </main>
  );
}