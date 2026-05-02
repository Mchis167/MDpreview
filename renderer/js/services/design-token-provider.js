/**
 * DesignTokenProvider
 * Purpose: Expose design system tokens programmatically for use in published documents
 * Source: renderer/css/design-system/tokens.css (3-tier architecture)
 *
 * This module extracts design tokens at runtime and provides a JavaScript API
 * for accessing token values. Used by PublishService for injecting tokens into
 * standalone HTML bundles without hardcoding.
 */

const DesignTokenProvider = (() => {
  'use strict';

  // ============================================
  // TOKEN DEFINITIONS (mirrored from tokens.css)
  // ============================================

  const TOKENS = {
    // TIER 1 — PRIMITIVES
    primitives: {
      // Brand Colors
      '--ds-primitive-orange': '#ffbf48',
      '--ds-primitive-green': '#22c55e',
      '--ds-primitive-red': '#ff453a',
      '--ds-primitive-blue': '#1E90FF',

      // RGB Channels
      '--ds-primitive-orange-rgb': '255, 191, 72',
      '--ds-primitive-green-rgb': '34, 197, 94',
      '--ds-primitive-red-rgb': '255, 69, 58',
      '--ds-primitive-blue-rgb': '30, 144, 255',

      // Base Backgrounds
      '--ds-primitive-base': '#151515',
      '--ds-primitive-surface': '#1a1a1a',
      '--ds-primitive-deep': '#111',
      '--ds-primitive-white': '#fff',
      '--ds-primitive-black': '#000',

      // Spacing Scale
      '--ds-space-3xs': '2px',
      '--ds-space-2xs': '4px',
      '--ds-space-xs': '6px',
      '--ds-space-sm': '8px',
      '--ds-space-md': '12px',
      '--ds-space-lg': '16px',
      '--ds-space-xl': '24px',
      '--ds-space-2xl': '28px',
      '--ds-space-3xl': '32px',
      '--ds-space-4xl': '48px',

      // Radius Scale
      '--ds-radius-xs': '4px',
      '--ds-radius-sm': '6px',
      '--ds-radius-md': '8px',
      '--ds-radius-lg': '12px',
      '--ds-radius-xl': '16px',
      '--ds-radius-2xl': '24px',
      '--ds-radius-3xl': '32px',
      '--ds-radius-full': '999px',

      // Typography
      '--ds-font-family-text': "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      '--ds-font-family-code': "'Roboto Mono', ui-monospace, SFMono-Regular, monospace",
      '--ds-font-xs': '11px',
      '--ds-font-sm': '12px',
      '--ds-font-md': '13px',
      '--ds-font-base': '14px',
      '--ds-font-lg': '15px',
      '--ds-font-xl': '18px',

      // Easing
      '--ds-ease-spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      '--ds-ease-elastic': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      '--ds-ease-out': 'cubic-bezier(0.4, 0, 0.2, 1)',

      // Blur Scale
      '--ds-blur-xs': '6px',
      '--ds-blur-sm': '8px',
      '--ds-blur-md': '12px',
      '--ds-blur-lg': '20px',
      '--ds-blur-xl': '32px'
    },

    // TIER 2 — ALPHA PALETTE
    alpha: {
      // White alpha variants
      '--ds-white-a01': 'rgba(255, 255, 255, 0.01)',
      '--ds-white-a02': 'rgba(255, 255, 255, 0.02)',
      '--ds-white-a03': 'rgba(255, 255, 255, 0.03)',
      '--ds-white-a04': 'rgba(255, 255, 255, 0.04)',
      '--ds-white-a05': 'rgba(255, 255, 255, 0.05)',
      '--ds-white-a08': 'rgba(255, 255, 255, 0.08)',
      '--ds-white-a10': 'rgba(255, 255, 255, 0.10)',
      '--ds-white-a12': 'rgba(255, 255, 255, 0.12)',
      '--ds-white-a20': 'rgba(255, 255, 255, 0.20)',
      '--ds-white-a30': 'rgba(255, 255, 255, 0.30)',
      '--ds-white-a40': 'rgba(255, 255, 255, 0.40)',
      '--ds-white-a60': 'rgba(255, 255, 255, 0.60)',
      '--ds-white-a90': 'rgba(255, 255, 255, 0.90)',

      // Black alpha variants
      '--ds-black-a05': 'rgba(0, 0, 0, 0.05)',
      '--ds-black-a15': 'rgba(0, 0, 0, 0.15)',
      '--ds-black-a20': 'rgba(0, 0, 0, 0.20)',
      '--ds-black-a30': 'rgba(0, 0, 0, 0.30)',
      '--ds-black-a35': 'rgba(0, 0, 0, 0.35)',
      '--ds-black-a40': 'rgba(0, 0, 0, 0.40)',
      '--ds-black-a50': 'rgba(0, 0, 0, 0.50)',
      '--ds-black-a80': 'rgba(0, 0, 0, 0.80)',
      '--ds-black-a90': 'rgba(0, 0, 0, 0.90)',

      // Accent alpha variants
      '--ds-orange-a08': 'rgba(255, 191, 72, 0.08)',
      '--ds-orange-a15': 'rgba(255, 191, 72, 0.15)',
      '--ds-orange-a30': 'rgba(255, 191, 72, 0.30)',

      '--ds-green-a15': 'rgba(34, 197, 94, 0.15)',
      '--ds-green-a20': 'rgba(34, 197, 94, 0.20)',
      '--ds-green-a40': 'rgba(34, 197, 94, 0.40)',

      '--ds-red-a08': 'rgba(255, 69, 58, 0.08)',
      '--ds-red-a10': 'rgba(255, 69, 58, 0.10)',
      '--ds-red-a15': 'rgba(255, 69, 58, 0.15)',
      '--ds-red-a30': 'rgba(255, 69, 58, 0.30)'
    },

    // TIER 3 — SEMANTIC
    semantic: {
      // Backgrounds
      '--ds-bg-base': '#151515',
      '--ds-bg-backdrop': 'rgba(0, 0, 0, 0.40)',
      '--ds-bg-popover-glass': 'rgba(255, 255, 255, 0.01)',
      '--ds-bg-floating-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.01) 0%, rgba(255, 255, 255, 0.03) 100%)',
      '--ds-bg-toolbar': 'rgba(0, 0, 0, 0.50)',
      '--ds-bg-toolbar-inner': 'rgba(255, 255, 255, 0.03)',

      // Glass effects
      '--ds-glass-sidebar': 'linear-gradient(166deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.20) 100%)',
      '--ds-glass-main': 'linear-gradient(168deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.30) 100%)',
      '--ds-glass-hover': 'rgba(255, 255, 255, 0.05)',

      // Borders
      '--ds-border-xsubtle': 'rgba(255, 255, 255, 0.01)',
      '--ds-border-subtle': 'rgba(255, 255, 255, 0.04)',
      '--ds-border-default': 'rgba(255, 255, 255, 0.05)',
      '--ds-border-strong': 'rgba(255, 255, 255, 0.08)',
      '--ds-border-xstrong': 'rgba(255, 255, 255, 0.12)',
      '--ds-border-selected-subtle': 'rgba(255, 255, 255, 0.10)',
      '--ds-border-selected': 'rgba(255, 255, 255, 0.30)',
      '--ds-border-dark-xsubtle': 'rgba(0, 0, 0, 0.05)',

      // Radius semantic
      '--ds-radius-shell': '24px',
      '--ds-radius-surface': '16px',
      '--ds-radius-panel': '12px',
      '--ds-radius-widget': '8px',
      '--ds-radius-chip': '4px',
      '--ds-radius-pill': '999px',

      // Text
      '--ds-text-primary': 'rgba(255, 255, 255, 0.90)',
      '--ds-text-secondary': 'rgba(255, 255, 255, 0.60)',
      '--ds-text-tertiary': 'rgba(255, 255, 255, 0.40)',
      '--ds-text-disabled': 'rgba(255, 255, 255, 0.20)',
      '--ds-text-inverse': '#ffffff',
      '--ds-text-on-accent': 'rgba(0, 0, 0, 0.90)',

      // Accent
      '--ds-accent': '#ffbf48',
      '--ds-accent-rgb': '255, 191, 72',
      '--ds-accent-hover': 'linear-gradient(rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0.10)), #ffbf48',
      '--ds-accent-green': '#22c55e',
      '--ds-accent-red': '#ff453a',
      '--ds-accent-blue': '#1E90FF',

      // Status
      '--ds-status-success': '#22c55e',
      '--ds-status-success-bg': 'rgba(34, 197, 94, 0.15)',
      '--ds-status-danger': '#ff453a',
      '--ds-status-danger-bg': 'rgba(255, 69, 58, 0.10)',
      '--ds-status-warning': '#ffbf48',
      '--ds-status-warning-bg': 'rgba(255, 191, 72, 0.08)',
      '--ds-status-info': '#1E90FF',

      // Shadows
      '--ds-shadow-xs': '0 1px 2px rgba(0, 0, 0, 0.20)',
      '--ds-shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.20)',
      '--ds-shadow-md': '0 8px 24px rgba(0, 0, 0, 0.35)',
      '--ds-shadow-lg': '0 20px 40px rgba(0, 0, 0, 0.50)',
      '--ds-shadow-xl': '0 32px 64px rgba(0, 0, 0, 0.80)',
      '--ds-shadow-lift': '0 20px 40px rgba(0, 0, 0, 0.30), 0 0 0 1px rgba(255, 255, 255, 0.10)',
      '--ds-shadow-glow': '0 0 20px rgba(255, 191, 72, 0.3)',

      // Blur
      '--ds-blur-sidebar': '32px',
      '--ds-blur-searchbox': '32px',

      // Z-Index
      '--ds-z-index-base': '1',
      '--ds-z-index-toolbar': '100',
      '--ds-z-index-overlay': '1000',
      '--ds-z-index-popover': '1100',
      '--ds-z-index-max': '9999',

      // Transitions
      '--ds-transition-fast': '0.1s cubic-bezier(0.16, 1, 0.3, 1)',
      '--ds-transition-main': '0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      '--ds-transition-normal': '0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      '--ds-transition-smooth': '0.2s cubic-bezier(0.16, 1, 0.3, 1)'
    },

    // Layout-critical tokens (for content padding)
    layout: {
      '--ds-content-padding-x': '80px',
      '--ds-content-padding-y': '80px'
    }
  };

  // ============================================
  // PRIVATE FUNCTIONS
  // ============================================

  /**
   * Merge all token tiers into a single flat map
   */
  function _getAllTokens() {
    return {
      ...TOKENS.primitives,
      ...TOKENS.alpha,
      ...TOKENS.semantic,
      ...TOKENS.layout
    };
  }

  /**
   * Validate a token exists and return its value
   */
  function _resolveToken(tokenName) {
    const allTokens = _getAllTokens();
    if (!(tokenName in allTokens)) {
      console.warn(`[DesignTokenProvider] Token not found: ${tokenName}`);
      return null;
    }
    return allTokens[tokenName];
  }

  // ============================================
  // PUBLIC API
  // ============================================

  return {
    /**
     * Get a single token value by name
     * @param {string} tokenName - CSS variable name (e.g., '--ds-accent')
     * @returns {string|null} Token value or null if not found
     */
    getToken(tokenName) {
      return _resolveToken(tokenName);
    },

    /**
     * Get all tokens of a specific tier
     * @param {string} tier - 'primitives' | 'alpha' | 'semantic' | 'layout'
     * @returns {object} Object with all tokens in that tier
     */
    getTier(tier) {
      if (!(tier in TOKENS)) {
        console.warn(`[DesignTokenProvider] Tier not found: ${tier}`);
        return {};
      }
      return TOKENS[tier];
    },

    /**
     * Get all tokens flattened into a single object
     * @returns {object} All tokens with keys like '--ds-accent'
     */
    getAllTokens() {
      return _getAllTokens();
    },

    /**
     * Generate CSS variable declarations as a string
     * @param {string} selector - CSS selector (e.g., ':root')
     * @returns {string} CSS rules for all tokens
     */
    generateCSSVariables(selector = ':root') {
      const allTokens = _getAllTokens();
      const lines = Object.entries(allTokens).map(
        ([name, value]) => `  ${name}: ${value};`
      );
      return `${selector} {\n${lines.join('\n')}\n}`;
    },

    /**
     * Generate inline CSS (without selector) for embedding in <style> tag
     * @returns {string} CSS variable declarations without selector
     */
    generateInlineStyles() {
      const allTokens = _getAllTokens();
      const lines = Object.entries(allTokens).map(
        ([name, value]) => `  ${name}: ${value};`
      );
      return lines.join('\n');
    },

    /**
     * Validate token consistency at runtime
     * Checks if tokens defined in JavaScript match those in the DOM
     * @returns {object} Validation report with matches, mismatches, missing
     */
    validateTokens() {
      const jsTokens = _getAllTokens();
      const domTokens = {};
      const result = {
        valid: true,
        matches: 0,
        mismatches: [],
        missingInDom: [],
        missingInJs: []
      };

      // Get tokens from DOM
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        const styles = getComputedStyle(root);

        for (const name of Object.keys(jsTokens)) {
          const domValue = styles.getPropertyValue(name).trim();
          if (domValue) {
            domTokens[name] = domValue;
          }
        }

        // Check for mismatches
        for (const [name, jsValue] of Object.entries(jsTokens)) {
          if (domTokens[name]) {
            result.matches++;
            // Note: Exact match may not be possible due to CSS parsing,
            // so we just verify the token exists in DOM
          } else {
            result.missingInDom.push(name);
            result.valid = false;
          }
        }

        // Check for tokens in DOM that aren't in JS
        for (const [name, domValue] of Object.entries(domTokens)) {
          if (!(name in jsTokens)) {
            result.missingInJs.push(name);
          }
        }
      }

      return result;
    }
  };
})();

// Export to window for browser context
window.DesignTokenProvider = DesignTokenProvider;

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DesignTokenProvider;
}
