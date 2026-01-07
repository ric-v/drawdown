'use client';

import { Loader2 } from 'lucide-react';

interface LoadingLayerProps {
  isLoading: boolean;
  message?: string;
}

export function LoadingLayer({ isLoading, message = 'Loading from cloud...' }: LoadingLayerProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl p-8 flex flex-col items-center gap-4 max-w-sm">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
          <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full" />
        </div>
        
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Syncing Portfolio
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        </div>

        <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
