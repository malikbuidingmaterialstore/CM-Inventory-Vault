import React, { useState, useEffect } from 'react';
import { User, SyncQueueItem } from '../types';
import { syncService, SyncStatusInfo } from '../services/syncService';
import { getPendingSyncQueue } from '../services/db';
import { 
  CloudLightning, 
  RefreshCw, 
  WifiOff, 
  CheckCircle2, 
  AlertCircle,
} from 'lucide-react';

interface SyncStatusViewProps {
  user: User;
  isOnline: boolean;
  onRefresh: () => void;
}

export const SyncStatusView: React.FC<SyncStatusViewProps> = ({
  user,
  isOnline,
  onRefresh,
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatusInfo>(syncService.getStatus());
  const [pendingQueue, setPendingQueue] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    success: boolean;
    count: number;
    time: Date;
    error?: string;
  } | null>(null);

  const loadQueue = async () => {
    const q = await getPendingSyncQueue(user.user_id);
    setPendingQueue(q);
  };

  useEffect(() => {
    const unsub = syncService.subscribe((s) => {
      setSyncStatus(s);
    });
    loadQueue();
    return () => unsub();
  }, [user.user_id]);

  const handleManualSync = async () => {
    if (isSyncing || !isOnline) return;
    setIsSyncing(true);
    const res = await syncService.triggerSync(user.user_id);
    setLastSyncResult({
      success: res.success,
      count: res.syncedCount,
      time: new Date(),
      error: res.error,
    });
    await loadQueue();
    setIsSyncing(false);
    onRefresh();
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold theme-text-main font-brand">
            Synchronization Status
          </h1>
          <p className="text-xs theme-text-tertiary mt-0.5">
            Bi-directional sync manager for Employee {user.username}
          </p>
        </div>

        <button
          onClick={handleManualSync}
          disabled={!isOnline || isSyncing}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs disabled:opacity-50 transition shadow-sm active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing Records...' : 'Start Manual Sync'}</span>
        </button>
      </div>

      {/* Sync State Card */}
      <div className="theme-bg-card border theme-border rounded-3xl p-6 theme-shadow space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b theme-border">
          <div className="flex items-center gap-3.5">
            <div className={`p-3.5 rounded-2xl ${
              !isOnline
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                : syncStatus.state === 'syncing' || isSyncing
                ? 'bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-500/30'
                : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
            }`}>
              {!isOnline ? (
                <WifiOff className="w-6 h-6" />
              ) : syncStatus.state === 'syncing' || isSyncing ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <CloudLightning className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold theme-text-main font-brand">
                  {!isOnline
                    ? 'OFFLINE MODE'
                    : isSyncing || syncStatus.state === 'syncing'
                    ? 'ONLINE — SYNCING'
                    : 'SYNC COMPLETE'}
                </h2>
                <span className={`w-2 h-2 rounded-full ${
                  !isOnline ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                }`} />
              </div>
              <p className="text-xs theme-text-secondary mt-0.5">
                {!isOnline
                  ? `${pendingQueue.length} change${pendingQueue.length > 1 ? 's' : ''} waiting to upload upon internet restoration`
                  : syncStatus.message || 'All local property records match cloud database'}
              </p>
            </div>
          </div>

          <div className="text-sm font-mono font-bold px-3 py-1.5 rounded-xl theme-bg-subtle border theme-border theme-text-main">
            {pendingQueue.length} Changes in Queue
          </div>
        </div>

        {/* Sync Pipeline Explanation Flow */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider theme-text-secondary mb-3 font-brand">
            Synchronization Pipeline Flow
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="theme-bg-subtle p-3 rounded-xl border theme-border">
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono font-bold block mb-1">STEP 1</span>
              <div className="font-semibold theme-text-main">Local Changes</div>
              <p className="text-[10px] theme-text-tertiary mt-1">Saved instantly to device IndexedDB</p>
            </div>
            <div className="theme-bg-subtle p-3 rounded-xl border theme-border">
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono font-bold block mb-1">STEP 2</span>
              <div className="font-semibold theme-text-main">Sync Queue</div>
              <p className="text-[10px] theme-text-tertiary mt-1">Serialized & ready for transmission</p>
            </div>
            <div className="theme-bg-subtle p-3 rounded-xl border theme-border">
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono font-bold block mb-1">STEP 3</span>
              <div className="font-semibold theme-text-main">Online Backend</div>
              <p className="text-[10px] theme-text-tertiary mt-1">Conflict check & UUID validation</p>
            </div>
            <div className="theme-bg-subtle p-3 rounded-xl border theme-border">
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono font-bold block mb-1">STEP 4</span>
              <div className="font-semibold theme-text-main">Database / Storage</div>
              <p className="text-[10px] theme-text-tertiary mt-1">Persistent central state updated</p>
            </div>
          </div>
        </div>

        {/* Last Sync Result message */}
        {lastSyncResult && (
          <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            lastSyncResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              {lastSyncResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>
                {lastSyncResult.success
                  ? `Successfully synchronized ${lastSyncResult.count} record(s) with cloud database.`
                  : `Sync failed: ${lastSyncResult.error || 'Server unreachable'}`}
              </span>
            </div>
            <span className="text-[10px] font-mono opacity-70">
              {lastSyncResult.time.toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* Sync Queue List */}
      <div className="theme-bg-card border theme-border rounded-3xl p-5 sm:p-6 theme-shadow space-y-3">
        <h2 className="text-sm font-bold theme-text-main uppercase tracking-wider font-brand">
          Queue Inspection ({pendingQueue.length})
        </h2>

        {pendingQueue.length === 0 ? (
          <div className="py-8 text-center theme-text-tertiary text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2 opacity-60" />
            <p className="font-semibold theme-text-main">No pending sync items</p>
            <p className="text-[11px] theme-text-tertiary mt-0.5">
              Any newly added properties or images will appear here when offline.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingQueue.map((item) => (
              <div
                key={item.queue_id}
                className="p-3.5 rounded-xl theme-bg-subtle border theme-border flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      {item.action.toUpperCase()}
                    </span>
                    <span className="font-semibold theme-text-main">
                      {item.entity_type}: {item.payload?.society ? `${item.payload.society} Plot ${item.payload.plot_number}` : item.entity_id}
                    </span>
                  </div>
                  <div className="text-[10px] theme-text-tertiary font-mono mt-1">
                    Created: {new Date(item.created_at).toLocaleTimeString()} · Status: {item.status}
                  </div>
                </div>

                <span className="text-xs text-amber-600 dark:text-amber-400 font-mono font-bold">
                  Pending Upload
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
