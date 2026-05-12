/**
 * BacklinksDrawerComponent - Organism for displaying backlinks in a side drawer.
 */
/* global DesignSystem, WikiService, WikiDrawer, ScrollContainer */
(function() {
  'use strict';

  let _isVisible = false;
  let _currentPath = null;
  let _mount = null;
  let _panel = null;
  let _content = null;
  let _titleEl = null;

  const BacklinksDrawer = {
    /**
     * Initializes the drawer.
     */
    init() {
      _mount = document.getElementById('backlinks-drawer-mount');
      if (!_mount) {
        _mount = document.createElement('div');
        _mount.id = 'backlinks-drawer-mount';
        document.body.appendChild(_mount);
      }
      this._renderSkeleton();
      this._bindGlobalEvents();
    },

    /**
     * Opens the drawer and shows backlinks for the specified file.
     * @param {string} filePath - Path to the markdown file.
     */
    open(filePath) {
      if (!filePath) return;
      _currentPath = filePath;
      _isVisible = true;

      this._updateUIState();
      this._renderBacklinks();
    },

    /**
     * Closes the drawer.
     */
    close() {
      if (!_isVisible) return;
      _isVisible = false;
      this._updateUIState();
    },

    /**
     * Returns whether the drawer is currently visible.
     */
    isOpen() {
      return _isVisible;
    },

    /**
     * Toggles the drawer for the specified file.
     */
    toggle(filePath) {
      if (_isVisible && _currentPath === filePath) {
        this.close();
      } else {
        this.open(filePath);
      }
    },

    _renderSkeleton() {
      if (!_mount) return;
      _mount.innerHTML = '';
      
      const container = DesignSystem.createElement('div', 'ds-backlinks-drawer');
      
      const overlay = DesignSystem.createElement('div', 'ds-backlinks-drawer-overlay');
      overlay.onclick = () => {
        this.close();
        if (typeof WikiDrawer !== 'undefined') WikiDrawer.close();
      };
      
      _panel = DesignSystem.createElement('div', 'ds-backlinks-drawer-panel');
      
      const header = DesignSystem.createElement('div', 'ds-backlinks-drawer-header');
      _titleEl = DesignSystem.createElement('div', 'ds-backlinks-drawer-title', { text: 'Backlinks' });
      
      const actions = DesignSystem.createElement('div', 'ds-backlinks-drawer-actions');
      const closeBtn = DesignSystem.createButton({
        variant: 'subtitle',
        offLabel: true,
        leadingIcon: 'x',
        title: 'Close drawer (Esc)',
        onClick: () => this.close()
      });
      actions.appendChild(closeBtn);
      
      header.appendChild(_titleEl);
      header.appendChild(actions);
      
      _content = DesignSystem.createElement('div', 'ds-backlinks-drawer-content');
      const scrollWrap = ScrollContainer.create(_content, { 
        className: 'ds-backlinks-drawer-scroll'
      });
      
      _panel.appendChild(header);
      _panel.appendChild(scrollWrap);
      
      container.appendChild(overlay);
      container.appendChild(_panel);
      _mount.appendChild(container);
    },

    _updateUIState() {
      const container = _mount.querySelector('.ds-backlinks-drawer');
      if (container) {
        container.classList.toggle('is-open', _isVisible);
        document.body.classList.toggle('ds-has-backlinks-drawer', _isVisible);
        document.documentElement.style.setProperty('--ds-backlinks-drawer-width-current', _isVisible ? '320px' : '0px');
      }
    },

    _renderBacklinks() {
      if (!_content || !_currentPath) return;
      
      const backlinks = (typeof WikiService !== 'undefined') 
        ? WikiService.getBacklinks(_currentPath) 
        : [];

      if (backlinks.length === 0) {
        this._renderEmptyState();
        return;
      }

      const fileName = _currentPath.split('/').pop().replace(/\.md$/, '');
      if (_titleEl) _titleEl.innerText = `Backlinks for "${fileName}"`;

      _content.innerHTML = '';
      const list = DesignSystem.createElement('div', 'ds-backlinks-list');

      backlinks.forEach(link => {
        const item = DesignSystem.createElement('div', 'ds-backlinks-item');
        item.innerHTML = `
          <div class="ds-backlinks-item-title">${link.title}</div>
          <div class="ds-backlinks-item-path">${link.path}</div>
        `;
        item.onclick = () => {
          if (typeof WikiDrawer !== 'undefined') {
            WikiDrawer.open(link.path);
          }
        };
        list.appendChild(item);
      });

      _content.appendChild(list);
    },

    _renderEmptyState() {
      const fileName = _currentPath.split('/').pop().replace(/\.md$/, '');
      if (_titleEl) _titleEl.innerText = `Backlinks for "${fileName}"`;

      _content.innerHTML = `
        <div class="ds-backlinks-empty">
          <div class="ds-backlinks-empty-icon">${DesignSystem.getIcon('waypoints')}</div>
          <div class="ds-backlinks-empty-text">No backlinks found for this file.</div>
          <div class="ds-backlinks-empty-sub">This file is not referenced by any other documents in your wiki.</div>
        </div>
      `;
    },

    _bindGlobalEvents() {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && _isVisible) {
          this.close();
        }
      });

      // Handle index updates
      window.addEventListener('wiki-index-updated', () => {
        if (_isVisible) this._renderBacklinks();
      });
    }
  };

  window.BacklinksDrawer = BacklinksDrawer;
})();
