/**
 * SidebarController.js — Centralized view management for Sidebar.
 * 
 * Handles switching between Explorer and Search views.
 */
const SidebarController = (() => {
  const VIEWS = {
    EXPLORER: 'explorer',
    SEARCH: 'search'
  };

  let currentView = VIEWS.EXPLORER;

  /**
   * Switch the active sidebar view
   * @param {string} viewName One of VIEWS
   */
  function switchView(viewName) {
    const mdHeader = document.getElementById('sidebar-md-header');
    const expView = document.getElementById('sidebar-explorer-view');
    const searchView = document.getElementById('sidebar-search-view');

    // Default: Show header, hide views
    if (mdHeader) mdHeader.style.display = 'flex';
    if (expView) expView.style.display = 'none';
    if (searchView) searchView.style.display = 'none';

    // Show target
    switch (viewName) {
      case VIEWS.EXPLORER:
        if (expView) expView.style.display = 'flex';
        _toggleDividers(true);
        break;
      case VIEWS.SEARCH:
        if (mdHeader) mdHeader.style.display = 'none'; // Hide picker as requested
        if (searchView) searchView.style.display = 'flex';
        _toggleDividers(false); // Hide dividers for a clean search layout
        break;
    }
    currentView = viewName;
  }

  /**
   * Helper to toggle dividers
   */
  function _toggleDividers(visible) {
    document.querySelectorAll('.sidebar-divider').forEach(d => {
      d.style.display = visible ? 'block' : 'none';
    });
  }

  return {
    VIEWS,
    switchView,
    getCurrentView: () => currentView
  };
})();

window.SidebarController = SidebarController;
