'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { inquiryService } from '../../services/inquiryService';
import { Inquiry, InquiryStatus, InquiryCounts } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { InquirySkeleton } from '../../components/InquirySkeleton';
import { EmptyState } from '../../components/EmptyState';
import {
  PlusCircle,
  Search,
  X,
  User,
  Phone,
  Mail,
  Calendar,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Inbox,
  Filter,
  CheckCircle,
} from 'lucide-react';

export default function InquiriesOverviewPage() {
  const { user } = useAuth();

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [counts, setCounts] = useState<InquiryCounts>({
    all: 0,
    new: 0,
    inProgress: 0,
    resolved: 0,
  });

  const [selectedStatus, setSelectedStatus] = useState<InquiryStatus | 'ALL'>('ALL');
  const [assignedToMe, setAssignedToMe] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search query by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchInquiries = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const response = await inquiryService.getInquiries({
        status: selectedStatus,
        search: debouncedSearch,
        assignedToMe,
      });

      setInquiries(response.inquiries);
      setCounts(response.counts);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inquiries. Please check connection.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedStatus, debouncedSearch, assignedToMe]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const clearAllFilters = () => {
    setSelectedStatus('ALL');
    setAssignedToMe(false);
    setSearchQuery('');
    setDebouncedSearch('');
  };

  const hasActiveFilters = selectedStatus !== 'ALL' || assignedToMe || debouncedSearch !== '';

  const formatRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 172800) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header Bar */}
        <div className="sm:flex sm:items-center sm:justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              Customer Inquiries
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Review, filter, and track customer support requests across their lifecycle.
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <button
              onClick={() => fetchInquiries(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 disabled:opacity-50 transition-colors shadow-2xs"
              title="Refresh inquiries list"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              href="/inquiries/new"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-amber-600/20 hover:bg-amber-500 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Capture Inquiry
            </Link>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-6 space-y-4">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedStatus === 'ALL'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800'
              }`}
            >
              <span>All Inquiries</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedStatus === 'ALL'
                    ? 'bg-zinc-700 text-zinc-100 dark:bg-zinc-300 dark:text-zinc-900'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                {counts.all}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatus('NEW')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedStatus === 'NEW'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-zinc-200/80 dark:border-zinc-800'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span>New</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedStatus === 'NEW'
                    ? 'bg-blue-800 text-white'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                }`}
              >
                {counts.new}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatus('IN_PROGRESS')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedStatus === 'IN_PROGRESS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-zinc-200/80 dark:border-zinc-800'
              }`}
            >
              <span>In Progress</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedStatus === 'IN_PROGRESS'
                    ? 'bg-amber-800 text-white'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {counts.inProgress}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatus('RESOLVED')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedStatus === 'RESOLVED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-zinc-200/80 dark:border-zinc-800'
              }`}
            >
              <span>Resolved</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedStatus === 'RESOLVED'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {counts.resolved}
              </span>
            </button>
          </div>

          {/* Search Bar & Assigned To Me Toggle */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer, phone, email, or subject..."
                className="block w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 pl-10 pr-9 py-2 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Assigned to Me Pill */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAssignedToMe(!assignedToMe)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  assignedToMe
                    ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                    : 'bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>Assigned to me only</span>
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-medium text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 underline"
                >
                  Clear filters
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Content Section: Table / Skeletons / Empty States */}
        <div className="mt-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-xl shadow-zinc-200/40 dark:shadow-none">
          
          {/* Error Banner */}
          {error && (
            <div className="p-6 text-center bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900">
              <AlertCircle className="mx-auto h-6 w-6 text-red-600 dark:text-red-400 mb-2" />
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">{error}</p>
              <button
                onClick={() => fetchInquiries(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-500"
              >
                Retry Request
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {isLoading ? (
            <InquirySkeleton />
          ) : inquiries.length === 0 ? (
            // Contextual Empty States
            hasActiveFilters ? (
              <EmptyState
                icon={Filter}
                title="No inquiries match your criteria"
                description="Try clearing your search keyword, switching status tabs, or unchecking 'Assigned to me'."
                action={{
                  label: 'Clear All Filters',
                  onClick: clearAllFilters,
                }}
              />
            ) : (
              <EmptyState
                icon={Inbox}
                title="No inquiries recorded yet"
                description="Customer requests submitted via phone, email, or chat will appear here."
                action={{
                  label: 'Capture First Inquiry',
                  href: '/inquiries/new',
                }}
              />
            )
          ) : (
            // Inquiries List
            <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
              {inquiries.map((inquiry) => (
                <Link
                  key={inquiry.id}
                  href={`/inquiries/${inquiry.id}`}
                  className="group block p-4 sm:p-5 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Left: Status, Subject, Customer info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <StatusBadge status={inquiry.status} size="sm" />
                        <span className="text-xs text-zinc-400 font-mono">
                          #{inquiry.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-zinc-400">•</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {formatRelativeTime(inquiry.createdAt)}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                        {inquiry.subject}
                      </h3>

                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 max-w-3xl">
                        {inquiry.description}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-zinc-600 dark:text-zinc-300">
                        <span className="flex items-center gap-1 font-medium">
                          <User className="h-3.5 w-3.5 text-zinc-400" />
                          {inquiry.customerName}
                        </span>

                        <span className="flex items-center gap-1 text-zinc-500 font-mono text-[11px]">
                          {inquiry.contactInfo.includes('@') ? (
                            <Mail className="h-3 w-3 text-zinc-400" />
                          ) : (
                            <Phone className="h-3 w-3 text-zinc-400" />
                          )}
                          {inquiry.contactInfo}
                        </span>

                        <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">|</span>

                        <span className="text-zinc-500 text-[11px]">
                          Logged by: {inquiry.createdByName || 'Staff'}
                        </span>
                      </div>
                    </div>

                    {/* Right: Assignee & Action arrow */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-zinc-100 dark:border-zinc-800">
                      <div className="text-left sm:text-right">
                        <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                          Handler
                        </span>
                        {inquiry.assignedToName ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            {inquiry.assignedToName}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            Unassigned
                          </span>
                        )}
                      </div>

                      <div className="flex items-center text-zinc-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all">
                        <span className="text-xs font-medium mr-1 hidden sm:inline">Details</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>

                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>

      </div>
    </ProtectedRoute>
  );
}
