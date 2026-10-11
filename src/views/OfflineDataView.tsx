import React, { useState, useEffect } from 'react';
import { User, Property, SyncQueueItem } from '../types';
import { getOfflineStats, getPendingSyncQueue } from '../services/db';
import { 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  CheckCircle2, 
} from 'lucide-react';
import { syncService } from '../services/syncService';

interface OfflineDataViewProps {
  user: User;
  properties: Property[];
  isOnline: boolean;
  onRefresh: () => void;
}

export const OfflineDataView: React.FC<OfflineDataViewProps> = ({
  user,
  properties,
  isOnline,
  onRefresh,
}) => {
  const [stats, setStats] = useState({
    totalProperties: 0,
    availableCount: 0,
    soldCount: 0,
    onHoldCount: 0,
    pendingSyncCount: 0,
    totalImagesCount: 0,
  });
  const [pendingQueue, setPendingQueue] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = async () => {
    const s = await getOfflineStats(user.user_id);
    setStats(s);
    const q = await getPendingSyncQueue(user.user_id);
    setPendingQueue(q);
  };

  useEffect(() => {
    loadData();
  }, [user.user_id, properties]);

  const handleForceSync = async () => {
    if (isSyncing || !isOnline) return;
    setIsSyncing(true);
    await syncService.triggerSync(user.user_id);
    await loadData();
    setIsSyncing(false);
    onRefresh();
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold theme-text-main font-brand">
            Offline Storage & Local Database
          </h1>
          <p className="text-xs theme-text-tertiary mt-0.5">
            IndexedDB offline persistence engine for Employee {user.username}
          </p>
        </div>

        <button
          onClick={handleForceSync}
          disabled={!isOnline || isSyncing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl theme-bg-card border theme-border text-xs font-semibold text-amber-700 dark:text-amber-400 hover:scale-[1.02] disabled:opacity-50 transition theme-shadow"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Synchronizing...' : 'Force Cloud Sync'}</span>
        </button>
      </div>

      {/* Network Status Card */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
        isOnline
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
      }`}>
        <div className="flex items-center gap-3">
          {isOnline ? (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <Wifi className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400">
              <WifiOff className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="text-sm font-bold">
              {isOnline ? 'Network Connected (Online)' : 'Device is Completely Offline'}
            </div>
            <p className="text-xs opacity-80 mt-0.5">
              {isOnline
                ? 'Local changes sync automatically with server database'
                : 'All changes are stored locally in IndexedDB and will queue for sync'}
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded theme-bg-card border theme-border">
          {isOnline ? 'READY' : 'OFFLINE MODE'}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="theme-bg-card border theme-border p-4 rounded-2xl theme-shadow">
          <div className="text-[11px] theme-text-secondary font-medium">Cached Properties</div>
          <div className="text-2xl font-bold theme-text-main mt-1 font-brand">
            {stats.totalProperties}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
            100% Available Offline
          </span>
        </div>

        <div className="theme-bg-card border theme-border p-4 rounded-2xl theme-shadow">
          <div className="text-[11px] theme-text-secondary font-medium">Locally Stored Photos</div>
          <div className="text-2xl font-bold theme-text-main mt-1 font-brand">
            {stats.totalImagesCount}
          </div>
          <span className="text-[10px] theme-text-tertiary font-mono mt-1 block">
            Cached in IndexedDB
          </span>
        </div>

        <div className="theme-bg-card border theme-border p-4 rounded-2xl theme-shadow">
          <div className="text-[11px] theme-text-secondary font-medium">Pending Sync Queue</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-brand">
            {stats.pendingSyncCount}
          </div>
          <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-mono mt-1 block">
            {stats.pendingSyncCount > 0 ? 'Waiting for upload' : 'Queue Empty'}
          </span>
        </div>

        <div className="theme-bg-card border theme-border p-4 rounded-2xl theme-shadow">
          <div className="text-[11px] theme-text-secondary font-medium">Database Engine</div>
          <div className="text-base font-bold theme-text-main mt-1">
            IndexedDB v1
          </div>
          <span className="text-[10px] theme-text-tertiary font-mono mt-1 block">
            Client-Side Sandbox
          </span>
        </div>
      </div>

      {/* Sync Queue List */}
      <div className="theme-bg-card border theme-border rounded-3xl p-5 sm:p-6 theme-shadow space-y-4">
        <div className="flex items-center justify-between pb-3 border-b theme-border">
          <div>
            <h2 className="text-sm font-bold theme-text-main uppercase tracking-wider font-brand">
              Pending Sync Queue ({pendingQueue.length})
            </h2>
            <p className="text-xs theme-text-secondary mt-0.5">
              Local changes awaiting synchronization with server
            </p>
          </div>
        </div>

        {pendingQueue.length === 0 ? (
          <div className="py-8 text-center theme-text-tertiary text-xs flex flex-col items-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2 opacity-80" />
            <p className="font-semibold theme-text-main">Sync Queue is completely clear</p>
            <p className="text-[11px] theme-text-tertiary mt-0.5">
              All properties and pictures created on this device have been synchronized.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingQueue.map((item) => (
              <div
                key={item.queue_id}
                className="p-3 rounded-xl theme-bg-subtle border theme-border flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded font-mono font-bold uppercase text-[10px] ${
                    item.action === 'create'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : item.action === 'update'
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                  }`}>
                    {item.action}
                  </span>
                  <div>
                    <div className="font-semibold theme-text-main">
                      {item.entity_type.toUpperCase()}: {item.payload?.society ? `${item.payload.society} Plot ${item.payload.plot_number}` : item.entity_id}
                    </div>
                    <div className="text-[10px] theme-text-tertiary font-mono">
                      Queue ID: {item.queue_id.substring(0, 16)}...
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                    {item.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
