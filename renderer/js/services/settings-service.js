/* global AppState */
/**
 * SettingsService
 * Centralized logic for managing application settings, theme application,
 * and persistence (localStorage + Server).
 */
const SettingsService = (() => {
  'use strict';

  /**
   * Centralized Settings Configuration
   * Maps AppState keys to their storage keys and side-effect types.
   */
  const SETTINGS_CONFIG = {
    // Theme / Appearance
    accentColor: { storageKey: 'md-accent-color', type: 'theme' },
    textZoom: { storageKey: 'md-text-zoom', type: 'theme' },
    codeZoom: { storageKey: 'md-code-zoom', type: 'theme' },
    fontText: { storageKey: 'md-font-text', type: 'theme' },
    fontCode: { storageKey: 'md-font-code', type: 'theme' },
    bgEnabled: { storageKey: 'md-bg-enabled', type: 'theme' },
    bgImage: { storageKey: 'md-bg-image', type: 'theme' },
    
    // Explorer Preferences
    showHidden: { storageKey: 'md-show-hidden', type: 'explorer' },
    hideEmptyFolders: { storageKey: 'md-hide-empty', type: 'explorer' },
    flatView: { storageKey: 'md-flat-view', type: 'explorer' },
    hiddenPaths: { storageKey: 'md-hidden-paths', type: 'explorer' },
    showHiddenInSearch: { storageKey: 'md-show-hidden-search', type: 'explorer' },
    
    // Other Persistent States
    sortMethod: { storageKey: 'mdpreview_sort_method', type: 'explorer' },
    rightSidebarOpen: { storageKey: 'md-right-sidebar-open', type: 'none' },
    rightSidebarTab: { storageKey: 'md-right-sidebar-tab', type: 'none' },
    
    // API / Third Party
    handoffToken: { storageKey: 'md-handoff-token', type: 'none' },
    publishWorkerUrl: { storageKey: 'md-publish-worker-url', type: 'none' },
    publishAdminSecret: { storageKey: 'md-publish-admin-secret', type: 'none' },
    publishData: { storageKey: 'md-publish-data', type: 'none' }
  };

  /**
   * Helper: Convert Hex to RGB
   */
  function hexToRgb(hex) {
    if (!hex) return null;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Apply all current theme settings to the document root
   */
  function applyTheme() {
    const root = document.documentElement;
    const s = AppState.settings;
    if (!s) return;

    // 1. Zoom
    root.style.setProperty('--preview-zoom', s.textZoom || 100);
    root.style.setProperty('--code-zoom', s.codeZoom || 100);

    // 2. Accent Color
    root.style.setProperty('--accent-color', s.accentColor);
    const rgb = hexToRgb(s.accentColor);
    if (rgb) {
      root.style.setProperty('--accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }

    // 3. Fonts
    root.style.setProperty('--font-text', s.fontText);
    root.style.setProperty('--font-code', s.fontCode);

    // 4. Select Arrow (Dynamic SVG)
    _updateSelectArrow(s.accentColor);

    // 5. Background Layer
    _updateBackgroundLayer(s.bgEnabled, s.bgImage);
  }

  /**
   * Unified Update Method
   * Updates state, persists to storage, triggers side effects, and syncs to server.
   */
  function update(key, value) {
    if (!AppState.settings || !(key in AppState.settings)) {
      console.warn(`SettingsService: Invalid setting key "${key}"`);
      return;
    }

    const config = SETTINGS_CONFIG[key] || {};
    
    // 1. Update AppState and Notify Listeners
    if (AppState.settings) {
      AppState.settings[key] = value;
    }
    // 2. Persist to LocalStorage
    if (config.storageKey) {
      const storageValue = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(config.storageKey, storageValue);
    }

    // 3. Trigger Side Effects
    if (config.type === 'theme') {
      applyTheme();
    } else if (config.type === 'explorer') {
      if (typeof TreeModule !== 'undefined') TreeModule.load();
    }

    // 4. Sync to Server
    if (AppState.savePersistentState) {
      AppState.savePersistentState();
    }
  }

  /**
   * Private: Update the dynamic SVG arrow for select elements
   */
  function _updateSelectArrow(color) {
    const arrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
    document.documentElement.style.setProperty('--select-arrow', `url("data:image/svg+xml,${encodeURIComponent(arrowSvg)}")`);
  }

  /**
   * Private: Update the application background layer
   */
  function _updateBackgroundLayer(enabled, image) {
    const bgLayer = document.getElementById('app-background');
    if (!bgLayer) return;

    if (enabled && image) {
      bgLayer.style.backgroundImage = `url(${image})`;
      bgLayer.style.display = 'block';
    } else {
      bgLayer.style.display = 'none';
    }
  }

  // ── Public API ──────────────────────────────────────────

  return {
    applyTheme,
    update,

    // Helper for AppState initialization
    getStorageKey(key) {
      return SETTINGS_CONFIG[key] ? SETTINGS_CONFIG[key].storageKey : null;
    },

    // Background Image Management
    getCustomBackgrounds() {
      try {
        return JSON.parse(localStorage.getItem('mdpreview_custom_bg_images') || '[]');
      } catch (_e) { return []; }
    },

    addCustomBackground(base64) {
      const bgs = this.getCustomBackgrounds();
      if (bgs.length >= 5) return false;
      bgs.push(base64);
      localStorage.setItem('mdpreview_custom_bg_images', JSON.stringify(bgs));
      return true;
    },

    hexToRgb
  };
})();

window.SettingsService = SettingsService;
