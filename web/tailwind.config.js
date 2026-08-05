/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        darkBg: '#08060d',
        cardBg: '#13101e',
        cardBorder: '#231d36',
        neonLime: '#ccff00',
      },
      boxShadow: {
        'glow-purple': '0 0 30px -5px rgba(168, 85, 247, 0.35)',
        'glow-orange': '0 0 30px -5px rgba(249, 115, 22, 0.35)',
        'glow-lime': '0 0 25px 0px rgba(204, 255, 0, 0.35)',
      },
      keyframes: {
        floatSlow: {
          '0%,100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(1deg)' },
        },
        floatBadge: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%,100%': { opacity: 0.42, transform: 'scale(1)' },
          '50%': { opacity: 0.8, transform: 'scale(1.05)' },
        },
      },
      animation: {
        float: 'floatSlow 5s ease-in-out infinite',
        floatSlow: 'floatBadge 4s ease-in-out infinite',
        glow: 'pulseGlow 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};