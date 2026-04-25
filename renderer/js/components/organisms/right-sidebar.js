/* ============================================================
   organisms/right-sidebar.js — Unified Right Sidebar Organism
   Atomic Design System (Organism)
   ============================================================ */

class RightSidebarComponent {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.mount - Wrapper element
   * @param {string} options.storageKey - Key for localStorage width
   */
  constructor(options = {}) {
    this.mount = options.mount || document.getElementById('right-sidebar-wrap');
    this.storageKey = options.storageKey || 'mdpreview_sidebar_right_width';

    this.state = {
      isOpen: false,
      title: '',
      actions: [], // { id, icon, title, onClick }
      items: [],
      renderItem: null, // (item, index) => HTMLElement
      emptyState: { icon: '', text: '' },
      currentModuleId: null
    };

    this.isResizing = false;
    this.init();
  }

  init() {
    if (!this.mount) {
      console.warn('RightSidebarComponent: mount point not found.');
      return;
    }
    this._setupResizer();
  }

  /**
   * Configure and render a specific module
   */
  setupModule(config) {
    this.state = {
      isOpen: true,
      title: config.title || '',
      actions: config.actions || [],
      items: config.items || [],
      renderItem: config.renderItem || null,
      emptyState: config.emptyState || { icon: '', text: '' },
      currentModuleId: config.currentModuleId || null
    };
    this.render();
  }

  close() {
    this.state.isOpen = false;
    this.mount.classList.remove('open');
  }

  render() {
    if (!this.mount) return;

    // 1. Initial setup of static structure if not present
    if (!this.mount.querySelector('.ds-right-sidebar')) {
      this.mount.innerHTML = '';
      this.mount.className = 'ds-right-sidebar-wrap';

      const resizer = DesignSystem.createElement('div', 'ds-right-sidebar-resizer');
      this.mount.appendChild(resizer);
      this._attachResizerEvents(resizer);

      const sidebar = DesignSystem.createElement('aside', 'ds-right-sidebar');
      sidebar.innerHTML = `
        <div class="ds-sidebar-header">
          <div class="ds-sidebar-title"></div>
          <div class="ds-sidebar-actions"></div>
        </div>
        <div class="ds-sidebar-content-wrap">
          <div class="ds-sidebar-list"></div>
        </div>
      `;
      this.mount.appendChild(sidebar);
    }

    const sidebarWrap = this.mount;
    const sidebar = sidebarWrap.querySelector('.ds-right-sidebar');
    const titleEl = sidebar.querySelector('.ds-sidebar-title');
    const actionsEl = sidebar.querySelector('.ds-sidebar-actions');
    const listEl = sidebar.querySelector('.ds-sidebar-list');
    const contentWrap = sidebar.querySelector('.ds-sidebar-content-wrap');

    // 2. Update Classes & Width
    sidebarWrap.classList.toggle('open', this.state.isOpen);
    if (this.state.isOpen) {
      const savedWidth = localStorage.getItem(this.storageKey);
      if (savedWidth) {
        sidebarWrap.style.setProperty('--sidebar-right-width', savedWidth + 'px');
      }
    }

    // 3. Update Header
    titleEl.textContent = this.state.title;
    actionsEl.innerHTML = '';
    this.state.actions.forEach(action => {
      const btn = DesignSystem.createHeaderAction(action.icon, action.title, (e) => {
        e.stopPropagation();
        action.onClick();
      }, action.id);
      actionsEl.appendChild(btn);
    });

    // 4. Update List Content
    listEl.innerHTML = '';
    // Clear previous empty state if any
    const existingEmpty = contentWrap.querySelector('.ds-sidebar-empty');
    if (existingEmpty) existingEmpty.remove();

    if (this.state.items.length === 0) {
      listEl.style.display = 'none';
      const empty = DesignSystem.createElement('div', 'ds-sidebar-empty');
      const iconHtml = DesignSystem.getIcon ? DesignSystem.getIcon(this.state.emptyState.icon) : this.state.emptyState.icon;

      empty.innerHTML = `
        <div class="ds-sidebar-empty-icon">${iconHtml}</div>
        <p>${this.state.emptyState.text}</p>
      `;
      contentWrap.appendChild(empty);
    } else {
      listEl.style.display = 'block';
      this.state.items.forEach((item, index) => {
        if (this.state.renderItem) {
          const itemEl = this.state.renderItem(item, index);
          listEl.appendChild(itemEl);
        }
      });
    }
  }

  // ── Private Helpers ──

  _setupResizer() {
    // Logic is handled in render and _attachResizerEvents
  }

  _attachResizerEvents(resizer) {
    resizer.addEventListener('mousedown', (_e) => {
      this.isResizing = true;
      resizer.classList.add('is-resizing');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    // We use window listeners to catch mouse move outside the sidebar
    const onMove = (e) => {
      if (!this.isResizing) return;
      const width = window.innerWidth - e.clientX;
      if (width >= 240 && width <= 600) {
        this.mount.style.setProperty('--sidebar-right-width', width + 'px');
      }
    };

    const onUp = () => {
      if (!this.isResizing) return;
      this.isResizing = false;
      resizer.classList.remove('is-resizing');
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';

      const currentWidth = parseInt(getComputedStyle(this.mount).getPropertyValue('--sidebar-right-width'));
      if (currentWidth) {
        localStorage.setItem(this.storageKey, currentWidth);
        if (typeof AppState !== 'undefined') {
          AppState.settings.rightSidebarWidth = currentWidth;
          if (AppState.savePersistentState) AppState.savePersistentState();
        }
      }

      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }
}

// Singleton bridge
window.RightSidebar = (() => {
  let instance = null;
  return {
    init: (options) => {
      if (!instance) instance = new RightSidebarComponent(options);
      return instance;
    },
    getInstance: () => instance
  };
})();
