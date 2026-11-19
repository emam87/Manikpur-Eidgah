import React, { useState } from 'react';
import { getImageUrl } from '../../utils/imageUrl.js';

export function ImageWithBlur({
  src,
  alt,
  aspectRatio = 'aspect-[4/3]',
  className = '',
  imageClassName = '',
  priority = false,
  fallback = '/defaults/eidgah-hero.webp',
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const resolvedSrc = getImageUrl(src, fallback);

  return (
    <div className={`relative overflow-hidden ${aspectRatio} bg-canvas-alt ${className}`}>
      {/* Skeleton Shimmer while loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-canvas-alt via-primary-soft/60 to-canvas-alt animate-shimmer" />
      )}

      {/* Actual Image */}
      <img
        src={hasError ? fallback : resolvedSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchpriority={priority ? 'high' : 'auto'}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        className={`w-full h-full object-cover transition-all duration-500 ${
          isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-sm'
        } ${imageClassName}`}
      />
    </div>
  );
}
