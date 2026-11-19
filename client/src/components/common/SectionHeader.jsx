import React from 'react';
import { EightPointStar, StarDivider } from './EightPointStar.jsx';

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'center', // 'center' | 'left'
  className = '',
}) {
  const isCenter = align === 'center';

  return (
    <div className={`space-y-3 ${isCenter ? 'text-center max-w-3xl mx-auto' : 'text-left'} ${className}`}>
      {eyebrow && (
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary-soft border border-primary/20 text-primary-dark text-xs font-semibold uppercase tracking-wider shadow-sakinah-sm ${
            isCenter ? 'mx-auto' : ''
          }`}
        >
          <EightPointStar className="w-3 h-3 text-gold-text" />
          <span>{eyebrow}</span>
          <EightPointStar className="w-3 h-3 text-gold-text" />
        </div>
      )}

      {title && (
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary-dark tracking-tight leading-tight">
          {title}
        </h2>
      )}

      <StarDivider className={isCenter ? 'my-3 mx-auto' : 'my-3'} />

      {subtitle && (
        <p className="text-ink-muted text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
