import React from 'react';
import { User, Property, ViewMode, SponsorAd } from '../types';
import { SponsorAdBanner } from '../components/SponsorAdBanner';
import { 
  Search, 
  PlusCircle, 
  Building2, 
  Images, 
  Video, 
  HardDrive, 
  CloudLightning, 
  UserCheck, 
  LogOut,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Sun,
  Moon,
  Crown
} from 'lucide-react';
import { formatPKR, formatDate } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

interface DashboardViewProps {
  user: User;
  properties: Property[];
  pendingSyncCount: number;
  isOnline: boolean;
  onNavigate: (view: ViewMode) => void;
  onSelectProperty: (property: Property) => void;
  onLogout: () => void;
  sponsorAds?: SponsorAd[];
  adsEnabled?: boolean;
  googleAdClient?: string;
  googleAdSlot?: string;
  onOpenUpgradeModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  properties,
  pendingSyncCount,
  isOnline,
  onNavigate,
  onSelectProperty,
  onLogout,
  sponsorAds = [],
  adsEnabled = true,
  googleAdClient,
  googleAdSlot,
  onOpenUpgradeModal,
}) => {
  const { theme, toggleTheme, isNight } = useTheme();

  // Compute user metrics
  const availableCount = properties.filter(p => p.status === 'Available').length;
  const onHoldCount = properties.filter(p => p.status === 'On Hold').length;
  const soldCount = properties.filter(p => p.status === 'Sold').length;

  let totalImages = 0;
  let totalVideos = 0;
  properties.forEach(p => {
    if (p.images) totalImages += p.images.length;
    if (p.videos) {
      totalVideos += p.videos.length;
    } else if (p.tiktok_links) {
      totalVideos += p.tiktok_links.length;
    }
  });

  // Recent 3 properties
  const recentProperties = properties.slice(0, 3);

  // Core navigation operational items
  const mainActions = [
    {
      id: 'search' as ViewMode,
      title: 'Search Property',
      description: 'Search by society, block, plot #, rate, or status',
      icon: Search,
      iconColor: 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      badge: `${properties.length} plots`,
    },
    {
      id: 'add_property' as ViewMode,
      title: 'Add Property',
      description: 'Register new housing record, rates, photos & videos',
      icon: PlusCircle,
      iconColor: 'bg-sky-600 dark:bg-sky-500 text-white border-sky-600 shadow-md shadow-sky-600/30',
      isHighlight: true,
    },
    {
      id: 'my_properties' as ViewMode,
      title: 'My Listings',
      description: 'View & manage your private property listings & records',
      icon: Building2,
      iconColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      badge: `${properties.length} total`,
    },
    {
      id: 'videos' as ViewMode,
      title: 'Property Videos',
      description: 'Video tours on YouTube, Instagram, TikTok & Facebook',
      icon: Video,
      iconColor: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
      badge: `${totalVideos} videos`,
    },
    {
      id: 'image_gallery' as ViewMode,
      title: 'Image Gallery',
      description: 'Browse all plot & villa photos in high resolution',
      icon: Images,
      iconColor: 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      badge: `${totalImages} photos`,
    },
    {
      id: 'offline_data' as ViewMode,
      title: 'Offline Data',
      description: 'Local IndexedDB storage metrics & offline records',
      icon: HardDrive,
      iconColor: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
    {
      id: 'sync_status' as ViewMode,
      title: 'Sync Status',
      description: 'Queue monitor & cloud database synchronizer',
      icon: CloudLightning,
      iconColor: 'bg-teal-100 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      badge: pendingSyncCount > 0 ? `${pendingSyncCount} pending` : 'Synced',
    },
    {
      id: 'my_account' as ViewMode,
      title: 'Settings / Account',
      description: 'Employee details & eye-care screen preferences',
      icon: UserCheck,
      iconColor: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 space-y-5 sm:space-y-6 font-sans">
      {/* Welcome Banner - CM INVENTORY WALLET Gold & Onyx Container */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl theme-bg-card border theme-border p-4 sm:p-7 theme-shadow transition-colors">
        {/* Subtle Gold / Amber ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 dark:bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-mono font-bold text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-500/20 px-2 py-0.5 rounded-md border border-sky-300 dark:border-sky-500/30">
                {user.username}
              </span>
              {user.is_ad_free || user.role === 'owner' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40">
                  <Crown className="w-3 h-3 fill-amber-500 text-amber-600 dark:text-amber-400" />
                  <span>PRO (Ad-Free Active)</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onOpenUpgradeModal}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 transition"
                  title="Click to upgrade to Ad-Free version"
                >
                  <Crown className="w-3 h-3 text-amber-600" />
                  <span>Free Tier (Go Ad-Free ⭐)</span>
                </button>
              )}
              <span className="theme-text-tertiary">·</span>
              <span className="text-xs text-amber-700 dark:text-amber-300 font-bold truncate">CM INVENTORY WALLET</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold theme-text-main tracking-tight font-brand">
              Welcome, {user.full_name}
            </h1>
            <p className="text-xs sm:text-sm theme-text-secondary mt-1 max-w-xl leading-relaxed">
              Real estate management dashboard. Manage your plots, housing schemes, buyer offers, and multimedia tours.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('add_property')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-amber-600/20 active:scale-95 min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Add Housing / Plot</span>
            </button>
          </div>
        </div>

        {/* Quick Stat Bar - Eye-Comfort Matte Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 pt-4 border-t theme-border">
          <div className="theme-bg-subtle rounded-xl sm:rounded-2xl p-3 sm:p-4 border theme-border">
            <div className="text-[11px] sm:text-xs font-semibold theme-text-secondary">Total Listings</div>
            <div className="text-xl sm:text-3xl font-bold theme-text-main mt-0.5 sm:mt-1 tabular-nums font-brand">
              {properties.length}
            </div>
          </div>
          <div className="theme-bg-subtle rounded-xl sm:rounded-2xl p-3 sm:p-4 border theme-border">
            <div className="text-[11px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-400">Available</div>
            <div className="text-xl sm:text-3xl font-bold text-emerald-800 dark:text-emerald-300 mt-0.5 sm:mt-1 tabular-nums font-brand">
              {availableCount}
            </div>
          </div>
          <div className="theme-bg-subtle rounded-xl sm:rounded-2xl p-3 sm:p-4 border theme-border">
            <div className="text-[11px] sm:text-xs font-semibold text-amber-700 dark:text-amber-400">On Hold</div>
            <div className="text-xl sm:text-3xl font-bold text-amber-800 dark:text-amber-300 mt-0.5 sm:mt-1 tabular-nums font-brand">
              {onHoldCount}
            </div>
          </div>
          <div className="theme-bg-subtle rounded-xl sm:rounded-2xl p-3 sm:p-4 border theme-border">
            <div className="text-[11px] sm:text-xs font-semibold text-rose-700 dark:text-rose-400">Sold</div>
            <div className="text-xl sm:text-3xl font-bold text-rose-800 dark:text-rose-300 mt-0.5 sm:mt-1 tabular-nums font-brand">
              {soldCount}
            </div>
          </div>
        </div>
      </div>

      {/* Sponsored Partner Advertisement Banner (Only visible to Free Tier users; hidden for Pro / Owner) */}
      <SponsorAdBanner
        user={user}
        ads={sponsorAds}
        adsEnabled={adsEnabled}
        googleAdClient={googleAdClient}
        googleAdSlot={googleAdSlot}
        onOpenUpgradeModal={onOpenUpgradeModal || (() => {})}
      />

      {/* Main Touch-Friendly Operations Grid */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider theme-text-main font-brand">
            Main Operations
          </h2>
          <span className="text-[11px] theme-text-tertiary">Quick access</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {mainActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => onNavigate(action.id)}
                className={`relative group flex flex-col justify-between p-3.5 sm:p-5 rounded-2xl text-left transition-all duration-200 border min-h-[110px] sm:min-h-[125px] active:scale-[0.97] theme-shadow ${
                  action.isHighlight
                    ? 'theme-bg-card border-sky-400 dark:border-sky-500 hover:border-sky-500 shadow-sm shadow-sky-600/10'
                    : 'theme-bg-card hover:theme-bg-subtle theme-border hover:border-sky-400 dark:hover:border-sky-600'
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <div className={`p-2 sm:p-2.5 rounded-xl border ${action.iconColor}`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
                  </div>
                  {action.badge && (
                    <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full theme-bg-subtle theme-text-secondary border theme-border truncate max-w-[70px] sm:max-w-none">
                      {action.badge}
                    </span>
                  )}
                </div>

                <div className="mt-2.5 sm:mt-4">
                  <h3 className="text-xs sm:text-sm font-bold theme-text-main group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center justify-between">
                    <span className="truncate">{action.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 theme-text-tertiary group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                  </h3>
                  <p className="text-[11px] sm:text-xs theme-text-secondary mt-0.5 line-clamp-1 leading-normal hidden xs:block">
                    {action.description}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Logout Action */}
          <button
            onClick={onLogout}
            className="group flex flex-col justify-between p-3.5 sm:p-5 rounded-2xl text-left transition-all duration-200 border border-rose-200 dark:border-rose-900/50 min-h-[110px] sm:min-h-[125px] active:scale-[0.97] bg-rose-50/60 hover:bg-rose-100/70 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 theme-shadow"
          >
            <div className="flex items-start justify-between w-full">
              <div className="p-2 sm:p-2.5 rounded-xl bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-4">
              <h3 className="text-xs sm:text-sm font-bold text-rose-800 dark:text-rose-300 transition-colors">
                Sign Out
              </h3>
              <p className="text-[11px] sm:text-xs text-rose-700/80 dark:text-rose-400 mt-0.5 hidden xs:block">
                Close session
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Properties Section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider theme-text-main font-brand">
            Recent Housing Records ({properties.length})
          </h2>
          <button
            onClick={() => onNavigate('my_properties')}
            className="text-xs text-sky-700 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 font-semibold flex items-center gap-1"
          >
            <span>View All Listings</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentProperties.length === 0 ? (
          <div className="text-center py-12 theme-bg-card rounded-3xl border theme-border p-6 theme-shadow">
            <Building2 className="w-12 h-12 theme-text-tertiary mx-auto mb-2 opacity-50" />
            <h3 className="text-base font-bold theme-text-main font-brand">No properties added yet</h3>
            <p className="text-xs theme-text-secondary mt-1 max-w-sm mx-auto">
              Start by adding your first plot, society, rates, and pictures to build your private inventory.
            </p>
            <button
              onClick={() => onNavigate('add_property')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white text-xs font-bold transition shadow-md shadow-sky-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add First Property</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentProperties.map((prop) => {
              const priceInfo = formatPKR(prop.price);
              const hasImages = prop.images && prop.images.length > 0;
              const hasVideos = (prop.videos && prop.videos.length > 0) || (prop.tiktok_links && prop.tiktok_links.length > 0);
              const isSold = prop.status === 'Sold';

              return (
                <div
                  key={prop.property_id}
                  onClick={() => onSelectProperty(prop)}
                  className={`group theme-bg-card hover:theme-bg-subtle border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 theme-shadow flex flex-col justify-between ${
                    isSold ? 'border-rose-300 dark:border-rose-900/60' : 'theme-border hover:border-sky-400 dark:hover:border-sky-600'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative h-44 w-full bg-stone-200 dark:bg-stone-900 overflow-hidden">
                    {hasImages ? (
                      <img
                        src={prop.images[0].image_url}
                        alt={`${prop.society} Plot ${prop.plot_number}`}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          isSold ? 'grayscale-[20%] group-hover:scale-105' : 'group-hover:scale-105'
                        }`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center theme-bg-subtle theme-text-tertiary">
                        <Building2 className="w-10 h-10 opacity-30 mb-1" />
                        <span className="text-[11px] font-medium">No Photo Uploaded</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-md shadow-xs uppercase tracking-wide ${
                          prop.status === 'Available'
                            ? 'bg-emerald-600 text-white'
                            : prop.status === 'On Hold'
                            ? 'bg-amber-600 text-white'
                            : 'bg-rose-600 text-white border border-rose-500'
                        }`}
                      >
                        {prop.status === 'Sold' ? 'SOLD' : prop.status}
                      </span>
                    </div>

                    {/* Video indicator */}
                    {hasVideos && (
                      <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                        <Video className="w-3 h-3 text-sky-300" />
                        <span>Video Tour</span>
                      </div>
                    )}

                    {/* Size tag */}
                    <div className="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-2.5 py-0.5 rounded">
                      {prop.plot_size}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-sky-800 dark:text-sky-300 font-semibold">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{prop.society}</span>
                      </div>

                      <h3 className="text-base font-bold theme-text-main mt-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        Plot #{prop.plot_number} · {prop.block || prop.phase || 'General'}
                      </h3>

                      <p className="text-xs theme-text-secondary mt-1 line-clamp-1">
                        {prop.notes || `${prop.plot_size} ${prop.plot_type} in ${prop.society}, ${prop.town}`}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t theme-border flex items-center justify-between">
                      <div>
                        <div className="text-base font-bold theme-text-main font-brand">
                          {priceInfo.short}
                        </div>
                        <div className="text-[10px] theme-text-tertiary font-mono">
                          {priceInfo.full}
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-sky-700 dark:text-sky-400 group-hover:underline">
                        Details &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
