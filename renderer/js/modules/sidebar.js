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
   * Initialize Sidebar Search logic (Revamped).
   */
  function _initSearch() {
    const mount = document.getElementById('sidebar-search-mount');
    if (!mount) return;

    if (typeof SearchComponent === 'undefined') {
      console.warn('SearchComponent not found. Search feature disabled.');
      return;
    }

    _searchBarInstance = SearchComponent.create({
      placeholder: 'Search...',
      onInput: (val) => {
        if (typeof TreeModule !== 'undefined') TreeModule.search(val.trim());
      },
      onExit: () => {
        if (typeof SidebarController !== 'undefined') {
          SidebarController.switchView(SidebarController.VIEWS.EXPLORER);
        }
        
        if (_searchBarInstance) _searchBarInstance.clear();
        if (typeof TreeModule !== 'undefined') TreeModule.search('');
        const searchResults = document.getElementById('search-results-list');
        if (searchResults) searchResults.innerHTML = '';
      }
    });

    mount.appendChild(_searchBarInstance);

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

  return { init, activateSearch };
})();

window.SidebarModule = SidebarModule;
