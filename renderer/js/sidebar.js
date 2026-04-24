/**
 * sidebar.js — Sidebar UI Controller and Resizer.
 * 
 * Target: Clean initialization and standardization.
 * Standard: Atomic Design V2.
 */
const SidebarModule = (() => {
  let _searchBarInstance = null;

  /**
   * Main entry point for Sidebar UI logic.
   */
  function init() {
    _initSearch();
    _initResizer();
  }

  /**
   * Initialize Sidebar Search logic (Revamped).
   * Note: No longer depends on the search button's existence at boot time.
   */
  function _initSearch() {
    const mount = document.getElementById('sidebar-search-mount');
    if (!mount) return;

    // Safety check: Ensure SearchComponent is loaded
    if (typeof SearchComponent === 'undefined') {
      console.warn('SearchComponent not found. Search feature disabled.');
      return;
    }

    // Initialize the reusable component
    _searchBarInstance = SearchComponent.create({
      placeholder: 'Search...',
      onInput: (val) => {
        if (typeof TreeModule !== 'undefined') TreeModule.search(val.trim());
      },
      onExit: () => {
        if (typeof SidebarController !== 'undefined') {
          SidebarController.switchView(SidebarController.VIEWS.EXPLORER);
        }
        
        // Clear all search data
        if (_searchBarInstance) _searchBarInstance.clear();
        if (typeof TreeModule !== 'undefined') TreeModule.search('');
        const searchResults = document.getElementById('search-results-list');
        if (searchResults) searchResults.innerHTML = '';
      }
    });

    mount.appendChild(_searchBarInstance);

    // Handle Escape key globally when search is active
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && typeof SidebarController !== 'undefined' && SidebarController.getCurrentView() === SidebarController.VIEWS.SEARCH) {
        if (_searchBarInstance) {
          const exitBtn = _searchBarInstance.querySelector('.exit-search-btn');
          if (exitBtn) exitBtn.click();
        }
      }
    });
  }

  /**
   * Externally trigger the search view
   */
  function activateSearch() {
    if (typeof SidebarController !== 'undefined') {
      SidebarController.switchView(SidebarController.VIEWS.SEARCH);
    }
    
    if (_searchBarInstance) {
      setTimeout(() => {
        _searchBarInstance.clear();
        if (typeof TreeModule !== 'undefined') TreeModule.search('');
        _searchBarInstance.focus();
      }, 50);
    }
  }

  /**
   * Initialize Sidebar Resizer (standardized).
   */
  function _initResizer() {
    const sidebar = document.getElementById('sidebar-left-wrap');
    const resizer = document.getElementById('sidebar-resizer');
    if (!sidebar || !resizer) return;

    let isResizing = false;

    // Load saved width
    const savedWidth = localStorage.getItem('mdpreview_sidebar_left_width');
    if (savedWidth) {
      sidebar.style.width = savedWidth + 'px';
    }

    resizer.addEventListener('mousedown', () => {
      isResizing = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', e => {
      if (!isResizing) return;
      const rect = sidebar.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      if (newWidth >= 256 && newWidth <= 600) {
        sidebar.style.width = `${newWidth}px`;
      }
    });

    window.addEventListener('mouseup', () => {
      if (!isResizing) return;
      isResizing = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';

      // Save width
      const currentWidth = sidebar.offsetWidth;
      localStorage.setItem('mdpreview_sidebar_left_width', currentWidth);
      if (typeof AppState !== 'undefined') {
        AppState.settings.sidebarWidth = currentWidth;
        if (AppState.savePersistentState) AppState.savePersistentState();
      }
    });
  }

  return { init, activateSearch };
})();

window.SidebarModule = SidebarModule;
