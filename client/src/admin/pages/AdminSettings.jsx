import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Globe, Moon, Phone, Lock, MapPin, 
  Sparkles, Check, AlertCircle, RefreshCw, Landmark, Upload, Image as ImageIcon, RotateCcw
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { BilingualInput } from '../components/BilingualInput.jsx';
import { AdminMapSettingsPanel } from '../components/AdminMapSettingsPanel.jsx';
import { getImageUrl } from '../../utils/imageUrl.js';

export function AdminSettings() {
  const { refreshSettings } = useSettings();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        const mapped = {};
        data.settings.forEach((s) => {
          mapped[s.key] = s.valueBn || '';
          mapped[`${s.key}_en`] = s.valueEn || '';
        });
        setSettings(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleHeroUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHero(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch('/api/admin/settings/hero-image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.path) {
        setSettings((prev) => ({ ...prev, hero_image: data.path, hero_image_en: data.path }));
        await refreshSettings();
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert(data.error || 'ছবি আপলোড ব্যর্থ হয়েছে।');
      }
    } catch {
      alert('ছবি আপলোডের সময় সার্ভারে সমস্যা হয়েছে।');
    } finally {
      setUploadingHero(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const payload = {};
      Object.keys(settings).forEach((k) => {
        if (k.endsWith('_en')) return;
        payload[k] = {
          valueBn: settings[k] || '',
          valueEn: settings[`${k}_en`] !== undefined ? settings[`${k}_en`] : null,
        };
      });

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshSettings();
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert(data.error || 'সেটিংস সংরক্ষণ ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      alert('সার্ভারে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'সাধারণ পরিচিতি', icon: Globe },
    { id: 'map', label: 'মানচিত্র ও অবস্থান', icon: MapPin },
    { id: 'land', label: 'জমিদাতা ও ভূমি সেটিংস', icon: Landmark },
    { id: 'jamat', label: 'ঈদের জামাত সময়সূচি', icon: Moon },
    { id: 'contact', label: 'যোগাযোগ ও ব্যাংক একাউন্ট', icon: Phone },
    { id: 'privacy', label: 'গোপনীয়তা ও নিরাপত্তা', icon: Lock },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-sand shadow-sakinah-sm">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            <span>ওয়েবসাইট কনফিগারেশন ও সেটিংস</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            ঈদগাহের পরিচিতি, ঐতিহাসিক তথ্য, জামাত সময়সূচি, ব্যাংক ও গোপনীয়তা নিয়ন্ত্রণ
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 text-xs font-bold text-primary-dark bg-primary-soft px-4 py-2 rounded-xl border border-primary/30">
            <Check className="w-4 h-4" />
            <span>সেটিংস সফলভাবে সংরক্ষিত হয়েছে!</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sakinah-sm border border-primary'
                  : 'bg-surface text-ink hover:bg-canvas-alt border border-sand'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Settings Form Container */}
      <form onSubmit={handleSave} className="bg-surface rounded-3xl p-6 sm:p-8 border border-sand shadow-sakinah-sm space-y-6 text-xs">
        {/* TAB 1: GENERAL */}
        {activeTab === 'general' && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="font-serif font-bold text-lg text-ink border-b border-sand pb-3">
              সাধারণ তথ্য ও দৃশ্যপট
            </h2>

            <BilingualInput
              label="ঈদগাহের নাম (Eidgah Name)"
              required={true}
              valueBn={settings.site_name || ''}
              valueEn={settings.site_name_en || ''}
              onChangeBn={(val) => {
                handleChange('site_name', val);
                handleChange('eidgahNameBn', val);
              }}
              onChangeEn={(val) => {
                handleChange('site_name_en', val);
                handleChange('eidgahNameEn', val);
              }}
              placeholderBn="মানিকপুর ঈদগাহ"
              placeholderEn="Manikpur Eidgah"
            />

            <BilingualInput
              label="ট্যাগলাইন / স্লোগান (Tagline)"
              valueBn={settings.tagline || ''}
              valueEn={settings.tagline_en || ''}
              onChangeBn={(val) => handleChange('tagline', val)}
              onChangeEn={(val) => handleChange('tagline_en', val)}
              placeholderBn="ঐতিহ্যবাহী দ্বীনি ও সামাজিক ঈদগাহ ময়দান • স্থাপিত ১৯৬৫ খ্রি."
              placeholderEn="Historic Community Eidgah Ground & Waqf Estate • Est. 1965"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-canvas-alt border border-sand">
              <div>
                <label className="block font-bold text-ink mb-1">ওয়েবসাইট থিম প্রিসেট (Theme Preset)</label>
                <select
                  value={settings.theme_preset || 'sakinah'}
                  onChange={(e) => handleChange('theme_preset', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-sand bg-surface text-ink font-semibold"
                >
                  <option value="sakinah">সাকিনাহ (Sakinah — হালকা শান্তিপূর্ণ আইভরি ও সেজ • ডিফল্ট)</option>
                  <option value="classic-emerald">ক্লাসিক এমারেল্ড (Classic Emerald — ঐতিহ্যবাহী গাঢ় সবুজ)</option>
                </select>
                <p className="text-[11px] text-ink-muted mt-1">
                  সংরক্ষণের সাথে সাথেই সম্পূর্ণ ওয়েবসাইট ও অ্যাডমিন প্যানেলে প্রিসেট কার্যকর হবে।
                </p>
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">হিরো সেকশনের ব্যাকগ্রাউন্ড স্টাইল</label>
                <select
                  value={settings.hero_bg_style || 'dawn-photo-wave'}
                  onChange={(e) => handleChange('hero_bg_style', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-sand bg-surface text-ink font-semibold"
                >
                  <option value="dawn-photo-wave">১. ডন ফটো ও ওয়েভ (Dawn Photo + Wave — ডিফল্ট)</option>
                  <option value="photo">২. কেন্দ্রীয় আলোকচিত্র (Centered Photo Wash)</option>
                  <option value="eid-dawn">৩. ঈদের সকাল (Eid Dawn — সেজ মসজিদ স্কাইলাইন)</option>
                  <option value="arcade">৪. আর্কেড (Arcade — আইভরি-সেজ খিলান ও সোনালী আলো)</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-2.5">
                <label className="block font-bold text-ink">হিরো ব্যাকগ্রাউন্ড ছবি আপলোড / পাথ (Hero Image)</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {settings.hero_image ? (
                    <img
                      src={getImageUrl(settings.hero_image, '/defaults/eidgah-hero.webp')}
                      alt="Hero Preview"
                      className="w-32 h-16 rounded-xl object-cover border border-sand bg-surface shrink-0"
                    />
                  ) : (
                    <div className="w-32 h-16 rounded-xl border border-dashed border-sand bg-surface flex items-center justify-center text-ink-muted shrink-0">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-grow w-full space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white font-bold cursor-pointer hover:bg-primary-hover transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingHero ? 'আপলোড হচ্ছে...' : 'নতুন ছবি আপলোড করুন'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleHeroUpload}
                          disabled={uploadingHero}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          handleChange('hero_image', '/defaults/eidgah-hero.webp');
                          handleChange('hero_image_en', '/defaults/eidgah-hero.webp');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-surface border border-sand text-ink font-semibold hover:bg-primary-soft/50 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>ডিফল্ট ছবি</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleChange('hero_image', '');
                          handleChange('hero_image_en', '');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-surface border border-sand text-ink-muted font-semibold hover:text-ink transition-colors"
                      >
                        <span>ছবি ছাড়া (SVG স্কাইলাইন)</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={settings.hero_image ?? ''}
                      onChange={(e) => {
                        handleChange('hero_image', e.target.value);
                        handleChange('hero_image_en', e.target.value);
                      }}
                      placeholder="/defaults/eidgah-hero.webp"
                      className="w-full px-3 py-2 rounded-xl border border-sand bg-surface text-ink font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <BilingualInput
              label="প্রতিষ্ঠার সাল"
              valueBn={settings.established_year || ''}
              valueEn={settings.established_year_en || ''}
              onChangeBn={(val) => handleChange('established_year', val)}
              onChangeEn={(val) => handleChange('established_year_en', val)}
              placeholderBn="১৯৬৫ খ্রিস্টাব্দ"
              placeholderEn="1965 AD"
            />

            <BilingualInput
              label="মোট ভূমির পরিমাণ"
              valueBn={settings.land_area || ''}
              valueEn={settings.land_area_en || ''}
              onChangeBn={(val) => handleChange('land_area', val)}
              onChangeEn={(val) => handleChange('land_area_en', val)}
              placeholderBn="১.৩৫ একর (১৩৫ শতাংশ ওয়াকফকৃত জমি)"
              placeholderEn="1.35 Acres (135 Decimals Waqf Land)"
            />

            <BilingualInput
              label="জামাত ধারণক্ষমতা"
              valueBn={settings.capacity || ''}
              valueEn={settings.capacity_en || ''}
              onChangeBn={(val) => handleChange('capacity', val)}
              onChangeEn={(val) => handleChange('capacity_en', val)}
              placeholderBn="প্রায় ১২,০০০+ মুসল্লি"
              placeholderEn="Approx. 12,000+ worshippers"
            />

            <BilingualInput
              label="কমিটি শিরোনাম"
              valueBn={settings.committee_title || ''}
              valueEn={settings.committee_title_en || ''}
              onChangeBn={(val) => handleChange('committee_title', val)}
              onChangeEn={(val) => handleChange('committee_title_en', val)}
              placeholderBn="সাত সদস্যবিশিষ্ট উন্নয়ন কমিটি"
              placeholderEn="Seven-member Development Committee"
            />

            <BilingualInput
              label="সংক্ষিপ্ত পরিচিতি বক্তব্য (Intro)"
              isTextArea={true}
              rows={3}
              valueBn={settings.intro || ''}
              valueEn={settings.intro_en || ''}
              onChangeBn={(val) => handleChange('intro', val)}
              onChangeEn={(val) => handleChange('intro_en', val)}
              placeholderBn="সংক্ষিপ্ত পরিচিতি বক্তব্য..."
              placeholderEn="Brief introductory text..."
            />

            <BilingualInput
              label="প্রতিষ্ঠার পূর্ণাঙ্গ ইতিহাস (History)"
              isTextArea={true}
              rows={5}
              valueBn={settings.history || ''}
              valueEn={settings.history_en || ''}
              onChangeBn={(val) => handleChange('history', val)}
              onChangeEn={(val) => handleChange('history_en', val)}
              placeholderBn="প্রতিষ্ঠার পূর্ণাঙ্গ ইতিহাস লিখুন..."
              placeholderEn="Full history of establishment..."
            />
          </div>
        )}

        {/* TAB 2: LAND & DONORS CONFIG */}
        {activeTab === 'land' && (
          <div className="space-y-6 max-w-3xl">
            <h2 className="font-serif font-bold text-lg text-ink border-b border-sand pb-3 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-primary" />
              <span>জমিদাতা পরিষদ ও ভূমি রূপান্তর সেটিংস</span>
            </h2>

            {/* Money Donors Toggle */}
            <div className="p-4 bg-canvas-alt rounded-2xl border border-sand">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enable_money_donors === 'true' || settings.enable_money_donors === '1'}
                  onChange={(e) => handleChange('enable_money_donors', e.target.checked ? 'true' : 'false')}
                  className="w-5 h-5 mt-0.5 rounded accent-primary border-sand focus:ring-gold"
                />
                <div>
                  <span className="font-bold text-ink block text-sm">
                    আগের টাকার অনুদানকারী পেজ জনসম্মুখে সক্রিয় রাখুন (/donations)
                  </span>
                  <span className="text-xs text-ink-muted block mt-0.5">
                    বন্ধ থাকলে পাবলিক সাইটে কেবল "জমিদাতা" ফিচার থাকবে এবং পুরানো অনুদান তালিকা কেবল অ্যাডমিনে সংরক্ষিত থাকবে। চালু করলে সাধারণ মানুষ /donations লিঙ্কে পুরনো টাকার অনুদান তালিকা দেখতে পাবে।
                  </span>
                </div>
              </label>
            </div>

            {/* Tribute Text */}
            <BilingualInput
              label="পাবলিক পেজের শীর্ষ শ্রদ্ধাঞ্জলি বাণী"
              isTextArea={true}
              rows={3}
              valueBn={settings.land_tribute_bn || ''}
              valueEn={settings.land_tribute_en || ''}
              onChangeBn={(val) => handleChange('land_tribute_bn', val)}
              onChangeEn={(val) => handleChange('land_tribute_en', val)}
              placeholderBn="মানিকপুর ঈদগাহের শ্রদ্ধেয় জমিদাতাগণের নিঃস্বার্থ ওয়াকফ ও অবদানের প্রতি জানাই গভীর বিনম্র শ্রদ্ধা..."
              placeholderEn="In profound reverence and everlasting gratitude to the revered land donors..."
            />

            {/* Land Unit Conversion Factors */}
            <div className="p-5 bg-canvas rounded-2xl border border-sand space-y-4">
              <div>
                <h3 className="text-sm font-bold text-primary-dark">ভূমির একক রূপান্তর অনুপাত (কনভার্সন ফ্যাক্টর)</h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  জমিদাতা ফরম ও পাবলিক সুইচারে এই হিসাব অনুযায়ী স্বয়ংক্রিয়ভাবে মোট শতাংশ বা একর নির্ধারিত হয়।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-ink mb-1">১ একর = কত শতাংশ?</label>
                  <input
                    type="number"
                    step="any"
                    value={settings.unit_conv_acre || '100'}
                    onChange={(e) => handleChange('unit_conv_acre', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-sand font-mono font-bold bg-surface text-ink"
                  />
                  <span className="text-[10px] text-ink-muted mt-0.5 block">ডিফল্ট: ১০০ শতাংশ</span>
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">১ বিঘা = কত শতাংশ?</label>
                  <input
                    type="number"
                    step="any"
                    value={settings.unit_conv_bigha || '33'}
                    onChange={(e) => handleChange('unit_conv_bigha', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-sand font-mono font-bold bg-surface text-ink"
                  />
                  <span className="text-[10px] text-ink-muted mt-0.5 block">ডিফল্ট: ৩৩ শতাংশ</span>
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">১ কাঠা = কত শতাংশ?</label>
                  <input
                    type="number"
                    step="any"
                    value={settings.unit_conv_katha || '1.65'}
                    onChange={(e) => handleChange('unit_conv_katha', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-sand font-mono font-bold bg-surface text-ink"
                  />
                  <span className="text-[10px] text-ink-muted mt-0.5 block">ডিফল্ট: ১.৬৫ শতাংশ</span>
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">১ শতাংশ = কত বর্গফুট?</label>
                  <input
                    type="number"
                    step="any"
                    value={settings.unit_conv_sqft || '435.6'}
                    onChange={(e) => handleChange('unit_conv_sqft', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-sand font-mono font-bold bg-surface text-ink"
                  />
                  <span className="text-[10px] text-ink-muted mt-0.5 block">ডিফল্ট: ৪৩৫.৬ বর্গফুট</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">পাবলিক পেজে ডিফল্ট প্রদর্শনের একক</label>
                <select
                  value={settings.land_default_unit || 'DECIMAL_SHATANGSHO'}
                  onChange={(e) => handleChange('land_default_unit', e.target.value)}
                  className="w-full sm:max-w-xs px-3 py-2 rounded-xl border border-sand font-semibold bg-surface text-ink"
                >
                  <option value="DECIMAL_SHATANGSHO">শতাংশ / শতক / ডেসিমাল</option>
                  <option value="KATHA">কাঠা</option>
                  <option value="BIGHA">বিঘা</option>
                  <option value="ACRE">একর</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EID JAMAT */}
        {activeTab === 'jamat' && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="font-serif font-bold text-lg text-primary-dark border-b border-sand pb-3">
              পবিত্র ঈদের জামাত সময়সূচি
            </h2>

            <BilingualInput
              label="জামাত সময়সূচি ও নির্দেশনা"
              isTextArea={true}
              rows={5}
              valueBn={settings.eid_jamat || ''}
              valueEn={settings.eid_jamat_en || ''}
              onChangeBn={(val) => handleChange('eid_jamat', val)}
              onChangeEn={(val) => handleChange('eid_jamat_en', val)}
              placeholderBn="পবিত্র ঈদুল ফিতর: ১ম জামাত সকাল ৮:০০ ঘটিকা..."
              placeholderEn="Holy Eid-ul-Fitr: 1st Jamat at 8:00 AM, 2nd Jamat at 9:00 AM..."
            />
          </div>
        )}

        {/* TAB 3: CONTACT & BANK */}
        {activeTab === 'contact' && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="font-serif font-bold text-lg text-primary-dark border-b border-sand pb-3">
              অফিসিয়াল যোগাযোগ ও দান অনুদান ব্যাংক হিসাব
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-ink mb-1">হটলাইন / মোবাইল</label>
                <input
                  type="text"
                  value={settings.contact_phone || ''}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">ই-মেইল</label>
                <input
                  type="email"
                  value={settings.contact_email || ''}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink"
                />
              </div>
            </div>

            <BilingualInput
              label="ব্যাংকের নাম"
              valueBn={settings.bank_name || ''}
              valueEn={settings.bank_name_en || ''}
              onChangeBn={(val) => handleChange('bank_name', val)}
              onChangeEn={(val) => handleChange('bank_name_en', val)}
              placeholderBn="ইসলামী ব্যাংক বাংলাদেশ পিএলসি"
              placeholderEn="Islami Bank Bangladesh PLC"
            />

            <BilingualInput
              label="শাখার নাম"
              valueBn={settings.bank_branch || ''}
              valueEn={settings.bank_branch_en || ''}
              onChangeBn={(val) => handleChange('bank_branch', val)}
              onChangeEn={(val) => handleChange('bank_branch_en', val)}
              placeholderBn="বাঞ্ছারামপুর শাখা"
              placeholderEn="Bancharampur Branch"
            />

            <BilingualInput
              label="হিসাবের নাম (Account Title)"
              valueBn={settings.bank_account_name || ''}
              valueEn={settings.bank_account_name_en || ''}
              onChangeBn={(val) => handleChange('bank_account_name', val)}
              onChangeEn={(val) => handleChange('bank_account_name_en', val)}
              placeholderBn="মানিকপুর ঈদগাহ উন্নয়ন তহবিল"
              placeholderEn="Manikpur Eidgah Development Fund"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-ink mb-1">হিসাব নম্বর (Account No)</label>
                <input
                  type="text"
                  value={settings.bank_account_no || ''}
                  onChange={(e) => handleChange('bank_account_no', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">রাউটিং নম্বর</label>
                <input
                  type="text"
                  value={settings.bank_routing_no || ''}
                  onChange={(e) => handleChange('bank_routing_no', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">বিকাশ ও নগদ নম্বর</label>
                <input
                  type="text"
                  value={settings.bkash_no || ''}
                  onChange={(e) => handleChange('bkash_no', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB: MAP & LOCATION (Unambiguous 6-tab panel) */}
        {activeTab === 'map' && (
          <AdminMapSettingsPanel
            settings={settings}
            onSettingsUpdated={(updatedMapFields) =>
              setSettings((prev) => ({ ...prev, ...updatedMapFields }))
            }
          />
        )}

        {/* TAB 4: PRIVACY */}
        {activeTab === 'privacy' && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="font-serif font-bold text-lg text-primary-dark border-b border-sand pb-3">
              সার্বজনীন গোপনীয়তা ও স্বচ্ছতা সেটিংস
            </h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-sand hover:bg-canvas-alt cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.show_donation_amount === '1' || settings.show_donation_amount === 'true'}
                  onChange={(e) => handleChange('show_donation_amount', e.target.checked ? '1' : '0')}
                  className="w-4 h-4 rounded accent-primary"
                />
                <div>
                  <span className="font-bold text-ink block">অনুদানকারীদের টাকার পরিমাণ ওয়েবসাইটে উন্মুক্ত রাখুন</span>
                  <span className="text-[11px] text-ink-muted">অন করা থাকলে পাবলিক লেজারে টাকার পরিমাণ দৃশ্যমান হবে।</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-sand hover:bg-canvas-alt cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allow_photo_download === '1' || settings.allow_photo_download === 'true'}
                  onChange={(e) => handleChange('allow_photo_download', e.target.checked ? '1' : '0')}
                  className="w-4 h-4 rounded accent-primary"
                />
                <div>
                  <span className="font-bold text-ink block">গ্যালারি থেকে সরাসরি ছবি ডাউনলোডের সুযোগ দিন</span>
                  <span className="text-[11px] text-ink-muted">অন করা থাকলে লাইটবক্সে ডাউনলোড বাটন দৃশ্যমান হবে।</span>
                </div>
              </label>
            </div>
          </div>
        )}



        {/* Save Button (hidden on map tab which manages its own dirty-gated Save/Reset + 50m guard) */}
        {activeTab !== 'map' && (
          <div className="pt-4 border-t border-sand flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-primary-hover transition-colors shadow-sakinah-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

