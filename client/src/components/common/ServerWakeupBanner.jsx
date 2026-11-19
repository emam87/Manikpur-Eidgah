import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function ServerWakeupBanner() {
  const { isWakingUp } = useSettings();
  const { t } = useLanguage();

  if (!isWakingUp) return null;

  return (
    <div className="bg-warning-soft border-b border-warning/30 text-warning text-sm py-2.5 px-4 text-center flex items-center justify-center gap-2 animate-fade-in sticky top-0 z-50 backdrop-blur-md">
      <Loader2 className="w-4 h-4 animate-spin text-warning" />
      <span>{t('server_waking_up')}</span>
    </div>
  );
}

