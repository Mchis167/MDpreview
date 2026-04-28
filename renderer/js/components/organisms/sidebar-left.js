/* global WorkspaceSwitcherComponent, WorkspaceModule, AppState, DesignSystem */
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
      EXPLORER: 'explorer'
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
    const isCollapsed = localStorage.getItem('mdpreview_sidebar_left_collapsed') === 'true';
    if (isCollapsed) {
      wrap.classList.add('sidebar-collapsed');
    }
    wrap.style.width = `${this.state.width}px`;

    // 2. Create Aside
    const aside = document.createElement('aside');
    aside.id = 'sidebar-left';
    aside.classList.add('ds-sidebar-base');
    
    aside.innerHTML = `
      <!-- Workspace Picker -->
      <div class="ds-workspace-switcher-mount" id="workspace-switcher-mount"></div>

      <!-- ── Explorer View ── -->
      <div id="sidebar-explorer-view">
        <!-- Recently Viewed Section -->
        <div id="recently-viewed-section" class="sidebar-section">
          <div id="recently-viewed-header-mount"></div>
          <div class="sidebar-section-content">
            <div class="sidebar-section-content-inner">
              <div id="recently-viewed-list"></div>
            </div>
          </div>
        </div>

        <div class="sidebar-divider"></div>

        <!-- Main Trees Container (Always fills remaining space) -->
        <div id="sidebar-main-trees">
          <!-- File Explorer Section -->
          <div id="file-explorer-section" class="sidebar-section">
            <div id="file-explorer-header-mount"></div>
            <div class="sidebar-section-content">
              <div class="sidebar-section-content-inner">
                <div id="file-tree-mount"></div>
              </div>
            </div>
          </div>

          <div class="sidebar-divider"></div>

          <!-- Hidden Items Section -->
          <div id="hidden-items-section" class="sidebar-section">
            <div id="hidden-items-header-mount"></div>
            <div class="sidebar-section-content">
              <div class="sidebar-section-content-inner">
                <div id="hidden-items-mount"></div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <!-- Footer Status -->
      <div class="sidebar-divider"></div>
      <div class="sidebar-footer" id="sidebar-footer-mount"></div>
    `;

    wrap.appendChild(aside);

    // 3. Create Resizer
    const resizer = document.createElement('div');
    resizer.className = 'sidebar-resizer';
    resizer.id = 'sidebar-resizer';
    wrap.appendChild(resizer);

    this.mount.appendChild(wrap);

    // 4. Initialize Workspace Switcher
    this._initWorkspaceSwitcher();
    this._initFooterActions();
  }

  /**
   * Initialize Footer Actions (Settings & Shortcuts)
   */
  _initFooterActions() {
    const mount = document.getElementById('sidebar-footer-mount');
    if (!mount) return;

    const settingsBtn = DesignSystem.createButton({
      label: 'Settings',
      variant: 'subtitle',
      leadingIcon: 'settings',
      onClick: () => {
        if (window.SettingsComponent) {
          window.SettingsComponent.toggle();
        }
      }
    });

    const explorerSettingsBtn = DesignSystem.createButton({
      label: 'Explorer Settings',
      variant: 'subtitle',
      leadingIcon: 'settings-2',
      offLabel: true,
      onClick: (e) => {
        if (window.ExplorerSettingsComponent) {
          window.ExplorerSettingsComponent.toggle({ anchor: e.currentTarget });
        }
      }
    });

    const shortcutsBtn = DesignSystem.createButton({
      label: 'Shortcuts',
      variant: 'subtitle',
      leadingIcon: 'keyboard',
      offLabel: true,
      onClick: () => {
        if (window.SearchPalette) {
          window.SearchPalette.show('shortcut');
        }
      }
    });

    mount.appendChild(settingsBtn);
    mount.appendChild(shortcutsBtn);
    mount.appendChild(DesignSystem.createElement('div', 'sidebar-footer-spacer'));
    mount.appendChild(explorerSettingsBtn);
  }

  /**
   * Initialize the Workspace Switcher molecule
   */
  _initWorkspaceSwitcher() {
    const mount = document.getElementById('workspace-switcher-mount');
    if (!mount) return;

    this.workspaceSwitcher = new WorkspaceSwitcherComponent({
      onClick: () => {
        if (typeof WorkspaceModule !== 'undefined') {
          WorkspaceModule.openPanel();
        }
      }
    });

    mount.appendChild(this.workspaceSwitcher.render());
    
    // Register switcher instance in AppState for global access if needed
    if (typeof AppState !== 'undefined') {
      AppState.components = AppState.components || {};
      AppState.components.workspaceSwitcher = this.workspaceSwitcher;
    }
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

    if (mdHeader) mdHeader.style.display = 'block';
    if (expView) expView.style.display = 'none';
    if (searchView) searchView.style.display = 'none';

    switch (viewName) {
      case this.VIEWS.EXPLORER:
        if (expView) expView.style.display = 'flex';
        dividers.forEach(d => d.style.display = 'block');
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
