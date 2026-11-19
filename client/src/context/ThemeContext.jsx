import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Theme (Light / Dark)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('eidgah_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Synchronize Dark Mode to DOM root + theme-color meta + OS changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const cssVar = theme === 'dark' ? '--bg' : '--primary';
      const resolvedColor = getComputedStyle(root).getPropertyValue(cssVar).trim();
      if (resolvedColor) {
        metaThemeColor.setAttribute('content', resolvedColor);
      }
    }
  }, [theme]);

  // Listen to OS prefers-color-scheme changes if user hasn't made a manual choice
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleOsChange = (e) => {
      if (!localStorage.getItem('eidgah_theme_manual')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handleOsChange);
    return () => mq.removeEventListener('change', handleOsChange);
  }, []);

  // Clean up any legacy lite-mode or font-size classes/storage
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('lite-mode', 'text-size-sm', 'text-size-base', 'text-size-lg');
    localStorage.removeItem('eidgah_litemode');
    localStorage.removeItem('eidgah_fontsize');
  }, []);

  const setManualTheme = (nextTheme) => {
    localStorage.setItem('eidgah_theme', nextTheme);
    localStorage.setItem('eidgah_theme_manual', '1');
    setTheme(nextTheme);
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('eidgah_theme', next);
      localStorage.setItem('eidgah_theme_manual', '1');
      return next;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: setManualTheme,
        toggleTheme,
        isDark: theme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}


