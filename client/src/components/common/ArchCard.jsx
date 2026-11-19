import React from 'react';

/**
 * ArchCard: Reusable Sakinah card with gentle shadow and warm sand border.
 */
export function ArchCard({
  children,
  className = '',
  hoverEffect = true,
  variant = 'white', // 'white' | 'emerald' | 'ivory'
  onClick,
}) {
  const variantStyles = {
    white: 'bg-surface text-ink border-sand shadow-sakinah-sm',
    emerald: 'bg-primary text-white border-gold/40 shadow-sakinah-card',
    ivory: 'bg-canvas-alt text-ink border-sand shadow-sakinah-sm',
  };

  const hoverClasses = hoverEffect
    ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-sakinah-lift hover:border-primary/40'
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
