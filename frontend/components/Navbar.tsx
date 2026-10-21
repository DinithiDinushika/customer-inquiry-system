'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Coffee, LogOut, User as UserIcon, Shield, Inbox, PlusCircle } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-8">
          <Link href="/inquiries" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-md shadow-amber-600/20 group-hover:bg-amber-500 transition-colors">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100 block">
                Coffee Ninja
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium -mt-1 block">
                Inquiry Hub
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/inquiries"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/inquiries'
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900'
              }`}
            >
              <Inbox className="h-4 w-4" />
              Inquiries
            </Link>
            <Link
              href="/inquiries/new"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/inquiries/new'
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900'
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              Capture Inquiry
            </Link>
          </nav>
        </div>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pl-3 border-l border-zinc-200 dark:border-zinc-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {user.fullName}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'
                  }`}
                >
                  {user.role === 'admin' && <Shield className="h-2.5 w-2.5" />}
                  {user.role}
                </span>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 block -mt-0.5 truncate max-w-[160px]">
                {user.email}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign out of workspace"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 hover:text-red-600 hover:bg-red-50 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-red-950/30 transition-all border border-zinc-200 dark:border-zinc-800"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
