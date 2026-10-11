import React, { useState } from 'react';
import { User, Property, AuthSession, SystemSettings } from '../types';
import { 
  User as UserIcon, 
  ShieldCheck, 
  HardDrive, 
  Lock, 
  LogOut, 
  Key, 
  Building2, 
  Smartphone, 
  Check, 
  AlertCircle,
  Eye,
  Sun,
  Moon,
  Sparkles,
  Glasses,
  Crown,
  CheckCircle2,
  ArrowRight,
  Zap,
  MessageSquare
} from 'lucide-react';
import { formatDate } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

interface MyAccountViewProps {
  user: User;
  propertiesCount: number;
  onLogout: () => void;
  onOpenOwnerControl: () => void;
  onOpenUpgradeModal?: () => void;
  settings?: SystemSettings;
}

export const MyAccountView: React.FC<MyAccountViewProps> = ({
  user,
  propertiesCount,
  onLogout,
  onOpenOwnerControl,
  onOpenUpgradeModal,
  settings,
}) => {
  const { theme, setTheme, eyeShield, toggleEyeShield, isNight } = useTheme();

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold theme-text-main font-brand">
          Settings & Employee Account
        </h1>
        <p className="text-xs theme-text-secondary mt-0.5">
          Office employee profile, visual ergonomics, & device synchronization parameters
        </p>
      </div>

      {/* Visual Ergonomics & Eye-Care Section */}
      <div className="theme-bg-card border theme-border rounded-3xl p-6 theme-shadow space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b theme-border">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <Eye className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base font-bold theme-text-main font-brand flex items-center gap-2">
              <span>Eye-Care & Visual Ergonomics</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold">
                EYE FRIENDLY ACTIVE
              </span>
            </h2>
            <p className="text-xs theme-text-secondary mt-0.5">
              Specially calibrated warm tones to eliminate screen glare, prevent eye fatigue, and minimize blue light strain.
            </p>
          </div>
        </div>

        {/* Theme Mode Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Warm Paper Day Mode */}
          <button
            type="button"
            onClick={() => setTheme('warm-paper')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              theme === 'warm-paper'
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 shadow-xs'
                : 'theme-bg-subtle theme-border hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className={`w-4 h-4 ${theme === 'warm-paper' ? 'text-amber-700' : 'theme-text-tertiary'}`} />
                <span className="text-sm font-bold theme-text-main">Soft Warm Paper</span>
              </div>
              {theme === 'warm-paper' && (
                <span className="w-2 h-2 rounded-full bg-amber-600" />
              )}
            </div>
            <p className="text-xs theme-text-secondary mt-1.5 leading-relaxed">
              Anti-glare warm cream palette. Recommended for office and daylight work to prevent pupil contraction.
            </p>
          </button>

          {/* Soothing Twilight Night Mode */}
          <button
            type="button"
            onClick={() => setTheme('soothing-twilight')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              theme === 'soothing-twilight'
                ? 'bg-slate-800/80 border-amber-400 shadow-xs'
                : 'theme-bg-subtle theme-border hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className={`w-4 h-4 ${theme === 'soothing-twilight' ? 'text-amber-400' : 'theme-text-tertiary'}`} />
                <span className="text-sm font-bold theme-text-main">Soothing Twilight</span>
              </div>
              {theme === 'soothing-twilight' && (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </div>
            <p className="text-xs theme-text-secondary mt-1.5 leading-relaxed">
              Warm charcoal night palette with amber accents. Prevents dark-room glare and avoids pitch-black astigmatism halo.
            </p>
          </button>
        </div>

        {/* Eye Shield Toggle */}
        <div className="pt-2 flex items-center justify-between p-3.5 rounded-xl theme-bg-subtle border theme-border">
          <div className="flex items-center gap-2.5">
            <Glasses className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <div>
              <div className="text-xs font-semibold theme-text-main">
                Eye Shield (Blue Light Barrier)
              </div>
              <div className="text-[11px] theme-text-secondary">
                Softens harsh spectral spikes with an extra warm optical tint for long data-entry sessions.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleEyeShield}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              eyeShield ? 'bg-amber-600' : 'bg-stone-300 dark:bg-stone-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                eyeShield ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Membership & Paid Version / Ad-Free Status Card */}
      <div className="theme-bg-card border theme-border rounded-3xl p-6 theme-shadow space-y-4">
        <div className="flex items-center justify-between pb-4 border-b theme-border">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              user.is_ad_free || user.role === 'owner'
                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                : 'bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700'
            }`}>
              <Crown className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold theme-text-main font-brand flex items-center gap-2">
                <span>Account Plan & Ad-Free Status</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider border bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-400/40">
                  {user.role === 'owner' ? 'MASTER ACCOUNT' : user.is_ad_free ? 'PAID PRO ACTIVE' : 'FREE TIER'}
                </span>
              </h2>
              <p className="text-xs theme-text-secondary mt-0.5">
                The free tier includes sponsored partner ads, while the Paid Pro tier removes all ads permanently.
              </p>
            </div>
          </div>
        </div>

        {/* Current Tier Details */}
        {user.role === 'owner' ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-400/40 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-200 font-brand">
              <Crown className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>Executive Director & Owner — 100% Ad-Free Master Plan</span>
            </div>
            <p className="text-xs theme-text-secondary leading-relaxed">
              As administrator, all ads are completely disabled for your account, and you have full authority to manage monetization, ads, and user subscription tiers.
            </p>
          </div>
        ) : user.is_ad_free || user.subscription_tier === 'pro' ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-emerald-500/10 border border-amber-400/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-600 fill-amber-500" />
                <span className="text-sm font-bold text-amber-900 dark:text-amber-200 font-brand">
                  CM Vault Pro — 100% Ad-Free Paid Version
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-600 text-white shadow-xs">
                ACTIVE ✅
              </span>
            </div>

            <p className="text-xs theme-text-secondary">
              Congratulations! Your account is 100% ad-free with full Pro features enabled.
              {user.subscription_expires_at && (
                <span className="block font-mono text-[11px] text-amber-800 dark:text-amber-300 mt-1">
                  Subscription Expiry: {formatDate(user.subscription_expires_at)}
                </span>
              )}
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-800 dark:text-slate-200 pt-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero Advertisements</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified PRO Realtor Badge</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fast Cloud Priority Sync</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>24/7 VIP Admin Support</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-blue-50 dark:from-slate-900 dark:via-sky-950/20 dark:to-slate-900 border border-sky-300 dark:border-sky-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold theme-text-main font-brand">
                  Free Tier (Ad-Supported)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-200 dark:bg-sky-900 text-sky-900 dark:text-sky-200">
                  Ads Enabled
                </span>
              </div>
              <span className="text-sm font-extrabold text-amber-700 dark:text-amber-400 font-brand">
                PKR {(settings?.pro_monthly_price_pkr || 1500).toLocaleString()} / Month
              </span>
            </div>

            <p className="text-xs theme-text-secondary leading-relaxed">
              Sponsored real estate partners and relevant service promotions appear on this free plan. Upgrade to the Pro version to enjoy a 100% ad-free experience and receive the Verified Gold Badge.
            </p>

            <button
              onClick={onOpenUpgradeModal}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 transition active:scale-98"
            >
              <Crown className="w-4 h-4 fill-white" />
              <span>Upgrade to Paid Ad-Free Version</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Account Info Card */}
      <div className="theme-bg-card border theme-border rounded-3xl p-6 theme-shadow space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b theme-border">
          <div className="w-14 h-14 rounded-2xl bg-amber-600 dark:bg-amber-500 text-white font-bold font-mono text-xl flex items-center justify-center shadow-md shadow-amber-600/20">
            {user.username.replace('EMP-', '') || 'U'}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold theme-text-main font-brand">
                {user.full_name}
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                {user.role === 'owner' ? 'EXECUTIVE' : 'OFFICE EMPLOYEE'}
              </span>
            </div>
            <p className="text-xs theme-text-secondary font-mono mt-0.5">
              Employee ID: <strong className="theme-text-main">{user.username}</strong> · User ID: {user.user_id}
            </p>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl theme-bg-subtle border theme-border">
            <span className="theme-text-tertiary text-[11px] block">Assigned Role</span>
            <span className="text-sm font-semibold theme-text-main mt-0.5 block">
              {user.role === 'owner' ? 'System Director / Owner' : 'Real Estate Employee'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl theme-bg-subtle border theme-border">
            <span className="theme-text-tertiary text-[11px] block">Private Properties Listed</span>
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-300 font-brand mt-0.5 block">
              {propertiesCount} Records Isolated to You
            </span>
          </div>

          <div className="p-3.5 rounded-xl theme-bg-subtle border theme-border">
            <span className="theme-text-tertiary text-[11px] block">Data Privacy Mode</span>
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5 block flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Full Isolation Active</span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl theme-bg-subtle border theme-border">
            <span className="theme-text-tertiary text-[11px] block">Offline Database</span>
            <span className="text-sm font-semibold theme-text-main mt-0.5 block">
              IndexedDB Storage Sync
            </span>
          </div>
        </div>

        {/* Account Security Policy */}
        <div className="p-4 rounded-2xl theme-bg-subtle border theme-border text-xs theme-text-secondary space-y-1.5">
          <div className="font-semibold theme-text-main">Office Security Rules:</div>
          <p>• User data is strictly isolated: other employees cannot access or view your housing records.</p>
          <p>• Passwords and accounts are managed through the central office administration.</p>
          <p>• No phone numbers or external customer contact details are stored in this system.</p>
        </div>

        {/* Logout Action */}
        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition shadow-xs active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Account</span>
          </button>
        </div>
      </div>

      {/* Owner Console link (only visible if logged-in user is explicitly Owner) */}
      {user.role === 'owner' && (
        <div className="pt-4 border-t theme-border text-center">
          <button
            onClick={onOpenOwnerControl}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-100 dark:bg-sky-950/40 hover:bg-sky-200 dark:hover:bg-sky-900/50 text-sky-900 dark:text-sky-300 border border-sky-300 dark:border-sky-700 text-xs font-semibold transition"
          >
            <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Open Executive Administration Console</span>
          </button>
        </div>
      )}
    </div>
  );
};
