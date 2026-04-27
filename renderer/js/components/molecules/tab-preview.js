/**
 * TabPreview Component (Molecules)
 * Purpose: Provides a debounced hover preview of tab content with scroll awareness.
 * Dependencies: DesignSystem, ScrollModule, TabsModule, DraftModule
 */
const TabPreview = (() => {
  'use strict';

  const SELECTORS = {
    tab: '.tab-item',
    preview: '.ds-tab-preview'
  };

  const CONFIG = {
    debounceTime: 300,
    width: 352,
    height: 272,
    scale: 0.38, // Matched to user's manual CSS update (304/800)
    windowSize: 2000, // Optimized window for performance vs layout accuracy
    cacheTTL: 60000 // 1 minute
  };

  let _previewEl = null;
  let _hoverTimer = null;
  let _activePath = null;
  const _renderCache = new Map(); // path -> { html, timestamp, scrollTop }

  // ============================================
  // Private Functions
  // ============================================

  function _createPreviewElement() {
    if (_previewEl) return _previewEl;

    _previewEl = DesignSystem.createElement('div', 'ds-tab-preview');
    _previewEl.innerHTML = `
      <div class="ds-tab-preview__content-wrapper">
        <div class="ds-tab-preview__mirror">
          <div class="ds-tab-preview__content md-render-body">
            <div class="md-content-inner"></div>
          </div>
        </div>
        <div class="ds-tab-preview__mask"></div>
      </div>
      <div class="ds-tab-preview__footer">
        <div class="ds-tab-preview__filename"></div>
        <div class="ds-tab-preview__stats"></div>
      </div>
    `;

    document.body.appendChild(_previewEl);
    return _previewEl;
  }

  async function _showPreview(path, targetRect) {
    _activePath = path;
    const preview = _createPreviewElement();

    // 1. Position it below the tab
    const x = Math.max(10, Math.min(window.innerWidth - CONFIG.width - 10, targetRect.left + (targetRect.width / 2) - (CONFIG.width / 2)));
    const y = targetRect.bottom + 8;

    preview.style.left = `${x}px`;
    preview.style.top = `${y}px`;

    // 3. Show loading state
    const mirror = preview.querySelector('.ds-tab-preview__mirror');
    const contentEl = preview.querySelector('.md-content-inner');
    const filenameEl = preview.querySelector('.ds-tab-preview__filename');
    const statsEl = preview.querySelector('.ds-tab-preview__stats');
    
    contentEl.innerHTML = '<div class="skeleton-text" style="height: 100px; opacity: 0.5;"></div>';
    filenameEl.textContent = path.split('/').pop();
    statsEl.textContent = 'Loading stats...';
    
    if (mirror) mirror.scrollTop = 0;
    preview.classList.add('ds-tab-preview--visible');

    // Fetch Metadata in parallel
    _fetchMetadata(path).then(meta => {
      if (_activePath !== path) return;
      if (meta) {
        filenameEl.textContent = meta.name;
        statsEl.textContent = `Last edited: ${meta.relativeTime}`;
      } else {
        statsEl.textContent = '';
      }
    });

    try {
      // 4. Get content slice and scroll info
      const rawData = await _getContentSlice(path);
      if (_activePath !== path) return;

      // 5. Check Cache first
      const cached = _renderCache.get(path);
      const isCacheValid = cached && (Date.now() - cached.timestamp < CONFIG.cacheTTL) && (cached.scrollTop === rawData.scrollTop);
      
      let html = '';
      if (isCacheValid) {
        html = cached.html;
      } else {
        html = await _renderSlice(rawData.content);
        if (_activePath !== path) return;
        
        // Update cache
        _renderCache.set(path, {
          html,
          timestamp: Date.now(),
          scrollTop: rawData.scrollTop
        });
      }

      contentEl.innerHTML = html;
      
      // 6. Perfect Scroll Sync via Mirror Viewport
      const viewer = document.getElementById('md-viewer-mount');
      const viewerHeight = viewer ? viewer.clientHeight : 600;
      
      const mirror = preview.querySelector('.ds-tab-preview__mirror');
      if (mirror) {
        // MATCH HEIGHT to ensure identical scroll range
        mirror.style.height = `${viewerHeight}px`;

        // Calculate the actual offset if we are using a slice
        const zoom = window.AppState?.settings?.textZoom || 100;
        const lineHeight = 27 * (zoom / 100);
        const scrollOffset = rawData.scrollTop - (rawData.startLine * lineHeight);
        
        // Use requestAnimationFrame to ensure DOM layout is updated before scrolling
        requestAnimationFrame(() => {
          mirror.scrollTop = scrollOffset;
        });
      }

      // 7. Mermaid/CodeBlock processing if needed
      if (window.processMermaid) window.processMermaid(contentEl);
      if (window.CodeBlockModule) window.CodeBlockModule.process(contentEl);

    } catch (err) {
      console.error('TabPreview error:', err);
      contentEl.innerHTML = '<div style="padding: 20px; font-size: 11px; opacity: 0.5;">Preview unavailable</div>';
    }
  }

  async function _getContentSlice(path) {
    let fullContent = '';
    
    // Check DraftModule first
    if (path.startsWith('__DRAFT_') && window.DraftModule) {
      fullContent = window.DraftModule.getDraftContent(path);
    } else {
      // Fetch from API
      try {
        const res = await fetch(`/api/file/raw?path=${encodeURIComponent(path)}`);
        if (res.ok) {
          fullContent = await res.text();
        }
      } catch (_e) { /* fallback to empty */ }
    }

    if (!fullContent) return { content: '', startLine: 0, scrollTop: 0 };

    // Get scroll position
    const positions = JSON.parse(localStorage.getItem('md-scroll-positions') || '{}');
    const wsId = window.AppState?.currentWorkspace?.id;
    const scrollKey = wsId ? `${wsId}:${path}` : path;
    const scrollTop = positions[scrollKey] || 0;

    // For absolute accuracy, we render the full content for most files.
    // Slicing is only a fallback for extremely large files (> 10000 lines).
    const lines = fullContent.split('\n');
    const isHuge = lines.length > CONFIG.windowSize;
    
    let content = fullContent;
    let startLine = 0;

    if (isHuge) {
      const zoom = window.AppState?.settings?.textZoom || 100;
      const lineHeight = 27 * (zoom / 100);
      const approxLineIndex = Math.max(0, Math.floor((scrollTop - 160) / lineHeight));
      // Buffer of 1000 lines before/after for layout stability
      startLine = Math.max(0, approxLineIndex - 1000);
      content = lines.slice(startLine, startLine + CONFIG.windowSize).join('\n');
    }
    
    return {
      content,
      startLine,
      scrollTop
    };
  }

  async function _renderSlice(content) {
    const res = await fetch('/api/render-raw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (!res.ok) throw new Error('Render failed');
    const data = await res.json();
    return data.html;
  }

  async function _fetchMetadata(path) {
    if (path.startsWith('__DRAFT_')) return null;
    try {
      const res = await fetch(`/api/file/meta?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const meta = await res.json();
        return {
          ...meta,
          relativeTime: _getRelativeTime(meta.mtime)
        };
      }
    } catch (_e) { }
    return null;
  }

  function _getRelativeTime(mtime) {
    const now = Date.now();
    const diff = now - mtime;
    const sec = Math.floor(diff / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const days = Math.floor(hr / 24);

    if (sec < 60) return 'Just now';
    if (min < 60) return `${min}m ago`;
    if (hr < 24) return `${hr}h ago`;
    return `${days}d ago`;
  }

  function _hidePreview() {
    _activePath = null;
    if (_previewEl) {
      _previewEl.classList.remove('ds-tab-preview--visible');
    }
  }

  // ============================================
  // Public API
  // ============================================
  return {
    init: function() {
      // Listen for tab hover events (delegated)
      document.addEventListener('mouseover', (e) => {
        const tabItem = e.target.closest(SELECTORS.tab);
        const inPreview = e.target.closest(SELECTORS.preview);

        if (tabItem) {
          // Do not show preview for the active tab (already visible)
          if (tabItem.classList.contains('active')) {
            _hidePreview();
            if (_hoverTimer) clearTimeout(_hoverTimer);
            return;
          }

          const path = tabItem.getAttribute('data-path');
          if (!path) return;

          if (path === _activePath) {
            clearTimeout(_hoverTimer); // Stay open
            return;
          }

          clearTimeout(_hoverTimer);
          _hoverTimer = setTimeout(() => {
            _showPreview(path, tabItem.getBoundingClientRect());
          }, CONFIG.debounceTime);
        } else if (inPreview) {
          clearTimeout(_hoverTimer); // Stay open if mouse moves into the preview box
        } else {
          // Leaving tab area
          if (_hoverTimer) clearTimeout(_hoverTimer);
          _hoverTimer = setTimeout(() => {
            _hidePreview();
          }, 150);
        }
      });
    },

    hide: function() {
      _hidePreview();
    }
  };
})();

// Explicit export to global scope
window.TabPreview = TabPreview;
