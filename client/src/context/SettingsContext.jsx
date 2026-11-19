import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

const DEFAULT_SETTINGS = {
  site_name: { bn: 'মানিকপুর ঈদগাহ', en: 'Manikpur Eidgah' },
  tagline: {
    bn: 'ঐতিহ্যবাহী দ্বীনি ও সামাজিক ঈদগাহ ময়দান • স্থাপিত ১৯৬৫ খ্রি.',
    en: 'Historic Community Eidgah Ground & Waqf Estate • Est. 1965',
  },
  established_year: { bn: '১৯৬৫ খ্রিস্টাব্দ (১৩৭২ বঙ্গাব্দ)', en: '1965 AD (1372 Bengali Year)' },
  land_area: { bn: '১.৩৫ একর (১৩৫ শতাংশ ওয়াকফকৃত জমি)', en: '1.35 Acres (135 Decimals Waqf Land)' },
  capacity: { bn: 'প্রায় ১২,০০০+ মুসল্লি (একত্রে জামাত আদায়যোগ্য)', en: 'Approx. 12,000+ Worshippers per Congregation' },
  location: { bn: 'মানিকপুর, ডাকঘর: মানিকপুর বাজার, বাংলাদেশ', en: 'Manikpur, P.O: Manikpur Bazar, Bangladesh' },
  eid_jamat: {
    bn: 'পবিত্র ঈদুল ফিতর: ১ম জামাত সকাল ৮:০০ ঘটিকা, ২য় জামাত সকাল ৯:০০ ঘটিকা | পবিত্র ঈদুল আযহা: প্রধান জামাত সকাল ৭:৩০ ঘটিকা।',
    en: 'Eid-ul-Fitr: 1st Jamat at 8:00 AM, 2nd Jamat at 9:00 AM | Eid-ul-Adha: Main Jamat at 7:30 AM.',
  },
  bank_info: {
    bn: 'হিসাবের নাম: মানিকপুর ঈদগাহ উন্নয়ন তহবিল\nইসলামী ব্যাংক বাংলাদেশ পিএলসি, মানিকপুর শাখা\nচলতি হিসাব নং: ২০৫০-১৯৮-০২০৪৫৮৯১২\nবিকাশ / নগদ: ০১৭১১-২২৩৩৪৪',
    en: 'Account Name: Manikpur Eidgah Development Fund\nIslami Bank Bangladesh PLC, Manikpur Branch\nA/C No: 2050-198-020458912\nbKash / Nagad: +880 1711-223344',
  },
  map_lat: { bn: '23.9875', en: '23.9875' },
  map_lng: { bn: '90.8214', en: '90.8214' },
  map_zoom: { bn: '17', en: '17' },
  theme_preset: { bn: 'sakinah', en: 'sakinah' },
  hero_bg_style: { bn: 'dawn-photo-wave', en: 'dawn-photo-wave' },
  hero_image: { bn: '/defaults/eidgah-hero.webp', en: '/defaults/eidgah-hero.webp' },
  show_bismillah: { bn: '1', en: '1' },
  show_donation_amount: { bn: '1', en: '1' },
  show_member_amount: { bn: '1', en: '1' },
  allow_photo_download: { bn: '1', en: '1' },
  contact_phone: { bn: '+880 1711-223344, +880 1819-556677', en: '+880 1711-223344, +880 1819-556677' },
  contact_email: { bn: 'info@manikpureidgah.org', en: 'info@manikpureidgah.org' },
  facebook_url: { bn: 'https://facebook.com/manikpureidgah', en: 'https://facebook.com/manikpureidgah' },
  youtube_url: { bn: 'https://youtube.com/@manikpureidgah', en: 'https://youtube.com/@manikpureidgah' },
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isWakingUp, setIsWakingUp] = useState(false);

  const fetchPublicSettings = async () => {
    try {
      const res = await fetch('/api/public/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      if (data && data.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      }
      setIsWakingUp(false);
    } catch {
      // Fall back to default settings without crashing
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      // If after 3.5s settings haven't loaded, server might be cold starting on Render
      if (loading) {
        setIsWakingUp(true);
      }
    }, 3500);

    fetchPublicSettings().finally(() => clearTimeout(timer));

    return () => clearTimeout(timer);
  }, []);

  // Synchronize theme_preset attribute & theme-color meta on DOM root whenever settings update
  const activePreset = (() => {
    const entry = settings.theme_preset;
    const raw = typeof entry === 'string' ? entry : entry?.bn || entry?.en || 'sakinah';
    return raw === 'classic-emerald' ? 'classic-emerald' : 'sakinah';
  })();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme-preset', activePreset);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const isDark = root.classList.contains('dark');
      const cssVar = isDark ? '--bg' : '--primary';
      const resolvedColor = getComputedStyle(root).getPropertyValue(cssVar).trim();
      if (resolvedColor) {
        metaThemeColor.setAttribute('content', resolvedColor);
      }
    }
  }, [activePreset]);

  const getSetting = (key, locale = 'bn', fallback = '') => {
    const entry = settings[key];
    if (!entry) return fallback;
    if (typeof entry === 'string') return entry;
    
    // Strict separation: when locale is 'en', only look at en (never fall back to bn!)
    if (locale === 'en') {
      if (entry.en && typeof entry.en === 'string' && entry.en.trim() !== '') {
        return entry.en.trim();
      }
      return fallback;
    }
    
    // When locale is 'bn': look at bn
    if (entry.bn && typeof entry.bn === 'string' && entry.bn.trim() !== '') {
      return entry.bn.trim();
    }
    return fallback;
  };

  const isSettingEnabled = (key) => {
    const val = getSetting(key, 'bn');
    return val === '1' || val === 'true' || val === true;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        isWakingUp,
        themePreset: activePreset,
        refreshSettings: fetchPublicSettings,
        getSetting,
        isSettingEnabled,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

