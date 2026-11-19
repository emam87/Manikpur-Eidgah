import React from 'react';
import { useScrollProgress } from '../../hooks/useScrollProgress.js';

export function ScrollProgressBar() {
  const progress = useScrollProgress();

  if (progress <= 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[3px] z-50 pointer-events-none"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-gold to-primary shadow-sm transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
