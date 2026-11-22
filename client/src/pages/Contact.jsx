import React, { useState } from 'react';
import { 
  Phone, Mail, MapPin, Building, CreditCard, Smartphone, 
  Copy, Check, ExternalLink, Navigation, Clock, ShieldCheck, HeartHandshake
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { Breadcrumb } from '../components/common/Breadcrumb.jsx';
import { SectionHeader } from '../components/common/SectionHeader.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { EightPointStar } from '../components/common/EightPointStar.jsx';

export function Contact() {
  const { locale, t } = useLanguage();
  const { getSetting } = useSettings();
  const { showToast } = useToast();

  const [copiedKey, setCopiedKey] = useState(null);

  const phone = getSetting('contact_phone', locale) || getSetting('contact_phone', 'bn', '+880 1711-000000');
  const email = getSetting('contact_email', locale) || getSetting('contact_email', 'bn', 'info@manikpureidgah.org');
  const address = getSetting('location', locale, locale === 'bn' ? 'মানিকপুর, বাঞ্ছারামপুর, ব্রাহ্মণবাড়িয়া, বাংলাদেশ' : 'Manikpur, Bancharampur, Brahmanbaria, Bangladesh');
  const bankName = getSetting('bank_name', locale, locale === 'bn' ? 'ইসলামী ব্যাংক বাংলাদেশ পিএলসি' : 'Islami Bank Bangladesh PLC');
  const branchName = getSetting('bank_branch', locale, locale === 'bn' ? 'বাঞ্ছারামপুর শাখা' : 'Bancharampur Branch');
  const acName = getSetting('bank_account_name', locale, locale === 'bn' ? 'মানিকপুর ঈদগাহ উন্নয়ন কমিটি' : 'Manikpur Eidgah Development Committee');
  const acNumber = getSetting('bank_account_no', locale) || getSetting('bank_account_no', 'bn', '20501234567890123');
  const routingNo = getSetting('bank_routing_no', locale) || getSetting('bank_routing_no', 'bn', '125120000');
  const bkashNo = getSetting('bkash_no', locale) || getSetting('bkash_no', 'bn', locale === 'bn' ? '01711-000000 (পার্সোনাল)' : '01711-000000 (Personal)');
  const nagadNo = getSetting('nagad_no', locale) || getSetting('nagad_no', 'bn', locale === 'bn' ? '01811-000000 (পার্সোনাল)' : '01811-000000 (Personal)');

  const copyToClipboard = async (text, key, label) => {
    const cleanText = String(text || '').trim();
    if (!cleanText) return;

    let copiedOk = false;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(cleanText);
        copiedOk = true;
      }
    } catch {
      copiedOk = false;
    }

    if (!copiedOk) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = cleanText;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, cleanText.length);
        copiedOk = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        copiedOk = false;
      }
    }

    setCopiedKey(key);
    if (showToast) {
      showToast(
        locale === 'bn'
          ? `${label || 'তথ্য'} কপি করা হয়েছে: ${cleanText}`
          : `${label || 'Info'} copied: ${cleanText}`,
        'success'
      );
    }
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="py-6 sm:py-12">
      <SEO 
        title={locale === 'bn' ? 'যোগাযোগ ও অনুদান ব্যাংক হিসাব' : 'Contact & Donation Accounts'} 
        description={locale === 'bn' ? 'মানিকপুর ঈদগাহ কমিটির সাথে যোগাযোগ ও অনুদান পাঠানোর ব্যাংক হিসাব।' : 'Contact information, committee office, and official bank donation accounts for Manikpur Eidgah.'}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        <Breadcrumb 
          items={[
            { label: locale === 'bn' ? 'যোগাযোগ ও তহবিল' : 'Contact & Donations' }
          ]} 
        />

        {/* Single Page Title */}
        <div className="border-b border-sand pb-3">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary-dark tracking-tight">
            {locale === 'bn' ? 'যোগাযোগ ও দান তহবিল' : 'Contact & Official Accounts'}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
            {locale === 'bn'
              ? 'ঈদগাহের সার্বিক উন্নয়ন কার্যক্রমে অনুদান প্রেরণের অফিসিয়াল ব্যাংক হিসাব ও যোগাযোগের মাধ্যম'
              : 'Direct communication channels and official bank donation accounts supporting Manikpur Eidgah'}
          </p>
        </div>

        {/* Two-Column Grid: Contact Information & Bank Accounts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
          {/* Column 1: Contact Cards */}
          <div className="space-y-6">
            <h2 className="font-serif text-2xl font-bold text-primary-dark flex items-center gap-2">
              <Phone className="w-6 h-6 text-gold-text" />
              <span>{locale === 'bn' ? 'অফিসিয়াল যোগাযোগ' : 'Office Information'}</span>
            </h2>

            <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-sand shadow-sakinah-card space-y-6">
              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary-dark flex items-center justify-center shrink-0 border border-primary/20">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-ink text-base">{locale === 'bn' ? 'ঈদগাহ ময়দানের ঠিকানা' : 'Eidgah Address'}</h3>
                  <p className="text-sm text-ink-muted mt-1 leading-relaxed">{address}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4 pt-4 border-t border-sand">
                <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary-dark flex items-center justify-center shrink-0 border border-primary/20">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-bold text-ink text-base">{locale === 'bn' ? 'হটলাইন / মোবাইল' : 'Contact Phone'}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <a
                      href={`tel:${phone}`}
                      className="text-base font-semibold text-primary-dark hover:text-gold-text transition-colors inline-flex items-center gap-2 tabular-nums"
                    >
                      <span>{phone}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(phone, 'phone', locale === 'bn' ? 'ফোন নম্বর' : 'Phone')}
                      className="text-xs px-2.5 py-1 rounded-lg bg-canvas-alt text-ink hover:bg-primary-soft transition-colors inline-flex items-center gap-1 min-h-[36px] border border-sand cursor-pointer"
                      title="নম্বর কপি করুন"
                      aria-label="Copy phone number"
                    >
                      {copiedKey === 'phone' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'phone' ? (locale === 'bn' ? 'কপি হয়েছে' : 'Copied') : (locale === 'bn' ? 'কপি' : 'Copy')}</span>
                    </button>
                  </div>
                  <span className="text-xs text-ink-muted block mt-1">{locale === 'bn' ? '(সরাসরি কল করতে ট্যাপ করুন)' : '(Tap to call directly)'}</span>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 pt-4 border-t border-sand">
                <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary-dark flex items-center justify-center shrink-0 border border-primary/20">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-ink text-base">{locale === 'bn' ? 'ই-মেইল যোগাযোগ' : 'Official Email'}</h3>
                  <a
                    href={`mailto:${email}`}
                    className="text-sm font-semibold text-primary-dark hover:text-gold-text transition-colors mt-1 block break-all"
                  >
                    {email}
                  </a>
                </div>
              </div>

              {/* Office Hours */}
              <div className="flex items-start gap-4 pt-4 border-t border-sand">
                <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary-dark flex items-center justify-center shrink-0 border border-primary/20">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-ink text-base">{locale === 'bn' ? 'সাক্ষাতের সময়' : 'Office Hours'}</h3>
                  <p className="text-sm text-ink-muted mt-1 leading-relaxed">
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
            <h2 className="font-serif text-2xl font-bold text-primary-dark flex items-center gap-2">
              <Building className="w-6 h-6 text-gold-text" />
              <span>{locale === 'bn' ? 'দান ও ফান্ড ব্যাংক হিসাব' : 'Donation Bank Accounts'}</span>
            </h2>

            {/* Bank Card (Sakinah Ivory & Gold-Foil Prestige Card) */}
            <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-gold shadow-sakinah-sm text-ink relative overflow-hidden space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-sand">
                <div>
                  <span className="text-xs uppercase tracking-wider text-gold-text font-bold block mb-1">
                    {locale === 'bn' ? 'সঞ্চয়ী ব্যাংক হিসাব' : 'Official Savings Account'}
                  </span>
                  <h3 className="font-serif font-bold text-xl text-primary-dark">{bankName}</h3>
                  <p className="text-xs text-ink-muted">{branchName}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary-soft flex items-center justify-center border border-gold/40">
                  <CreditCard className="w-6 h-6 text-primary-dark" />
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-xs text-ink-muted block">{locale === 'bn' ? 'হিসাবের নাম' : 'Account Title'}</span>
                  <span className="font-serif font-bold text-base text-primary-dark">{acName}</span>
                </div>

                <div
                  onClick={() => copyToClipboard(acNumber, 'bank_ac', locale === 'bn' ? 'হিসাব নম্বর' : 'Account Number')}
                  className="bg-canvas-alt p-3.5 sm:p-4 rounded-xl border border-gold/40 flex flex-col xs:flex-row xs:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0">
                    <span className="text-[11px] text-gold-text block font-mono font-semibold">{locale === 'bn' ? 'হিসাব নম্বর (A/C No)' : 'Account Number'}</span>
                    <span className="font-mono font-extrabold text-base sm:text-lg text-ink tracking-wider break-all tabular-nums select-all">{acNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(acNumber, 'bank_ac', locale === 'bn' ? 'হিসাব নম্বর' : 'Account Number');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gold-plate hover:brightness-105 active:scale-[0.98] text-ink font-bold text-xs flex items-center justify-center gap-1.5 transition-all min-h-[40px] tap-target shrink-0 shadow-sakinah-sm cursor-pointer relative z-10"
                    title="হিসাব নম্বর কপি করুন"
                  >
                    {copiedKey === 'bank_ac' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey === 'bank_ac' ? (locale === 'bn' ? 'কপি হয়েছে' : 'Copied') : (locale === 'bn' ? 'কপি করুন' : 'Copy')}</span>
                  </button>
                </div>

                {routingNo && (
                  <div className="flex justify-between items-center text-xs text-ink-muted pt-1">
                    <span>{locale === 'bn' ? 'রাউটিং নম্বর:' : 'Routing No:'}</span>
                    <span className="font-mono font-bold text-primary-dark tabular-nums">{routingNo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Banking Options */}
            <div className="bg-surface rounded-3xl p-5 sm:p-6 border border-sand shadow-sakinah-card space-y-4">
              <h3 className="font-serif font-bold text-base text-primary-dark flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-gold-text" />
                <span>{locale === 'bn' ? 'মোবাইল ব্যাংকিং (বিকাশ ও নগদ)' : 'Mobile Banking (bKash & Nagad)'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* bKash */}
                <div className="p-4 rounded-2xl bg-canvas-alt border border-sand flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-xs font-bold text-terracotta font-mono">{locale === 'bn' ? 'bKash (বিকাশ)' : 'bKash'}</span>
                    <span className="font-mono font-bold text-ink text-sm block mt-1 tabular-nums">{bkashNo}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bkashNo.split(' ')[0], 'bkash', 'bKash')}
                    className="text-xs text-primary-dark hover:bg-primary hover:text-white font-bold flex items-center gap-1.5 self-start px-3 py-1.5 rounded-lg bg-surface border border-sand min-h-[38px] tap-target transition-colors cursor-pointer"
                  >
                    {copiedKey === 'bkash' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'bkash' ? (locale === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (locale === 'bn' ? 'নম্বর কপি করুন' : 'Copy Number')}</span>
                  </button>
                </div>

                {/* Nagad */}
                <div className="p-4 rounded-2xl bg-canvas-alt border border-sand flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-xs font-bold text-gold-text font-mono">{locale === 'bn' ? 'Nagad (নগদ)' : 'Nagad'}</span>
                    <span className="font-mono font-bold text-ink text-sm block mt-1 tabular-nums">{nagadNo}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(nagadNo.split(' ')[0], 'nagad', 'Nagad')}
                    className="text-xs text-primary-dark hover:bg-primary hover:text-white font-bold flex items-center gap-1.5 self-start px-3 py-1.5 rounded-lg bg-surface border border-sand min-h-[38px] tap-target transition-colors cursor-pointer"
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
