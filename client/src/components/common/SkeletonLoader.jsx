import React from 'react';

export function SkeletonLoader({ count = 3, type = 'card' }) {
  const items = Array.from({ length: count });

  if (type === 'stats') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {items.map((_, i) => (
          <div key={i} className="bg-white/40 animate-pulse rounded-xl p-4 h-24 border border-gold-500/10" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 border border-gold-500/20 shadow-sm animate-pulse space-y-4">
          <div className="w-16 h-16 bg-stone-200 rounded-full mx-auto" />
          <div className="h-5 bg-stone-200 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-stone-100 rounded w-1/2 mx-auto" />
          <div className="h-10 bg-stone-100 rounded w-full mt-4" />
        </div>
      ))}
    </div>
  );
}

