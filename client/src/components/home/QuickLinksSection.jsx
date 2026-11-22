import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Landmark, Images, Compass, Map, FileText } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function QuickLinksSection() {
  const { locale, t } = useLanguage();

  const links = [
    {
      to: '/lifetime-members',
      icon: Users,
      label: locale === 'bn' ? 'সদস্যবৃন্দ' : 'Members',
    },
    {
      to: '/land-donors',
      icon: Landmark,
      label: locale === 'bn' ? 'জমিদাতা' : 'Land Donors',
    },
    {
      to: '/gallery',
      icon: Images,
      label: locale === 'bn' ? 'গ্যালারি' : 'Gallery',
    },
    {
      to: '/designs',
      icon: Compass,
      label: locale === 'bn' ? 'নকশা ও পরিকল্পনা' : 'Design & Plan',
    },
    {
      to: '/land-maps',
      icon: Map,
      label: locale === 'bn' ? 'জমির নকশা' : 'Land Map',
    },
    {
      to: '/documents',
      icon: FileText,
      label: locale === 'bn' ? 'দলিলপত্র' : 'Documents',
    },
  ];

  return (
    <section aria-label="Quick Links" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-surface border border-sand hover:border-primary/40 shadow-sakinah-sm hover:shadow-sakinah-card text-center transition-all tap-feedback min-h-[92px]"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-soft/70 text-primary flex items-center justify-center mb-2">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="font-serif font-bold text-xs sm:text-sm text-primary-dark tracking-tight leading-tight line-clamp-1">
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
