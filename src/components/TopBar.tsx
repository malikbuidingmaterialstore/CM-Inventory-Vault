import React from 'react';
import { BrandLogo } from './BrandLogo';
import { User, ViewMode } from '../types';
import { 
  LogOut, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  PlusCircle, 
  Sun, 
  Moon, 
  Eye,
  User as UserIcon,
  ShieldCheck,
  Crown
} from 'lucide-react';
import { syncService } from '../services/syncService';
import { useTheme } from '../context/ThemeContext';

interface TopBarProps {
  user: User;
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onLogout: () => void;
  isOnline: boolean;
  pendingSyncCount: number;
  onOpenUpgradeModal?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  currentView,
  onNavigate,
  onLogout,
  isOnline,
  pendingSyncCount,
  onOpenUpgradeModal,
}) => {
  const [isSyncing, setIsSyncing] = React.useState(false);
  const { theme: _theme, toggleTheme, eyeShield, toggleEyeShield, isNight } = useTheme();

  const handleQuickSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    await syncService.triggerSync(user.user_id);
    setIsSyncing(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full theme-bg-card theme-text-main border-b theme-border shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Zone 1: Brand & Logo */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-left focus:outline-none group shrink-0 min-h-[44px]"
          aria-label="Go to Dashboard"
        >
          <img
            src="/logo.png"
            alt="CM INVENTORY VAULT"
            className="h-8 sm:h-10 w-auto max-w-[170px] sm:max-w-[220px] object-contain filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.35)]"
          />
        </button>

        {/* Desktop Quick Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              currentView === 'dashboard'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'theme-text-secondary hover:theme-text-main hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('my_properties')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              currentView === 'my_properties'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'theme-text-secondary hover:theme-text-main hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            My Listings
          </button>
          <button
            onClick={() => onNavigate('videos')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              currentView === 'videos' || currentView === 'tiktok_videos'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'theme-text-secondary hover:theme-text-main hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            Videos
          </button>
          <button
            onClick={() => onNavigate('search')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              currentView === 'search'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'theme-text-secondary hover:theme-text-main hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            Search
          </button>
        </nav>

        {/* Zone 2: Mobile & Desktop Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile Single-Tap Theme Toggle (< sm) */}
          <button
            onClick={toggleTheme}
            className="sm:hidden p-2 rounded-xl border theme-border theme-bg-subtle text-amber-700 dark:text-amber-400 active:scale-95 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
            title={isNight ? 'Switch to Soft Day mode' : 'Switch to Midnight Dark mode'}
            aria-label="Toggle Theme"
          >
            {isNight ? (
              <Sun className="w-4 h-4 text-sky-300" />
            ) : (
              <Moon className="w-4 h-4 text-sky-700" />
            )}
          </button>

          {/* Desktop Dual Theme Switcher (>= sm) */}
          <div className="hidden sm:flex items-center bg-black/5 dark:bg-white/10 rounded-xl p-1 border theme-border">
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                !isNight
                  ? 'bg-white text-sky-900 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Soft Day Mode"
            >
              <Sun className={`w-3.5 h-3.5 ${!isNight ? 'text-sky-600' : ''}`} />
              <span className="hidden md:inline text-[11px] font-semibold">Day</span>
            </button>
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                isNight
                  ? 'bg-slate-800 text-sky-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Midnight Navy Mode"
            >
              <Moon className={`w-3.5 h-3.5 ${isNight ? 'text-sky-400' : ''}`} />
              <span className="hidden md:inline text-[11px] font-semibold">Night</span>
            </button>
          </div>

          {/* Eye Shield Button (Anti-Fatigue Filter - visible on >= sm to prevent mobile crowd) */}
          <button
            onClick={toggleEyeShield}
            className={`hidden sm:flex p-2 rounded-xl border text-xs font-medium transition min-h-[40px] min-w-[40px] items-center justify-center ${
              eyeShield
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 shadow-xs'
                : 'theme-border theme-text-tertiary hover:theme-text-main hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title={eyeShield ? 'Eye Shield ON' : 'Turn Eye Shield ON'}
            aria-label="Toggle Eye Shield"
          >
            <Eye className={`w-4 h-4 ${eyeShield ? 'stroke-[2.5] text-amber-600 dark:text-amber-400' : ''}`} />
          </button>

          {/* Online / Offline Sync Badge */}
          <button
            onClick={handleQuickSync}
            disabled={!isOnline || isSyncing}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium transition active:scale-95 border min-h-[34px] sm:min-h-[36px] ${
              !isOnline
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70'
                : pendingSyncCount > 0
                ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700/60 animate-pulse'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60'
            }`}
            title={!isOnline ? 'Offline Mode' : pendingSyncCount > 0 ? `${pendingSyncCount} changes to sync` : 'All records synced'}
          >
            {!isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-[10px] sm:text-[11px] font-semibold hidden xs:inline">Offline</span>
                {pendingSyncCount > 0 && (
                  <span className="px-1 text-[10px] rounded-full bg-amber-500/30 text-amber-900 dark:text-amber-200 font-bold">
                    {pendingSyncCount}
                  </span>
                )}
              </>
            ) : (
              <>
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 animate-spin" />
                ) : (
                  <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
                <span className="text-[10px] sm:text-[11px] font-medium hidden sm:inline">
                  {isSyncing ? 'Syncing...' : pendingSyncCount > 0 ? `${pendingSyncCount}` : 'Synced'}
                </span>
              </>
            )}
          </button>

          {/* PRO Ad-Free Badge or Remove Ads Button */}
          {user.is_ad_free || user.role === 'owner' ? (
            <div 
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/40 text-amber-800 dark:text-amber-300 font-bold text-[11px] shadow-xs select-none"
              title="Verified Ad-Free PRO Account"
            >
              <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-600 dark:text-amber-400" />
              <span>PRO (Ad-Free)</span>
            </div>
          ) : (
            <button
              onClick={onOpenUpgradeModal}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-amber-500/20 hover:from-amber-500/30 hover:to-amber-500/30 border border-amber-400/60 text-amber-800 dark:text-amber-300 font-bold text-[10px] sm:text-[11px] shadow-xs active:scale-95 transition"
              title="Upgrade to remove all ads and get verified Pro badge"
            >
              <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Remove Ads (PRO)</span>
              <span className="sm:hidden">No Ads</span>
            </button>
          )}

          {/* Desktop Add Property button */}
          <button
            onClick={() => onNavigate('add_property')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md shadow-amber-600/20 active:scale-95 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Plot</span>
          </button>

          {/* User Avatar & Logout */}
          <div className="flex items-center gap-1 pl-1 sm:pl-2 border-l theme-border">
            {/* Admin Vault Console button - strictly visible to authenticated owner */}
            {user.role === 'owner' && (
              <button
                onClick={() => onNavigate(currentView === 'owner_control' ? 'dashboard' : 'owner_control')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  currentView === 'owner_control'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                }`}
                title={currentView === 'owner_control' ? 'Exit Admin Vault' : 'Open Admin Vault'}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">Admin Vault</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('my_account')}
              className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition min-h-[38px] min-w-[38px] justify-center"
              title="My Account"
              aria-label="My Account"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 font-mono text-xs font-bold flex items-center justify-center">
                {user.username.replace('EMP-', '') || <UserIcon className="w-4 h-4" />}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold theme-text-main leading-tight truncate max-w-[80px]">
                  {user.username}
                </div>
              </div>
            </button>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="p-1.5 sm:p-2 rounded-lg theme-text-tertiary hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
