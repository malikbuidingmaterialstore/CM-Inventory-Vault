/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Property, 
  PropertyStatus,
  PropertyImage, 
  AuthSession, 
  ViewMode,
  SystemSettings,
  SponsorAd
} from './types';
import { api } from './services/api';
import { 
  saveSessionLocally, 
  getCachedSessionLocally, 
  clearSessionLocally, 
  getUserPropertiesLocally, 
  savePropertyLocally, 
  deletePropertyLocally,
  bulkReplaceUserPropertiesLocally,
  getPendingSyncQueue
} from './services/db';
import { syncService } from './services/syncService';
import { LoginView } from './views/LoginView';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { SyncBanner } from './components/SyncBanner';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { DashboardView } from './views/DashboardView';
import { AddPropertyView } from './views/AddPropertyView';
import { MyPropertiesView } from './views/MyPropertiesView';
import { PropertyDetailsView } from './views/PropertyDetailsView';
import { SearchPropertyView } from './views/SearchPropertyView';
import { ImageGalleryView } from './views/ImageGalleryView';
import { TikTokVideosView } from './views/TikTokVideosView';
import { OfflineDataView } from './views/OfflineDataView';
import { SyncStatusView } from './views/SyncStatusView';
import { MyAccountView } from './views/MyAccountView';
import { OwnerControlView } from './views/OwnerControlView';

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Advertisements & Paid Version (Ad-Free) states
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [sponsorAds, setSponsorAds] = useState<SponsorAd[]>([]);
  const [adsEnabled, setAdsEnabled] = useState<boolean>(true);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);

  // Load system settings & active sponsor ads
  const loadSystemSettings = useCallback(async () => {
    try {
      const res = await api.getSettings();
      if (res) {
        setSettings(res);
        setAdsEnabled(res.ads_enabled !== false);
        if (res.sponsor_ads) {
          setSponsorAds(res.sponsor_ads);
        }
      }
    } catch (err) {
      console.warn('Failed to load settings', err);
    }
  }, []);

  const handleUpgradeSuccess = async (updatedUser: User) => {
    if (session) {
      const newSession: AuthSession = {
        ...session,
        user: updatedUser,
      };
      setSession(newSession);
      await saveSessionLocally(newSession);
    }
    await loadSystemSettings();
  };

  // Monitor online / offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (session) {
        syncService.triggerSync(session.user.user_id).then(() => {
          loadUserProperties(session.user.user_id);
        });
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubSync = syncService.subscribe((status) => {
      setPendingSyncCount(status.pendingCount);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubSync();
    };
  }, [session]);

  // Load properties for current user strictly from IndexedDB
  const loadUserProperties = useCallback(async (userId: string) => {
    try {
      const localProps = await getUserPropertiesLocally(userId);
      setProperties(localProps);
      const queue = await getPendingSyncQueue(userId);
      setPendingSyncCount(queue.length);
    } catch (err) {
      console.warn('Error loading local properties', err);
    }
  }, []);

  // Initialization: check cached session in IndexedDB
  useEffect(() => {
    async function init() {
      try {
        const cached = await getCachedSessionLocally();
        if (cached && cached.user) {
          setSession(cached);
          localStorage.setItem('property_hub_token', cached.token);
          localStorage.setItem('property_hub_current_user_id', cached.user.user_id);
          if (cached.user.role === 'owner') {
            setCurrentView('owner_control');
          }
          await loadUserProperties(cached.user.user_id);
          await loadSystemSettings();

          // If online, perform background sync
          if (navigator.onLine) {
            syncService.triggerSync(cached.user.user_id).then(async (res) => {
              if (res.success) {
                await loadUserProperties(cached.user.user_id);
              }
            });
          }
        } else {
          // Even if not logged in, fetch settings
          await loadSystemSettings();
        }
      } catch (err) {
        console.error('Initialization error', err);
      } finally {
        setIsInitializing(false);
      }
    }
    init();
  }, [loadUserProperties, loadSystemSettings]);

  const handleLoginSuccess = async (newSession: AuthSession) => {
    setSession(newSession);
    if (newSession.user.role === 'owner') {
      setCurrentView('owner_control');
    } else {
      setCurrentView('dashboard');
    }
    await loadUserProperties(newSession.user.user_id);
    await loadSystemSettings();

    if (navigator.onLine) {
      syncService.triggerSync(newSession.user.user_id).then(async () => {
        await loadUserProperties(newSession.user.user_id);
      });
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('property_hub_token');
    localStorage.removeItem('property_hub_current_user_id');
    await clearSessionLocally();
    setSession(null);
    setProperties([]);
    setSelectedProperty(null);
    setEditingProperty(null);
    setCurrentView('dashboard');
  };

  // Property Actions
  const handleSaveProperty = async (prop: Property) => {
    if (!session) return;
    // Save to IndexedDB locally & queue for sync
    await savePropertyLocally(prop, true);
    await loadUserProperties(session.user.user_id);

    // If online, trigger cloud sync in background
    if (navigator.onLine) {
      syncService.triggerSync(session.user.user_id).then(() => {
        loadUserProperties(session.user.user_id);
      });
    }

    // Navigate to details
    setSelectedProperty(prop);
    setEditingProperty(null);
    setCurrentView('property_details');
  };

  const handleDeleteProperty = async (propId: string) => {
    if (!session) return;
    await deletePropertyLocally(propId, session.user.user_id, true);
    await loadUserProperties(session.user.user_id);

    if (navigator.onLine) {
      syncService.triggerSync(session.user.user_id).then(() => {
        loadUserProperties(session.user.user_id);
      });
    }

    setSelectedProperty(null);
    setCurrentView('my_properties');
  };

  const handleUpdatePropertyStatus = async (
    propId: string,
    newStatus: PropertyStatus,
    note?: string
  ) => {
    if (!session) return;
    const existing = properties.find((p) => p.property_id === propId);
    if (!existing) return;

    const now = new Date().toISOString();
    const actionName =
      newStatus === 'Sold'
        ? 'Marked as Sold'
        : newStatus === 'On Hold'
        ? 'Marked as On Hold'
        : 'Marked as Available';

    const historyEntry = {
      history_id: 'hist_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
      action: actionName as any,
      timestamp: now,
      note: note || `Status changed from ${existing.status} to ${newStatus}`,
      user_id: session.user.user_id,
      username: session.user.username,
    };

    const updatedProp: Property = {
      ...existing,
      status: newStatus,
      sold_at: newStatus === 'Sold' ? (existing.sold_at || now) : existing.sold_at,
      history: [historyEntry, ...(existing.history || [])],
      updated_at: now,
      sync_version: existing.sync_version + 1,
    };

    await savePropertyLocally(updatedProp, true);
    await loadUserProperties(session.user.user_id);

    if (selectedProperty && selectedProperty.property_id === propId) {
      setSelectedProperty(updatedProp);
    }

    if (navigator.onLine) {
      syncService.triggerSync(session.user.user_id);
    }
  };

  const handleAddImages = async (propId: string, newImages: PropertyImage[]) => {
    if (!session) return;
    const existing = properties.find((p) => p.property_id === propId);
    if (!existing) return;

    const updatedProp: Property = {
      ...existing,
      images: [...(existing.images || []), ...newImages],
      updated_at: new Date().toISOString(),
      sync_version: existing.sync_version + 1,
    };

    await savePropertyLocally(updatedProp, true);
    await loadUserProperties(session.user.user_id);
    setSelectedProperty(updatedProp);

    if (navigator.onLine) {
      syncService.triggerSync(session.user.user_id);
    }
  };

  const handleDeleteImage = async (propId: string, imageId: string) => {
    if (!session) return;
    const existing = properties.find((p) => p.property_id === propId);
    if (!existing) return;

    const updatedProp: Property = {
      ...existing,
      images: (existing.images || []).filter((img) => img.image_id !== imageId),
      updated_at: new Date().toISOString(),
      sync_version: existing.sync_version + 1,
    };

    await savePropertyLocally(updatedProp, true);
    await loadUserProperties(session.user.user_id);
    setSelectedProperty(updatedProp);

    if (navigator.onLine) {
      syncService.triggerSync(session.user.user_id);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center theme-bg-main text-amber-600 dark:text-amber-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-600 dark:border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-widest theme-text-tertiary">INITIALIZING PROPERTY HUB...</span>
        </div>
      </div>
    );
  }

  // Not authenticated -> show clean Login screen
  if (!session) {
    return <LoginView onLoginSuccess={handleLoginSuccess} isOnline={isOnline} />;
  }

  return (
    <div className="min-h-screen w-full theme-bg-main theme-text-main flex flex-col font-sans overflow-x-hidden transition-colors duration-200">
      {/* Top Header */}
      <TopBar
        user={session.user}
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'add_property') setEditingProperty(null);
          setCurrentView(view);
        }}
        onLogout={handleLogout}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
      />

      {/* Online / Offline Sync Banner */}
      <SyncBanner
        userId={session.user.user_id}
        onSyncComplete={() => loadUserProperties(session.user.user_id)}
      />

      {/* Main Dynamic View Content */}
      <main className="flex-1 w-full pb-28 sm:pb-10">
        {currentView === 'dashboard' && (
          <DashboardView
            user={session.user}
            properties={properties}
            pendingSyncCount={pendingSyncCount}
            isOnline={isOnline}
            sponsorAds={sponsorAds}
            adsEnabled={adsEnabled}
            googleAdClient={settings?.google_ad_client}
            googleAdSlot={settings?.google_ad_slot}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
            onNavigate={(view) => {
              if (view === 'add_property') setEditingProperty(null);
              setCurrentView(view);
            }}
            onSelectProperty={(prop) => {
              setSelectedProperty(prop);
              setCurrentView('property_details');
            }}
            onLogout={handleLogout}
          />
        )}

        {currentView === 'my_properties' && (
          <MyPropertiesView
            user={session.user}
            properties={properties}
            sponsorAds={sponsorAds}
            adsEnabled={adsEnabled}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
            onSelectProperty={(prop) => {
              setSelectedProperty(prop);
              setCurrentView('property_details');
            }}
            onAddNew={() => {
              setEditingProperty(null);
              setCurrentView('add_property');
            }}
            onEdit={(prop) => {
              setEditingProperty(prop);
              setCurrentView('add_property');
            }}
            onDelete={handleDeleteProperty}
            onUpdateStatus={handleUpdatePropertyStatus}
          />
        )}

        {currentView === 'add_property' && (
          <AddPropertyView
            user={session.user}
            editingProperty={editingProperty}
            existingProperties={properties}
            onSave={handleSaveProperty}
            onCancel={() => {
              setEditingProperty(null);
              setCurrentView('dashboard');
            }}
            onViewExisting={(prop) => {
              setSelectedProperty(prop);
              setEditingProperty(null);
              setCurrentView('property_details');
            }}
            isOnline={isOnline}
          />
        )}

        {currentView === 'property_details' && selectedProperty && (
          <PropertyDetailsView
            user={session.user}
            property={selectedProperty}
            sponsorAds={sponsorAds}
            adsEnabled={adsEnabled}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
            onBack={() => setCurrentView('my_properties')}
            onEdit={(prop) => {
              setEditingProperty(prop);
              setCurrentView('add_property');
            }}
            onDelete={handleDeleteProperty}
            onUpdateStatus={handleUpdatePropertyStatus}
            onAddImages={handleAddImages}
            onDeleteImage={handleDeleteImage}
          />
        )}

        {currentView === 'search' && (
          <SearchPropertyView
            user={session.user}
            properties={properties}
            sponsorAds={sponsorAds}
            adsEnabled={adsEnabled}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
            onSelectProperty={(prop) => {
              setSelectedProperty(prop);
              setCurrentView('property_details');
            }}
          />
        )}

        {currentView === 'image_gallery' && (
          <ImageGalleryView
            user={session.user}
            properties={properties}
            onSelectProperty={(prop) => {
              setSelectedProperty(prop);
              setCurrentView('property_details');
            }}
            onAddImagesToProperty={handleAddImages}
            onDeleteImage={handleDeleteImage}
          />
        )}

        {currentView === 'tiktok_videos' && (
          <TikTokVideosView
            user={session.user}
            properties={properties}
            onSelectProperty={(prop) => {
              setSelectedProperty(prop);
              setCurrentView('property_details');
            }}
            onAddNew={() => {
              setEditingProperty(null);
              setCurrentView('add_property');
            }}
          />
        )}

        {currentView === 'offline_data' && (
          <OfflineDataView
            user={session.user}
            properties={properties}
            isOnline={isOnline}
            onRefresh={() => loadUserProperties(session.user.user_id)}
          />
        )}

        {currentView === 'sync_status' && (
          <SyncStatusView
            user={session.user}
            isOnline={isOnline}
            onRefresh={() => loadUserProperties(session.user.user_id)}
          />
        )}

        {currentView === 'my_account' && (
          <MyAccountView
            user={session.user}
            propertiesCount={properties.length}
            settings={settings || undefined}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
            onLogout={handleLogout}
            onOpenOwnerControl={() => setCurrentView('owner_control')}
          />
        )}

        {currentView === 'owner_control' && session.user.role === 'owner' && (
          <OwnerControlView
            currentUser={session.user}
            onExit={() => setCurrentView('dashboard')}
            onRefreshData={() => loadUserProperties(session.user.user_id)}
            onRefreshSettings={loadSystemSettings}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Mobile Bottom Thumb Navigation */}
      <BottomNav
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'add_property') setEditingProperty(null);
          setCurrentView(view);
        }}
        pendingSyncCount={pendingSyncCount}
      />

      {/* Pro Ad-Free Membership Upgrade Modal */}
      {session && (
        <ProUpgradeModal
          user={session.user}
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          onUpgradeSuccess={handleUpgradeSuccess}
          settings={settings || undefined}
        />
      )}
    </div>
  );
}
