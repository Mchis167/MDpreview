/**
 * WikiDrawerComponent - Organism for previewing wiki documents in a side drawer.
 * Reuses MarkdownPreview for consistent rendering and interaction.
 * 
 * Part of Phase 4: Side Drawer UI
 */
/* global DesignSystem, MarkdownPreview, ScrollContainer, BacklinksDrawer */
(function() {
  'use strict';

  let _isVisible = false;
  let _currentPath = null;
  let _mount = null;
  let _panel = null;
  let _content = null;
  let _titleEl = null;
  let _previewComp = null;
  let _currentWidth = localStorage.getItem('ds-wiki-drawer-width') || '500px';
  let _isResizing = false;

  const WikiDrawer = {
    /**
     * Initializes the drawer by mounting the skeleton to the DOM.
     */
    init() {
      _mount = document.getElementById('wiki-drawer-mount');
      if (!_mount) {
        // Fallback mount point if not in index.html
        _mount = document.createElement('div');
        _mount.id = 'wiki-drawer-mount';
        document.body.appendChild(_mount);
      }
      this._renderSkeleton();
      this._bindGlobalEvents();
    },

    /**
     * Opens the drawer and loads the content of the specified markdown file.
     * @param {string} filePath - Path to the markdown file relative to vault root.
     * @param {string} anchor - Optional anchor (e.g. #heading-1) to scroll to.
     */
    async open(filePath, anchor = null) {
      if (!filePath) return;
      
      // Handle path with hash if passed as a single string
      if (!anchor && filePath.includes('#')) {
        const parts = filePath.split('#');
        filePath = parts[0];
        anchor = '#' + parts[1];
      }

      // If already open with the same file, just scroll to anchor
      if (_isVisible && _currentPath === filePath) {
        if (anchor) WikiDrawer._scrollToAnchor(anchor);
        return;
      }

      _currentPath = filePath;
      _isVisible = true;

      WikiDrawer._showLoading();
      WikiDrawer._updateUIState();

      try {
        const res = await fetch(`/api/render?file=${encodeURIComponent(filePath)}`);
        if (!res.ok) throw new Error(`Failed to load wiki content: ${res.status}`);
        const data = await res.json();

        // Check if we are still opening the same file (avoid race conditions)
        if (_currentPath !== filePath) return;

        WikiDrawer._renderContent(data.html, filePath);

        // Scroll to anchor after content is rendered
        if (anchor) {
          // Delay slightly to ensure DOM is painted
          requestAnimationFrame(() => WikiDrawer._scrollToAnchor(anchor));
        }
      } catch (err) {
        console.error('[WikiDrawer] Error:', err);
        WikiDrawer._renderError(err.message);
      }
    },

    /**
     * Closes the drawer.
     */
    close() {
      if (!_isVisible) return;
      _isVisible = false;
      _currentPath = null;
      this._updateUIState();
      
      // Close BacklinksDrawer too if it's open (UX: Close all panels when tapping outside)
      if (typeof BacklinksDrawer !== 'undefined' && BacklinksDrawer.isOpen()) {
        BacklinksDrawer.close();
      }
      
      // Cleanup preview component (freeing observers/listeners)
      if (_previewComp && _previewComp.destroy) {
         try { _previewComp.destroy(); } catch(_e) { /* ignore cleanup errors */ }
      }
      _previewComp = null;
    },

    /**
     * Returns whether the drawer is currently visible.
     */
    isOpen() {
      return _isVisible;
    },

    _renderSkeleton() {
      if (!_mount) return;
      _mount.innerHTML = '';
      
      const container = DesignSystem.createElement('div', 'ds-wiki-drawer');
      
      // 1. Overlay (Transparent but with blur)
      const overlay = DesignSystem.createElement('div', 'ds-wiki-drawer-overlay');
      overlay.onclick = () => this.close();
      
      // 2. Panel (The sliding part)
      _panel = DesignSystem.createElement('div', 'ds-wiki-drawer-panel');
      
      // ── Header ──
      const header = DesignSystem.createElement('div', 'ds-wiki-drawer-header');
      _titleEl = DesignSystem.createElement('div', 'ds-wiki-drawer-title', { text: 'Wiki Preview' });
      
      const actions = DesignSystem.createElement('div', 'ds-wiki-drawer-actions');
      
      // Action: Open in Main View
      const openInTabBtn = DesignSystem.createButton({
        variant: 'subtitle',
        offLabel: true,
        leadingIcon: 'external-link',
        title: 'Open in main view',
        onClick: () => {
          if (_currentPath && window.loadFile) {
            window.loadFile(_currentPath);
            this.close();
          }
        }
      });
      
      // Action: Close
      const closeBtn = DesignSystem.createButton({
        variant: 'subtitle',
        offLabel: true,
        leadingIcon: 'x',
        title: 'Close drawer (Esc)',
        onClick: () => this.close()
      });
      
      actions.appendChild(openInTabBtn);
      actions.appendChild(closeBtn);
      
      header.appendChild(_titleEl);
      header.appendChild(actions);
      
      // ── Content area ──
      _content = DesignSystem.createElement('div', 'ds-wiki-drawer-content');
      
      const scrollWrap = ScrollContainer.create(_content, { 
        className: 'ds-wiki-drawer-scroll'
      });
      
      _panel.appendChild(header);
      _panel.appendChild(scrollWrap);
      
      // 3. Resizer (Left edge)
      const resizer = DesignSystem.createElement('div', 'ds-wiki-drawer-resizer');
      this._bindResizeEvents(resizer);
      _panel.appendChild(resizer);
      
      container.appendChild(overlay);
      container.appendChild(_panel);
      _mount.appendChild(container);
    },

    _updateUIState() {
      const container = _mount.querySelector('.ds-wiki-drawer');
      if (container) {
        container.classList.toggle('is-open', _isVisible);
        
        // Update the width variable (use pixel if resized, or default 45%)
        document.documentElement.style.setProperty('--ds-wiki-drawer-width-current', _isVisible ? _currentWidth : '0px');
      }
    },

    _showLoading() {
      if (_titleEl) _titleEl.innerText = 'Loading...';
      if (_content) _content.innerHTML = '<div class="skeleton-text" style="width: 100%; height: 200px;"></div>';
    },

    _renderContent(html, filePath) {
      if (!_content || !_titleEl) return;

      const fileName = filePath.split('/').pop().replace(/\.md$/, '');
      _titleEl.innerText = fileName;
      _content.innerHTML = '';

      // Reuse the global MarkdownPreview class
      if (typeof MarkdownPreview !== 'undefined') {
        _previewComp = new MarkdownPreview({
          mount: _content,
          html: html,
          file: filePath,
          options: {
            skipScroll: true, // Don't let the drawer affect global scroll sync
            onInternalLink: (newPath, anchor) => this.open(newPath, anchor) // Open nested links in the drawer
          }
        });
      } else {
        _content.innerHTML = html; // Fallback if component missing
      }
    },

    _renderError(message) {
      if (_titleEl) _titleEl.innerText = 'Error';
      if (_content) _content.innerHTML = `<div class="ds-error-state">${message}</div>`;
    },

    /**
     * Scrolls the drawer content to the element matching the anchor ID.
     */
    _scrollToAnchor(anchor) {
      if (!anchor || !_content) return;
      
      const id = anchor.startsWith('#') ? anchor.substring(1) : anchor;
      const decodedId = decodeURIComponent(id);
      
      
      const scrollContainer = _content.closest('.ds-scroll-container');
      if (!scrollContainer) {
        console.warn('[WikiDrawer] Scroll container not found!');
        return;
      }

      let attempts = 0;
      const maxAttempts = 20; // 20 * 100ms = 2 seconds max wait

      const performScroll = () => {
        const target = _content.querySelector(`[id="${decodedId}"], [name="${decodedId}"]`) 
                   || _content.querySelector(`[id="${id}"], [name="${id}"]`);
                   
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (attempts < maxAttempts) {
          attempts++;
          // If we haven't found it yet, but we're still in the "loading" or "rendering" window, retry
          setTimeout(performScroll, 100);
        } else {
          console.warn(`[WikiDrawer] Target element NOT found after 2s for ID: "${id}"`);
          scrollContainer.scrollTop = 0;
        }
      };

      // Start the polling
      performScroll();
    },

    _bindGlobalEvents() {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && _isVisible) {
          this.close();
        }
      });
    },

    _bindResizeEvents(resizer) {
      if (!resizer) return;

      resizer.onmousedown = (e) => {
        e.preventDefault();
        _isResizing = true;
        document.body.classList.add('is-resizing-wiki');

        const startX = e.clientX;
        const startWidth = _panel.offsetWidth;

        const onMouseMove = (moveEvent) => {
          if (!_isResizing) return;
          
          // Calculate new width: mouse moved left -> width increases
          // Since it's pinned to the right: width = window.innerWidth - currentMouseX
          const deltaX = startX - moveEvent.clientX;
          let newWidth = startWidth + deltaX;

          // Constraints
          const minWidth = 350;
          const maxWidth = window.innerWidth * 0.5;

          if (newWidth < minWidth) newWidth = minWidth;
          if (newWidth > maxWidth) newWidth = maxWidth;

          _currentWidth = `${newWidth}px`;
          this._updateUIState();
        };

        const onMouseUp = () => {
          _isResizing = false;
          document.body.classList.remove('is-resizing-wiki');
          localStorage.setItem('ds-wiki-drawer-width', _currentWidth);
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      };
    }
  };

  // Export to window
  window.WikiDrawer = WikiDrawer;
})();
