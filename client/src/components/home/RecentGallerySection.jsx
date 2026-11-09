import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Calendar, ChevronRight, Layers } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { EightPointStar } from '../common/EightPointStar.jsx';

export function RecentGallerySection({ albums = [] }) {
  const { locale, t, toBanglaNum, getLocalized } = useLanguage();

  if (!albums || albums.length === 0) {
    return null;
  }

  const getTypeLabel = (type, occasionName) => {
    if (type === 'OTHER' && occasionName) {
      return occasionName;
    }
    if (type === 'FITR') return locale === 'bn' ? 'ঈদুল ফিতর' : 'Eid-ul-Fitr';
    if (type === 'ADHA') return locale === 'bn' ? 'ঈদুল আযহা' : 'Eid-ul-Adha';
    return locale === 'bn' ? 'অন্যান্য' : 'Other';
  };

  return (
    <section className="py-12 sm:py-16 bg-ivory-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-gold-600 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">
              <Camera className="w-4 h-4 text-emerald-700" />
              <span>{t('recent_gallery_title')}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              {t('recent_gallery_desc')}
            </h2>
          </div>
          <Link
            to="/gallery"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
          >
            <span>{t('view_all_gallery')}</span>
            <ChevronRight className="w-4 h-4 text-gold-500" />
          </Link>
        </div>

        {/* Desktop 4 per row, mobile 2 per row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {albums.map((album) => {
            const title = getLocalized(album, 'title');
            const occasion = getLocalized(album, 'occasionName');
            const typeBadge = getTypeLabel(album.type, occasion);
            const coverUrl = album.coverPhoto?.thumbPath
              ? `/uploads/${album.coverPhoto.thumbPath}`
              : album.photos?.[0]?.thumbPath
              ? `/uploads/${album.photos[0].thumbPath}`
              : '/uploads/defaults/eidgah-hero.svg';
            const photoCount = album._count?.photos || album.photos?.length || 0;

            return (
              <Link
                key={album.id}
                to={`/gallery/${album.slug}`}
                className="group relative flex flex-col rounded-2xl bg-white border border-gold-500/30 overflow-hidden shadow-sm hover:shadow-xl hover:border-gold-500 transition-all duration-300"
              >
                {/* Stacked Photos Decorative Layer Behind */}
                <div className="relative w-full aspect-[4/3] bg-stone-100 overflow-hidden">
                  <img
                    src={coverUrl}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="%230F5132"><rect width="400" height="300" fill="%230F5132"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23FAF7F0" font-family="serif" font-size="20">মানিকপুর ঈদগাহ</text></svg>';
                    }}
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-transparent to-transparent opacity-80" />

                  {/* Badges on Image */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-950/80 backdrop-blur-sm border border-gold-500/40 text-[10px] sm:text-xs font-semibold text-gold-300">
                      {typeBadge}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs text-white">
                    <span className="font-serif font-bold text-sm text-gold-200">
                      {toBanglaNum(album.year)}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-[11px]">
                      <Layers className="w-3 h-3 text-gold-400" />
                      <span>{toBanglaNum(photoCount)}</span>
                    </span>
                  </div>
                </div>

                {/* Album Title */}
                <div className="p-3.5 sm:p-4 flex-grow flex flex-col justify-between">
                  <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                    {title}
                  </h3>
                  <div className="pt-2 flex items-center gap-1 text-[11px] sm:text-xs text-emerald-800 font-semibold group-hover:text-gold-600 transition-colors">
                    <span>{locale === 'bn' ? 'ফোল্ডার খুলুন' : 'Open Folder'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
