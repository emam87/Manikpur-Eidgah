import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Map, ShieldCheck, ChevronRight, FileCheck, Layers } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { EightPointStar } from '../common/EightPointStar.jsx';

export function TransparencyTeaser() {
  const { locale, t } = useLanguage();

  const transparencyItems = [
    {
      title: locale === 'bn' ? 'রেজিস্ট্রি ওয়াকফ দলিল ও কাগজপত্র' : 'Registered Waqf Deeds & Legal Archive',
      description: locale === 'bn' ? '১৯৬৫ সালের মূল ওয়াকফ দলিল, দানপত্র ও সরকারি রেজিস্ট্রি সনদ অনলাইনে সংরক্ষিত।' : 'Permanent official digital archive of registered waqf deeds and transfer titles.',
      link: '/documents',
      cta: t('view_documents'),
      icon: FileText,
      badge: locale === 'bn' ? '৮টি ক্যাটাগরি' : '8 Categories',
    },
    {
      title: locale === 'bn' ? 'মৌজা ও ক্যাডাস্ট্রাল জমির নকশা' : 'Cadastral & Mouza Land Maps',
      description: locale === 'bn' ? 'সিএস, এসএ, আরএস ও বিএস জরিপের ১.৩৫ একর জমির সীমানা ও দাগ নম্বর সম্বলিত ইন্টারেক্টিভ ম্যাপ।' : 'Interactive map viewer for CS, SA, RS, and BS official cadastral land surveys.',
      link: '/land-maps',
      cta: t('view_land_maps'),
      icon: Map,
      badge: locale === 'bn' ? 'সিএস • এসএ • আরএস • বিএস' : 'CS • SA • RS • BS',
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-white border-t border-gold-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-gold-600 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>{t('transparency_title')}</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            {t('transparency_desc')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {transparencyItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="bg-ivory-50 rounded-3xl p-6 sm:p-8 border border-gold-500/30 hover:border-gold-500 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-gold-300 flex items-center justify-center shadow-md">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 group-hover:text-emerald-800 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-sm text-stone-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-gold-500/20">
                  <Link
                    to={item.link}
                    className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:text-emerald-950 group-hover:text-gold-600 transition-colors"
                  >
                    <span>{item.cta}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

