/* ══════════════════════════════════════════════════
   TabBarComponent.js — Scalable Header Organism
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class TabBarComponent {
  /**
   * @param {Object} options 
   * @param {HTMLElement} options.mount - Container element
   * @param {Function} options.onTabSwitch - Callback(path)
   * @param {Function} options.onTabClose - Callback(path)
   * @param {Function} options.onAddTab - Callback()
   * @param {Function} options.onToggleSidebar - Callback()
   * @param {Array} options.rightActions - Array of { id, icon, title, onClick, type }
   */
  constructor(options = {}) {
    this.mount = options.mount || document.getElementById('tab-bar-container');
    this.options = {
      onTabSwitch: options.onTabSwitch || (() => {}),
      onTabClose: options.onTabClose || (() => {}),
      onAddTab: options.onAddTab || (() => {}),
      onToggleSidebar: options.onToggleSidebar || (() => {}),
      rightActions: options.rightActions || []
    };

    this.state = {
      openFiles: [],
      activeFile: null
    };

    this.init();
  }

  init() {
    if (!this.mount) {
        console.warn('TabBarComponent: mount point not found.');
        return;
    }
    this.render();
  }

  /**
   * Update the internal state and re-render
   * @param {Object} newState 
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  /**
   * Main render function
   */
  render() {
    if (!this.mount) return;
    
    // Clear and set base class
    this.mount.innerHTML = '';
    this.mount.className = 'tab-bar-container';

    // ── 1. Left Section: Sidebar Toggle ──────────────────
    const toggleWrapper = document.createElement('div');
    toggleWrapper.className = 'tab-bar__sidebar-toggle-wrapper';
    toggleWrapper.innerHTML = `
      <div class="tab-bar__toggle-btn" title="Toggle Sidebar">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m9 6-6 6 6 6"/><path d="M3 12h12"/><path d="M21 19V5"/>
        </svg>
      </div>
    `;
    toggleWrapper.querySelector('.tab-bar__toggle-btn').onclick = () => this.options.onToggleSidebar();
    this.mount.appendChild(toggleWrapper);

    this.mount.appendChild(this._createDivider());

    // ── 2. Middle Section: Tab List ─────────────────────
    const tabList = document.createElement('div');
    tabList.className = 'tab-bar__list';
    this.state.openFiles.forEach(path => {
      tabList.appendChild(this._createTabItem(path));
    });
    this.mount.appendChild(tabList);

    // ── 3. Add Tab Section (Next to List) ────────────────
    const addTabWrapper = document.createElement('div');
    const draftCount = this.state.openFiles.filter(p => p && p.startsWith('__DRAFT_')).length;
    const isLimitReached = draftCount >= 20;

    addTabWrapper.className = `tab-bar__add-btn-container ${isLimitReached ? 'is-disabled' : ''}`;
    addTabWrapper.innerHTML = `
      <div class="tab-bar__add-btn" title="${isLimitReached ? '' : 'New Draft'}">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
    `;
    
    if (isLimitReached) {
      const tooltip = DesignSystem.createTooltip('Draft limit reached (max 20)');
      addTabWrapper.appendChild(tooltip);
    }

    addTabWrapper.onclick = () => {
      if (!isLimitReached) this.options.onAddTab();
    };
    this.mount.appendChild(addTabWrapper);

    // ── 4. Right Section: Action Group ──────────────────
    const actionsWrapper = document.createElement('div');
    actionsWrapper.className = 'tab-bar__actions-right';
    
    this.options.rightActions.forEach(action => {
      if (action.type === 'divider') {
        actionsWrapper.appendChild(this._createActionDivider());
      } else {
        actionsWrapper.appendChild(this._createActionBtn(action));
      }
    });
    this.mount.appendChild(actionsWrapper);
  }

  /**
   * Internal helper to create a tab item molecule
   */
  _createTabItem(path) {
    const isDraft = path && path.startsWith('__DRAFT_');
    let fileName = path.split('/').pop();
    
    if (isDraft) {
      fileName = (typeof DraftModule !== 'undefined') ? DraftModule.getDisplayName(path) : 'Draft';
    }

    const isActive = path === this.state.activeFile;

    const item = document.createElement('div');
    item.className = `tab-item ${isActive ? 'active' : ''}`;
    item.title = path;

    const dot = isDraft ? '<span class="tab-bar__draft-dot"></span>' : '';

    item.innerHTML = `
      ${dot}
      <span class="tab-bar__name">${fileName}</span>
      <div class="tab-bar__close" title="Close tab">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </div>
    `;

    item.onclick = (e) => {
        if (e.target.closest('.tab-bar__close')) return;
        this.options.onTabSwitch(path);
    };
    
    item.querySelector('.tab-bar__close').onclick = (e) => {
      e.stopPropagation();
      this.options.onTabClose(path);
    };

    return item;
  }

  /**
   * Internal helper to create an action button
   */
  _createActionBtn(action) {
    const btn = DesignSystem.createHeaderAction(action.icon, action.title || '', (e) => {
      if (e) e.stopPropagation();
      action.onClick();
    });
    return btn;
  }

  _createDivider() {
    const d = document.createElement('div');
    d.className = 'tab-bar__divider-v';
    return d;
  }

  _createActionDivider() {
    const d = document.createElement('div');
    d.className = 'tab-bar__action-divider';
    return d;
  }
}

// Export for Design System
window.TabBar = (() => {
    let instance = null;
    return {
        init: (options) => {
            if (!instance) instance = new TabBarComponent(options);
            return instance;
        },
        getInstance: () => instance
    };
})();
