import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}) {
  const [dragY, setDragY] = useState(0);
  const [startY, setStartY] = useState(null);
  const sheetRef = useRef(null);

  // Background scroll locking
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Touch drag-down handlers for mobile
  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (startY === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragY > 120) {
      onClose();
    }
    setDragY(0);
    setStartY(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-scrim/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : 'none',
          transition: startY === null ? 'transform 200ms ease' : 'none',
        }}
        className={`w-full ${maxWidth} bg-surface rounded-t-[32px] md:rounded-3xl border-t md:border border-sand shadow-sakinah-lift max-h-[92dvh] md:max-h-[88vh] flex flex-col overflow-hidden relative text-ink animate-slide-up`}
      >
        {/* Mobile Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 rounded-full bg-sand" />
        </div>

        {/* Header Bar */}
        {(title || onClose) && (
          <div className="flex items-center justify-between px-6 pt-3 pb-4 border-b border-sand">
            <div>
              {title && (
                <h3 className="font-serif font-bold text-lg sm:text-xl text-primary-dark leading-snug">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-ink-muted mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-canvas-alt text-ink-muted hover:text-ink min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors tap-feedback"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
