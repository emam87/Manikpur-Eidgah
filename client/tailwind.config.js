/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: '#FAF7F0',
          50: '#FDFBF7',
          100: '#FAF7F0',
          200: '#F4EFE6',
          300: '#EBE2D3',
          400: '#DECDB5',
        },
        emerald: {
          DEFAULT: '#0F5132',
          50: '#F0F9F4',
          100: '#D9F2E3',
          200: '#B3E4C7',
          300: '#80CF9F',
          400: '#4DB977',
          500: '#198754',
          600: '#156F45',
          700: '#0F5132', // Deep Emerald
          800: '#0C4128',
          900: '#082E1C',
          950: '#041B10',
        },
        gold: {
          DEFAULT: '#B8923F',
          50: '#FBF8F0',
          100: '#F5EDD8',
          200: '#EADBB1',
          300: '#DFC88B',
          400: '#D3B565',
          500: '#B8923F', // Antique Gold
          600: '#9B772E',
          700: '#7A5B20',
          800: '#583F13',
          900: '#382608',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif Bengali"', 'serif'],
        sans: ['"Hind Siliguri"', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(184, 146, 63, 0.25)',
        'emerald-card': '0 10px 30px -5px rgba(15, 81, 50, 0.15)',
        'ivory-card': '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        arch: '40px 40px 12px 12px',
      },
      animation: {
        'shimmer': 'shimmer 2.5s infinite linear',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
