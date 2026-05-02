/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#8B5CF6', dark: '#6D28D9', light: '#A78BFA' },
        accent:  { DEFAULT: '#F472B6', dark: '#DB2777' },
        dark:    { DEFAULT: '#0F0F1A', card: '#1A1A2E', border: '#2D2D4E' },
        surface: { DEFAULT: '#16213E', hover: '#1F2F55' },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 5px #8B5CF6' }, '50%': { boxShadow: '0 0 20px #8B5CF6, 0 0 40px #8B5CF660' } },
      },
    },
  },
  plugins: [],
}
