'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/inquiries');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[70vh]">
      <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-3" />
      <p className="text-sm text-zinc-500 font-medium">Entering Coffee Ninja Workspace...</p>
    </div>
  );
}
