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
      onTabSwitch: options.onTabSwitch || (() => { }),
      onTabClose: options.onTabClose || (() => { }),
      onAddTab: options.onAddTab || (() => { }),
      onToggleSidebar: options.onToggleSidebar || (() => { }),
      onCloseOthers: options.onCloseOthers || (() => { }),
      onCloseAll: options.onCloseAll || (() => { }),
      onCloseSelected: options.onCloseSelected || (() => { }),
      onPinTab: options.onPinTab || (() => { }),
      onUnpinTab: options.onUnpinTab || (() => { }),
      rightActions: options.rightActions || []
    };

    this.state = {
      openFiles: [],
      pinnedFiles: [],
      dirtyFiles: [],
      activeFile: null,
      selectedFiles: []
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
      <div class="ds-header-action" title="Toggle Sidebar" id="sidebar-toggle-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m9 6-6 6 6 6"/><path d="M3 12h12"/><path d="M21 19V5"/>
        </svg>
      </div>
    `;
    toggleWrapper.querySelector('#sidebar-toggle-btn').onclick = () => this.options.onToggleSidebar();
    this.mount.appendChild(toggleWrapper);

    this.mount.appendChild(this._createDivider());

    // ── 2. Middle Section: Tab List ─────────────────────
    const tabList = document.createElement('div');
    tabList.className = 'tab-bar__list';

    // Separate pinned and unpinned tabs, maintaining pin order
    const pinned = this.state.pinnedFiles.filter(f => this.state.openFiles.includes(f));
    const unpinned = this.state.openFiles.filter(f => !this.state.pinnedFiles.includes(f));
    const displayOrder = [...pinned, ...unpinned];

    displayOrder.forEach(path => {
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

    // Ensure active tab is visible
    requestAnimationFrame(() => this._scrollToActive());
  }

  /**
   * Scroll the active tab into view if it's overflowing
   */
  _scrollToActive() {
    const list = this.mount.querySelector('.tab-bar__list');
    const active = this.mount.querySelector('.tab-item.active');
    if (!list || !active) return;

    active.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    });
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
    const isSelected = this.state.selectedFiles.includes(path);
    const isPinned = this.state.pinnedFiles.includes(path);
    const isDirty = this.state.dirtyFiles.includes(path);

    const item = document.createElement('div');
    item.className = `tab-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''} ${isPinned ? 'is-pinned' : ''} ${isDirty ? 'is-dirty' : ''}`;
    item.setAttribute('data-path', path);

    const dot = isDraft ? '<span class="tab-bar__draft-dot"></span>' : '';
    const dirtyDot = (isDirty && !isDraft) ? '<span class="tab-bar__dirty-dot"></span>' : '';
    const pinIconHtml = isPinned ? `<div class="tab-bar__pin-icon">${DesignSystem.getIcon('pin')}</div>` : '';

    let displayLabel = fileName;
    if (!isDraft && displayLabel.toLowerCase().endsWith('.md')) {
      displayLabel = displayLabel.substring(0, displayLabel.length - 3);
    }

    item.innerHTML = `
      ${dot}
      ${dirtyDot}
      ${pinIconHtml}
      <span class="tab-bar__name">${displayLabel}</span>
      <div class="tab-bar__close" title="Close tab">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </div>
    `;

    item.onmousedown = (e) => {
      // Middle click to close
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        this.options.onTabClose(path);
        return;
      }

      if (e.button !== 0) return; // Left click only for drag
      if (e.target.closest('.tab-bar__close')) return;
      this._initTabDrag(e, item, path);
    };

    item.onclick = (e) => {
      if (e.target.closest('.tab-bar__close')) return;
      this.options.onTabSwitch(path, {
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        altKey: e.altKey
      });
    };

    item.ondblclick = (e) => {
      e.preventDefault();
      const isPinned = this.state.pinnedFiles.includes(path);
      if (isPinned) {
        this.options.onUnpinTab(path);
      } else {
        this.options.onPinTab(path);
      }
    };

    item.oncontextmenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._showContextMenu(e, path);
    };

    item.querySelector('.tab-bar__close').onclick = (e) => {
      e.stopPropagation();
      this.options.onTabClose(path);
    };

    return item;
  }

  /**
   * VIP Drag & Drop Engine for Tabs (Horizontal)
   */
  _initTabDrag(e, itemEl, _path) {
    const tabList = itemEl.closest('.tab-bar__list');
    if (!tabList) return;

    const rect = itemEl.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const itemWidth = rect.width;
    const siblings = Array.from(tabList.querySelectorAll('.tab-item'));
    const itemIdx = siblings.indexOf(itemEl);

    let currentIdx = itemIdx;
    let dragProxy = null;
    let isDraggingStarted = false;
    let animationFrameId = null;
    let currentX = e.clientX;
    let currentY = e.clientY;
    const isPinnedDrag = itemEl.classList.contains('is-pinned');

    // Pre-calculate sibling centers
    const sibCenters = siblings.map(sib => {
      const r = sib.getBoundingClientRect();
      return r.left + r.width / 2;
    });

    const updateUI = () => {
      if (!dragProxy) return;

      const deltaX = currentX - startX;
      dragProxy.style.transform = `translate(${deltaX}px, 0px) scale(0.9)`;

      let newIdx = itemIdx;
      let minDist = Infinity;
      sibCenters.forEach((center, i) => {
        // TC: Restrict dragging to same group (Pinned vs Unpinned)
        const targetIsPinned = siblings[i].classList.contains('is-pinned');
        if (targetIsPinned !== isPinnedDrag) return;

        const dist = Math.abs(currentX - center);
        if (dist < minDist) {
          minDist = dist;
          newIdx = i;
        }
      });

      siblings.forEach((sib, idx) => {
        if (sib === itemEl) return;
        
        // TC: Only animate siblings in the same group
        const sibIsPinned = sib.classList.contains('is-pinned');
        if (sibIsPinned !== isPinnedDrag) {
          sib.style.transform = '';
          return;
        }

        if (idx > itemIdx && idx <= newIdx) {
          sib.style.transform = `translateX(-${itemWidth}px)`;
        } else if (idx < itemIdx && idx >= newIdx) {
          sib.style.transform = `translateX(${itemWidth}px)`;
        } else {
          sib.style.transform = '';
        }
      });

      currentIdx = newIdx;

      // Auto-scroll logic
      const listRect = tabList.getBoundingClientRect();
      const threshold = 50;
      if (currentX < listRect.left + threshold) tabList.scrollLeft -= 5;
      if (currentX > listRect.right - threshold) tabList.scrollLeft += 5;

      animationFrameId = requestAnimationFrame(updateUI);
    };

    const onMouseMove = (moveEvent) => {
      currentX = moveEvent.clientX;
      currentY = moveEvent.clientY;
      const dist = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));

      if (!isDraggingStarted && dist > 5) {
        isDraggingStarted = true;

        // Create Proxy
        const originalStyle = window.getComputedStyle(itemEl);
        dragProxy = itemEl.cloneNode(true);
        dragProxy.classList.add('is-dragging-vip');
        dragProxy.style.width = `${rect.width}px`;
        dragProxy.style.height = `${rect.height}px`;
        dragProxy.style.left = `${rect.left}px`;
        dragProxy.style.top = `${rect.top}px`;
        dragProxy.style.background = originalStyle.backgroundColor !== 'rgba(0, 0, 0, 0)'
          ? originalStyle.backgroundColor
          : 'rgba(255, 255, 255, 0.08)';

        document.body.appendChild(dragProxy);
        itemEl.classList.add('tab-item-placeholder');
        tabList.classList.add('is-dragging-active');
        animationFrameId = requestAnimationFrame(updateUI);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      if (!isDraggingStarted) return;

      if (dragProxy) {
        // Snap proxy to final position
        dragProxy.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        const targetCenter = sibCenters[currentIdx];
        const finalX = targetCenter - (rect.left + rect.width / 2);
        dragProxy.style.transform = `translateX(${finalX}px) scale(1)`;

        setTimeout(() => {
          // Perform surgical DOM move
          tabList.classList.add('is-handing-off');

          if (currentIdx !== itemIdx) {
            const target = siblings[currentIdx];
            if (currentIdx < itemIdx) {
              tabList.insertBefore(itemEl, target);
            } else {
              tabList.insertBefore(itemEl, target.nextSibling);
            }
            // Update state in TabsModule
            if (typeof TabsModule !== 'undefined') {
              TabsModule.reorder(itemIdx, currentIdx);
            }
          }

          itemEl.classList.remove('tab-item-placeholder');
          tabList.classList.remove('is-dragging-active');
          siblings.forEach(s => s.style.transform = '');

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              tabList.classList.remove('is-handing-off');
              if (dragProxy) {
                dragProxy.style.opacity = '0';
                setTimeout(() => {
                  if (dragProxy) dragProxy.remove();
                  dragProxy = null;
                }, 200);
              }
            });
          });
        }, 200);
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * Custom context menu for tabs
   */
  _showContextMenu(e, path) {
    const isPinned = this.state.pinnedFiles.includes(path);
    const items = [
      { label: isPinned ? 'Unpin Tab' : 'Pin Tab', icon: isPinned ? 'pin-off' : 'pin', onClick: () => isPinned ? this.options.onUnpinTab(path) : this.options.onPinTab(path) },
      { divider: true },
      { label: 'Close Tab', icon: 'x', shortcut: '⌘W', onClick: () => this.options.onTabClose(path) },
      { label: 'Close Others', icon: 'minus', onClick: () => this.options.onCloseOthers(path) },
      { label: 'Close All', icon: 'layers', onClick: () => this.options.onCloseAll() }
    ];

    // Only show "Close Selected" if more than 1 selected
    if (this.state.selectedFiles.length > 1) {
      items.push({ divider: true });
      items.push({ 
        label: `Close Selected (${this.state.selectedFiles.length})`, 
        icon: 'check-square', 
        onClick: () => this.options.onCloseSelected() 
      });
    }

    DesignSystem.createContextMenu(e, items);
  }


  /**
   * Internal helper to create an action button
   */
  _createActionBtn(action) {
    const btn = DesignSystem.createHeaderAction(action.icon, action.title || '', (e) => {
      if (e) e.stopPropagation();
      if (typeof action.onClick === 'function') {
        action.onClick();
      }
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
