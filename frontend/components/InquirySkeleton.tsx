import React from 'react';

export const InquirySkeleton = () => {
  return (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800 animate-pulse">
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
              <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            </div>
            <div className="h-3.5 w-3/4 bg-zinc-100 dark:bg-zinc-800/60 rounded"></div>
            <div className="flex items-center gap-4">
              <div className="h-3 w-28 bg-zinc-100 dark:bg-zinc-800/40 rounded"></div>
              <div className="h-3 w-36 bg-zinc-100 dark:bg-zinc-800/40 rounded"></div>
            </div>
          </div>
          <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
        </div>
      ))}
    </div>
  );
};
