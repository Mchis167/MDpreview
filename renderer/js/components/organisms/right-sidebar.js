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
      ...this.state,
      ...config,
      isOpen: true
    };
    this.render();
  }

  close() {
    this.state.isOpen = false;
    this.mount.classList.remove('open');
  }

  render() {
    if (!this.mount) return;

    // 1. Clear and Update Wrap Classes
    this.mount.innerHTML = '';
    this.mount.className = 'ds-right-sidebar-wrap';
    if (this.state.isOpen) {
      this.mount.classList.add('open');
      const savedWidth = localStorage.getItem(this.storageKey);
      if (savedWidth) {
        this.mount.style.setProperty('--sidebar-right-width', savedWidth + 'px');
      }
    }

    // 2. Create Resizer
    const resizer = DesignSystem.createElement('div', 'ds-right-sidebar-resizer');
    this.mount.appendChild(resizer);
    this._attachResizerEvents(resizer);

    // 3. Main Sidebar Container
    const sidebar = DesignSystem.createElement('aside', 'ds-right-sidebar');
    
    // ── Header ──
    const header = DesignSystem.createElement('div', 'ds-sidebar-header');
    const title = DesignSystem.createElement('div', 'ds-sidebar-title', { text: this.state.title });
    const actions = DesignSystem.createElement('div', 'ds-sidebar-actions');
    
    this.state.actions.forEach(action => {
      const btn = DesignSystem.createHeaderAction(action.icon, action.title, (e) => {
        e.stopPropagation();
        action.onClick();
      });
      actions.appendChild(btn);
    });
    
    header.appendChild(title);
    header.appendChild(actions);
    sidebar.appendChild(header);

    // ── Content ──
    const contentWrap = DesignSystem.createElement('div', 'ds-sidebar-content-wrap');
    const list = DesignSystem.createElement('div', 'ds-sidebar-list');
    
    if (this.state.items.length === 0) {
      const empty = DesignSystem.createElement('div', 'ds-sidebar-empty');
      const isLucide = this.state.emptyState.icon && !this.state.emptyState.icon.includes('<svg');
      const iconHtml = isLucide ? `<i data-lucide="${this.state.emptyState.icon}"></i>` : this.state.emptyState.icon;
      
      empty.innerHTML = `
        ${iconHtml}
        <p>${this.state.emptyState.text}</p>
      `;
      contentWrap.appendChild(empty);
    } else {
      this.state.items.forEach((item, index) => {
        if (this.state.renderItem) {
          const itemEl = this.state.renderItem(item, index);
          list.appendChild(itemEl);
        }
      });
      contentWrap.appendChild(list);
    }
    
    sidebar.appendChild(contentWrap);
    this.mount.appendChild(sidebar);
  }

  // ── Private Helpers ──

  _setupResizer() {
    // Logic is handled in render and _attachResizerEvents
  }

  _attachResizerEvents(resizer) {
    resizer.addEventListener('mousedown', (e) => {
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
