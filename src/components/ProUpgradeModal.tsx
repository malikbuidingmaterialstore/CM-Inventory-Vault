import React, { useState } from 'react';
import { User, SystemSettings } from '../types';
import { api } from '../services/api';
import { saveSessionLocally, getCachedSessionLocally } from '../services/db';
import { 
  Crown, 
  Check, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  MessageSquare, 
  CreditCard, 
  Building2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface ProUpgradeModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpgradeSuccess: (updatedUser: User) => void;
  settings?: SystemSettings;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpgradeSuccess,
  settings,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const proPrice = settings?.pro_monthly_price_pkr || 1500;
  const ownerWhatsApp = settings?.owner_whatsapp || '+92 3082665978';
  const ownerEmail = settings?.owner_email || 'sacc5038@gmail.com';

  const handleInstantUpgrade = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await api.upgradeToPro('Activated via Pro Modal');
      if (res.success && res.user) {
        // Update cached session in IndexedDB so the session persists ad-free locally
        const cached = await getCachedSessionLocally();
        if (cached) {
          cached.user = res.user;
          await saveSessionLocally(cached);
        }
        setSuccessMessage('Congratulations! Your account has been upgraded to CM Wallet Pro (Ad-Free Active).');
        setTimeout(() => {
          onUpgradeSuccess(res.user);
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Upgrade error', err);
      setErrorMessage(err.message || 'Failed to activate upgrade. Please try again or contact owner on WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hello Owner / Administration,\n\nI want to upgrade my CM INVENTORY WALLET account to the Ad-Free PRO Version.\n\n👤 Username: ${user.username}\n💼 Name: ${user.full_name}\n📱 Phone: ${user.phone || 'N/A'}\n\nPlease activate my Ad-Free PRO subscription.`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div 
        className="relative w-full max-w-lg theme-bg-card rounded-3xl border theme-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Ribbon Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-sky-900 via-sky-800 to-blue-900 text-white p-5 sm:p-6 pb-6">
          {/* Subtle sparkling overlay */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-xl bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/30">
              <Crown className="w-5 h-5 fill-slate-950" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/15 text-amber-300">
              PREMIUM MEMBERSHIP
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight font-brand">
            CM Wallet Pro — Ad-Free Version
          </h2>
          <p className="text-xs text-sky-200 mt-1 leading-relaxed">
            Eliminate all advertisements and unlock verified premium realtor features.
          </p>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-brand">
              PKR {proPrice.toLocaleString()}
            </span>
            <span className="text-xs text-sky-200">/ Month</span>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Feature Comparison Box */}
          <div className="rounded-2xl border theme-border overflow-hidden">
            <div className="grid grid-cols-2 p-3 bg-slate-100 dark:bg-slate-800/60 font-bold text-[11px] theme-text-secondary border-b theme-border">
              <span>Features</span>
              <span className="text-right">Benefits</span>
            </div>

            <div className="divide-y theme-border text-xs">
              <div className="p-3 flex items-center justify-between gap-2">
                <span className="theme-text-main font-medium">100% Ad-Free Clean Interface</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" /> Zero Ads
                </span>
              </div>

              <div className="p-3 flex items-center justify-between gap-2">
                <span className="theme-text-main font-medium">Verified PRO Realtor Gold Badge</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 shrink-0">
                  <Crown className="w-3.5 h-3.5" /> VIP Status
                </span>
              </div>

              <div className="p-3 flex items-center justify-between gap-2">
                <span className="theme-text-main font-medium">High-Speed Cloud Sync & Backup</span>
                <span className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1 shrink-0">
                  <Zap className="w-4 h-4" /> Fast Priority
                </span>
              </div>

              <div className="p-3 flex items-center justify-between gap-2">
                <span className="theme-text-main font-medium">Direct WhatsApp VIP Support</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                  <ShieldCheck className="w-4 h-4" /> 24/7 Priority
                </span>
              </div>
            </div>
          </div>

          {/* Payment & Activation Instructions */}
          <div className="p-4 rounded-2xl theme-bg-subtle border theme-border space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold theme-text-main">
              <CreditCard className="w-4 h-4 text-sky-600" />
              <span>How to Pay & Activate:</span>
            </div>
            <p className="text-xs theme-text-secondary leading-relaxed">
              {settings?.payment_instructions || 'Pay the monthly subscription fee via EasyPaisa, JazzCash, or Bank Transfer and send screenshot proof on WhatsApp. Your account will be upgraded immediately.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {/* WhatsApp Direct Confirmation */}
            <a
              href={`https://wa.me/${ownerWhatsApp.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition active:scale-98"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send Activation Request via WhatsApp</span>
            </a>

            {/* Instant Demo Upgrade Button (allows user/owner to test Ad-Free in 1 click) */}
            <button
              type="button"
              onClick={handleInstantUpgrade}
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition active:scale-98 disabled:opacity-50"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>{isSubmitting ? 'Activating Pro...' : 'Activate 30-Day Ad-Free PRO'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
