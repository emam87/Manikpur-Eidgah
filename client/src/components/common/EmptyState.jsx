import React from 'react';
import { EightPointStar } from './EightPointStar.jsx';

export function EmptyState({
  icon: Icon = EightPointStar,
  title,
  description,
  action,
}) {
  return (
    <div className="text-center py-16 px-4 bg-surface rounded-3xl border border-sand shadow-sakinah-card max-w-lg mx-auto space-y-4 my-8 animate-fade-in">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-soft border border-primary/20 text-primary-dark flex items-center justify-center shadow-sakinah-sm">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-serif font-bold text-xl text-primary-dark">{title}</h3>
      {description && (
        <p className="text-ink-muted text-sm leading-relaxed max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
