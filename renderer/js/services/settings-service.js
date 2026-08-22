/* global AppState, MonacoService, ThemeKit, TreeModule */
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
    editorFontScale: { storageKey: 'md-editor-font-scale', type: 'editorFont' },
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
    publishData: { storageKey: 'md-publish-data', type: 'none' },
    customBackgrounds: { storageKey: 'mdpreview_custom_bg_images', type: 'none' }
  };

  /**
   * Apply all current theme settings to the document root.
   *
   * The accent and the background layer are theme-kit's — the same code the
   * VSCode extension applies them with — so the two surfaces cannot drift on
   * which variables a colour actually sets.
   */
  function applyTheme() {
    const root = document.documentElement;
    const s = AppState.settings;
    if (!s) return;

    // 1. Zoom
    root.style.setProperty('--preview-zoom', s.textZoom || 100);
    root.style.setProperty('--code-zoom', s.codeZoom || 100);

    // 2. Accent colour, its rgb channels and the select chevron
    ThemeKit.applyAccent(root, s.accentColor);

    // 3. Fonts
    root.style.setProperty('--font-text', s.fontText);
    root.style.setProperty('--font-code', s.fontCode);

    // 4. Background Layer
    ThemeKit.applyBackground(document.getElementById('app-background'), s.bgEnabled, s.bgImage);
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
    } else if (config.type === 'editorFont') {
      if (typeof MonacoService !== 'undefined') MonacoService.setFontScale(value);
    }

    // 4. Sync to Server
    if (AppState.savePersistentState) {
      AppState.savePersistentState();
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
      return AppState.settings.customBackgrounds || [];
    },

    addCustomBackground(base64) {
      const bgs = this.getCustomBackgrounds();
      // theme-kit stops the user at the same cap and explains why; this is
      // the backstop for any other caller.
      if (bgs.length >= 5) return false;

      this.update('customBackgrounds', [...bgs, base64]);
      return true;
    },

    removeCustomBackground(base64) {
      const bgs = this.getCustomBackgrounds();
      this.update('customBackgrounds', bgs.filter((b) => b !== base64));
    },

    // Resolved on call, not at load: theme.js may not have run yet when
    // this file is evaluated.
    hexToRgb: (hex) => ThemeKit.hexToRgb(hex)
  };
})();

window.SettingsService = SettingsService;
