/* global SearchPalette */
/**
 * sidebar.js — Sidebar UI Controller.
 * 
 * Target: Clean initialization and standardization.
 * Refactored: Resizer logic moved to SidebarLeft.
 */
const SidebarModule = (() => {
  let _searchBarInstance = null;

  /**
   * Main entry point for Sidebar UI logic.
   */
  function init() {
    _initSearch();
  }

  /**
   * Initialize Sidebar Search logic (Legacy removed, now just init Palette)
   */
  function _initSearch() {
    if (typeof SearchPalette !== 'undefined') {
      SearchPalette.init();
    }
  }

  /**
   * Externally trigger the search view
   */
  function activateSearch() {
    if (typeof SearchPalette !== 'undefined') {
      SearchPalette.show();
    }
  }

  return { init, activateSearch };
})();

window.SidebarModule = SidebarModule;
