import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Heart, MapPin, Calendar, ChevronRight, X, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { EightPointStar } from '../common/EightPointStar.jsx';

export function MembersDonorsTeaser({ members = [] }) {
  const { locale, t, toBanglaNum, formatMoney, getLocalized } = useLanguage();
  const { isSettingEnabled } = useSettings();
  const [selectedMember, setSelectedMember] = useState(null);

  if (!members || members.length === 0) {
    return null;
  }

  const globalShowAmount = isSettingEnabled('show_donation_amount');

  return (
    <section className="py-12 sm:py-16 bg-ivory-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-gold-600 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>{t('members_preview_title')}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              {locale === 'bn' ? 'আজীবন সদস্যবৃন্দের পরিচিতি' : 'Featured Lifetime Members'}
            </h2>
          </div>
          <Link
            to="/lifetime-members"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
          >
            <span>{locale === 'bn' ? 'সকল আজীবন সদস্য দেখুন' : 'View All Members'}</span>
            <ChevronRight className="w-4 h-4 text-gold-500" />
          </Link>
        </div>

        {/* Membership Certificate Cards: Desktop 3/row, Mobile 1/row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {members.slice(0, 3).map((member) => {
            const name = getLocalized(member, 'name');
            const address = getLocalized(member, 'address');
            const showAmountPlate = globalShowAmount && member.showAmount && member.amountPaid && Number(member.amountPaid) > 0;
            const initialChar = name ? name.trim().charAt(0) : 'স';
            const photoUrl = member.photoPath ? `/uploads/${member.photoPath}` : null;

            return (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="relative rounded-2xl bg-emerald-900 text-ivory-50 border-2 border-gold-500/50 p-6 shadow-xl hover:shadow-2xl hover:border-gold-400 transition-all duration-300 cursor-pointer flex flex-col justify-between group overflow-hidden"
              >
                {/* 4 Corner Gold Ornaments */}
                <div className="absolute top-2 left-2 text-gold-500/40 pointer-events-none">✦</div>
                <div className="absolute top-2 right-2 text-gold-500/40 pointer-events-none">✦</div>
                <div className="absolute bottom-2 left-2 text-gold-500/40 pointer-events-none">✦</div>
                <div className="absolute bottom-2 right-2 text-gold-500/40 pointer-events-none">✦</div>

                <div>
                  {/* Gold Ribbon for Membership No */}
                  <div className="flex justify-between items-start mb-5">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-950 border border-gold-500/60 text-gold-300 font-mono text-xs font-bold tracking-wider shadow-inner">
                      <span>{t('member_no')}</span>
                      <span>{toBanglaNum(member.membershipNo)}</span>
                    </span>
                    <ShieldCheck className="w-5 h-5 text-gold-400" />
                  </div>

                  {/* Arch-Top Photo with Gold Glow or Initials Avatar */}
                  <div className="flex flex-col items-center text-center space-y-3 mb-4">
                    <div className="relative w-24 h-28 rounded-t-full rounded-b-lg border-2 border-gold-500 overflow-hidden bg-emerald-950 shadow-gold-glow flex items-center justify-center">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full flex items-center justify-center font-serif text-3xl font-bold text-gold-300 bg-emerald-950 ${
                          photoUrl ? 'hidden' : 'flex'
                        }`}
                      >
                        {initialChar}
                      </div>
                    </div>

                    <h3 className="font-serif font-bold text-lg sm:text-xl text-ivory-50 group-hover:text-gold-300 transition-colors leading-snug">
                      {name}
                    </h3>
                  </div>

                  {/* Metadata: Address & Member-Since */}
                  <div className="space-y-1.5 text-xs text-ivory-200/90 text-center border-t border-gold-500/20 pt-3">
                    {address && (
                      <p className="flex items-center justify-center gap-1.5 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                        <span>{address}</span>
                      </p>
                    )}
                    {member.memberSince && (
                      <p className="flex items-center justify-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                        <span>{t('member_since')}: {toBanglaNum(member.memberSince)}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Shimmer Gold Foil Plate ONLY when amount is allowed */}
                {showAmountPlate ? (
                  <div className="mt-4 pt-3 border-t border-gold-500/30">
                    <div className="rounded-xl p-2.5 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 text-stone-950 text-center font-serif font-extrabold text-sm shadow-md animate-gold-shimmer">
                      <span>{formatMoney(member.amountPaid)}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Member Detail Modal */}
        {selectedMember && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedMember(null)}
          >
            <div
              className="relative max-w-md w-full bg-emerald-950 text-ivory-50 rounded-3xl p-6 sm:p-8 border-2 border-gold-500 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-emerald-900 text-gold-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-24 h-28 rounded-t-full rounded-b-lg border-2 border-gold-500 overflow-hidden bg-emerald-900 shadow-gold-glow flex items-center justify-center">
                  {selectedMember.photoPath ? (
                    <img
                      src={`/uploads/${selectedMember.photoPath}`}
                      alt={getLocalized(selectedMember, 'name')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-serif text-3xl font-bold text-gold-300">
                      {getLocalized(selectedMember, 'name')?.charAt(0) || 'স'}
                    </span>
                  )}
                </div>

                <span className="inline-block px-3 py-1 rounded-full bg-emerald-900 border border-gold-500/50 text-gold-300 text-xs font-mono font-bold">
                  {t('member_no')} {toBanglaNum(selectedMember.membershipNo)}
                </span>

                <h3 className="font-serif font-bold text-2xl text-ivory-50">
                  {getLocalized(selectedMember, 'name')}
                </h3>

                {selectedMember.fatherNameBn && (
                  <p className="text-xs text-ivory-300">
                    {t('father_name')}: {getLocalized(selectedMember, 'fatherName')}
                  </p>
                )}

                {selectedMember.addressBn && (
                  <p className="text-xs text-ivory-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gold-400" />
                    <span>{getLocalized(selectedMember, 'address')}</span>
                  </p>
                )}

                {selectedMember.memberSince && (
                  <p className="text-xs text-ivory-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gold-400" />
                    <span>{t('member_since')}: {toBanglaNum(selectedMember.memberSince)}</span>
                  </p>
                )}
              </div>

              {globalShowAmount && selectedMember.showAmount && selectedMember.amountPaid ? (
                <div className="pt-3 border-t border-gold-500/30 text-center">
                  <span className="text-xs text-gold-300 block mb-1">আজীবন সদস্য অনুদান</span>
                  <div className="rounded-xl p-2.5 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 text-stone-950 font-serif font-extrabold text-base shadow-md">
                    {formatMoney(selectedMember.amountPaid)}
                  </div>
                </div>
              ) : null}

              <p className="text-[11px] text-center text-ivory-400/80 pt-2 border-t border-gold-500/20">
                ব্যক্তিগত গোপনীয়তা রক্ষার্থে মোবাইল নম্বর ও জাতীয় পরিচয়পত্র নম্বর প্রদর্শিত হয় না।
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
