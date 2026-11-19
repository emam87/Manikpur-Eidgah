import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, ChevronRight, Layers } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { ImageWithBlur } from '../common/ImageWithBlur.jsx';
import { getImageUrl } from '../../utils/imageUrl.js';

export function RecentGallerySection({ albums = [] }) {
  const { locale, t, toBanglaNum, getLocalized, getEnumLabel } = useLanguage();

  if (!albums || albums.length === 0) {
    return null;
  }

  // Max 6 items
  const displayAlbums = albums.slice(0, 6);

  const getTypeLabel = (type, occasionName) => {
    if (type === 'OTHER' && occasionName) {
      return occasionName;
    }
    return getEnumLabel('album_types', type);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" aria-hidden="true" />
          <h2 className="font-serif font-bold text-base sm:text-lg text-primary-dark tracking-tight">
            {locale === 'bn' ? 'সাম্প্রতিক স্মৃতিচিত্র' : 'Recent Photos'}
          </h2>
        </div>
        <Link
          to="/gallery"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary-dark hover:text-primary transition-colors"
        >
          <span>{locale === 'bn' ? 'সকল ছবি' : 'All Photos'}</span>
          <ChevronRight className="w-3.5 h-3.5 text-gold-text" />
        </Link>
      </div>

      {/* Horizontal-scroll strip on mobile (snap-x), responsive grid on desktop */}
      <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto snap-x scrollbar-none pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {displayAlbums.map((album) => {
          const title = getLocalized(album, 'title');
          if (locale === 'en' && !title) return null;
          const occasion = getLocalized(album, 'occasionName');
          const typeBadge = getTypeLabel(album.type, occasion);
          const coverUrl = getImageUrl(
            album.coverPhoto?.thumbPath ||
              album.coverPhoto?.path ||
              album.photos?.[0]?.thumbPath ||
              album.photos?.[0]?.path,
            '/defaults/eidgah-hero.webp'
          );
          const photoCount = album._count?.photos || album.photos?.length || 0;

          return (
            <Link
              key={album.id}
              to={`/gallery/${album.slug}`}
              className="flex-shrink-0 w-44 sm:w-auto snap-start group relative flex flex-col rounded-2xl bg-surface border border-sand overflow-hidden shadow-sakinah-sm hover:shadow-sakinah-card transition-all active:scale-[0.98] tap-feedback"
            >
              <div className="relative w-full aspect-[4/3] bg-canvas-alt overflow-hidden">
                <ImageWithBlur
                  src={coverUrl}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-scrim/75 via-transparent to-transparent opacity-80 pointer-events-none" />

                <div className="absolute top-2 left-2 z-10">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-surface/95 backdrop-blur-sm border border-sand text-[9px] font-semibold text-primary-dark shadow-sakinah-sm">
                    {typeBadge}
                  </span>
                </div>

                <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[11px] text-white z-10">
                  <span className="font-serif font-bold text-xs text-white drop-shadow">
                    {locale === 'bn' ? toBanglaNum(album.year) : album.year}
                  </span>
                  <span className="inline-flex items-center gap-0.5 bg-scrim/65 backdrop-blur-sm px-1.5 py-0.5 rounded-full text-[10px] text-white border border-white/20">
                    <Layers className="w-2.5 h-2.5 text-gold-plate-from" />
                    <span>{locale === 'bn' ? toBanglaNum(photoCount) : photoCount}</span>
                  </span>
                </div>
              </div>

              <div className="p-2.5">
                <h3 className="font-serif font-bold text-xs text-ink group-hover:text-primary-dark transition-colors line-clamp-1">
                  {title}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
