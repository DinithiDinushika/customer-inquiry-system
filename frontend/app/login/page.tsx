'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Coffee, Lock, Mail, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Show session expired message if redirected
  useEffect(() => {
    if (searchParams.get('session_expired')) {
      setErrorMessage('Your session has expired. Please sign in again.');
    }
  }, [searchParams]);

  // If already authenticated, redirect to workspace
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/inquiries');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace('/inquiries');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillQuickAccount = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('Password123!');
    setErrorMessage(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-xl shadow-amber-600/30">
            <Coffee className="h-8 w-8" />
          </div>
        </div>
        <h1 className="mt-5 text-center text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Coffee Ninja Workspace
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Customer Inquiry Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-8 px-6 shadow-xl shadow-zinc-200/50 dark:shadow-none sm:rounded-2xl sm:px-10 border border-zinc-200/80 dark:border-zinc-800">
          
          {/* Error Alert Banner */}
          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3.5 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Staff Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@coffeeninja.com"
                  className="block w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-600/25 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in to Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Seed Accounts (Evaluation Convenience) */}
          <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-center mb-3">
              Fast Demo Accounts (Seeded)
            </span>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => fillQuickAccount('agent1@coffeeninja.com')}
                className="flex items-center justify-between px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors text-left"
              >
                <span>
                  <strong>Sarah Connor</strong> (Agent)
                </span>
                <span className="text-zinc-400 text-[11px]">agent1@coffeeninja.com</span>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount('agent2@coffeeninja.com')}
                className="flex items-center justify-between px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors text-left"
              >
                <span>
                  <strong>John Doe</strong> (Agent)
                </span>
                <span className="text-zinc-400 text-[11px]">agent2@coffeeninja.com</span>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount('admin@coffeeninja.com')}
                className="flex items-center justify-between px-3 py-2 text-xs rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/50 text-purple-900 dark:text-purple-300 transition-colors text-left"
              >
                <span>
                  <strong>Ellen Ripley</strong> (Admin)
                </span>
                <span className="text-purple-600 dark:text-purple-400 text-[11px]">admin@coffeeninja.com</span>
              </button>
            </div>
            <p className="mt-3 text-[11px] text-center text-zinc-400">
              Password for all accounts: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">Password123!</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
