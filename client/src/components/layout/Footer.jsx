import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Landmark, HeartHandshake, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { EightPointStar } from '../common/EightPointStar.jsx';

export function Footer() {
  const { locale, t, toBanglaNum } = useLanguage();
  const { getSetting } = useSettings();

  const siteName = getSetting('site_name', locale, t('site_name'));
  const tagline = getSetting('tagline', locale, t('site_tagline'));
  const location = getSetting('location', locale, 'মানিকপুর, মানিকপুর বাজার, বাংলাদেশ');
  const phone = getSetting('contact_phone', locale, '+880 1711-223344');
  const email = getSetting('contact_email', locale, 'info@manikpureidgah.org');
  const eidJamat = getSetting('eid_jamat', locale, '');
  const bankInfo = getSetting('bank_info', locale, '');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-star-pattern text-ivory-100 border-t-2 border-gold-500/40 mt-auto pt-14 pb-8 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1: About & History summary */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-gold-500/60 flex items-center justify-center text-gold-400">
                <EightPointStar className="w-6 h-6 text-gold-400" />
              </div>
              <h3 className="font-serif font-bold text-lg text-ivory-50 tracking-tight">
                {siteName}
              </h3>
            </div>
            <p className="text-sm text-ivory-200/90 leading-relaxed">
              {tagline}
            </p>
            <div className="pt-2 text-xs text-gold-400 flex items-center gap-2">
              <EightPointStar className="w-3.5 h-3.5 text-gold-500" />
              <span>{locale === 'bn' ? '১.৩৫ একর ওয়াকফ এস্টেট (স্থাপিত ১৯৬৫)' : '1.35 Acres Waqf Estate (Est. 1965)'}</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="font-serif font-semibold text-base text-gold-300 border-b border-gold-500/30 pb-2.5 mb-4 flex items-center gap-2">
              <EightPointStar className="w-4 h-4 text-gold-400" />
              <span>{t('footer_quick_links')}</span>
            </h4>
            <ul className="space-y-2 text-sm text-ivory-200">
              <li>
                <Link to="/about" className="hover:text-gold-300 transition-colors flex items-center gap-1.5 py-1">
                  <ChevronRight className="w-3.5 h-3.5 text-gold-500" />
                  <span>{t('nav_about')}</span>
                </Link>
              </li>
              <li>
                <Link to="/lifetime-members" className="hover:text-gold-300 transition-colors flex items-center gap-1.5 py-1">
                  <ChevronRight className="w-3.5 h-3.5 text-gold-500" />
                  <span>{t('nav_members')}</span>
                </Link>
              </li>
              <li>
                <Link to="/donors" className="hover:text-gold-300 transition-colors flex items-center gap-1.5 py-1">
                  <ChevronRight className="w-3.5 h-3.5 text-gold-500" />
                  <span>{t('nav_donors')}</span>
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-gold-300 transition-colors flex items-center gap-1.5 py-1">
                  <ChevronRight className="w-3.5 h-3.5 text-gold-500" />
                  <span>{t('nav_gallery')}</span>
                </Link>
              </li>
              <li>
                <Link to="/designs" className="hover:text-gold-300 transition-colors flex items-center gap-1.5 py-1">
                  <ChevronRight className="w-3.5 h-3.5 text-gold-500" />
                  <span>{t('nav_designs')}</span>
                </Link>
              </li>
              <li>
                <Link to="/documents" className="hover:text-gold-300 transition-colors flex items-center gap-1.5 py-1">
                  <ChevronRight className="w-3.5 h-3.5 text-gold-500" />
                  <span>{t('nav_documents')}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Prayer Schedule & Contact Info */}
          <div>
            <h4 className="font-serif font-semibold text-base text-gold-300 border-b border-gold-500/30 pb-2.5 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold-400" />
              <span>{t('eid_jamat_schedule_title')}</span>
            </h4>
            {eidJamat ? (
              <p className="text-xs text-ivory-200/90 leading-relaxed bg-emerald-950/80 p-3 rounded-xl border border-gold-500/20 mb-4 whitespace-pre-line">
                {eidJamat}
              </p>
            ) : null}
            <div className="space-y-2 text-xs text-ivory-200">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                <span>{location}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold-400 shrink-0" />
                <a href={`tel:${phone}`} className="hover:text-gold-300 transition-colors">{phone}</a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold-400 shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-gold-300 transition-colors">{email}</a>
              </p>
            </div>
          </div>

          {/* Col 4: Bank Donation Info */}
          <div>
            <h4 className="font-serif font-semibold text-base text-gold-300 border-b border-gold-500/30 pb-2.5 mb-4 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-gold-400" />
              <span>{t('footer_bank_info')}</span>
            </h4>
            <div className="bg-emerald-950/90 p-4 rounded-xl border border-gold-500/30 text-xs text-ivory-200 space-y-2 leading-relaxed whitespace-pre-line">
              {bankInfo || (
                <>
                  <p className="font-semibold text-gold-300">ইসলামী ব্যাংক বাংলাদেশ পিএলসি</p>
                  <p>হিসাব নং: ২০৫০-১৯৮-০২০৪৫৮৯১২</p>
                  <p>বিকাশ/নগদ: ০১৭১১-২২৩৩৪৪</p>
                </>
              )}
            </div>
            <div className="mt-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-200 font-semibold transition-colors"
              >
                <span>{locale === 'bn' ? 'বিস্তারিত অনুদান নির্দেশিকা' : 'Full Donation Instructions'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-8 border-t border-gold-500/25 flex flex-col sm:flex-row items-center justify-between text-xs text-ivory-300/80 gap-3 text-center sm:text-left">
          <p>
            © {toBanglaNum(currentYear)} {siteName}। {t('footer_all_rights')}
          </p>
          <p className="text-[11px] text-ivory-400/70">
            {locale === 'bn' ? 'ডিজিটাল স্বচ্ছতা ও ওয়াকফ সংরক্ষণাগার' : 'Official Digital Waqf Portal'}
          </p>
        </div>
      </div>
    </footer>
  );
}

