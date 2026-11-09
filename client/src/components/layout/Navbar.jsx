import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Globe, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { EightPointStar } from '../common/EightPointStar.jsx';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { locale, setLocale, toggleLocale, t } = useLanguage();
  const { getSetting } = useSettings();
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Shrink navbar on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { to: '/', label: t('nav_home') },
    { to: '/about', label: t('nav_about') },
    { to: '/lifetime-members', label: t('nav_members') },
    { to: '/donors', label: t('nav_donors') },
    { to: '/gallery', label: t('nav_gallery') },
    { to: '/designs', label: t('nav_designs') },
    { to: '/map', label: t('nav_map') },
    { to: '/land-maps', label: t('nav_land_map') },
    { to: '/documents', label: t('nav_documents') },
    { to: '/notices', label: t('nav_notices') },
    { to: '/contact', label: t('nav_contact') },
  ];

  const siteName = getSetting('site_name', locale, t('site_name'));

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-emerald-900/95 backdrop-blur-md shadow-lg py-2.5 border-b border-gold-500/30'
          : 'bg-emerald-800 text-ivory-50 py-3.5 border-b border-gold-500/20'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Title */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0 mr-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-gold-500/50 flex items-center justify-center text-gold-400 group-hover:border-gold-400 transition-colors shadow-sm shrink-0">
              <EightPointStar className="w-6 h-6 text-gold-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-serif font-bold text-sm sm:text-base lg:text-xl text-ivory-50 group-hover:text-gold-300 transition-colors tracking-tight leading-snug truncate">
                {siteName}
              </span>
              <span className="text-[10px] sm:text-xs text-gold-400 font-sans tracking-wide truncate">
                {locale === 'bn' ? 'স্থাপিত ১৯৬৫ খ্রি. • ওয়াকফ এস্টেট' : 'Est. 1965 • Waqf Estate'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 2xl:gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-950 text-gold-300 border border-gold-500/40 shadow-inner'
                      : 'text-ivory-100 hover:text-gold-300 hover:bg-emerald-700/50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Controls: Language Switcher & Mobile Menu */}
          <div className="flex items-center gap-2.5">
            {/* Dual Language Segmented Toggle Switch: [ বাংলা | EN ] */}
            <div className="flex items-center bg-emerald-950/90 p-0.5 rounded-full border border-gold-500/40 shadow-inner">
              <button
                type="button"
                onClick={() => setLocale('bn')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  locale === 'bn'
                    ? 'bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-emerald-950 shadow-md font-extrabold'
                    : 'text-ivory-200 hover:text-gold-300'
                }`}
                title="বাংলায় দেখুন"
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  locale === 'en'
                    ? 'bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-emerald-950 shadow-md font-extrabold'
                    : 'text-ivory-200 hover:text-gold-300'
                }`}
                title="View in English"
              >
                EN
              </button>
            </div>

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg bg-emerald-950 border border-gold-500/30 text-ivory-100 hover:text-gold-300 tap-target"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer & Backdrop */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 top-[60px] bg-black/60 backdrop-blur-sm z-30 xl:hidden animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Mobile Drawer Menu */}
          <div className="relative z-40 xl:hidden bg-emerald-950 border-t border-gold-500/30 px-4 pt-3 pb-6 space-y-3 shadow-2xl rounded-b-2xl max-h-[calc(100vh-75px)] overflow-y-auto">
            {/* Mobile Language Switcher Row */}
            <div className="flex items-center justify-between pb-3 border-b border-emerald-800 text-xs text-ivory-200">
              <span className="font-semibold flex items-center gap-1.5 text-gold-300">
                <Globe className="w-4 h-4 text-gold-400" />
                <span>{locale === 'bn' ? 'ভাষা নির্বাচন:' : 'Language:'}</span>
              </span>
              <div className="flex items-center bg-emerald-900 p-0.5 rounded-full border border-gold-500/40 shadow-inner">
                <button
                  type="button"
                  onClick={() => setLocale('bn')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all min-h-[36px] ${
                    locale === 'bn'
                      ? 'bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-emerald-950 shadow-md font-extrabold'
                      : 'text-ivory-200 hover:text-gold-300'
                  }`}
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => setLocale('en')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all min-h-[36px] ${
                    locale === 'en'
                      ? 'bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-emerald-950 shadow-md font-extrabold'
                      : 'text-ivory-200 hover:text-gold-300'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Mobile Nav Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-colors tap-target min-h-[44px] ${
                      isActive
                        ? 'bg-emerald-800 text-gold-300 border-l-4 border-gold-500 font-semibold shadow-inner'
                        : 'text-ivory-100 hover:bg-emerald-900 active:bg-emerald-800 hover:text-gold-300'
                    }`
                  }
                >
                  <span>{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-gold-400/60" />
                </NavLink>
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
}

