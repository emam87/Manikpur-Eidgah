import React, { useState } from 'react';
import { 
  Phone, Mail, MapPin, Building, CreditCard, Smartphone, 
  Copy, Check, ExternalLink, Navigation, Clock, ShieldCheck, HeartHandshake
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { EightPointStar, StarDivider } from '../components/common/EightPointStar.jsx';

export function Contact() {
  const { locale, t, toBanglaNum } = useLanguage();
  const { getSetting } = useSettings();

  const [copiedKey, setCopiedKey] = useState(null);

  const phone = getSetting('contact_phone', locale, '+880 1711-000000');
  const email = getSetting('contact_email', locale, 'info@manikpureidgah.org');
  const address = getSetting('location', locale, 'মানিকপুর, বাঞ্ছারামপুর, ব্রাহ্মণবাড়িয়া, বাংলাদেশ');
  const bankName = getSetting('bank_name', locale, 'ইসলামী ব্যাংক বাংলাদেশ পিএলসি');
  const branchName = getSetting('bank_branch', locale, 'বাঞ্ছারামপুর শাখা');
  const acName = getSetting('bank_account_name', locale, 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ উন্নয়ন কমিটি');
  const acNumber = getSetting('bank_account_no', locale, '20501234567890123');
  const routingNo = getSetting('bank_routing_no', locale, '125120000');
  const bkashNo = getSetting('bkash_no', locale, '01711-000000 (পার্সোনাল)');
  const nagadNo = getSetting('nagad_no', locale, '01811-000000 (পার্সোনাল)');

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="py-10 sm:py-16">
      <SEO 
        title={locale === 'bn' ? 'যোগাযোগ ও অনুদান ব্যাংক হিসাব' : 'Contact & Donation Accounts'} 
        description={locale === 'bn' ? 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ কমিটির সাথে যোগাযোগ ও অনুদান পাঠানোর ব্যাংক হিসাব।' : 'Contact information, committee office, and official bank donation accounts for Manikpur Eidgah.'}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950 text-gold-300 text-xs sm:text-sm font-semibold mb-3 border border-gold-500/40">
            <HeartHandshake className="w-3.5 h-3.5 text-gold-400" />
            <span>{locale === 'bn' ? 'সরাসরি যোগাযোগ ও অনুদান' : 'Contact & Donations'}</span>
            <EightPointStar className="w-3.5 h-3.5 text-gold-400" />
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight mb-4">
            {locale === 'bn' ? 'যোগাযোগ ও দান তহবিল' : 'Contact & Official Accounts'}
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            {locale === 'bn' 
              ? 'ঈদগাহের সার্বিক উন্নয়ন কার্যক্রমে অনুদান প্রেরণের অফিসিয়াল ব্যাংক হিসাব ও পরিচালনা পরিষদের সাথে যোগাযোগের মাধ্যম।' 
              : 'Direct communication channels and official bank donation accounts supporting the Manikpur Eidgah development fund.'}
          </p>
          <StarDivider className="my-4" />
        </div>

        {/* Two-Column Grid: Contact Information & Bank Accounts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
          {/* Column 1: Contact Cards */}
          <div className="space-y-6">
            <h2 className="font-serif text-2xl font-bold text-emerald-950 flex items-center gap-2">
              <Phone className="w-6 h-6 text-gold-500" />
              <span>{locale === 'bn' ? 'অফিসিয়াল যোগাযোগ' : 'Office Information'}</span>
            </h2>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold-500/30 shadow-md space-y-6">
              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                  <MapPin className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base">{locale === 'bn' ? 'ঈদগাহ ময়দানের ঠিকানা' : 'Eidgah Address'}</h3>
                  <p className="text-sm text-stone-600 mt-1 leading-relaxed">{address}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4 pt-4 border-t border-stone-100">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                  <Phone className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base">{locale === 'bn' ? 'হটলাইন / মোবাইল' : 'Contact Phone'}</h3>
                  <a
                    href={`tel:${phone}`}
                    className="text-base font-semibold text-emerald-900 hover:text-gold-600 transition-colors mt-1 block"
                  >
                    {phone}
                  </a>
                  <span className="text-xs text-stone-400">{locale === 'bn' ? '(সরাসরি কল করতে ক্লিক করুন)' : '(Tap to call)'}</span>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 pt-4 border-t border-stone-100">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                  <Mail className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base">{locale === 'bn' ? 'ই-মেইল যোগাযোগ' : 'Official Email'}</h3>
                  <a
                    href={`mailto:${email}`}
                    className="text-sm font-semibold text-emerald-900 hover:text-gold-600 transition-colors mt-1 block"
                  >
                    {email}
                  </a>
                </div>
              </div>

              {/* Office Hours */}
              <div className="flex items-start gap-4 pt-4 border-t border-stone-100">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                  <Clock className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base">{locale === 'bn' ? 'সাক্ষাতের সময়' : 'Office Hours'}</h3>
                  <p className="text-sm text-stone-600 mt-1">
                    {locale === 'bn' 
                      ? 'প্রতি শুক্রবার জুমার নামাজের পর অথবা কমিটির যেকোনো কর্মকর্তার সাথে পূর্ব-যোগাযোগ সাপেক্ষে।' 
                      : 'Every Friday after Jummah prayers or upon prior appointment with committee members.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Donation Bank & Mobile Banking */}
          <div className="space-y-6">
            <h2 className="font-serif text-2xl font-bold text-emerald-950 flex items-center gap-2">
              <Building className="w-6 h-6 text-gold-500" />
              <span>{locale === 'bn' ? 'দান ও ফান্ড ব্যাংক হিসাব' : 'Donation Bank Accounts'}</span>
            </h2>

            {/* Bank Card (Emerald & Gold Foil Styling) */}
            <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 rounded-3xl p-6 sm:p-8 border-2 border-gold-500/50 shadow-xl text-ivory relative overflow-hidden space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gold-500/30">
                <div>
                  <span className="text-xs uppercase tracking-wider text-gold-300 font-bold block mb-1">
                    {locale === 'bn' ? 'সঞ্চয়ী ব্যাংক হিসাব' : 'Official Savings Account'}
                  </span>
                  <h3 className="font-serif font-bold text-xl text-gold-100">{bankName}</h3>
                  <p className="text-xs text-stone-300">{branchName}</p>
                </div>
                <CreditCard className="w-10 h-10 text-gold-400" />
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-xs text-stone-300 block">{locale === 'bn' ? 'হিসাবের নাম' : 'Account Title'}</span>
                  <span className="font-serif font-bold text-base text-gold-200">{acName}</span>
                </div>

                <div className="bg-emerald-900/80 p-3.5 sm:p-4 rounded-xl border border-gold-500/30 flex flex-col xs:flex-row xs:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[11px] text-gold-300 block font-mono">{locale === 'bn' ? 'হিসাব নম্বর (A/C No)' : 'Account Number'}</span>
                    <span className="font-mono font-extrabold text-base sm:text-lg text-white tracking-wider break-all">{acNumber}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(acNumber, 'bank_ac')}
                    className="px-3 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 active:scale-[0.98] text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all min-h-[40px] tap-target shrink-0 shadow-sm"
                    title="হিসাব নম্বর কপি করুন"
                  >
                    {copiedKey === 'bank_ac' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey === 'bank_ac' ? (locale === 'bn' ? 'কপি হয়েছে' : 'Copied') : (locale === 'bn' ? 'কপি করুন' : 'Copy')}</span>
                  </button>
                </div>

                {routingNo && (
                  <div className="flex justify-between items-center text-xs text-stone-300 pt-1">
                    <span>{locale === 'bn' ? 'রাউটিং নম্বর:' : 'Routing No:'}</span>
                    <span className="font-mono font-bold text-gold-300">{routingNo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Banking Options */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gold-500/30 shadow-md space-y-4">
              <h3 className="font-serif font-bold text-base text-emerald-950 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-gold-500" />
                <span>{locale === 'bn' ? 'মোবাইল ব্যাংকিং (বিকাশ ও নগদ)' : 'Mobile Banking (bKash & Nagad)'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* bKash */}
                <div className="p-4 rounded-2xl bg-pink-50/60 border border-pink-200 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-xs font-bold text-pink-700 font-mono">bKash (বিকাশ)</span>
                    <span className="font-mono font-bold text-stone-900 text-sm block mt-1">{bkashNo}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(bkashNo.split(' ')[0], 'bkash')}
                    className="text-xs text-pink-800 hover:text-pink-900 font-bold flex items-center gap-1.5 self-start px-3 py-1.5 rounded-lg bg-pink-100/70 border border-pink-200 min-h-[38px] tap-target transition-colors"
                  >
                    {copiedKey === 'bkash' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'bkash' ? (locale === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (locale === 'bn' ? 'নম্বর কপি করুন' : 'Copy Number')}</span>
                  </button>
                </div>

                {/* Nagad */}
                <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-xs font-bold text-orange-700 font-mono">Nagad (নগদ)</span>
                    <span className="font-mono font-bold text-stone-900 text-sm block mt-1">{nagadNo}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(nagadNo.split(' ')[0], 'nagad')}
                    className="text-xs text-orange-800 hover:text-orange-900 font-bold flex items-center gap-1.5 self-start px-3 py-1.5 rounded-lg bg-orange-100/70 border border-orange-200 min-h-[38px] tap-target transition-colors"
                  >
                    {copiedKey === 'nagad' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'nagad' ? (locale === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (locale === 'bn' ? 'নম্বর কপি করুন' : 'Copy Number')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

