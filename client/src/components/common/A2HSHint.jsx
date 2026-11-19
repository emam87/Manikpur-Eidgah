import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { EightPointStar } from './EightPointStar.jsx';

export function A2HSHint() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const { locale } = useLanguage();

  useEffect(() => {
    const isDismissed = localStorage.getItem('eidgah_a2hs_dismissed');
    if (isDismissed) return undefined;

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('eidgah_a2hs_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-40 bg-surface text-ink p-4 rounded-2xl border border-gold/50 shadow-sakinah-lift backdrop-blur-md animate-slide-up flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-primary-soft border border-primary/25 flex items-center justify-center text-primary-dark shrink-0">
          <EightPointStar className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="font-serif font-bold text-xs sm:text-sm text-primary-dark truncate">
            {locale === 'bn' ? 'হোম স্ক্রিনে অ্যাপ হিসেবে যুক্ত করুন' : 'Add Manikpur Eidgah App'}
          </p>
          <p className="text-[11px] text-ink-muted truncate">
            {locale === 'bn' ? 'সহজে ও দ্রুত নোটিশ ও হিসাব দেখতে' : 'Instant access anytime on your device'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleInstall}
          className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-sakinah-sm flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{locale === 'bn' ? 'যুক্ত করুন' : 'Add'}</span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-lg text-ink-muted hover:text-ink"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
