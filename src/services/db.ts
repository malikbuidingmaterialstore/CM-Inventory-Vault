import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Property, PropertyImage, PropertyTikTokLink, SyncQueueItem, AuthSession } from '../types';

interface PropertyHubDB extends DBSchema {
  properties: {
    key: string;
    value: Property;
    indexes: {
      'by-user': string;
      'by-status': string;
      'by-updated': string;
    };
  };
  property_images: {
    key: string;
    value: PropertyImage;
    indexes: {
      'by-property': string;
      'by-user': string;
    };
  };
  property_tiktok_links: {
    key: string;
    value: PropertyTikTokLink;
    indexes: {
      'by-property': string;
      'by-user': string;
    };
  };
  sync_queue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      'by-user': string;
      'by-status': string;
    };
  };
  key_value: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'property_hub_offline_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PropertyHubDB>> | null = null;

export function getLocalDB(): Promise<IDBPDatabase<PropertyHubDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PropertyHubDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Properties store
        const propStore = db.createObjectStore('properties', { keyPath: 'property_id' });
        propStore.createIndex('by-user', 'user_id');
        propStore.createIndex('by-status', 'status');
        propStore.createIndex('by-updated', 'updated_at');

        // Images store
        const imgStore = db.createObjectStore('property_images', { keyPath: 'image_id' });
        imgStore.createIndex('by-property', 'property_id');
        imgStore.createIndex('by-user', 'user_id');

        // TikTok Links store
        const tiktokStore = db.createObjectStore('property_tiktok_links', { keyPath: 'tiktok_id' });
        tiktokStore.createIndex('by-property', 'property_id');
        tiktokStore.createIndex('by-user', 'user_id');

        // Sync Queue store
        const syncStore = db.createObjectStore('sync_queue', { keyPath: 'queue_id' });
        syncStore.createIndex('by-user', 'user_id');
        syncStore.createIndex('by-status', 'status');

        // Generic Key-Value store
        db.createObjectStore('key_value', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}

// ================= PROPERTY OPERATIONS =================

export async function savePropertyLocally(property: Property, addToQueue: boolean = false): Promise<void> {
  const db = await getLocalDB();
  const tx = db.transaction(['properties', 'sync_queue'], 'readwrite');
  await tx.objectStore('properties').put(property);

  if (addToQueue) {
    const queueItem: SyncQueueItem = {
      queue_id: 'sync_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
      user_id: property.user_id,
      entity_type: 'property',
      action: property.is_local_only ? 'create' : 'update',
      entity_id: property.property_id,
      payload: property,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    await tx.objectStore('sync_queue').put(queueItem);
  }

  await tx.done;
}

export async function getUserPropertiesLocally(userId: string): Promise<Property[]> {
  const db = await getLocalDB();
  const allForUser = await db.getAllFromIndex('properties', 'by-user', userId);
  // Sort latest updated first
  return allForUser.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export async function getPropertyByIdLocally(propertyId: string, userId: string): Promise<Property | undefined> {
  const db = await getLocalDB();
  const prop = await db.get('properties', propertyId);
  // Strict isolation check
  if (prop && prop.user_id === userId) {
    return prop;
  }
  return undefined;
}

export async function deletePropertyLocally(propertyId: string, userId: string, addToQueue: boolean = true): Promise<void> {
  const db = await getLocalDB();
  const existing = await db.get('properties', propertyId);
  if (!existing || existing.user_id !== userId) {
    return; // Cannot delete another user's property
  }

  const tx = db.transaction(['properties', 'sync_queue'], 'readwrite');
  await tx.objectStore('properties').delete(propertyId);

  if (addToQueue) {
    const queueItem: SyncQueueItem = {
      queue_id: 'sync_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
      user_id: userId,
      entity_type: 'property',
      action: 'delete',
      entity_id: propertyId,
      payload: { property_id: propertyId },
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    await tx.objectStore('sync_queue').put(queueItem);
  }

  await tx.done;
}

export async function bulkReplaceUserPropertiesLocally(userId: string, serverProperties: Property[]): Promise<void> {
  const db = await getLocalDB();
  const tx = db.transaction('properties', 'readwrite');
  const store = tx.objectStore('properties');

  // Keep local-only pending creations
  const existing = await store.index('by-user').getAll(userId);
  const pendingCreations = existing.filter(p => p.is_local_only);
  const pendingIds = new Set(pendingCreations.map(p => p.property_id));

  // Remove existing synced properties for this user
  for (const p of existing) {
    if (!pendingIds.has(p.property_id)) {
      await store.delete(p.property_id);
    }
  }

  // Put new server properties
  for (const sp of serverProperties) {
    // If not in pending creations, save
    if (!pendingIds.has(sp.property_id)) {
      await store.put(sp);
    }
  }

  await tx.done;
}

// ================= SYNC QUEUE OPERATIONS =================

export async function getPendingSyncQueue(userId: string): Promise<SyncQueueItem[]> {
  const db = await getLocalDB();
  const allForUser = await db.getAllFromIndex('sync_queue', 'by-user', userId);
  return allForUser.filter(item => item.status === 'pending' || item.status === 'failed');
}

export async function updateSyncQueueItemStatus(
  queueId: string, 
  status: SyncQueueItem['status'], 
  errorMessage?: string
): Promise<void> {
  const db = await getLocalDB();
  const item = await db.get('sync_queue', queueId);
  if (item) {
    item.status = status;
    if (errorMessage) item.error_message = errorMessage;
    await db.put('sync_queue', item);
  }
}

export async function removeSyncQueueItem(queueId: string): Promise<void> {
  const db = await getLocalDB();
  await db.delete('sync_queue', queueId);
}

export async function clearAllSyncedQueueItems(userId: string): Promise<void> {
  const db = await getLocalDB();
  const all = await db.getAllFromIndex('sync_queue', 'by-user', userId);
  const tx = db.transaction('sync_queue', 'readwrite');
  for (const item of all) {
    if (item.status === 'synced') {
      await tx.store.delete(item.queue_id);
    }
  }
  await tx.done;
}

// ================= SESSION PERSISTENCE =================

export async function saveSessionLocally(session: AuthSession): Promise<void> {
  const db = await getLocalDB();
  await db.put('key_value', {
    key: 'auth_session',
    value: session,
  });
}

export async function getCachedSessionLocally(): Promise<AuthSession | null> {
  try {
    const db = await getLocalDB();
    const entry = await db.get('key_value', 'auth_session');
    if (entry && entry.value) {
      return entry.value as AuthSession;
    }
  } catch (err) {
    console.warn('Error reading local session', err);
  }
  return null;
}

export async function clearSessionLocally(): Promise<void> {
  const db = await getLocalDB();
  await db.delete('key_value', 'auth_session');
}

// ================= OFFLINE STATS =================

export async function getOfflineStats(userId: string): Promise<{
  totalProperties: number;
  availableCount: number;
  soldCount: number;
  onHoldCount: number;
  pendingSyncCount: number;
  totalImagesCount: number;
}> {
  const props = await getUserPropertiesLocally(userId);
  const queue = await getPendingSyncQueue(userId);

  let totalImages = 0;
  for (const p of props) {
    totalImages += p.images ? p.images.length : 0;
  }

  return {
    totalProperties: props.length,
    availableCount: props.filter(p => p.status === 'Available').length,
    soldCount: props.filter(p => p.status === 'Sold').length,
    onHoldCount: props.filter(p => p.status === 'On Hold').length,
    pendingSyncCount: queue.length,
    totalImagesCount: totalImages,
  };
}
