/**
 * SidebarController.js — Centralized view management for Sidebar.
 * 
 * Refactored: Now delegates to SidebarLeft (Organism).
 */
const SidebarController = (() => {
  const VIEWS = {
    EXPLORER: 'explorer',
    SEARCH: 'search'
  };

  /**
   * Switch the active sidebar view
   * @param {string} viewName One of VIEWS
   */
  function switchView(viewName) {
    const instance = SidebarLeft.getInstance();
    if (instance) {
      instance.switchView(viewName);
    }
  }

  return {
    VIEWS,
    switchView,
    getCurrentView: () => {
      const instance = SidebarLeft.getInstance();
      return instance ? instance.state.currentView : VIEWS.EXPLORER;
    }
  };
})();

window.SidebarController = SidebarController;
