import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

const DEFAULT_SETTINGS = {
  site_name: { bn: 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ', en: 'Manikpur Central Shahi Eidgah' },
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
    bn: 'হিসাবের নাম: মানিকপুর কেন্দ্রীয় ঈদগাহ উন্নয়ন তহবিল\nইসলামী ব্যাংক বাংলাদেশ পিএলসি, মানিকপুর শাখা\nচলতি হিসাব নং: ২০৫০-১৯৮-০২০৪৫৮৯১২\nবিকাশ / নগদ: ০১৭১১-২২৩৩৪৪',
    en: 'Account Name: Manikpur Central Eidgah Development Fund\nIslami Bank Bangladesh PLC, Manikpur Branch\nA/C No: 2050-198-020458912\nbKash / Nagad: +880 1711-223344',
  },
  map_lat: { bn: '23.9875', en: '23.9875' },
  map_lng: { bn: '90.8214', en: '90.8214' },
  map_zoom: { bn: '17', en: '17' },
  hero_bg_style: { bn: 'eid-dawn', en: 'eid-dawn' },
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

  useEffect(() => {
    let timer = setTimeout(() => {
      // If after 3.5s settings haven't loaded, server might be cold starting on Render
      if (loading) {
        setIsWakingUp(true);
      }
    }, 3500);

    fetch('/api/public/settings')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch settings');
        return res.json();
      })
      .then((data) => {
        if (data && data.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        }
        setIsWakingUp(false);
      })
      .catch(() => {
        // Fall back to default settings without crashing
      })
      .finally(() => {
        setLoading(false);
        clearTimeout(timer);
      });

    return () => clearTimeout(timer);
  }, []);

  const getSetting = (key, locale = 'bn', fallback = '') => {
    const entry = settings[key];
    if (!entry) return fallback;
    if (typeof entry === 'string') return entry;
    return entry[locale] || entry.bn || entry.en || fallback;
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

