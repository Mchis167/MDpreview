/* global DesignSystem, UIUtils */
/**
 * TOCComponent — Table of Contents (Organism)
 * Purpose: Scans headings in the document and renders a navigable tree view.
 * Dependencies: DesignSystem, ScrollModule
 * 
 * @global DesignSystem, UIUtils
 */
const TOCComponent = (() => {
  'use strict';

  // ============================================
  // Private State
  // ============================================
  let _isVisible = false;
  let _currentMode = 'read';
  let _expandedState = new Set();
  let _collapsedState = new Set();
  let _tree = [];
  let _hideTimeout = null;
  let _isScanning = false;
  let _activeView = 'outline'; // 'outline' or 'map'
  let _viewSwitcher = null;
  let _lastUpdateId = 0;
  let _mapEl = null;
  const SCROLL_OFFSET = 240; // PX from top to trigger section change and scroll destination

  const SELECTORS = {
    panel: 'ds-toc-panel',
    item: 'ds-toc-item',
    btn: 'floating-toc-btn'
  };

  // ============================================
  // Private Functions
  // ============================================

  /**
   * Scans headings in the container and builds a tree structure
   */
  function _scanHeadings(container) {
    if (!container) return [];

    const headingNodes = Array.from(container.querySelectorAll('h2, h3, h4, h5, h6'));
    const flatList = headingNodes.map(node => {
      const lineEl = node.closest('.md-line');
      return {
        text: node.textContent.trim(),
        level: parseInt(node.nodeName.substring(1)),
        line: lineEl ? parseInt(lineEl.getAttribute('data-line')) : 0,
        element: node
      };
    });

    // Build hierarchy
    const tree = [];
    const stack = [];

    flatList.forEach(item => {
      const node = { ...item, children: [] };

      while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        tree.push(node);
      } else {
        stack[stack.length - 1].children.push(node);
      }

      stack.push(node);
    });

    return tree;
  }

  /**
   * Renders the empty state when no headings are found
   */
  function _renderEmpty() {
    const empty = DesignSystem.createElement('div', 'toc-empty-state');
    empty.innerHTML = `
      <div class="empty-icon">${DesignSystem.getIcon('list-tree')}</div>
      <p>No outline available</p>
      <span>This document has no H2–H6 headings to generate a Table of Contents.</span>
    `;
    return empty;
  }


  function _highlightItem(line) {
    const panel = document.getElementById(SELECTORS.panel);
    if (!panel) return;

    // Remove old active
    panel.querySelectorAll(`.${SELECTORS.item}.is-active`).forEach(el => el.classList.remove('is-active'));

    // Find matching TOC item
    const item = panel.querySelector(`.${SELECTORS.item}[data-line="${line}"]`);
    if (item) {
      item.classList.add('is-active');

      // Auto-expand parents of active item
      let parent = item.parentElement.closest(`.${SELECTORS.item}`);
      while (parent) {
        if (!parent.classList.contains('is-expanded')) {
          parent.classList.add('is-expanded');
          parent.classList.remove('is-collapsed');
          const toggle = parent.querySelector('.item-toggle');
          if (toggle) toggle.innerHTML = DesignSystem.getIcon('chevron-down');
        }
        parent = parent.parentElement.closest(`.${SELECTORS.item}`);
      }

      // Auto-scroll the TOC panel itself
      const body = panel.querySelector('.toc-body');
      if (body) {
        const itemTop = item.offsetTop;
        const bodyScroll = body.scrollTop;
        const bodyHeight = body.clientHeight;
        if (itemTop < bodyScroll || itemTop > bodyScroll + bodyHeight - 40) {
          body.scrollTo({ top: itemTop - 40, behavior: 'smooth' });
        }
      }
    }
  }

  /**
   * Renders a single tree node and its children
   */
  function _renderNode(node, _depth = 0) {
    const item = DesignSystem.createElement('div', [SELECTORS.item, `level-${node.level}`], {
      'data-line': node.line
    });

    const stateKey = `${node.level}-${node.text}`;

    if (_expandedState.has(stateKey)) {
      item.classList.add('is-expanded');
    } else if (_collapsedState.has(stateKey)) {
      item.classList.add('is-collapsed');
    } else if (node.level <= 4) {
      item.classList.add('is-expanded');
    } else {
      item.classList.add('is-collapsed');
    }

    const content = DesignSystem.createElement('div', 'item-content');

    const label = DesignSystem.createElement('span', 'item-label', { text: node.text });
    content.appendChild(label);

    if (node.children.length > 0) {
      const toggle = DesignSystem.createElement('span', 'item-toggle', {
        html: DesignSystem.getIcon('chevron-right')
      });
      toggle.onclick = (e) => {
        e.stopPropagation();
        item.classList.toggle('is-expanded');
        item.classList.toggle('is-collapsed');

        const isNowExpanded = item.classList.contains('is-expanded');
        if (isNowExpanded) {
          _expandedState.add(stateKey);
          _collapsedState.delete(stateKey);
        } else {
          _collapsedState.add(stateKey);
          _expandedState.delete(stateKey);
        }

        toggle.innerHTML = isNowExpanded
          ? DesignSystem.getIcon('chevron-down')
          : DesignSystem.getIcon('chevron-right');
      };
      content.appendChild(toggle);

      // Update toggle icon initially if expanded
      if (item.classList.contains('is-expanded')) {
        toggle.innerHTML = DesignSystem.getIcon('chevron-down');
      }
    }

    content.onclick = () => {
      if (node.element) {
        // Manual scroll to account for threshold/toolbar offset
        const container = document.querySelector('.md-viewer-viewport');
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const elementRect = node.element.getBoundingClientRect();
          const relativeTop = elementRect.top - containerRect.top;
          // Target slightly above the threshold to ensure it's active
          const targetScroll = container.scrollTop + relativeTop - (SCROLL_OFFSET - 10);
          
          container.scrollTo({ top: targetScroll, behavior: 'smooth' });
        } else {
          node.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else if (node.line && window.EditorModule) {
        window.EditorModule.focusWithContext({ line: node.line });
      }
      // On mobile or small screens, we might want to close after click
      if (window.innerWidth < 768) TOCComponent.hide();
    };

    item.appendChild(content);

    if (node.children.length > 0) {
      const childrenContainer = DesignSystem.createElement('div', 'item-children');
      node.children.forEach(child => {
        childrenContainer.appendChild(_renderNode(child, _depth + 1));
      });
      item.appendChild(childrenContainer);
    }

    return item;
  }

  /**
   * Creates the TOC panel
   */
  function _createPanel() {
    const panel = DesignSystem.createElement('div', SELECTORS.panel, { id: SELECTORS.panel });
    const header = DesignSystem.createElement('div', 'toc-header');
    
    // View Switcher
    _viewSwitcher = DesignSystem.createSegmentedControl({
      items: [
        { id: 'outline', icon: 'list-tree', title: 'Outline' },
        { id: 'map', icon: 'map', title: 'Project Map' }
      ],
      activeId: _activeView,
      onChange: (id) => {
        // Destroy observer when leaving map view
        if (_activeView === 'map' && id !== 'map' && window.ProjectMap) {
          window.ProjectMap.destroy();
        }
        _activeView = id;
        _viewSwitcher.updateActive(id);
        const title = header.querySelector('h3');
        if (title) title.textContent = id === 'outline' ? 'Table of Contents' : 'Project Map';
        TOCComponent.renderBody();
      }
    });
    header.appendChild(_viewSwitcher.el);

    const title = DesignSystem.createElement('h3', '', { 
      text: _activeView === 'outline' ? 'Table of Contents' : 'Project Map' 
    });
    header.appendChild(title);

    const spacer = DesignSystem.createElement('div', 'ds-spacer');
    header.appendChild(spacer);

    const closeBtn = new IconActionButton({
      iconName: 'x',
      title: 'Close',
      className: 'toc-close',
      onClick: () => TOCComponent.hide()
    }).render();
    header.appendChild(closeBtn);

    const body = DesignSystem.createElement('div', 'toc-body');

    panel.appendChild(header);
    panel.appendChild(body);

    // Apply Smart Scroll Mask for premium feel
    if (window.UIUtils && window.UIUtils.applySmartScrollMask) {
      window.UIUtils.applySmartScrollMask(body, { fadeHeight: 24 });
    }

    return panel;
  }

  function _renderSkeleton() {
    return UIUtils.renderSkeleton('list', 6);
  }

  // ============================================
  // Public API
  // ============================================
  return {
    init: function () {
      // Global initialization if needed
    },

    update: function (container, options = {}) {
      const updateId = ++_lastUpdateId;
      _isScanning = options.isSkeleton || false;
      const { mode = 'read' } = options;
      _currentMode = mode;

      if (updateId !== _lastUpdateId) return;

      _tree = _scanHeadings(container);

      _isScanning = false;

      // Update button state in MarkdownViewer
      const btn = document.getElementById('floating-toc-btn');
      if (btn) {
        // We keep the button enabled but the panel will show the empty state
        btn.disabled = false;
        btn.classList.remove('is-disabled');
      }

      // If visible, re-render body
      if (_isVisible) {
        this.renderBody();
      }
    },

    updateMap: function() {
      if (!_isVisible || _activeView !== 'map' || !_mapEl) return;
      const mount = document.getElementById('md-viewer-mount');
      const viewport = mount ? mount.querySelector('.md-viewer-viewport') : null;
      if (viewport && window.ProjectMap) {
        window.ProjectMap.update(_mapEl, viewport);
      }
    },

    reset: function () {
      _lastUpdateId++; // Invalidate pending updates
      _tree = [];
      _isScanning = true;
      _expandedState.clear();
      _collapsedState.clear();
      
      if (_activeView === 'map' && _mapEl && window.ProjectMap) {
        window.ProjectMap.reset(_mapEl);
      }
      
      this.renderBody();
    },

    renderBody: function () {
      const panel = document.getElementById(SELECTORS.panel);
      if (!panel) return;

      const body = panel.querySelector('.toc-body');

      // Capture current expansion states before clearing
      panel.querySelectorAll('.ds-toc-item').forEach(item => {
        const level = Array.from(item.classList).find(c => c.startsWith('level-'));
        const label = item.querySelector('.item-label');
        if (level && label) {
          const key = `${level.replace('level-', '')}-${label.textContent}`;
          if (item.classList.contains('is-expanded')) {
            _expandedState.add(key);
            _collapsedState.delete(key);
          } else {
            _collapsedState.add(key);
            _expandedState.delete(key);
          }
        }
      });

      if (_activeView === 'map') {
        body.classList.add('is-map');
        const mount = document.getElementById('md-viewer-mount');
        const viewport = mount ? mount.querySelector('.md-viewer-viewport') : null;
        // Only mirror content if scanning is finished.
        // Project Map mirrors the entire document, so we don't care about _tree.length (headings).
        if (viewport && window.ProjectMap && !_isScanning) {
          if (_mapEl && body.contains(_mapEl)) {
            window.ProjectMap.update(_mapEl, viewport);
          } else {
            body.innerHTML = '';
            _mapEl = window.ProjectMap.render(body, viewport);
          }
        }
        return;
      }

      body.classList.remove('is-map');
      body.innerHTML = '';
      _mapEl = null;

      if (_tree.length === 0) {
        if (_isScanning) {
          body.appendChild(_renderSkeleton());
        } else {
          body.appendChild(_renderEmpty());
        }
        return;
      }

      _tree.forEach(node => {
        body.appendChild(_renderNode(node));
      });
    },

    toggle: function (anchor) {
      if (_isVisible) {
        this.hide();
      } else {
        this.show(anchor);
      }
    },

    show: function (anchor) {
      if (_hideTimeout) {
        clearTimeout(_hideTimeout);
        _hideTimeout = null;
      }

      let panel = document.getElementById(SELECTORS.panel);

      // If _isVisible is true but panel is missing from DOM, it means the parent re-rendered.
      // In this case, we allow show() to proceed to re-mount the panel.
      if (_isVisible && panel) return;

      if (!panel) {
        panel = _createPanel();
        anchor.appendChild(panel);
      }

      this.renderBody();

      // Small timeout to ensure transition triggers after DOM mount
      setTimeout(() => {
        panel.classList.add('show');
        if (_viewSwitcher) _viewSwitcher.updateActive(_activeView);
        const btn = document.getElementById(SELECTORS.btn);
        if (btn) btn.classList.add('is-active');
        anchor.classList.add('has-toc');
        _isVisible = true;
      }, 20);
    },

    hide: function () {
      const panel = document.getElementById(SELECTORS.panel);
      const btn = document.getElementById(SELECTORS.btn);
      const mount = document.getElementById('md-viewer-mount');

      if (panel) panel.classList.remove('show');
      if (btn) btn.classList.remove('is-active');
      if (mount) mount.classList.remove('has-toc');

      // Disconnect live observer to free resources
      if (window.ProjectMap) window.ProjectMap.destroy();
      _mapEl = null;

      if (_hideTimeout) clearTimeout(_hideTimeout);

      _hideTimeout = setTimeout(() => {
        _isVisible = false;
        _hideTimeout = null;
        // Optional: remove from DOM to keep it clean
        if (panel && panel.parentElement) {
          panel.remove();
        }
      }, 300);
    },

    isVisible: () => _isVisible,

    updateActiveHeading: function (container) {
      if (!_isVisible) return;

      const panel = document.getElementById(SELECTORS.panel);
      if (!panel) return;

      const headings = Array.from(container.querySelectorAll('h2, h3, h4, h5, h6'));
      const containerRect = container.getBoundingClientRect();
      const threshold = SCROLL_OFFSET; 

      let activeHeading = null;

      for (const h of headings) {
        const hRect = h.getBoundingClientRect();
        const relativeTop = hRect.top - containerRect.top;

        if (relativeTop <= threshold) {
          activeHeading = h;
        } else {
          break;
        }
      }

      if (activeHeading) {
        const lineEl = activeHeading.closest('.md-line');
        const activeLine = lineEl ? parseInt(lineEl.getAttribute('data-line'), 10) : null;

        if (activeLine !== null) {
          _highlightItem(activeLine);
        }
      }

      // Sync Project Map Viewport
      if (_activeView === 'map' && _mapEl && window.ProjectMap) {
        window.ProjectMap.syncScroll(_mapEl);
      }
    }
  };
})();

// Explicit export
window.TOCComponent = TOCComponent;
