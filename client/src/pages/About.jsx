import React, { useState, useEffect } from 'react';
import { Calendar, LandPlot, Users, ChevronDown, MapPin, Phone } from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { SkeletonLoader } from '../components/common/SkeletonLoader.jsx';
import { BottomSheet } from '../components/common/BottomSheet.jsx';
import { Breadcrumb } from '../components/common/Breadcrumb.jsx';
import { ImageWithBlur } from '../components/common/ImageWithBlur.jsx';
import { getImageUrl } from '../utils/imageUrl.js';

export function About() {
  const { locale, t, toBanglaNum, getLocalized } = useLanguage();
  const { getSetting } = useSettings();

  const [aboutData, setAboutData] = useState({
    committeeTitle: 'সাত সদস্যবিশিষ্ট উন্নয়ন কমিটি',
    level1: [],
    level2: [],
    otherLevels: [],
    archivedCommittees: {},
  });
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [openArchiveTerm, setOpenArchiveTerm] = useState(null);

  useEffect(() => {
    fetch('/api/public/about')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch about data');
        return res.json();
      })
      .then((data) => {
        if (data && data.success) {
          setAboutData(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const historyText = getSetting('history', locale, '');
  const introText = getSetting('intro', locale, '');
  const fullText = historyText || introText;

  const landArea = getSetting(
    'land_area',
    locale,
    locale === 'bn' ? '১.৩৫ একর (১৩৫ শতাংশ)' : '1.35 Acres (135 Decimals)'
  );
  const capacity = getSetting(
    'capacity',
    locale,
    locale === 'bn' ? 'প্রায় ১২,০০০+ মুসল্লি' : 'Approx. 12,000+ worshippers'
  );
  const estYear = getSetting(
    'established_year',
    locale,
    locale === 'bn' ? '১৯৬৫ খ্রিস্টাব্দ' : '1965 AD'
  );

  const committeeTitle =
    locale === 'bn'
      ? aboutData.committeeTitleBn || aboutData.committeeTitle || t('about.committee_heading')
      : aboutData.committeeTitleEn || t('about.committee_heading');

  const historyPreview = fullText.length > 280 ? fullText.slice(0, 280) + '...' : fullText;

  return (
    <div className="py-4 sm:py-8 page-enter">
      <SEO title={t('about.title')} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <Breadcrumb items={[{ label: t('about.title') }]} />

        {/* Single Page Title */}
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary-dark tracking-tight">
            {t('about.heading')}
          </h1>
        </div>

        {/* Compact Key-Value Facts Summary */}
        <div className="rounded-2xl bg-surface border border-sand p-4 shadow-sakinah-sm">
          <div className="grid grid-cols-3 divide-x divide-sand text-center">
            <div className="px-2">
              <span className="text-[10px] sm:text-xs font-semibold text-ink-muted flex items-center justify-center gap-1">
                <Calendar className="w-3 h-3 text-gold-text" />
                <span>{t('stats.est_year')}</span>
              </span>
              <p className="font-serif font-bold text-xs sm:text-sm text-primary-dark mt-1 truncate">
                {estYear}
              </p>
            </div>
            <div className="px-2">
              <span className="text-[10px] sm:text-xs font-semibold text-ink-muted flex items-center justify-center gap-1">
                <LandPlot className="w-3 h-3 text-gold-text" />
                <span>{t('stats.land_area')}</span>
              </span>
              <p className="font-serif font-bold text-xs sm:text-sm text-primary-dark mt-1 truncate">
                {landArea}
              </p>
            </div>
            <div className="px-2">
              <span className="text-[10px] sm:text-xs font-semibold text-ink-muted flex items-center justify-center gap-1">
                <Users className="w-3 h-3 text-gold-text" />
                <span>{t('stats.capacity')}</span>
              </span>
              <p className="font-serif font-bold text-xs sm:text-sm text-primary-dark mt-1 truncate">
                {capacity}
              </p>
            </div>
          </div>
        </div>

        {/* Short History Section (Expandable) */}
        {fullText && (
          <div className="rounded-2xl bg-surface border border-sand p-5 sm:p-6 shadow-sakinah-sm space-y-3">
            <h2 className="font-serif font-bold text-base sm:text-lg text-primary-dark border-b border-sand pb-2">
              {t('about.history_title')}
            </h2>
            <div className="text-sm leading-relaxed text-ink whitespace-pre-line">
              {historyExpanded ? fullText : historyPreview}
            </div>
            {fullText.length > 280 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setHistoryExpanded(!historyExpanded)}
                  className="text-xs font-bold text-primary-dark hover:text-primary transition-colors py-1 tap-feedback min-h-[36px]"
                >
                  {historyExpanded
                    ? locale === 'bn'
                      ? 'সংক্ষেপ করুন ▲'
                      : 'Show Less ▲'
                    : locale === 'bn'
                    ? 'বিস্তারিত পড়ুন ▼'
                    : 'Read More ▼'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* MANAGING COMMITTEE SECTION */}
        <div className="space-y-6 pt-2">
          <div className="border-b border-sand pb-2">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-primary-dark tracking-tight">
              {committeeTitle}
            </h2>
          </div>

          {loading ? (
            <SkeletonLoader count={4} />
          ) : (
            <div className="space-y-6">
              {/* Chief Coordinator Card */}
              {aboutData.level1.map((chief) => {
                const name = getLocalized(chief, 'name');
                const designation = getLocalized(chief, 'designation') || getLocalized(chief, 'role');
                const photoUrl = chief.photoPath ? getImageUrl(chief.photoPath) : null;

                return (
                  <div key={chief.id} className="max-w-sm mx-auto">
                    <div
                      onClick={() => setSelectedMember(chief)}
                      className="bg-surface text-ink rounded-2xl p-5 border border-gold/60 shadow-sakinah-sm text-center cursor-pointer hover:border-gold hover:shadow-sakinah-card transition-all active:scale-[0.98] tap-feedback"
                    >
                      <div className="w-20 h-24 rounded-t-full rounded-b-lg border-2 border-gold/70 overflow-hidden bg-primary-soft shadow-sakinah-sm mx-auto mb-3 flex items-center justify-center">
                        {photoUrl ? (
                          <ImageWithBlur
                            src={photoUrl}
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-serif text-2xl font-bold text-primary-dark">
                            {name?.charAt(0) || 'C'}
                          </span>
                        )}
                      </div>

                      <span className="inline-block px-3 py-0.5 rounded-full bg-primary text-white font-bold text-[11px] mb-1.5 shadow-sakinah-sm">
                        {designation}
                      </span>

                      <h3 className="font-serif font-bold text-base sm:text-lg text-primary-dark truncate">
                        {name}
                      </h3>

                      {chief.term && (
                        <p className="text-[11px] text-gold-text font-semibold mt-1">
                          {t('about.term_label')}: {locale === 'bn' ? toBanglaNum(chief.term) : chief.term}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 2-Column Coordinators Grid on Mobile */}
              {aboutData.level2.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-serif text-sm sm:text-base font-bold text-primary-dark">
                    {t('about.coordinators_heading')}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {aboutData.level2.map((coord) => {
                      const name = getLocalized(coord, 'name');
                      const designation = getLocalized(coord, 'designation') || getLocalized(coord, 'role');
                      const photoUrl = coord.photoPath ? getImageUrl(coord.photoPath) : null;

                      return (
                        <div
                          key={coord.id}
                          onClick={() => setSelectedMember(coord)}
                          className="bg-surface rounded-xl p-3 border border-sand text-center shadow-sakinah-sm hover:border-primary/40 transition-all cursor-pointer flex flex-col items-center justify-between active:scale-[0.98] tap-feedback"
                        >
                          <div className="w-full flex flex-col items-center">
                            <div className="w-16 h-20 rounded-t-full rounded-b-md border border-gold/60 overflow-hidden bg-primary-soft mx-auto mb-2 flex items-center justify-center">
                              {photoUrl ? (
                                <ImageWithBlur
                                  src={photoUrl}
                                  alt={name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="font-serif text-lg font-bold text-primary-dark">
                                  {name?.charAt(0) || 'C'}
                                </span>
                              )}
                            </div>

                            <span className="inline-block px-2 py-0.5 rounded-full bg-primary-soft text-primary-dark text-[10px] font-semibold mb-1">
                              {designation}
                            </span>

                            <h4 className="font-serif font-bold text-xs sm:text-sm text-ink line-clamp-1">
                              {name}
                            </h4>
                          </div>

                          <div className="pt-2 mt-2 border-t border-sand w-full text-[10px] text-primary-dark font-semibold">
                            {t('common.details')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Previous Committees Archive in Collapsed Accordion */}
          {Object.keys(aboutData.archivedCommittees).length > 0 && (
            <div className="pt-6 border-t border-sand space-y-3">
              <h3 className="font-serif text-base sm:text-lg font-bold text-primary-dark">
                {t('about.former_committees_title')}
              </h3>

              <div className="space-y-2">
                {Object.entries(aboutData.archivedCommittees).map(([termName, membersList]) => {
                  const isOpen = openArchiveTerm === termName;
                  return (
                    <div
                      key={termName}
                      className="rounded-xl bg-surface border border-sand overflow-hidden shadow-sakinah-sm"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenArchiveTerm(isOpen ? null : termName)}
                        className="w-full flex items-center justify-between p-3.5 text-left tap-feedback min-h-[46px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-sm text-primary-dark">
                            {t('about.term_label')}: {locale === 'bn' ? toBanglaNum(termName) : termName}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-soft text-primary-dark">
                            {locale === 'bn'
                              ? `${toBanglaNum(membersList.length)} জন`
                              : `${membersList.length}`}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-gold-text transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="p-3.5 pt-0 border-t border-sand grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {membersList.map((m) => {
                            const name = getLocalized(m, 'name');
                            const designation = getLocalized(m, 'designation') || getLocalized(m, 'role');
                            return (
                              <div
                                key={m.id}
                                className="p-2 bg-canvas-alt rounded-lg border border-sand text-center"
                              >
                                <p className="font-serif font-bold text-xs text-ink line-clamp-1">{name}</p>
                                <p className="text-[10px] text-gold-text font-semibold">{designation}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Member Profile Detail BottomSheet */}
      <BottomSheet
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title={selectedMember ? getLocalized(selectedMember, 'name') : ''}
      >
        {selectedMember && (
          <div className="flex flex-col items-center text-center space-y-3 py-2">
            <div className="w-20 h-26 rounded-t-full rounded-b-lg border-2 border-gold/70 overflow-hidden bg-primary-soft shadow-sakinah-sm flex items-center justify-center">
              {selectedMember.photoPath ? (
                <img
                  src={getImageUrl(selectedMember.photoPath)}
                  alt={getLocalized(selectedMember, 'name')}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-serif text-2xl font-bold text-primary-dark">
                  {getLocalized(selectedMember, 'name')?.charAt(0) || 'M'}
                </span>
              )}
            </div>

            <span className="inline-block px-3 py-0.5 rounded-full bg-primary text-white text-xs font-bold shadow-sakinah-sm">
              {getLocalized(selectedMember, 'designation') || getLocalized(selectedMember, 'role')}
            </span>

            <h3 className="font-serif font-bold text-xl text-primary-dark">
              {getLocalized(selectedMember, 'name')}
            </h3>

            {selectedMember.term && (
              <p className="text-xs text-gold-text font-semibold">
                {t('about.term_label')}:{' '}
                {locale === 'bn' ? toBanglaNum(selectedMember.term) : selectedMember.term}
              </p>
            )}

            {selectedMember.addressBn && (
              <p className="text-xs text-ink-muted flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gold-text" />
                <span>{getLocalized(selectedMember, 'address')}</span>
              </p>
            )}

            {selectedMember.phone && (
              <p className="text-xs text-primary-dark flex items-center gap-1 font-semibold">
                <Phone className="w-3.5 h-3.5 text-gold-text" />
                <a href={`tel:${selectedMember.phone}`} className="underline min-h-[44px] flex items-center">
                  {selectedMember.phone}
                </a>
              </p>
            )}

            {(selectedMember.bioBn || selectedMember.bioEn) && (
              <div className="pt-3 border-t border-sand text-xs text-ink text-left leading-relaxed w-full">
                {getLocalized(selectedMember, 'bio')}
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
