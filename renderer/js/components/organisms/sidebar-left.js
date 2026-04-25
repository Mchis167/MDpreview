/* ══════════════════════════════════════════════════
   SidebarLeftComponent.js — Navigation Organism
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class SidebarLeftComponent {
  /**
   * @param {Object} options 
   * @param {HTMLElement} options.mount - Mounting point
   */
  constructor(options = {}) {
    this.mount = options.mount || document.getElementById('sidebar-left-mount');
    
    this.VIEWS = {
      EXPLORER: 'explorer',
      SEARCH: 'search'
    };

    this.state = {
      currentView: this.VIEWS.EXPLORER,
      width: 256
    };

    this.isResizing = false;
    this.init();
  }

  init() {
    if (!this.mount) {
      console.warn('SidebarLeftComponent: mount point not found.');
      return;
    }
    
    // Load saved width
    const savedWidth = localStorage.getItem('mdpreview_sidebar_left_width');
    if (savedWidth) {
      this.state.width = parseInt(savedWidth);
    }

    this.render();
    this._initResizer();
  }

  /**
   * Main render function - Creates the entire shell
   */
  render() {
    this.mount.innerHTML = '';
    this.mount.className = 'sidebar-left-container';

    // 1. Create Wrapper
    const wrap = document.createElement('div');
    wrap.id = 'sidebar-left-wrap';
    wrap.style.width = `${this.state.width}px`;

    // 2. Create Aside
    const aside = document.createElement('aside');
    aside.id = 'sidebar-left';
    
    aside.innerHTML = `
      <!-- Workspace Picker -->
      <div class="workspace-picker" id="sidebar-md-header">
        <div id="workspace-switcher-outer">
          <button id="workspace-switcher">
            <div class="ws-info">
              <span class="ws-label">WORKSPACE</span>
              <div id="workspace-name" class="skeleton skeleton-text" style="width: 80px; margin-top: 4px;"></div>
            </div>
            <svg class="ws-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      <!-- ── Explorer View ── -->
      <div id="sidebar-explorer-view">
        <!-- Recently Viewed Section -->
        <div id="recently-viewed-section" class="sidebar-section">
          <div id="recently-viewed-header-mount"></div>
          <div id="recently-viewed-list"></div>
        </div>

        <div class="sidebar-divider"></div>

        <!-- File Explorer Section -->
        <div id="file-explorer-section" class="sidebar-section">
          <div id="file-explorer-header-mount"></div>
          <div class="sidebar-tree-scroll">
            <div id="file-tree"></div>
          </div>
        </div>
      </div>

      <!-- ── Search View ── -->
      <div id="sidebar-search-view" style="display:none">
        <div class="sidebar-search-container" id="sidebar-search-mount"></div>
        <div id="search-results-section" class="sidebar-section">
          <div id="search-results-header-mount"></div>
          <div id="search-results-list" class="sidebar-tree-scroll"></div>
        </div>
      </div>

      <!-- Footer Status -->
      <div class="sidebar-footer">
        <div class="hot-reload-badge" id="markdown-footer">
          <div class="hr-badge-left">
            <span class="hr-badge-label">Hot Reload Active</span>
          </div>
          <div class="hr-badge-bars">
            <div class="bar bar-1"></div>
            <div class="bar bar-2"></div>
            <div class="bar bar-3"></div>
          </div>
        </div>
      </div>
    `;

    wrap.appendChild(aside);

    // 3. Create Resizer
    const resizer = document.createElement('div');
    resizer.className = 'sidebar-resizer';
    resizer.id = 'sidebar-resizer';
    wrap.appendChild(resizer);

    this.mount.appendChild(wrap);
  }

  /**
   * Switch the active sidebar view (Replaces SidebarController logic)
   * @param {string} viewName 
   */
  switchView(viewName) {
    const mdHeader = document.getElementById('sidebar-md-header');
    const expView = document.getElementById('sidebar-explorer-view');
    const searchView = document.getElementById('sidebar-search-view');
    const dividers = this.mount.querySelectorAll('.sidebar-divider');

    if (mdHeader) mdHeader.style.display = 'flex';
    if (expView) expView.style.display = 'none';
    if (searchView) searchView.style.display = 'none';

    switch (viewName) {
      case this.VIEWS.EXPLORER:
        if (expView) expView.style.display = 'flex';
        dividers.forEach(d => d.style.display = 'block');
        break;
      case this.VIEWS.SEARCH:
        if (mdHeader) mdHeader.style.display = 'none';
        if (searchView) searchView.style.display = 'flex';
        dividers.forEach(d => d.style.display = 'none');
        break;
    }
    this.state.currentView = viewName;
  }

  /**
   * Initialize Resizer logic (Replaces SidebarModule logic)
   */
  _initResizer() {
    const wrap = document.getElementById('sidebar-left-wrap');
    const resizer = document.getElementById('sidebar-resizer');
    if (!wrap || !resizer) return;

    resizer.addEventListener('mousedown', () => {
      this.isResizing = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      resizer.classList.add('is-resizing');
    });

    window.addEventListener('mousemove', e => {
      if (!this.isResizing) return;
      const rect = wrap.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      if (newWidth >= 256 && newWidth <= 600) {
        wrap.style.width = `${newWidth}px`;
        this.state.width = newWidth;
      }
    });

    window.addEventListener('mouseup', () => {
      if (!this.isResizing) return;
      this.isResizing = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      resizer.classList.remove('is-resizing');

      // Save width
      localStorage.setItem('mdpreview_sidebar_left_width', this.state.width);
      if (typeof AppState !== 'undefined') {
        AppState.settings.sidebarWidth = this.state.width;
        if (AppState.savePersistentState) AppState.savePersistentState();
      }
    });
  }
}

// Singleton Bridge
window.SidebarLeft = (() => {
  let instance = null;
  return {
    init: (options) => {
      if (!instance) instance = new SidebarLeftComponent(options);
      return instance;
    },
    getInstance: () => instance
  };
})();
