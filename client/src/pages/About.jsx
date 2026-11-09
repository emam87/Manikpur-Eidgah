import React, { useState, useEffect } from 'react';
import { Users2, LandPlot, Users, Calendar, MapPin, Phone, X, Award, ChevronDown } from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { EightPointStar, StarDivider } from '../components/common/EightPointStar.jsx';
import { SkeletonLoader } from '../components/common/SkeletonLoader.jsx';

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

  // Lock body scroll when member modal is open
  useEffect(() => {
    if (selectedMember) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedMember]);

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
  const landArea = getSetting('land_area', locale, '১.৩৫ একর (১৩৫ শতাংশ ওয়াকফকৃত জমি)');
  const capacity = getSetting('capacity', locale, 'প্রায় ১২,০০০+ মুসল্লি');
  const estYear = getSetting('established_year', locale, '১৯৬৫ খ্রিস্টাব্দ');

  return (
    <div className="py-10 sm:py-16">
      <SEO title={locale === 'bn' ? 'পরিচিতি ও ইতিহাস' : 'About & History'} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-20">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950 text-gold-300 text-xs sm:text-sm font-semibold mb-3 border border-gold-500/40">
            <EightPointStar className="w-3.5 h-3.5 text-gold-400" />
            <span>{locale === 'bn' ? 'ঐতিহাসিক পটভূমি ও পরিচালনা পরিষদ' : 'History & Management Committee'}</span>
            <EightPointStar className="w-3.5 h-3.5 text-gold-400" />
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight mb-4">
            {locale === 'bn' ? 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ পরিচিতি' : 'About Manikpur Central Shahi Eidgah'}
          </h1>
          <StarDivider className="my-4" />
        </div>

        {/* Highlight Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gold-500/30 text-center shadow-sm space-y-2">
            <Calendar className="w-8 h-8 text-emerald-700 mx-auto" />
            <h3 className="font-serif font-bold text-lg text-stone-900">{t('stats_est_year')}</h3>
            <p className="text-stone-600 text-sm">{estYear}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gold-500/30 text-center shadow-sm space-y-2">
            <LandPlot className="w-8 h-8 text-emerald-700 mx-auto" />
            <h3 className="font-serif font-bold text-lg text-stone-900">{t('stats_land_area')}</h3>
            <p className="text-stone-600 text-sm">{landArea}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gold-500/30 text-center shadow-sm space-y-2">
            <Users className="w-8 h-8 text-emerald-700 mx-auto" />
            <h3 className="font-serif font-bold text-lg text-stone-900">জামাত ধারণক্ষমতা</h3>
            <p className="text-stone-600 text-sm">{capacity}</p>
          </div>
        </div>

        {/* Full History Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gold-500/30 shadow-md space-y-6">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-emerald-900 border-b border-gold-500/20 pb-4 flex items-center gap-2.5">
            <EightPointStar className="w-5 h-5 text-gold-500" />
            <span>{locale === 'bn' ? 'প্রতিষ্ঠার ইতিহাস ও ঐতিহ্য' : 'Foundation History & Heritage'}</span>
          </h2>
          <div className="prose prose-stone max-w-none text-sm sm:text-base leading-relaxed text-stone-700 whitespace-pre-line space-y-4">
            {historyText || introText}
          </div>
        </div>

        {/* MANAGING COMMITTEE SECTION */}
        <div className="space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 text-gold-600 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">
              <Users2 className="w-4 h-4 text-emerald-700" />
              <span>{locale === 'bn' ? 'কার্যনির্বাহী পরিচালনা পরিষদ' : 'Executive Managing Committee'}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              {aboutData.committeeTitle}
            </h2>
            <StarDivider className="my-4" />
          </div>

          {loading ? (
            <SkeletonLoader count={6} />
          ) : (
            <div className="space-y-12">
              {/* Level 1: Chief Coordinator (One Large Centered Card) */}
              {aboutData.level1.map((chief) => {
                const name = getLocalized(chief, 'name');
                const designation = getLocalized(chief, 'designation') || getLocalized(chief, 'role');
                const photoUrl = chief.photoPath ? `/uploads/${chief.photoPath}` : null;

                return (
                  <div key={chief.id} className="max-w-md mx-auto">
                    <div
                      onClick={() => setSelectedMember(chief)}
                      className="bg-emerald-900 text-ivory-50 rounded-3xl p-8 border-2 border-gold-500 shadow-2xl text-center cursor-pointer hover:shadow-gold-glow hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
                    >
                      <div className="absolute top-3 left-3 text-gold-500/50">✦</div>
                      <div className="absolute top-3 right-3 text-gold-500/50">✦</div>
                      <div className="absolute bottom-3 left-3 text-gold-500/50">✦</div>
                      <div className="absolute bottom-3 right-3 text-gold-500/50">✦</div>

                      <div className="w-28 h-36 rounded-t-full rounded-b-xl border-2 border-gold-500 overflow-hidden bg-emerald-950 shadow-gold-glow mx-auto mb-4 flex items-center justify-center">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <span className="font-serif text-4xl font-bold text-gold-300">
                            {name?.charAt(0) || 'ল'}
                          </span>
                        )}
                      </div>

                      <span className="inline-block px-4 py-1 rounded-full bg-gold-500 text-stone-950 font-bold text-xs sm:text-sm tracking-wide mb-2 shadow">
                        {designation}
                      </span>

                      <h3 className="font-serif font-extrabold text-xl sm:text-2xl text-ivory-50 group-hover:text-gold-200 transition-colors">
                        {name}
                      </h3>

                      {chief.term && (
                        <p className="text-xs text-gold-400 mt-2">
                          মেয়াদ: {toBanglaNum(chief.term)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Level 2: Coordinators (Heading "সমন্বয়কবৃন্দ", Grid of 3 per row on desktop, 2 per row on mobile) */}
              {aboutData.level2.length > 0 && (
                <div className="space-y-6 pt-4">
                  <div className="text-center">
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-emerald-900 tracking-tight">
                      {t('coordinators_heading')}
                    </h3>
                    <div className="h-0.5 w-16 bg-gold-500 mx-auto mt-2" />
                  </div>

                  {/* Grid of 3 per row on desktop (6 members = exactly 2 rows), 2 per row on mobile */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
                    {aboutData.level2.map((coord) => {
                      const name = getLocalized(coord, 'name');
                      const designation = getLocalized(coord, 'designation') || getLocalized(coord, 'role');
                      const photoUrl = coord.photoPath ? `/uploads/${coord.photoPath}` : null;

                      return (
                        <div
                          key={coord.id}
                          onClick={() => setSelectedMember(coord)}
                          className="bg-white rounded-2xl p-3.5 sm:p-6 border border-gold-500/30 text-center shadow-sm hover:shadow-xl hover:border-gold-500 transition-all duration-300 cursor-pointer group flex flex-col items-center justify-between"
                        >
                          <div className="flex flex-col items-center">
                            <div className="w-20 h-26 sm:w-24 sm:h-30 rounded-t-full rounded-b-lg border-2 border-gold-500 overflow-hidden bg-emerald-950 shadow-sm mx-auto mb-3 flex items-center justify-center">
                              {photoUrl ? (
                                <img
                                  src={photoUrl}
                                  alt={name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <span className="font-serif text-2xl font-bold text-gold-300">
                                  {name?.charAt(0) || 'স'}
                                </span>
                              )}
                            </div>

                            <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] sm:text-xs font-semibold mb-1.5 border border-emerald-200">
                              {designation}
                            </span>

                            <h4 className="font-serif font-bold text-sm sm:text-lg text-stone-900 group-hover:text-emerald-800 transition-colors line-clamp-2">
                              {name}
                            </h4>
                          </div>

                          <div className="pt-3 mt-3 border-t border-gold-500/20 w-full text-[11px] text-emerald-700 font-semibold group-hover:text-gold-600 transition-colors">
                            {locale === 'bn' ? 'বিস্তারিত প্রোফাইল' : 'View Profile'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Previous Committees Archive Grouped by Term */}
          {Object.keys(aboutData.archivedCommittees).length > 0 && (
            <div className="pt-12 border-t border-gold-500/30 space-y-8">
              <div className="text-center max-w-xl mx-auto">
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                  {t('previous_committee')}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-1">
                  {locale === 'bn' ? 'অতীতের বিভিন্ন মেয়াদে দায়িত্ব পালনকারী কমিটির তালিকা' : 'Archived records of past managing committees'}
                </p>
                <div className="h-0.5 w-16 bg-gold-500 mx-auto mt-2" />
              </div>

              <div className="space-y-8">
                {Object.entries(aboutData.archivedCommittees).map(([termName, membersList]) => (
                  <div key={termName} className="bg-white rounded-3xl p-6 sm:p-8 border border-gold-500/30 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-gold-500/20 pb-3">
                      <span className="font-serif font-bold text-lg sm:text-xl text-emerald-900">
                        মেয়াদকাল: {toBanglaNum(termName)}
                      </span>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-stone-100 text-stone-700">
                        {toBanglaNum(membersList.length)} জন সদস্য
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {membersList.map((m) => {
                        const name = getLocalized(m, 'name');
                        const designation = getLocalized(m, 'designation') || getLocalized(m, 'role');
                        return (
                          <div key={m.id} className="p-3 bg-ivory-50 rounded-xl border border-gold-500/20 text-center space-y-1">
                            <h5 className="font-serif font-bold text-sm text-stone-900 line-clamp-1">{name}</h5>
                            <p className="text-xs text-gold-600 font-semibold">{designation}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Member Profile Detail Modal */}
      {selectedMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="relative max-w-md w-full bg-emerald-950 text-ivory-50 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border-2 border-gold-500 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-3.5 right-3.5 p-2 rounded-full bg-emerald-900 text-gold-400 hover:text-white min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-24 h-32 rounded-t-full rounded-b-lg border-2 border-gold-500 overflow-hidden bg-emerald-900 shadow-gold-glow flex items-center justify-center">
                {selectedMember.photoPath ? (
                  <img
                    src={`/uploads/${selectedMember.photoPath}`}
                    alt={getLocalized(selectedMember, 'name')}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-serif text-3xl font-bold text-gold-300">
                    {getLocalized(selectedMember, 'name')?.charAt(0) || 'ক'}
                  </span>
                )}
              </div>

              <span className="inline-block px-3 py-1 rounded-full bg-gold-500 text-stone-950 text-xs font-bold shadow">
                {getLocalized(selectedMember, 'designation') || getLocalized(selectedMember, 'role')}
              </span>

              <h3 className="font-serif font-bold text-2xl text-ivory-50">
                {getLocalized(selectedMember, 'name')}
              </h3>

              {selectedMember.term && (
                <p className="text-xs text-gold-300">
                  মেয়াদ: {toBanglaNum(selectedMember.term)}
                </p>
              )}

              {selectedMember.addressBn && (
                <p className="text-xs text-ivory-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gold-400" />
                  <span>{getLocalized(selectedMember, 'address')}</span>
                </p>
              )}

              {selectedMember.phone && (
                <p className="text-xs text-gold-300 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gold-400" />
                  <a href={`tel:${selectedMember.phone}`} className="underline">{selectedMember.phone}</a>
                </p>
              )}

              {(selectedMember.bioBn || selectedMember.bioEn) && (
                <div className="pt-3 border-t border-gold-500/20 text-xs text-ivory-200/90 text-left leading-relaxed">
                  {getLocalized(selectedMember, 'bio')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

