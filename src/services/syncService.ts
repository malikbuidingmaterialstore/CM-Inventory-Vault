import { api } from './api';
import { 
  getPendingSyncQueue, 
  removeSyncQueueItem, 
  bulkReplaceUserPropertiesLocally, 
  getUserPropertiesLocally 
} from './db';
import { Property } from '../types';

export type SyncState = 'offline' | 'idle' | 'syncing' | 'synced' | 'error';

export interface SyncStatusInfo {
  state: SyncState;
  pendingCount: number;
  lastSyncedAt: Date | null;
  message: string;
}

type SyncListener = (status: SyncStatusInfo) => void;

class SyncService {
  private listeners: Set<SyncListener> = new Set();
  private isSyncing: boolean = false;
  private currentStatus: SyncStatusInfo = {
    state: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'idle',
    pendingCount: 0,
    lastSyncedAt: null,
    message: '',
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.updateStatus({ state: 'idle', message: 'Online — Checking sync queue' });
        this.triggerSync();
      });

      window.addEventListener('offline', () => {
        this.updateStatus({ state: 'offline', message: 'Offline Mode — Local changes will sync when reconnected' });
      });
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.currentStatus);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.currentStatus));
  }

  private updateStatus(partial: Partial<SyncStatusInfo>) {
    this.currentStatus = { ...this.currentStatus, ...partial };
    this.notify();
  }

  public getStatus(): SyncStatusInfo {
    return this.currentStatus;
  }

  public async refreshPendingCount(userId: string) {
    if (!userId) return;
    try {
      const queue = await getPendingSyncQueue(userId);
      this.updateStatus({
        pendingCount: queue.length,
        state: !navigator.onLine ? 'offline' : (this.isSyncing ? 'syncing' : this.currentStatus.state),
      });
    } catch {
      // ignore
    }
  }

  public async triggerSync(userId?: string): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.updateStatus({
        state: 'offline',
        message: 'Cannot sync: No internet connection',
      });
      return { success: false, syncedCount: 0, error: 'Offline' };
    }

    if (this.isSyncing) {
      return { success: true, syncedCount: 0 };
    }

    const currentUserId = userId || localStorage.getItem('property_hub_current_user_id');
    if (!currentUserId) {
      return { success: false, syncedCount: 0, error: 'User not logged in' };
    }

    this.isSyncing = true;
    try {
      const pendingItems = await getPendingSyncQueue(currentUserId);
      this.updateStatus({
        state: 'syncing',
        pendingCount: pendingItems.length,
        message: pendingItems.length > 0 
          ? `Uploading ${pendingItems.length} local change${pendingItems.length > 1 ? 's' : ''}...`
          : 'Synchronizing with cloud database...',
      });

      let syncedCount = 0;

      // 1. Process pending items in sync queue if any exist
      if (pendingItems.length > 0) {
        const result = await api.syncBatch(pendingItems);
        // Remove processed items from local queue
        for (const processedId of result.processed) {
          await removeSyncQueueItem(processedId);
          syncedCount++;
        }

        // Update local IndexedDB with latest verified properties from server
        if (result.latestProperties && result.latestProperties.length > 0) {
          await bulkReplaceUserPropertiesLocally(currentUserId, result.latestProperties);
        }
      } else {
        // Even if queue is empty, fetch latest cloud updates to keep client fresh
        const serverRes = await api.getProperties();
        if (serverRes.properties) {
          await bulkReplaceUserPropertiesLocally(currentUserId, serverRes.properties);
        }
      }

      // Recalculate remaining pending items
      const remaining = await getPendingSyncQueue(currentUserId);

      this.updateStatus({
        state: 'synced',
        pendingCount: remaining.length,
        lastSyncedAt: new Date(),
        message: 'Sync complete — All records up to date',
      });

      // After 4 seconds, revert status text to idle
      setTimeout(() => {
        if (this.currentStatus.state === 'synced') {
          this.updateStatus({ state: 'idle', message: 'All changes synchronized' });
        }
      }, 4000);

      return { success: true, syncedCount };
    } catch (err: any) {
      console.warn('Sync failed:', err);
      const remaining = await getPendingSyncQueue(currentUserId).catch(() => []);
      this.updateStatus({
        state: !navigator.onLine ? 'offline' : 'error',
        pendingCount: remaining.length,
        message: err.message || 'Sync failed: Will retry automatically',
      });
      return { success: false, syncedCount: 0, error: err.message };
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncService = new SyncService();
