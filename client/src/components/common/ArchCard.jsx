import React from 'react';

/**
 * ArchCard: Reusable Ivory Heritage card with arch styling and hairline gold border.
 */
export function ArchCard({
  children,
  className = '',
  hoverEffect = true,
  variant = 'white', // 'white' | 'emerald' | 'ivory'
  onClick,
}) {
  const variantStyles = {
    white: 'bg-white text-stone-900 border-gold-500/30',
    emerald: 'bg-emerald-800 text-ivory-50 border-gold-500/40 shadow-emerald-card',
    ivory: 'bg-ivory-50 text-stone-900 border-gold-500/25',
  };

  const hoverClasses = hoverEffect
    ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-gold-500/70'
    : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-5 md:p-6 relative overflow-hidden ${variantStyles[variant]} ${hoverClasses} ${className}`}
    >
      {children}
    </div>
  );
}
