/** @type {import('tailwindcss').Config} */
const withAlpha = (varName) => `rgb(var(${varName}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: withAlpha('--bg-rgb'),
        'canvas-alt': withAlpha('--bg-alt-rgb'),
        surface: {
          DEFAULT: withAlpha('--surface-rgb'),
          hover: withAlpha('--surface-hover-rgb'),
        },
        primary: {
          DEFAULT: withAlpha('--primary-rgb'),
          hover: withAlpha('--primary-hover-rgb'),
          dark: withAlpha('--primary-dark-rgb'),
          soft: withAlpha('--primary-soft-rgb'),
        },
        'sky-mist': withAlpha('--sky-rgb'),
        'dawn-cream': withAlpha('--dawn-cream-rgb'),
        sage: {
          light: withAlpha('--sage-light-rgb'),
          mid: withAlpha('--sage-mid-rgb'),
          deep: withAlpha('--sage-deep-rgb'),
        },
        gold: {
          DEFAULT: withAlpha('--gold-rgb'),
          text: withAlpha('--gold-text-rgb'),
          'plate-from': withAlpha('--gold-plate-from-rgb'),
          'plate-to': withAlpha('--gold-plate-to-rgb'),
        },
        ink: {
          DEFAULT: withAlpha('--text-rgb'),
          muted: withAlpha('--text-muted-rgb'),
        },
        sand: withAlpha('--border-rgb'),
        footer: {
          DEFAULT: withAlpha('--footer-rgb'),
          text: withAlpha('--footer-text-rgb'),
        },
        sidebar: {
          DEFAULT: withAlpha('--sidebar-rgb'),
          text: withAlpha('--sidebar-text-rgb'),
        },
        success: {
          DEFAULT: withAlpha('--success-rgb'),
          soft: withAlpha('--success-soft-rgb'),
        },
        warning: {
          DEFAULT: withAlpha('--warning-rgb'),
          soft: withAlpha('--warning-soft-rgb'),
        },
        danger: {
          DEFAULT: withAlpha('--danger-rgb'),
          soft: withAlpha('--danger-soft-rgb'),
        },
        terracotta: withAlpha('--terracotta-rgb'),
        scrim: withAlpha('--scrim-rgb'),
      },
      fontFamily: {
        serif: ['var(--font-serif)', '"Noto Serif Bengali"', 'serif'],
        sans: ['var(--font-sans)', '"Hind Siliguri"', 'sans-serif'],
      },
      boxShadow: {
        'sakinah-sm': 'var(--shadow-sm)',
        'sakinah-card': 'var(--shadow-card)',
        'sakinah-lift': 'var(--shadow-lift)',
        'gold-glow': 'var(--shadow-gold)',
        'gold-glow-lg': 'var(--shadow-gold-lg)',
        'ivory-card': 'var(--shadow-card)',
        'emerald-card': 'var(--shadow-card)',
        'card-lift': 'var(--shadow-lift)',
      },
      borderRadius: {
        arch: '40px 40px 12px 12px',
      },
      transitionDuration: {
        150: '150ms',
        250: '250ms',
        450: '450ms',
      },
      transitionTimingFunction: {
        heritage: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        shimmer: 'shimmer 2.5s infinite linear',
        'fade-in': 'fadeIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'crescent-float': 'crescentFloat 6s ease-in-out infinite',
        'star-twinkle': 'starTwinkle 3s ease-in-out infinite',
        'spin-slow': 'spin 40s linear infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'dust-drift': 'dustDrift 14s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        crescentFloat: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(2deg)' },
        },
        starTwinkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.85)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 14px rgb(var(--gold-rgb) / 0.22)' },
          '50%': { boxShadow: '0 0 26px rgb(var(--gold-rgb) / 0.45)' },
        },
        dustDrift: {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '20%': { opacity: '0.8' },
          '80%': { opacity: '0.6' },
          '100%': { transform: 'translateY(-120px) translateX(25px)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
