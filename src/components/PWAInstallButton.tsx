import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running as an installed PWA, hide
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const res = await install();
      if (!res) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 font-medium transition active:scale-95 shadow-xs cursor-pointer ${
          compact
            ? 'px-2.5 py-1 text-xs rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/25'
            : 'px-3.5 py-2 text-xs rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white dark:text-slate-950 font-bold hover:from-amber-500 hover:to-amber-400 shadow-amber-500/20 shadow-md'
        }`}
        title="Install MSA Real Estate App on your mobile device"
      >
        <Download className="w-3.5 h-3.5 text-amber-800 dark:text-amber-300" />
        <span>Install App</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/40 p-6 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <img
                  src="/src/assets/images/msa_icon_transparent.png"
                  alt="MSA"
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-amber-700 dark:text-amber-400 font-brand">
                    Install MSA on Mobile
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Install app directly on your phone or tablet
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-700 dark:text-slate-300">
              {isIOS ? (
                /* iOS Safari instructions */
                <>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-300">
                    No App Store required on iPhone. Install directly as a fullscreen web app via Safari:
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-400 shrink-0 font-bold">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">1. Tap the Safari Share Button:</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Tap the Share icon at the bottom of the Safari browser screen.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-400 shrink-0 font-bold">
                      <PlusSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">2. Select &quot;Add to Home Screen&quot;:</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Scroll down the share options, select &quot;Add to Home Screen&quot;, and tap &quot;Add&quot; in the top-right corner.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                /* Android Chrome instructions */
                <>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-300">
                    Instant installation on Android without Google Play Store:
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-400 shrink-0 font-bold text-sm px-3">
                      ⋮
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">1. Tap Chrome Menu (Three Dots):</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Tap the three-dots menu icon (⋮) in the top right corner of Chrome.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-400 shrink-0">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">2. Tap &quot;Install App&quot; or &quot;Add to Home Screen&quot;:</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong> from the dropdown list.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0 font-bold px-2.5">
                      ✓
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">3. Standalone Fullscreen Experience:</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        The app will be installed on your mobile home screen with its official MSA icon and launch in full-screen standalone mode.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              {isInstallable && (
                <button
                  onClick={async () => {
                    await install();
                    setShowGuide(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white dark:text-slate-950 font-bold text-xs hover:from-amber-500 hover:to-amber-400 transition"
                >
                  Direct Install Now
                </button>
              )}
              <button
                onClick={() => setShowGuide(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
