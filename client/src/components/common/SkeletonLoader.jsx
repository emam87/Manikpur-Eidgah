import React from 'react';

export function SkeletonLoader({ count = 3, type = 'card' }) {
  const items = Array.from({ length: count });

  if (type === 'stats') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {items.map((_, i) => (
          <div key={i} className="bg-surface animate-pulse rounded-xl p-4 h-24 border border-sand" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map((_, i) => (
        <div key={i} className="bg-surface rounded-2xl p-6 border border-sand shadow-sakinah-sm animate-pulse space-y-4">
          <div className="w-16 h-16 bg-canvas-alt rounded-full mx-auto" />
          <div className="h-5 bg-canvas-alt rounded w-3/4 mx-auto" />
          <div className="h-4 bg-canvas-alt rounded w-1/2 mx-auto" />
          <div className="h-10 bg-canvas-alt rounded w-full mt-4" />
        </div>
      ))}
    </div>
  );
}
