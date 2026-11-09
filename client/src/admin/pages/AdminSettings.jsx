import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Globe, Moon, Phone, Lock, MapPin, 
  Sparkles, Check, AlertCircle, RefreshCw 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (data.success) {
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
    { id: 'jamat', label: 'ঈদের জামাত সময়সূচি', icon: Moon },
    { id: 'contact', label: 'যোগাযোগ ও ব্যাংক একাউন্ট', icon: Phone },
    { id: 'privacy', label: 'গোপনীয়তা ও নিরাপত্তা', icon: Lock },
    { id: 'map', label: 'মানচিত্র ও জিপিএস', icon: MapPin },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gold-500/30 shadow-sm">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-800" />
            <span>ওয়েবসাইট কনফিগারেশন ও সেটিংস</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            ঈদগাহের পরিচিতি, ঐতিহাসিক তথ্য, জামাত সময়সূচি, ব্যাংক ও গোপনীয়তা নিয়ন্ত্রণ
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-300">
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
                  ? 'bg-emerald-950 text-gold-200 shadow-md border border-gold-500/50'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Settings Form Container */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-gold-500/30 shadow-sm space-y-6 text-xs">
        {/* TAB 1: GENERAL */}
        {activeTab === 'general' && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="font-serif font-bold text-lg text-stone-900 border-b border-stone-100 pb-3">
              সাধারণ তথ্য ও দৃশ্যপট
            </h2>

            <div>
              <label className="block font-bold text-stone-700 mb-1">হিরো সেকশনের ব্যাকগ্রাউন্ড স্টাইল</label>
              <select
                value={settings.hero_bg_style || 'eid-dawn'}
                onChange={(e) => handleChange('hero_bg_style', e.target.value)}
                className="w-full sm:max-w-xs px-3 py-2 rounded-xl border border-stone-300 font-semibold"
              >
                <option value="eid-dawn">১. ঈদের সকাল (Eid Dawn - চিত্রিত ভোরের আকাশ ও মসজিদ)</option>
                <option value="arcade">২. শাহী আর্কেড (Arcade - গভীর সবুজ ও সোনালী খিলান)</option>
                <option value="photo">৩. আলোকচিত্র (Photo - মূল ঈদগাহ ময়দানের ফটো)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">প্রতিষ্ঠার সাল</label>
                <input
                  type="text"
                  value={settings.established_year || ''}
                  onChange={(e) => handleChange('established_year', e.target.value)}
                  placeholder="১৯৬৫ খ্রিস্টাব্দ"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">মোট ভূমির পরিমাণ</label>
                <input
                  type="text"
                  value={settings.land_area || ''}
                  onChange={(e) => handleChange('land_area', e.target.value)}
                  placeholder="১.৩৫ একর (১৩৫ শতাংশ ওয়াকফকৃত জমি)"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">জামাত ধারণক্ষমতা</label>
                <input
                  type="text"
                  value={settings.capacity || ''}
                  onChange={(e) => handleChange('capacity', e.target.value)}
                  placeholder="প্রায় ১২,০০০+ মুসল্লি"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">কমিটি শিরোনাম</label>
                <input
                  type="text"
                  value={settings.committee_title || ''}
                  onChange={(e) => handleChange('committee_title', e.target.value)}
                  placeholder="সাত সদস্যবিশিষ্ট উন্নয়ন কমিটি"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">সংক্ষিপ্ত পরিচিতি বক্তব্য (Intro)</label>
              <textarea
                rows={3}
                value={settings.intro || ''}
                onChange={(e) => handleChange('intro', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">প্রতিষ্ঠার পূর্ণাঙ্গ ইতিহাস (History)</label>
              <textarea
                rows={6}
                value={settings.history || ''}
                onChange={(e) => handleChange('history', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
          </div>
        )}

        {/* TAB 2: EID JAMAT */}
        {activeTab === 'jamat' && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="font-serif font-bold text-lg text-stone-900 border-b border-stone-100 pb-3">
              পবিত্র ঈদের জামাত সময়সূচি
            </h2>

            <div>
              <label className="block font-bold text-stone-700 mb-1">জামাত সময়সূচি ও নির্দেশনা</label>
              <textarea
                rows={5}
                value={settings.eid_jamat || ''}
                onChange={(e) => handleChange('eid_jamat', e.target.value)}
                placeholder="পবিত্র ঈদুল ফিতর: ১ম জামাত সকাল ৮:০০ ঘটিকা..."
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
          </div>
        )}

        {/* TAB 3: CONTACT & BANK */}
        {activeTab === 'contact' && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="font-serif font-bold text-lg text-stone-900 border-b border-stone-100 pb-3">
              অফিসিয়াল যোগাযোগ ও দান অনুদান ব্যাংক হিসাব
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">হটলাইন / মোবাইল</label>
                <input
                  type="text"
                  value={settings.contact_phone || ''}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">ই-মেইল</label>
                <input
                  type="email"
                  value={settings.contact_email || ''}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">ব্যাংকের নাম</label>
                <input
                  type="text"
                  value={settings.bank_name || ''}
                  onChange={(e) => handleChange('bank_name', e.target.value)}
                  placeholder="ইসলামী ব্যাংক বাংলাদেশ পিএলসি"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">শাখার নাম</label>
                <input
                  type="text"
                  value={settings.bank_branch || ''}
                  onChange={(e) => handleChange('bank_branch', e.target.value)}
                  placeholder="বাঞ্ছারামপুর শাখা"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">হিসাবের নাম (Account Title)</label>
                <input
                  type="text"
                  value={settings.bank_account_name || ''}
                  onChange={(e) => handleChange('bank_account_name', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">হিসাব নম্বর (Account No)</label>
                <input
                  type="text"
                  value={settings.bank_account_no || ''}
                  onChange={(e) => handleChange('bank_account_no', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">রাউটিং নম্বর</label>
                <input
                  type="text"
                  value={settings.bank_routing_no || ''}
                  onChange={(e) => handleChange('bank_routing_no', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">বিকাশ ও নগদ নম্বর</label>
                <input
                  type="text"
                  value={settings.bkash_no || ''}
                  onChange={(e) => handleChange('bkash_no', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PRIVACY */}
        {activeTab === 'privacy' && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="font-serif font-bold text-lg text-stone-900 border-b border-stone-100 pb-3">
              সার্বজনীন গোপনীয়তা ও স্বচ্ছতা সেটিংস
            </h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.show_donation_amount === '1' || settings.show_donation_amount === 'true'}
                  onChange={(e) => handleChange('show_donation_amount', e.target.checked ? '1' : '0')}
                  className="w-4 h-4 rounded text-emerald-800"
                />
                <div>
                  <span className="font-bold text-stone-800 block">অনুদানকারীদের টাকার পরিমাণ ওয়েবসাইটে উন্মুক্ত রাখুন</span>
                  <span className="text-[11px] text-stone-500">অন করা থাকলে পাবলিক লেজারে টাকার পরিমাণ দৃশ্যমান হবে।</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allow_photo_download === '1' || settings.allow_photo_download === 'true'}
                  onChange={(e) => handleChange('allow_photo_download', e.target.checked ? '1' : '0')}
                  className="w-4 h-4 rounded text-emerald-800"
                />
                <div>
                  <span className="font-bold text-stone-800 block">গ্যালারি থেকে সরাসরি ছবি ডাউনলোডের সুযোগ দিন</span>
                  <span className="text-[11px] text-stone-500">অন করা থাকলে লাইটবক্সে ডাউনলোড বাটন দৃশ্যমান হবে।</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* TAB 5: MAP */}
        {activeTab === 'map' && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="font-serif font-bold text-lg text-stone-900 border-b border-stone-100 pb-3">
              মানচিত্র ও জিপিএস কোঅর্ডিনেট
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">অক্ষাংশ (Latitude)</label>
                <input
                  type="text"
                  value={settings.map_lat || ''}
                  onChange={(e) => handleChange('map_lat', e.target.value)}
                  placeholder="23.9875"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">দ্রাঘিমাংশ (Longitude)</label>
                <input
                  type="text"
                  value={settings.map_lng || ''}
                  onChange={(e) => handleChange('map_lng', e.target.value)}
                  placeholder="90.8214"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-emerald-950 text-gold-200 text-xs sm:text-sm font-bold hover:bg-emerald-900 transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

