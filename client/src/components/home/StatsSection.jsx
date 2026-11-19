import React from 'react';
import { Users, Landmark, Camera, LandPlot } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function StatsSection({ stats = null }) {
  const { locale, t, toBanglaNum } = useLanguage();

  if (!stats) return null;

  const hasMembers = stats.members !== null && stats.members !== undefined;
  const rawDonors = stats.landDonors !== undefined ? stats.landDonors : stats.donors;
  const hasDonors = rawDonors !== null && rawDonors !== undefined;
  const hasPhotos = stats.photos !== null && stats.photos !== undefined;
  const parsedLand =
    stats.totalLandDecimal !== null && stats.totalLandDecimal !== undefined
      ? Number(stats.totalLandDecimal)
      : null;
  const hasLand = parsedLand !== null && !Number.isNaN(parsedLand);

  const formattedLand = hasLand
    ? `${locale === 'bn' ? toBanglaNum(parsedLand) : parsedLand} ${t('stats.decimal_suffix') || (locale === 'bn' ? 'শতক' : 'Dec')}`
    : null;

  const statItems = [
    hasMembers
      ? {
        id: 'members',
        label: t('stats.lifetime_members') || (locale === 'bn' ? 'আজীবন সদস্য' : 'Members'),
        value: locale === 'bn' ? toBanglaNum(stats.members) : stats.members,
        icon: Users,
      }
      : null,
    hasDonors
      ? {
        id: 'donors',
        label: t('stats.land_donors') || (locale === 'bn' ? 'জমিদাতা' : 'Donors'),
        value: locale === 'bn' ? toBanglaNum(rawDonors) : rawDonors,
        icon: Landmark,
      }
      : null,
    hasPhotos
      ? {
        id: 'photos',
        label: t('stats.eid_photos') || (locale === 'bn' ? 'স্মৃতিচিত্র' : 'Photos'),
        value: locale === 'bn' ? toBanglaNum(stats.photos) : stats.photos,
        icon: Camera,
      }
      : null,
    hasLand && formattedLand
      ? {
        id: 'land',
        label: t('stats.donated_land') || (locale === 'bn' ? 'ওয়াকফকৃত জমি' : 'Waqf Land'),
        value: formattedLand,
        icon: LandPlot,
      }
      : null,
  ].filter(Boolean);

  if (statItems.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={t('stats.lifetime_members') || 'Stats'}
      className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8"
    >
      <div className="rounded-2xl bg-surface border border-sand shadow-sakinah-sm overflow-hidden">
        <div
          className={`grid ${statItems.length === 3
            ? 'grid-cols-3'
            : statItems.length === 4
              ? 'grid-cols-2 sm:grid-cols-4'
              : 'grid-cols-2'
            } divide-x divide-sand`}
        >
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3 p-3 sm:px-5 sm:py-4"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary-soft border border-primary/15 flex items-center justify-center text-primary shrink-0 shadow-sakinah-sm">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="font-serif font-extrabold text-base sm:text-xl lg:text-2xl text-primary-dark leading-tight tabular-nums truncate">
                    {item.value}
                  </div>
                  <div className="text-[10px] sm:text-xs font-semibold text-ink-muted leading-tight truncate mt-0.5">
                    {item.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
