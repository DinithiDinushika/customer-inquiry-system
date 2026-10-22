import React from 'react';
import { InquiryStatus } from '../types';
import { Sparkles, Clock, CheckCircle2 } from 'lucide-react';

interface StatusBadgeProps {
  status: InquiryStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  const isSm = size === 'sm';

  switch (status) {
    case 'NEW':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 ${
            isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          New
        </span>
      );

    case 'IN_PROGRESS':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 ${
            isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <Clock className={isSm ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          In Progress
        </span>
      );

    case 'RESOLVED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 ${
            isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <CheckCircle2 className={isSm ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          Resolved
        </span>
      );

    default:
      return null;
  }
};
