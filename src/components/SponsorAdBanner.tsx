import React, { useState, useEffect } from 'react';
import { SponsorAd, User } from '../types';
import { 
  Sparkles, 
  ExternalLink, 
  Phone, 
  MessageSquare, 
  Crown, 
  ChevronRight, 
  Building, 
  Landmark, 
  ShieldCheck, 
  Zap, 
  Layers,
  X
} from 'lucide-react';

interface SponsorAdBannerProps {
  user: User;
  ads?: SponsorAd[];
  adsEnabled?: boolean;
  googleAdClient?: string;
  googleAdSlot?: string;
  onOpenUpgradeModal: () => void;
  variant?: 'banner' | 'card' | 'compact';
  className?: string;
}

export const SponsorAdBanner: React.FC<SponsorAdBannerProps> = ({
  user,
  ads = [],
  adsEnabled = true,
  googleAdClient,
  googleAdSlot,
  onOpenUpgradeModal,
  variant = 'banner',
  className = '',
}) => {
  // If user is already Ad-Free PRO, or Owner, or ads are globally disabled, NEVER show ads!
  if (user.is_ad_free || user.role === 'owner' || adsEnabled === false) {
    return null;
  }

  // Active custom sponsor ads
  const activeAds = ads.filter(a => a.is_active);

  // Dynamically load Google AdSense script if client is provided
  useEffect(() => {
    if (googleAdClient && typeof window !== 'undefined') {
      const existingScript = document.getElementById('google-adsense-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-adsense-script';
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${googleAdClient}`;
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // ignore adsense push error during hot reload
      }
    }
  }, [googleAdClient, googleAdSlot]);

  // If Google AdSense client & slot are configured, render official Google responsive ad unit
  if (googleAdClient && googleAdSlot) {
    return (
      <div className={`relative overflow-hidden rounded-2xl border theme-border theme-bg-card p-3 my-3 shadow-sm ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
            Google Sponsored Ad
          </span>
          <button
            onClick={onOpenUpgradeModal}
            className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1"
          >
            <Crown className="w-3 h-3 text-amber-600" />
            <span>Remove Ads (PRO)</span>
          </button>
        </div>
        <div className="min-h-[90px] flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-xl overflow-hidden text-center text-xs theme-text-tertiary">
          <ins
            className="adsbygoogle"
            style={{ display: 'block', minWidth: '250px', width: '100%', minHeight: '90px' }}
            data-ad-client={googleAdClient}
            data-ad-slot={googleAdSlot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    );
  }

  if (activeAds.length === 0) {
    return null;
  }

  // Cycle ad index every 12 seconds if multiple ads exist
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (activeAds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % activeAds.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [activeAds.length]);

  const ad = activeAds[currentIdx] || activeAds[0];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Building Materials':
        return <Building className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'Bank Loan':
        return <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Solar & Electric':
        return <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case 'Architect & 3D':
        return <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`relative overflow-hidden rounded-xl border border-sky-200 dark:border-sky-900/50 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/60 dark:from-sky-950/20 dark:via-slate-900/60 dark:to-sky-950/20 p-3 shadow-xs ${className}`}>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-200/60 dark:bg-sky-900/50 text-sky-900 dark:text-sky-300">
              SPONSORED
            </span>
            <span className="text-[10px] text-slate-500 truncate max-w-[130px] font-medium">
              {ad.sponsor_name}
            </span>
          </div>
          <button
            onClick={onOpenUpgradeModal}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline"
            title="Upgrade to remove ads"
          >
            <Crown className="w-3 h-3 text-amber-600" />
            <span>Remove Ads</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {ad.title}
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">
              {ad.tagline || ad.description}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-1">
            {ad.whatsapp && (
              <a
                href={`https://wa.me/${ad.whatsapp.replace(/[^0-9]/g, '')}?text=Assalam-o-Alaikum,%20I%20saw%20your%20ad%20on%20Property%20Hub`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition active:scale-95"
                title="WhatsApp Sponsor"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </a>
            )}
            {ad.phone && (
              <a
                href={`tel:${ad.phone}`}
                className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold transition flex items-center gap-1"
              >
                <Phone className="w-3 h-3" />
                <span className="hidden sm:inline">Call</span>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-sky-300/70 dark:border-sky-800/80 bg-gradient-to-r from-sky-50/90 via-white to-blue-50/70 dark:from-slate-900/90 dark:via-sky-950/30 dark:to-slate-900/80 p-4 sm:p-5 shadow-xs transition-all ${className}`}>
      {/* Decorative ambient subtle glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-400/5 dark:bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Top Banner Meta Header */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-sky-200/60 dark:border-sky-800/50">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-200/70 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200 flex items-center gap-1">
            {getCategoryIcon(ad.category)}
            <span>SPONSORED PARTNER</span>
          </span>
          {ad.badge_label && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-mono hidden xs:inline">
              {ad.badge_label}
            </span>
          )}
        </div>

        {/* Remove Ads / Upgrade to Pro Trigger Button */}
        <button
          onClick={onOpenUpgradeModal}
          className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/40 text-[11px] font-bold transition active:scale-95 shadow-xs"
          title="Upgrade to CM Vault Pro to permanently remove all advertisements"
        >
          <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:rotate-12 transition-transform" />
          <span>Remove Ads (Ad-Free PRO)</span>
          <ChevronRight className="w-3 h-3 text-amber-600" />
        </button>
      </div>

      {/* Main Ad Content */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-brand">
              {ad.title}
            </h3>
            <span className="text-xs text-sky-800 dark:text-sky-300 font-semibold hidden md:inline">
              — {ad.sponsor_name}
            </span>
          </div>

          <p className="text-xs font-semibold text-sky-900 dark:text-sky-300">
            {ad.tagline}
          </p>

          <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
            {ad.description}
          </p>
        </div>

        {/* Sponsor Contact Buttons */}
        <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
          {ad.whatsapp && (
            <a
              href={`https://wa.me/${ad.whatsapp.replace(/[^0-9]/g, '')}?text=Assalam-o-Alaikum,%20I%20saw%20your%20ad%20on%20Property%20Hub`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          )}

          {ad.phone && (
            <a
              href={`tel:${ad.phone}`}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{ad.cta_text || 'Call Now'}</span>
            </a>
          )}

          {ad.cta_link && !ad.phone && !ad.whatsapp && (
            <a
              href={ad.cta_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
            >
              <span>{ad.cta_text || 'Learn More'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Ad Paging Dots if multiple ads */}
      {activeAds.length > 1 && (
        <div className="flex items-center justify-center gap-1 mt-2.5 pt-1.5">
          {activeAds.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIdx
                  ? 'w-5 bg-sky-600 dark:bg-sky-400'
                  : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
              }`}
              aria-label={`Go to ad ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
