import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Landmark,
  Images,
  MoreHorizontal,
  Info,
  Compass,
  MapPin,
  Map,
  FileText,
  Bell,
  Phone,
  Sun,
  Moon,
  ChevronRight,
  X,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { EightPointStar } from '../common/EightPointStar.jsx';

export function MobileTabBar() {
  const { locale, setLocale, t } = useLanguage();
  const { isDark, setTheme } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  // Close more sheet on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname, location.hash]);

  // Listen to open-more-sheet custom event (e.g. from top bar settings button)
  useEffect(() => {
    const handleOpenMore = () => setMoreOpen(true);
    window.addEventListener('open-more-sheet', handleOpenMore);
    return () => window.removeEventListener('open-more-sheet', handleOpenMore);
  }, []);

  // Lock body scroll when sheet is open & listen for Escape
  useEffect(() => {
    if (moreOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreOpen]);

  const primaryTabs = [
    { to: '/', label: t('nav_home') || (locale === 'bn' ? 'হোম' : 'Home'), icon: Home },
    { to: '/lifetime-members', label: t('nav_members') || (locale === 'bn' ? 'সদস্যবৃন্দ' : 'Members'), icon: Users },
    { to: '/land-donors', label: t('nav_land_donors') || (locale === 'bn' ? 'জমিদাতা' : 'Donors'), icon: Landmark },
    { to: '/gallery', label: t('nav_gallery') || (locale === 'bn' ? 'গ্যালারি' : 'Gallery'), icon: Images },
  ];

  const moreLinks = [
    { to: '/about', label: locale === 'bn' ? 'পরিচিতি ও কমিটি' : 'About & Committee', icon: Info },
    { to: '/designs', label: locale === 'bn' ? 'নকশা ও পরিকল্পনা' : 'Design & Plan', icon: Compass },
    { to: '/map', label: locale === 'bn' ? 'মানচিত্র ও পথ' : 'Map & Directions', icon: MapPin },
    { to: '/land-maps', label: locale === 'bn' ? 'জমির নকশা' : 'Land Map', icon: Map },
    { to: '/documents', label: locale === 'bn' ? 'দলিল ও কাগজপত্র' : 'Documents', icon: FileText },
    { to: '/notices', label: locale === 'bn' ? 'নোটিশ ও ঘোষণা' : 'Notices', icon: Bell },
    { to: '/contact', label: locale === 'bn' ? 'যোগাযোগ ও অনুদান' : 'Contact & Donate', icon: Phone },
  ];

  const isMoreActive = moreLinks.some(
    (l) => location.pathname === l.to || location.pathname.startsWith(l.to + '/')
  );

  return (
    <>
      {/* Sticky Bottom Tab Bar (5 items, labeled, safe-area aware) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-lg border-t border-sand shadow-sakinah-lift px-1.5 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]"
      >
        <div className="grid grid-cols-5 items-center justify-around text-center">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/'}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center py-1 rounded-xl transition-all select-none min-h-[48px] tap-feedback ${isActive
                    ? 'text-primary font-bold bg-primary-soft/60'
                    : 'text-ink-muted hover:text-primary-dark'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon className="w-5 h-5 transition-transform" />
                      {isActive && (
                        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="text-[10px] mt-1 tracking-tight leading-none truncate max-w-[62px]">
                      {tab.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* More Sheet Trigger Button */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition-all select-none min-h-[48px] tap-feedback ${isMoreActive || moreOpen
              ? 'text-primary font-bold bg-primary-soft/60'
              : 'text-ink-muted hover:text-primary-dark'
              }`}
            aria-label={locale === 'bn' ? 'আরও মেনু' : 'More Menu'}
            aria-expanded={moreOpen}
          >
            <div className="relative">
              <MoreHorizontal className="w-5 h-5" />
              {isMoreActive && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight leading-none">
              {locale === 'bn' ? 'আরও' : 'More'}
            </span>
          </button>
        </div>
      </nav>

      {/* "More" Canonical Bottom Sheet Overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 bg-scrim/60 backdrop-blur-sm lg:hidden animate-fade-in flex flex-col justify-end"
          onClick={() => setMoreOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-surface border-t-2 border-gold/50 rounded-t-[24px] p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-sakinah-lift text-ink space-y-3 max-h-[85dvh] overflow-y-auto animate-slide-up"
          >
            {/* Sheet Handle & Header */}
            <div className="w-full flex justify-center">
              <div className="w-10 h-1 rounded-full bg-gold/40" />
            </div>

            <div className="flex items-center justify-between pb-2.5 border-b border-sand">
              <div className="flex items-center gap-2">
                <EightPointStar className="w-4 h-4 text-primary" />
                <span className="font-serif font-bold text-base text-primary-dark">
                  {locale === 'bn' ? 'মেনু ও সেটিংস' : 'Menu & Settings'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="w-9 h-9 rounded-full bg-canvas-alt text-ink-muted hover:text-primary-dark border border-sand flex items-center justify-center tap-feedback"
                aria-label={t('nav.close_menu') || 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Canonical Secondary Navigation Grid */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary-dark/80 px-1">
                {locale === 'bn' ? 'বিভাগসমূহ' : 'Sections'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {moreLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setMoreOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all tap-feedback min-h-[44px] ${isActive
                          ? 'bg-primary-soft text-primary-dark border-l-4 border-primary font-bold shadow-sakinah-sm'
                          : 'bg-canvas-alt hover:bg-primary-soft/50 text-ink'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">{link.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gold-text/70 shrink-0" />
                    </NavLink>
                  );
                })}
              </div>
            </div>

            {/* Quick Preference Controls (Language, Theme) */}
            <div className="space-y-2 pt-2 border-t border-sand">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary-dark/80 px-1">
                {locale === 'bn' ? 'নিয়ন্ত্রণ ও সেটিংস' : 'Controls & Settings'}
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Language Switch */}
                <div className="col-span-2 p-2.5 rounded-xl bg-canvas-alt border border-sand flex items-center justify-between gap-2">
                  <span className="text-primary-dark font-medium">{locale === 'bn' ? 'ভাষা' : 'Language'}</span>
                  <div className="flex items-center bg-surface p-0.5 rounded-full border border-sand">
                    <button
                      type="button"
                      onClick={() => setLocale('bn')}
                      className={`px-3 py-1 rounded-full text-xs font-bold min-h-[32px] transition-all tap-feedback ${locale === 'bn' ? 'bg-primary text-white shadow-sakinah-sm' : 'text-ink-muted hover:text-primary-dark'
                        }`}
                    >
                      বাংলা
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocale('en')}
                      className={`px-3 py-1 rounded-full text-xs font-bold min-h-[32px] transition-all tap-feedback ${locale === 'en' ? 'bg-primary text-white shadow-sakinah-sm' : 'text-ink-muted hover:text-primary-dark'
                        }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                {/* Theme Toggle (Light / Dark only) */}
                <div className="col-span-2 p-2.5 rounded-xl bg-canvas-alt border border-sand flex items-center justify-between gap-2">
                  <span className="text-primary-dark font-medium">
                    {locale === 'bn' ? 'থিম' : 'Theme'}
                  </span>
                  <div
                    className="flex items-center bg-surface p-0.5 rounded-full border border-sand"
                    role="group"
                    aria-label={locale === 'bn' ? 'থিম নির্বাচন' : 'Select theme'}
                  >
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      aria-pressed={!isDark}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all min-h-[32px] tap-feedback ${!isDark
                        ? 'bg-primary text-white shadow-sakinah-sm'
                        : 'text-ink-muted hover:text-primary-dark'
                        }`}
                    >
                      <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{locale === 'bn' ? 'লাইট' : 'Light'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      aria-pressed={isDark}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all min-h-[32px] tap-feedback ${isDark
                        ? 'bg-primary text-white shadow-sakinah-sm'
                        : 'text-ink-muted hover:text-primary-dark'
                        }`}
                    >
                      <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{locale === 'bn' ? 'ডার্ক' : 'Dark'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
