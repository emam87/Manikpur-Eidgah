import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Sun,
  Moon,
  ChevronRight,
  ChevronDown,
  MapPin,
  HeartHandshake,
  SlidersHorizontal,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

function MosqueLogoMark({ className = 'w-6 h-6' }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M16 4C11.5 7.6 8.5 11.4 8.5 16.5V26H23.5V16.5C23.5 11.4 20.5 7.6 16 4Z"
        fill="currentColor"
        fillOpacity="0.16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M16 4V2M13.5 26V20.5C13.5 18.8 14.6 17.5 16 17.5C17.4 17.5 18.5 18.8 18.5 20.5V26M4.5 26H27.5M6 26V14.5L7.25 12.5L8.5 14.5V26M23.5 26V14.5L24.75 12.5L26 14.5V26"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const navRef = useRef(null);

  const { locale, setLocale, t } = useLanguage();
  const { getSetting } = useSettings();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const isHome = location.pathname === '/';

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname]);

  // Close menus on Escape key & outside click
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
      }
    };
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll appearance transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 18);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navGroups = [
    {
      id: 'info',
      label: t('nav.group_info'),
      paths: ['/about', '/notices', '/map'],
      items: [
        { to: '/about', label: t('nav.about') },
        { to: '/map', label: locale === 'bn' ? 'মানচিত্র ও পথ' : 'Map & Directions' },
        { to: '/notices', label: t('nav.notices') },
      ],
    },
    {
      id: 'community',
      label: t('nav.group_community'),
      paths: ['/lifetime-members', '/land-donors'],
      items: [
        { to: '/lifetime-members', label: t('nav.members') },
        { to: '/land-donors', label: t('nav.land_donors') },
      ],
    },
    {
      id: 'media',
      label: t('nav.group_media'),
      paths: ['/gallery', '/designs'],
      items: [
        { to: '/gallery', label: t('nav.gallery') },
        { to: '/designs', label: t('nav.designs') },
      ],
    },
    {
      id: 'archive',
      label: t('nav.group_archive'),
      paths: ['/land-maps', '/documents'],
      items: [
        { to: '/land-maps', label: t('nav.land_map') },
        { to: '/documents', label: t('nav.documents') },
      ],
    },
  ];

  const siteName = getSetting('site_name', locale, t('common.site_name'));
  const navSubtitle = getSetting('nav_subtitle', locale, t('nav.brand_subtitle'));
  const topLocation = getSetting('location', locale, t('hero.badge'));

  const handleOpenMoreSheet = () => {
    window.dispatchEvent(new CustomEvent('open-more-sheet'));
  };

  return (
    <header ref={navRef} className="sticky top-0 z-40 w-full transition-all duration-300">
      {/* 1. SLIM UTILITY TOP BAR (Desktop only >= 1024px) */}
      <div className="hidden lg:block bg-primary-soft/70 dark:bg-canvas-alt border-b border-sand/80 text-primary-dark text-xs">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 min-h-[34px] py-1 flex items-center justify-between gap-2">
          {/* Left: Location */}
          <div className="flex items-center gap-1.5 font-medium truncate max-w-xs">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
            <span className="truncate">{topLocation}</span>
          </div>

          {/* Right: Theme Toggle, Language Switcher */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Night Noor / Sakinah Light Switch */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-surface/90 border border-sand text-primary-dark hover:bg-primary-soft hover:border-gold/60 transition-all shadow-sakinah-sm tap-feedback"
              title={isDark ? t('common.light_mode') : t('common.dark_mode')}
              aria-label={isDark ? t('common.light_mode') : t('common.dark_mode')}
              aria-pressed={isDark}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-gold-text" /> : <Moon className="w-3.5 h-3.5 text-primary-dark" />}
            </button>

            {/* Bilingual Toggle */}
            <div className="flex items-center bg-surface/90 p-0.5 rounded-full border border-sand shadow-sakinah-sm">
              <button
                type="button"
                onClick={() => setLocale('bn')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all min-h-[24px] ${locale === 'bn'
                  ? 'bg-primary text-white shadow-sakinah-sm'
                  : 'text-ink-muted hover:text-primary-dark'
                  }`}
                title={t('common.lang_bn')}
              >
                {t('common.lang_bn')}
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all min-h-[24px] ${locale === 'en'
                  ? 'bg-primary text-white shadow-sakinah-sm'
                  : 'text-ink-muted hover:text-primary-dark'
                  }`}
                title={t('common.lang_en')}
              >
                {t('common.lang_en')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVBAR: Mobile compact (max 56px) / Desktop full */}
      <div
        className={`relative w-full transition-all duration-300 ${isScrolled || !isHome
          ? 'bg-surface/95 backdrop-blur-md shadow-sakinah-sm'
          : 'bg-canvas/85 backdrop-blur-md'
          }`}
      >
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 h-14 sm:h-16">
            {/* Brand Logo + Short Site Name */}
            <Link
              to="/"
              className="flex items-center gap-2 sm:gap-3 group min-w-0 focus-heritage rounded-xl p-1"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary-soft border border-gold/55 flex items-center justify-center text-primary-dark group-hover:border-gold transition-colors shadow-sakinah-sm shrink-0">
                <MosqueLogoMark className="w-5 h-5 sm:w-6 sm:h-6 text-primary-dark" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-serif font-bold text-sm sm:text-base lg:text-lg text-primary-dark group-hover:text-primary transition-colors tracking-tight leading-tight truncate max-w-[190px] sm:max-w-none">
                  {siteName}
                </span>
                {navSubtitle ? (
                  <span className="hidden sm:inline-block text-[10px] sm:text-[11px] text-gold-text font-sans font-semibold tracking-wider truncate">
                    {navSubtitle}
                  </span>
                ) : null}
              </div>
            </Link>

            {/* Desktop Navigation Links (>= 1024px) */}
            <nav aria-label={t('nav.menu')} className="hidden lg:flex items-center gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-full text-xs xl:text-sm font-semibold transition-all whitespace-nowrap ${isActive
                    ? 'bg-primary text-white shadow-sakinah-sm font-bold'
                    : 'text-ink hover:text-primary-dark hover:bg-primary-soft/60'
                  }`
                }
              >
                {t('nav.home')}
              </NavLink>

              {navGroups.map((group) => {
                const isGroupActive = group.paths.some(
                  (p) => location.pathname === p || location.pathname.startsWith(`${p}/`)
                );
                const isOpen = openDropdown === group.id;

                return (
                  <div
                    key={group.id}
                    className="relative"
                    onMouseEnter={() => setOpenDropdown(group.id)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(isOpen ? null : group.id)}
                      aria-expanded={isOpen}
                      aria-haspopup="true"
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs xl:text-sm font-semibold transition-all whitespace-nowrap ${isGroupActive
                        ? 'bg-primary text-white shadow-sakinah-sm font-bold'
                        : 'text-ink hover:text-primary-dark hover:bg-primary-soft/60'
                        }`}
                    >
                      <span>{group.label}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                          }`}
                        aria-hidden="true"
                      />
                    </button>

                    {isOpen && (
                      <div className="absolute left-0 top-full pt-1.5 w-52 z-50">
                        <div className="rounded-2xl bg-surface border border-gold/35 shadow-sakinah-lift p-1.5 space-y-0.5 animate-fade-in">
                          {group.items.map((item) => (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              className={({ isActive }) =>
                                `flex items-center justify-between px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors ${isActive
                                  ? 'bg-primary text-white font-bold shadow-sakinah-sm'
                                  : 'text-ink hover:bg-primary-soft/60 hover:text-primary-dark'
                                }`
                              }
                            >
                              <span>{item.label}</span>
                              <ChevronRight className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-full text-xs xl:text-sm font-semibold transition-all whitespace-nowrap ${isActive
                    ? 'bg-primary text-white shadow-sakinah-sm font-bold'
                    : 'text-ink hover:text-primary-dark hover:bg-primary-soft/60'
                  }`
                }
              >
                {t('nav.contact')}
              </NavLink>
            </nav>

            {/* Desktop Donate CTA */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gold-plate text-xs sm:text-sm font-extrabold border border-gold shadow-sakinah-sm hover:shadow-gold-glow hover:-translate-y-0.5 active:scale-[0.98] transition-all whitespace-nowrap tap-feedback"
              >
                <HeartHandshake className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{t('nav.donate_cta')}</span>
              </Link>
            </div>

            {/* Mobile Top Bar Controls (max 56px: Language toggle + Settings/More icon) */}
            <div className="flex lg:hidden items-center gap-2 shrink-0">
              {/* Compact Language Toggle */}
              <button
                type="button"
                onClick={() => setLocale(locale === 'bn' ? 'en' : 'bn')}
                className="h-9 px-3 rounded-full bg-surface/90 border border-sand text-xs font-bold text-primary-dark hover:bg-primary-soft shadow-sakinah-sm tap-feedback flex items-center justify-center"
                aria-label={locale === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
              >
                {locale === 'bn' ? 'EN' : 'বাং'}
              </button>

              {/* Settings / More Drawer Trigger */}
              <button
                type="button"
                onClick={handleOpenMoreSheet}
                className="w-9 h-9 rounded-xl bg-surface/90 border border-sand text-primary-dark hover:bg-primary-soft shadow-sakinah-sm flex items-center justify-center tap-feedback"
                aria-label={locale === 'bn' ? 'মেনু ও সেটিংস খুলুন' : 'Open menu and settings'}
              >
                <SlidersHorizontal className="w-4 h-4 text-primary-dark" />
              </button>
            </div>
          </div>
        </div>

        {/* Thin Gold Hairline Border under Navbar */}
        <div
          className="absolute bottom-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-gold/25 via-gold/75 to-gold/25 pointer-events-none"
          aria-hidden="true"
        />
      </div>
    </header>
  );
}
