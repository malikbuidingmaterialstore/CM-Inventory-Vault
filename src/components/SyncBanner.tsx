import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { syncService, SyncStatusInfo } from '../services/syncService';

interface SyncBannerProps {
  userId?: string;
  onSyncComplete?: () => void;
}

export const SyncBanner: React.FC<SyncBannerProps> = ({ userId, onSyncComplete }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatusInfo>(syncService.getStatus());
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = syncService.subscribe((status) => {
      setSyncStatus(status);
    });
    if (userId) {
      syncService.refreshPendingCount(userId);
    }
    return () => unsubscribe();
  }, [userId]);

  const handleManualSync = async () => {
    if (isManualSyncing) return;
    setIsManualSyncing(true);
    const result = await syncService.triggerSync(userId);
    setIsManualSyncing(false);
    if (result.success && onSyncComplete) {
      onSyncComplete();
    }
  };

  const isOffline = syncStatus.state === 'offline' || (typeof navigator !== 'undefined' && !navigator.onLine);
  const isSyncing = syncStatus.state === 'syncing' || isManualSyncing;
  const isError = syncStatus.state === 'error';
  const hasPending = syncStatus.pendingCount > 0;

  return (
    <div className="w-full">
      {/* Offline Mode Banner */}
      {isOffline && (
        <div className="bg-amber-100/80 dark:bg-amber-950/40 border-b border-amber-300 dark:border-amber-800/50 px-4 py-2 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <div className="leading-tight">
              <span className="font-semibold text-amber-950 dark:text-amber-200">OFFLINE MODE</span>
              <span className="mx-1.5 opacity-50">·</span>
              <span>
                {hasPending 
                  ? `${syncStatus.pendingCount} change${syncStatus.pendingCount > 1 ? 's' : ''} waiting to sync`
                  : 'Working with locally cached database'}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-200 dark:bg-amber-500/20 px-2 py-0.5 rounded font-semibold">
            Local Only
          </span>
        </div>
      )}

      {/* Syncing or Synced Banner when Online */}
      {!isOffline && (isSyncing || hasPending || isError) && (
        <div
          className={`border-b px-4 py-2 flex items-center justify-between text-xs transition-colors ${
            isError
              ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800/40 dark:text-rose-200'
              : isSyncing
              ? 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-950/40 dark:border-sky-800/40 dark:text-sky-200'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800/30 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 animate-spin shrink-0" />
            ) : isError ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            <span className="font-medium">
              {isSyncing
                ? syncStatus.message || 'Syncing local records with cloud...'
                : isError
                ? syncStatus.message || 'Sync encountered a temporary issue'
                : hasPending
                ? `${syncStatus.pendingCount} record${syncStatus.pendingCount > 1 ? 's' : ''} ready to sync`
                : 'All changes synchronized'}
            </span>
          </div>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[11px] font-medium theme-text-main transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
