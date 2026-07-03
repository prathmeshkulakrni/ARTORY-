/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#7C3AED', dark: '#6D28D9', light: '#8B5CF6' },
        accent:  { DEFAULT: '#6366F1', dark: '#4F46E5', light: '#818CF8' },
        dark:    { DEFAULT: '#0B0D18', card: '#111327', border: '#1E2040' },
        surface: { DEFAULT: '#161832', hover: '#1C1F3E' },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'float':      'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 5px #7C3AED' }, '50%': { boxShadow: '0 0 20px #7C3AED, 0 0 40px #7C3AED60' } },
        float:     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
    },
  },
  plugins: [],
}
