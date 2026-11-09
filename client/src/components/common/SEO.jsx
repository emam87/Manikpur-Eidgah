import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

export function SEO({
  title,
  description,
  image,
  url,
  noIndex = false,
}) {
  const { locale, t } = useLanguage();
  const { getSetting } = useSettings();

  const siteName = getSetting('site_name', locale, t('site_name'));
  const defaultDesc = getSetting('tagline', locale, t('site_tagline'));

  const finalTitle = title ? `${title} | ${siteName}` : `${siteName} — ${defaultDesc}`;
  const finalDesc = description || defaultDesc;
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
  const finalUrl = url ? `${siteUrl}${url}` : window.location.href;
  const defaultImage = `${siteUrl}/uploads/defaults/eidgah-hero.svg`;
  const finalImage = image || defaultImage;

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDesc} />

      {noIndex ? (
        <meta name="robots" content="noindex, nofollow, noarchive" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDesc} />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDesc} />
      <meta name="twitter:image" content={finalImage} />
    </Helmet>
  );
}

