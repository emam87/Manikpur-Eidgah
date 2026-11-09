import React, { useEffect, useState } from 'react';
import { Users, Heart, Camera, LandPlot, Calendar } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

function useCounter(targetNumber, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!targetNumber || targetNumber <= 0) {
      setCount(0);
      return;
    }

    let start = 0;
    const end = parseInt(targetNumber, 10);
    const stepTime = Math.max(16, Math.floor(duration / end));

    const timer = setInterval(() => {
      start += Math.ceil(end / 40);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [targetNumber, duration]);

  return count;
}

export function StatsSection({ stats = {} }) {
  const { locale, t, toBanglaNum } = useLanguage();
  const { getSetting } = useSettings();

  const membersTarget = stats.members || 0;
  const donorsTarget = stats.donors || 0;
  const photosTarget = stats.photos || 0;

  const countMembers = useCounter(membersTarget);
  const countDonors = useCounter(donorsTarget);
  const countPhotos = useCounter(photosTarget);

  const landArea = getSetting('land_area', locale, '১.৩৫ একর');
  const estYear = getSetting('established_year', locale, '১৯৬৫');

  const statItems = [
    {
      id: 'members',
      label: t('stats_lifetime_members'),
      value: toBanglaNum(countMembers),
      icon: Users,
    },
    {
      id: 'donors',
      label: t('stats_total_donors'),
      value: toBanglaNum(countDonors),
      icon: Heart,
    },
    {
      id: 'photos',
      label: t('stats_eid_photos'),
      value: toBanglaNum(countPhotos),
      icon: Camera,
    },
    {
      id: 'land',
      label: t('stats_land_area'),
      value: landArea,
      icon: LandPlot,
      isText: true,
    },
    {
      id: 'year',
      label: t('stats_est_year'),
      value: estYear,
      icon: Calendar,
      isText: true,
    },
  ];

  return (
    <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-14 lg:-mt-16 mb-12 sm:mb-16">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border-2 border-gold-500/30 relative overflow-hidden">
        {/* Subtle decorative gold top bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-800 via-gold-500 to-emerald-800" />

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 lg:gap-8">
          {statItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`flex flex-col items-center text-center p-3 sm:p-2 rounded-xl bg-ivory-50/60 sm:bg-transparent border border-gold-500/10 sm:border-0 ${
                  index === 4 ? 'col-span-2 lg:col-span-1 max-w-[200px] mx-auto w-full' : ''
                }`}
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 border border-gold-500/30 flex items-center justify-center text-emerald-800 mb-1 shrink-0">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
                </div>
                <span className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-serif font-extrabold text-stone-900 tracking-tight">
                  {item.value}
                </span>
                <span className="text-[11px] sm:text-xs lg:text-sm text-stone-600 font-medium leading-tight">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

