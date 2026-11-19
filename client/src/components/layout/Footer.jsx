import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Landmark, ChevronRight, Sun, Moon } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { EightPointStar } from '../common/EightPointStar.jsx';

export function Footer() {
  const { locale, t, toBanglaNum } = useLanguage();
  const { getSetting } = useSettings();
  const { isDark, toggleTheme } = useTheme();

  const siteName = getSetting('site_name', locale, t('site_name'));
  const tagline = getSetting('tagline', locale, t('site_tagline'));
  const location = getSetting('location', locale, 'মানিকপুর, মানিকপুর বাজার, বাংলাদেশ');
  const phone = getSetting('contact_phone', locale, '+880 1711-223344');
  const email = getSetting('contact_email', locale, 'info@manikpureidgah.org');
  const eidJamat = getSetting('eid_jamat', locale, '');
  const bankInfo = getSetting('bank_info', locale, '');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-footer-pattern text-footer-text border-t-2 border-gold/45 mt-auto pt-8 sm:pt-12 pb-24 lg:pb-8 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* MOBILE FOOTER (Strictly: name, address, single tap-to-call phone, copyright. NO second menu) */}
        <div className="lg:hidden space-y-4 text-center sm:text-left py-2">
          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black/20 border border-gold-plate-from/50 flex items-center justify-center text-gold-plate-from shrink-0">
              <EightPointStar className="w-5 h-5 text-gold-plate-from" />
            </div>
            <h3 className="font-serif font-bold text-base text-footer-text tracking-tight">
              {siteName}
            </h3>
          </div>

          <div className="space-y-2 text-xs text-footer-text/90">
            <p className="flex items-center justify-center sm:justify-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gold-plate-from shrink-0" aria-hidden="true" />
              <span>{location}</span>
            </p>
            <p className="flex items-center justify-center sm:justify-start gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gold-plate-from shrink-0" aria-hidden="true" />
              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="hover:text-gold-plate-from font-semibold transition-colors py-1 inline-block"
              >
                {phone}
              </a>
            </p>
          </div>

          <div className="pt-3 border-t border-white/15 text-[11px] text-footer-text/80">
            <p>
              © {toBanglaNum(currentYear)} {siteName}
              {locale === 'bn' ? '। সর্বস্বত্ব সংরক্ষিত।' : '. All rights reserved.'}
            </p>
          </div>
        </div>

        {/* DESKTOP FOOTER (>= 1024px: Clean 4 Columns) */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-4 gap-10 mb-10">
            {/* Col 1: About & History summary */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black/20 border border-gold-plate-from/50 flex items-center justify-center text-gold-plate-from">
                  <EightPointStar className="w-6 h-6 text-gold-plate-from" />
                </div>
                <h3 className="font-serif font-bold text-lg text-footer-text tracking-tight">
                  {siteName}
                </h3>
              </div>
              <p className="text-sm text-footer-text/90 leading-relaxed">
                {tagline}
              </p>
              <div className="pt-2 text-xs text-gold-plate-from flex items-center gap-2">
                <EightPointStar className="w-3.5 h-3.5 text-gold-plate-from" />
                <span>{locale === 'bn' ? '১.৩৫ একর ওয়াকফ এস্টেট (স্থাপিত ১৯৬৫)' : '1.35 Acres Waqf Estate (Est. 1965)'}</span>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <h4 className="font-serif font-semibold text-base text-gold-plate-from border-b border-white/15 pb-2.5 mb-4 flex items-center gap-2">
                <EightPointStar className="w-4 h-4 text-gold-plate-from" />
                <span>{t('footer_quick_links')}</span>
              </h4>
              <ul className="space-y-2 text-sm text-footer-text/95">
                <li>
                  <Link to="/about" className="hover:text-gold-plate-from transition-colors flex items-center gap-1.5 py-1">
                    <ChevronRight className="w-3.5 h-3.5 text-gold-plate-from" />
                    <span>{t('nav_about')}</span>
                  </Link>
                </li>
                <li>
                  <Link to="/lifetime-members" className="hover:text-gold-plate-from transition-colors flex items-center gap-1.5 py-1">
                    <ChevronRight className="w-3.5 h-3.5 text-gold-plate-from" />
                    <span>{t('nav_members')}</span>
                  </Link>
                </li>
                <li>
                  <Link to="/land-donors" className="hover:text-gold-plate-from transition-colors flex items-center gap-1.5 py-1">
                    <ChevronRight className="w-3.5 h-3.5 text-gold-plate-from" />
                    <span>{t('nav_land_donors')}</span>
                  </Link>
                </li>
                <li>
                  <Link to="/gallery" className="hover:text-gold-plate-from transition-colors flex items-center gap-1.5 py-1">
                    <ChevronRight className="w-3.5 h-3.5 text-gold-plate-from" />
                    <span>{t('nav_gallery')}</span>
                  </Link>
                </li>
                <li>
                  <Link to="/designs" className="hover:text-gold-plate-from transition-colors flex items-center gap-1.5 py-1">
                    <ChevronRight className="w-3.5 h-3.5 text-gold-plate-from" />
                    <span>{t('nav_designs')}</span>
                  </Link>
                </li>
                <li>
                  <Link to="/documents" className="hover:text-gold-plate-from transition-colors flex items-center gap-1.5 py-1">
                    <ChevronRight className="w-3.5 h-3.5 text-gold-plate-from" />
                    <span>{t('nav_documents')}</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Prayer Schedule & Contact Info */}
            <div>
              <h4 className="font-serif font-semibold text-base text-gold-plate-from border-b border-white/15 pb-2.5 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold-plate-from" />
                <span>{t('eid_jamat_schedule_title')}</span>
              </h4>
              {eidJamat ? (
                <p className="text-xs text-footer-text/95 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/15 mb-4 whitespace-pre-line">
                  {eidJamat}
                </p>
              ) : null}
              <div className="space-y-2 text-xs text-footer-text/90">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gold-plate-from shrink-0 mt-0.5" />
                  <span>{location}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gold-plate-from shrink-0" />
                  <a href={`tel:${phone}`} className="hover:text-gold-plate-from transition-colors py-1 inline-block break-all">
                    {phone}
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gold-plate-from shrink-0" />
                  <a href={`mailto:${email}`} className="hover:text-gold-plate-from transition-colors py-1 inline-block break-all">
                    {email}
                  </a>
                </p>
              </div>
            </div>

            {/* Col 4: Bank Donation Info */}
            <div>
              <h4 className="font-serif font-semibold text-base text-gold-plate-from border-b border-white/15 pb-2.5 mb-4 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-gold-plate-from" />
                <span>{t('footer_bank_info')}</span>
              </h4>
              <div className="bg-black/20 p-4 rounded-xl border border-white/15 text-xs text-footer-text/95 space-y-2 leading-relaxed whitespace-pre-line">
                {bankInfo || (
                  locale === 'bn' ? (
                    <>
                      <p className="font-semibold text-gold-plate-from">ইসলামী ব্যাংক বাংলাদেশ পিএলসি</p>
                      <p>হিসাব নং: ২০৫০-১৯৮-০২০৪৫৮৯১২</p>
                      <p>বিকাশ/নগদ: ০১৭১১-২২৩৩৪৪</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-gold-plate-from">Islami Bank Bangladesh PLC</p>
                      <p>A/C No: 2050-198-020458912</p>
                      <p>bKash / Nagad: +880 1711-223344</p>
                    </>
                  )
                )}
              </div>
              <div className="mt-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1.5 text-xs text-gold-plate-from hover:text-white font-semibold transition-colors"
                >
                  <span>{locale === 'bn' ? 'বিস্তারিত অনুদান নির্দেশিকা' : 'Full Donation Instructions'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Desktop Controls (Theme) */}
          <div className="py-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs text-footer-text/85">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/20 text-footer-text border border-white/20 hover:border-gold-plate-from transition-all"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-gold-plate-from" /> : <Moon className="w-3.5 h-3.5 text-gold-plate-from" />}
                <span>{isDark ? t('common.light_mode') : t('common.dark_mode')}</span>
              </button>
            </div>

            <div className="text-[11px] text-footer-text/80">
              {locale === 'bn'
                ? 'বাংলাদেশ ওয়াকফ প্রশাসন নিবন্ধিত এস্টেট • ইসি নং ১৯৬১৫'
                : 'Registered Waqf Estate of Bangladesh • EC No. 19615'}
            </div>
          </div>

          {/* Desktop Bottom Bar: Copyright */}
          <div className="pt-4 border-t border-white/15 flex items-center justify-between text-xs text-footer-text/85">
            <p>
              © {toBanglaNum(currentYear)} {siteName}
              {locale === 'bn' ? '। ' : '. '}
              {t('footer.all_rights')}
            </p>
            <p className="text-[11px] text-footer-text/75">
              {locale === 'bn' ? 'ডিজিটাল স্বচ্ছতা ও ওয়াকফ সংরক্ষণাগার' : 'Official Digital Waqf Portal'}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
