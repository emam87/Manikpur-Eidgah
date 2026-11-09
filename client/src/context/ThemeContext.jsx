import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('eidgah_fontsize') || 'base';
  });

  useEffect(() => {
    localStorage.setItem('eidgah_fontsize', fontSize);
    const root = document.documentElement;
    root.classList.remove('text-size-sm', 'text-size-base', 'text-size-lg');
    root.classList.add(`text-size-${fontSize}`);
  }, [fontSize]);

  const decreaseFontSize = () => {
    if (fontSize === 'lg') setFontSize('base');
    else if (fontSize === 'base') setFontSize('sm');
  };

  const increaseFontSize = () => {
    if (fontSize === 'sm') setFontSize('base');
    else if (fontSize === 'base') setFontSize('lg');
  };

  const resetFontSize = () => {
    setFontSize('base');
  };

  return (
    <ThemeContext.Provider
      value={{
        fontSize,
        decreaseFontSize,
        increaseFontSize,
        resetFontSize,
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
