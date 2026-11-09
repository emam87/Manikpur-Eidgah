import React from 'react';

/**
 * 8-Point Islamic Star SVG Icon / Ornament
 */
export function EightPointStar({ className = 'w-5 h-5 text-gold-500', filled = true }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? '0' : '1.5'}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Two overlapping squares rotated 45 degrees creating traditional Islamic 8-point star */}
      <rect x="5.5" y="5.5" width="13" height="13" rx="1" transform="rotate(0 12 12)" />
      <rect x="5.5" y="5.5" width="13" height="13" rx="1" transform="rotate(45 12 12)" />
      <circle cx="12" cy="12" r="2.2" fill={filled ? '#FAF7F0' : 'currentColor'} />
    </svg>
  );
}

/**
 * Centered 8-Point Star Divider with Hairline Gold Lines
 */
export function StarDivider({ className = 'my-6', starColor = 'text-gold-500' }) {
  return (
    <div className={`flex items-center justify-center gap-3 w-full ${className}`}>
      <div className="h-[1px] bg-gradient-to-r from-transparent via-gold-500/50 to-gold-500 flex-grow max-w-[120px]" />
      <EightPointStar className={`w-4 h-4 ${starColor}`} />
      <div className="h-[1px] bg-gradient-to-l from-transparent via-gold-500/50 to-gold-500 flex-grow max-w-[120px]" />
    </div>
  );
}
