import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';

export function StickySaveButton({
  saving = false,
  label = 'সংরক্ষণ করুন',
  savingLabel = 'সংরক্ষণ হচ্ছে...',
  onSave,
  disabled = false,
}) {
  const [bottomOffset, setBottomOffset] = useState(0);

  // visualViewport handling: keep button above virtual keyboard on iOS/Android
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return undefined;

    const handleResize = () => {
      const vv = window.visualViewport;
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setBottomOffset(offset);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport.removeEventListener('resize', handleResize);
      window.visualViewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  return (
    <div
      style={{ bottom: `${bottomOffset}px` }}
      className="sticky z-30 bg-surface/95 backdrop-blur-md border-t border-sand p-3 sm:p-4 shadow-sakinah-lift pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-end gap-3 mt-6 rounded-t-2xl"
    >
      <button
        type="button"
        onClick={onSave}
        disabled={saving || disabled}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-sakinah-sm hover:shadow-sakinah-card transition-all disabled:opacity-50 min-h-[46px] tap-feedback"
      >
        <Save className="w-4 h-4" />
        <span>{saving ? savingLabel : label}</span>
      </button>
    </div>
  );
}
