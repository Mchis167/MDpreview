/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./renderer/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        'gray-dark': {
          950: '#0a0a0a',
          900: '#121214',
          800: '#1e1e20',
          700: '#2a2a2c',
          rest: '#737373'
        },
        accent: {
          DEFAULT: '#a855f7',
          hover: '#9333ea',
          glow: 'rgba(168, 85, 247, 0.8)'
        },
        success: {
          DEFAULT: '#22c55e',
          bg: 'rgba(5, 46, 22, 0.2)',
          border: 'rgba(34, 197, 94, 0.2)'
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
