'use client';

import React from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { Coffee, PlusCircle, CheckCircle2, ShieldCheck, Users, Clock } from 'lucide-react';

export default function InquiriesPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Welcome Header */}
        <div className="md:flex md:items-center md:justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                Workspace Active
              </span>
              <span className="text-xs text-zinc-400">Authenticated as {user?.role}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              Welcome back, {user?.fullName}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Customer inquiries management and status tracking workspace.
            </p>
          </div>

          <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
            <Link
              href="/inquiries/new"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-600/20 hover:bg-amber-500 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Capture New Inquiry
            </Link>
          </div>
        </div>

        {/* Auth Status & Next Step Info Card */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white dark:bg-zinc-900 overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500">Security & Session</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">JWT Bearer Enforced</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              API rejects unauthenticated requests with 401. Bearer header injected by frontend service layer.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500">Active Profile</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{user?.email}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Role: <strong className="capitalize">{user?.role}</strong> (Seeded account verified in PostgreSQL).
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500">Step 1 Status</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Sign-in Ready</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Workspace access is unlocked. Ready to implement Step 2 (Inquiry capture).
            </p>
          </div>
        </div>

      </div>
    </ProtectedRoute>
  );
}
