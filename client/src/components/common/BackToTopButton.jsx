import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary text-white border-2 border-gold/55 shadow-sakinah-lift backdrop-blur-md flex items-center justify-center hover:bg-primary-hover transition-all duration-300 tap-feedback animate-fade-in group"
      title="উপরে ফিরে যান"
      aria-label="Scroll back to top"
    >
      <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-y-0.5 transition-transform" />
    </button>
  );
}
