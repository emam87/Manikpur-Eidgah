import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Globe, Type, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { EightPointStar } from '../common/EightPointStar.jsx';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { locale, toggleLocale, t } = useLanguage();
  const { fontSize, increaseFontSize, decreaseFontSize, resetFontSize } = useTheme();
  const { getSetting } = useSettings();
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-gold-500/50 flex items-center justify-center text-gold-400 group-hover:border-gold-400 transition-colors shadow-sm">
              <EightPointStar className="w-6 h-6 text-gold-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-base sm:text-lg lg:text-xl text-ivory-50 group-hover:text-gold-300 transition-colors tracking-tight leading-tight">
                {siteName}
              </span>
              <span className="text-[11px] sm:text-xs text-gold-400 font-sans tracking-wide">
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

          {/* Controls: Text Size & Language Switcher */}
          <div className="flex items-center gap-2">
            {/* Font Size Modifier (A- / A / A+) */}
            <div className="hidden sm:flex items-center bg-emerald-950/80 rounded-lg p-1 border border-gold-500/30 text-xs">
              <button
                onClick={decreaseFontSize}
                title="Decrease font size"
                className={`px-2 py-1 rounded transition-colors ${
                  fontSize === 'sm' ? 'bg-gold-500 text-stone-950 font-bold' : 'text-ivory-200 hover:text-gold-300'
                }`}
              >
                A-
              </button>
              <button
                onClick={resetFontSize}
                title="Default font size"
                className={`px-2 py-1 rounded transition-colors ${
                  fontSize === 'base' ? 'bg-gold-500 text-stone-950 font-bold' : 'text-ivory-200 hover:text-gold-300'
                }`}
              >
                A
              </button>
              <button
                onClick={increaseFontSize}
                title="Increase font size"
                className={`px-2 py-1 rounded transition-colors ${
                  fontSize === 'lg' ? 'bg-gold-500 text-stone-950 font-bold' : 'text-ivory-200 hover:text-gold-300'
                }`}
              >
                A+
              </button>
            </div>

            {/* Language Toggle Button */}
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 border border-gold-500/40 text-gold-300 hover:bg-gold-500 hover:text-stone-950 transition-all text-xs font-semibold tap-target shadow-sm"
              title={locale === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{locale === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>

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

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-emerald-950 border-t border-gold-500/30 px-4 pt-3 pb-6 space-y-2 animate-fade-in shadow-2xl">
          {/* Mobile Text Size Controls */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-emerald-800 text-xs text-ivory-200">
            <span>{t('text_size_title')}:</span>
            <div className="flex gap-1 bg-emerald-900 rounded p-1 border border-gold-500/20">
              <button
                onClick={decreaseFontSize}
                className={`px-3 py-1 rounded ${fontSize === 'sm' ? 'bg-gold-500 text-stone-950 font-bold' : ''}`}
              >
                A-
              </button>
              <button
                onClick={resetFontSize}
                className={`px-3 py-1 rounded ${fontSize === 'base' ? 'bg-gold-500 text-stone-950 font-bold' : ''}`}
              >
                A
              </button>
              <button
                onClick={increaseFontSize}
                className={`px-3 py-1 rounded ${fontSize === 'lg' ? 'bg-gold-500 text-stone-950 font-bold' : ''}`}
              >
                A+
              </button>
            </div>
          </div>

          {/* Mobile Nav Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[70vh] overflow-y-auto">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors tap-target ${
                    isActive
                      ? 'bg-emerald-800 text-gold-300 border-l-4 border-gold-500 font-semibold'
                      : 'text-ivory-100 hover:bg-emerald-900 hover:text-gold-300'
                  }`
                }
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

