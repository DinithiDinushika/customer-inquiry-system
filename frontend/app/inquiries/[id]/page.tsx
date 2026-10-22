'use client';

import React, { useState, useEffect, useCallback, use, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { inquiryService } from '../../../services/inquiryService';
import { Inquiry, InquiryStatus } from '../../../types';
import { StatusBadge } from '../../../components/StatusBadge';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  PlayCircle,
  RefreshCw,
  Loader2,
  ShieldAlert,
  GitBranch,
  Layers,
  Info,
} from 'lucide-react';

function InquiryDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const inquiryId = resolvedParams.id;

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Stale data conflict state (Real-World Situation 2)
  const [conflictError, setConflictError] = useState<{
    message: string;
    submittedVersion: number;
    currentVersion: number;
    currentStatus: string;
  } | null>(null);

  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadInquiry = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setConflictError(null);
    setTransitionError(null);

    try {
      const data = await inquiryService.getInquiryById(inquiryId);
      setInquiry(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load inquiry details.');
    } finally {
      setIsLoading(false);
    }
  }, [inquiryId]);

  useEffect(() => {
    loadInquiry();
  }, [loadInquiry]);

  // Execute State Transition with OCC Version
  const handleStatusChange = async (nextStatus: InquiryStatus, forceStaleVersion = false) => {
    if (!inquiry) return;

    setIsUpdating(true);
    setConflictError(null);
    setTransitionError(null);
    setSuccessMessage(null);

    // If simulating stale tab, send an outdated version (inquiry.version - 1)
    const versionToSend = forceStaleVersion ? inquiry.version - 1 : inquiry.version;

    try {
      const updated = await inquiryService.updateStatus(inquiry.id, nextStatus, versionToSend);
      setInquiry(updated);
      setSuccessMessage(`Inquiry status updated to ${nextStatus}.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      if (err.status === 409 || err.code === 'STALE_DATA_CONFLICT') {
        // Real-World Situation 2: Stale Data Conflict caught!
        setConflictError({
          message: err.message || 'This inquiry was updated in another session or tab.',
          submittedVersion: err.details?.submittedVersion || versionToSend,
          currentVersion: err.details?.currentVersion || inquiry.version + 1,
          currentStatus: err.details?.currentStatus || 'Updated',
        });
      } else if (err.status === 422 || err.code === 'INVALID_STATUS_TRANSITION') {
        setTransitionError(err.message || 'Invalid status transition requested.');
      } else {
        setError(err.message || 'An error occurred while updating status.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-zinc-200 dark:border-zinc-800">
          <Link
            href="/inquiries"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Inquiries Overview
          </Link>

          <button
            onClick={loadInquiry}
            disabled={isLoading || isUpdating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 disabled:opacity-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="rounded-2xl bg-white dark:bg-zinc-900 p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm animate-pulse space-y-6">
            <div className="h-6 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            <div className="h-4 w-2/3 bg-zinc-100 dark:bg-zinc-800/60 rounded"></div>
            <div className="h-32 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl"></div>
          </div>
        ) : error && !inquiry ? (
          /* Error State (e.g. 404 or Invalid UUID) */
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/60 p-10 text-center shadow-lg">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Inquiry Not Found</h2>
            <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">{error}</p>
            <div className="mt-6">
              <Link
                href="/inquiries"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-amber-500 transition-colors"
              >
                Return to All Inquiries
              </Link>
            </div>
          </div>
        ) : inquiry ? (
          <div className="space-y-6">
            
            {/* Real-World Situation 2: Stale Data Conflict Alert Banner */}
            {conflictError && (
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700/80 p-5 shadow-lg shadow-amber-500/10">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                        Real-World Situation 2
                      </span>
                      <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                        Stale Data Update Conflict (Optimistic Concurrency Control)
                      </h3>
                    </div>
                    <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                      {conflictError.message}
                    </p>
                    <div className="mt-2 text-xs font-mono text-amber-900/80 dark:text-amber-300/80 bg-amber-100/70 dark:bg-amber-900/40 p-2.5 rounded-lg">
                      Attempted Version: <span className="font-bold text-red-600 dark:text-red-400">v{conflictError.submittedVersion}</span> | 
                      Latest Server Version: <span className="font-bold text-emerald-600 dark:text-emerald-400">v{conflictError.currentVersion}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        onClick={loadInquiry}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Reload Latest Data Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Invalid State Transition Error (422) */}
            {transitionError && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-4 text-sm text-red-700 dark:text-red-300 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <strong className="block font-semibold">State Machine Validation Failed (422)</strong>
                  <span className="text-xs">{transitionError}</span>
                </div>
              </div>
            )}

            {/* Success Toast Banner */}
            {successMessage && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-4 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium text-xs sm:text-sm">{successMessage}</span>
              </div>
            )}

            {/* Main Details Card */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-8 shadow-xl shadow-zinc-200/40 dark:shadow-none">
              
              {/* Header: Status, Version, Reference */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <StatusBadge status={inquiry.status} size="md" />
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                    title="Optimistic Concurrency Control Row Version"
                  >
                    <Layers className="h-3 w-3 text-zinc-400" />
                    v{inquiry.version}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    Ref: #{inquiry.id.slice(0, 8)}
                  </span>
                </div>

                <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Created {formatDate(inquiry.createdAt)}</span>
                </div>
              </div>

              {/* Inquiry Title & Customer Info */}
              <div className="pt-6">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {inquiry.subject}
                </h1>

                {/* Customer Details Strip */}
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Customer
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      <User className="h-4 w-4 text-zinc-400" />
                      {inquiry.customerName}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Contact Information
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {inquiry.contactInfo.includes('@') ? (
                        <>
                          <Mail className="h-4 w-4 text-zinc-400" />
                          <a
                            href={`mailto:${inquiry.contactInfo}`}
                            className="hover:underline text-amber-600 dark:text-amber-400"
                          >
                            {inquiry.contactInfo}
                          </a>
                        </>
                      ) : (
                        <>
                          <Phone className="h-4 w-4 text-zinc-400" />
                          <a
                            href={`tel:${inquiry.contactInfo}`}
                            className="hover:underline text-amber-600 dark:text-amber-400 font-mono"
                          >
                            {inquiry.contactInfo}
                          </a>
                        </>
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Current Handler
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {inquiry.assignedToName ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          {inquiry.assignedToName}
                        </>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 text-xs font-semibold">
                          Unassigned (In Pool)
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Description Body */}
                <div className="mt-6">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Inquiry Description
                  </h2>
                  <div className="p-4 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                    {inquiry.description}
                  </div>
                </div>

                {/* Metadata Timestamps */}
                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-6 text-xs text-zinc-400">
                  <span>Logged by: <strong>{inquiry.createdByName || 'Staff Member'}</strong></span>
                  <span>Last Updated: {formatDate(inquiry.updatedAt)}</span>
                  {inquiry.resolvedAt && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Resolved At: {formatDate(inquiry.resolvedAt)}
                    </span>
                  )}
                </div>

              </div>
            </div>

            {/* Lifecycle State Machine Action Panel (Minimum Working Scope #4 & Judgement #2) */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-8 shadow-xl shadow-zinc-200/40 dark:shadow-none">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="h-5 w-5 text-amber-600" />
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Inquiry Lifecycle Actions
                </h2>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                Enforces the transition matrix: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">NEW &rarr; IN_PROGRESS &rarr; RESOLVED</code>. Illegal transitions are rejected by the backend with 422.
              </p>

              {/* Action Buttons Based on Current Status */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* 1. When Status is NEW */}
                {inquiry.status === 'NEW' && (
                  <>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange('IN_PROGRESS')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold shadow-md shadow-amber-600/20 disabled:opacity-50 transition-all"
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                      Start Working (Move to In Progress)
                    </button>

                    {/* Prohibited action demonstration button */}
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange('RESOLVED')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 hover:border-red-300 hover:text-red-600 text-xs font-semibold transition-all"
                      title="Direct resolve from NEW is prohibited by the business rules"
                    >
                      <span>Resolve Directly (Test 422 Rejection)</span>
                    </button>
                  </>
                )}

                {/* 2. When Status is IN_PROGRESS */}
                {inquiry.status === 'IN_PROGRESS' && (
                  <>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange('RESOLVED')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Mark as Resolved
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange('NEW')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-semibold disabled:opacity-50 transition-all"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
                      Revert to New (Unassign/Reset)
                    </button>
                  </>
                )}

                {/* 3. When Status is RESOLVED */}
                {inquiry.status === 'RESOLVED' && (
                  <>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange('IN_PROGRESS')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all"
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                      Reopen Inquiry (Move to In Progress)
                    </button>

                    {/* Prohibited action demonstration button */}
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange('NEW')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 hover:border-red-300 hover:text-red-600 text-xs font-semibold transition-all"
                      title="Direct reset to NEW from RESOLVED is prohibited (must reopen to In Progress)"
                    >
                      <span>Reopen Directly to NEW (Test 422 Rejection)</span>
                    </button>
                  </>
                )}

              </div>

              {/* Demo Simulator: Simulate Stale Browser Tab (Situation 2) */}
              <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
                  <div className="flex items-start gap-2.5">
                    <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        Demonstrate Real-World Situation 2 (Stale Tab Concurrency)
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Simulates an older browser tab attempting an update with an obsolete version (v{inquiry.version - 1}). Triggers a 409 Conflict.
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isUpdating || inquiry.version <= 1}
                    onClick={() => handleStatusChange(inquiry.status === 'NEW' ? 'IN_PROGRESS' : 'RESOLVED', true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 text-xs font-semibold disabled:opacity-40 transition-colors shrink-0"
                    title={inquiry.version <= 1 ? 'Perform at least one status transition first so version > 1' : 'Simulate submitting with an outdated version'}
                  >
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                    Simulate Stale Tab Update (Trigger 409)
                  </button>
                </div>
              </div>

            </div>

          </div>
        ) : null}

      </div>
    </ProtectedRoute>
  );
}

export default function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-3" />
          <p className="text-sm text-zinc-500 font-medium">Loading inquiry details...</p>
        </div>
      }
    >
      <InquiryDetailContent params={params} />
    </Suspense>
  );
}
