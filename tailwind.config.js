/**
 * Tailwind CSS Configuration for MDPreview
 *
 * IMPORTANT: This config is LEGACY and should be migrated to CSS Design System tokens.
 * New code should use CSS custom properties (--ds-*) instead of Tailwind classes.
 *
 * Reference: ARCHITECTURE.md § Token System, § CSS Architecture
 *
 * Migration Path:
 * 1. CSS Design System tokens (PREFERRED) — var(--ds-*)
 * 2. Inline Tailwind classes (LEGACY) — avoid for new code
 * 3. Hard-coded values (FORBIDDEN) — never use
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  // Content paths for Tailwind to scan
  content: ["./renderer/**/*.{html,js}"],

  theme: {
    extend: {
      /**
       * Color Palette (LEGACY)
       *
       * NOTE: These should be replaced with CSS Design System tokens:
       * - gray-dark-950 → var(--ds-bg-overlay)
       * - accent → var(--ds-accent)
       * - success → var(--ds-status-success-bg)
       *
       * Migrate by:
       * 1. Use CSS tokens in design-system/*.css files
       * 2. Remove Tailwind color classes
       * 3. Prefer CSS variables over Tailwind utilities
       */
      colors: {
        /**
         * Dark Gray Scale
         * Background colors for dark theme
         * LEGACY — migrate to: --ds-bg-base, --ds-bg-surface, --ds-bg-overlay
         */
        'gray-dark': {
          950: '#0a0a0a',  // Base background
          900: '#121214',  // Primary background
          800: '#1e1e20',  // Secondary background
          700: '#2a2a2c',  // Tertiary background
          rest: '#737373'  // Text color fallback
        },

        /**
         * Accent Color (Orange)
         * Primary interactive color
         * LEGACY — migrate to: --ds-accent, --ds-accent-hover
         */
        accent: {
          DEFAULT: '#ffbf48',           // Base accent (orange)
          hover: '#e5ab41',             // Hover state
          glow: 'rgba(255, 191, 72, 0.8)' // Glow effect with alpha
        },

        /**
         * Success Status Color (Green)
         * Success/positive state colors
         * LEGACY — migrate to: --ds-status-success-bg, --ds-status-success-border
         */
        success: {
          DEFAULT: '#22c55e',              // Base success (green)
          bg: 'rgba(5, 46, 22, 0.2)',      // Subtle background
          border: 'rgba(34, 197, 94, 0.2)' // Subtle border
        }
      },

      /**
       * Animations (LEGACY)
       * Transition effects for UI elements
       * LEGACY — prefer CSS transitions: transition: all var(--ds-transition-smooth);
       */
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',    // Fade in animation (300ms)
        'slide-in': 'slideIn 0.3s ease-out',  // Slide in animation (300ms)
        'spin-slow': 'spin 3s linear infinite', // Slow spin animation (3s)
      },

      /**
       * Keyframes (LEGACY)
       * Custom animation definitions
       * LEGACY — prefer CSS animations in design-system/
       */
      keyframes: {
        /**
         * Fade In
         * Opacity + subtle vertical translation
         * 0% → 100%: transparent, down 4px → visible, normal position
         */
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },

        /**
         * Slide In
         * Horizontal + opacity transition
         * 0% → 100%: right 20px, transparent → normal position, visible
         */
        slideIn: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        }
      }
    },
  },

  // No plugins
  plugins: [],
}
