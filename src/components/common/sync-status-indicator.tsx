'use client';

import { useEffect, useState } from 'react';
import { Cloud, CloudOff, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

export function SyncStatusIndicator() {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'synced'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    const handleSynced = () => {
      setSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString());
      setTimeout(() => setSyncStatus('idle'), 3000);
    };

    const handleSyncError = () => {
      setSyncStatus('error');
    };

    window.addEventListener('portfolio-synced', handleSynced);
    window.addEventListener('portfolio-sync-error', handleSyncError);

    return () => {
      window.removeEventListener('portfolio-synced', handleSynced);
      window.removeEventListener('portfolio-sync-error', handleSyncError);
    };
  }, []);

  if (syncStatus === 'idle') return null;

  return (
    <div className={cn(
      "fixed bottom-4 right-4 px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm",
      "backdrop-blur-xl border transition-all duration-300",
      syncStatus === 'syncing' && "bg-blue-50/90 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
      syncStatus === 'synced' && "bg-emerald-50/90 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300",
      syncStatus === 'error' && "bg-rose-50/90 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
    )}>
      {syncStatus === 'syncing' && (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Syncing to cloud...</span>
        </>
      )}
      {syncStatus === 'synced' && (
        <>
          <Check className="w-4 h-4" />
          <span>Synced {lastSyncTime}</span>
        </>
      )}
      {syncStatus === 'error' && (
        <>
          <CloudOff className="w-4 h-4" />
          <span>Sync failed - retrying...</span>
        </>
      )}
    </div>
  );
}
