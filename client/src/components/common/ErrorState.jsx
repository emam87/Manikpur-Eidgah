import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button.jsx';

export function ErrorState({
  title = 'তথ্য লোড করতে সমস্যা হয়েছে',
  message = 'সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। আপনার ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।',
  onRetry,
}) {
  return (
    <div className="text-center py-16 px-4 bg-surface rounded-3xl border border-danger/30 shadow-sakinah-card max-w-lg mx-auto space-y-4 my-8 animate-fade-in">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-danger-soft border border-danger/30 text-danger flex items-center justify-center shadow-sakinah-sm">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h3 className="font-serif font-bold text-xl text-ink">{title}</h3>
      <p className="text-ink-muted text-sm leading-relaxed max-w-sm mx-auto">{message}</p>
      {onRetry && (
        <div className="pt-2">
          <Button variant="primary" size="sm" icon={RefreshCw} onClick={onRetry}>
            পুনরায় চেষ্টা করুন
          </Button>
        </div>
      )}
    </div>
  );
}
