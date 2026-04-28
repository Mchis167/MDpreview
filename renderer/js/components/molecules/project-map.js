/* global UIUtils, DesignSystem, AppState */
/**
 * ProjectMap Component (Molecule)
 * Purpose: Renders a high-fidelity mini-map preview using the project's official "Mirror Strategy" (SSR).
 * 
 * Logic:
 *  - Uses Server-Side Rendering (/api/render-raw) to ensure 100% fidelity.
 *  - Mirrors the layout 1:1 by matching viewer width and using transform: scale().
 *  - Synchronizes scroll position and viewport highlights with mathematical precision.
 * 
 * @global UIUtils
 */
const ProjectMap = (() => {
  'use strict';

  const SELECTORS = {
    track: '.ds-project-map__track',
    mirror: '.ds-project-map__mirror',
    viewport: '.ds-project-map__viewport',
    overlay: '.ds-project-map__overlay',
    content: '.md-content-inner'
  };

  const CONFIG = {
    updateDebounce: 600,
    baseWidth: 800
  };

  let _mainViewer = null;
  let _scale = 0.15;
  let _zoomFactor = 0.7;
  let _updateTimer = null;
  let _currentContent = '';
  let _lastRequestId = 0;
  let _abortController = null;
  let _resizeObserver = null;

  // ============================================
  // Private Functions
  // ============================================

  /**
   * Fetches rendered HTML from the server for the current content
   */
  async function _fetchRenderedHTML(content, signal) {
    try {
      const res = await fetch('/api/render-raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        signal // Attach the abort signal
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.html;
    } catch (err) {
      console.error('ProjectMap Render Error:', err);
      return null;
    }
  }

  function _updateViewportIndicator(mapEl) {
    if (!_mainViewer || !mapEl) return;

    // The scrollable area is now the body, not the root
    const body = mapEl.querySelector('.ds-project-map__body') || mapEl;
    const viewport = mapEl.querySelector(SELECTORS.viewport);
    if (!viewport) return;

    const clientHeight = _mainViewer.clientHeight;
    const scrollTop = _mainViewer.scrollTop;

    const vHeight = clientHeight * _scale;
    const vTop = scrollTop * _scale;

    viewport.style.height = `${vHeight}px`;
    viewport.style.top = `${vTop}px`;

    // Smart Auto-scroll the map panel to keep indicator centered
    // We use the parent's height (TOC body) to determine the actual visible space
    // REQUIRED BY ADR: 20260428-project-map-scroll-stabilization
    const visibleHeight = mapEl.parentElement ? mapEl.parentElement.clientHeight : mapEl.clientHeight;
    const footer = mapEl.querySelector('.ds-project-map__footer');
    const footerHeight = footer ? footer.offsetHeight : 0;
    const scrollAreaHeight = visibleHeight - footerHeight;
    
    // JS HACK: Force the root and scroll body to stay within bounds to enable scrolling
    mapEl.style.height = `${visibleHeight}px`;
    body.style.height = `${scrollAreaHeight}px`;
    body.style.overflowY = 'auto';

    const targetMapScroll = vTop - (scrollAreaHeight / 2) + (vHeight / 2);
    body.scrollTop = targetMapScroll;
  }

  /**
   * Applies current zoom and scale settings to the map DOM elements without a full re-render
   */
  function _applyZoom(mapEl) {
    const mirror = mapEl.querySelector(SELECTORS.mirror);
    const track = mapEl.querySelector(SELECTORS.track);
    const innerEl = mirror?.querySelector(SELECTORS.content);
    
    if (mirror && track && innerEl) {
      const body = mapEl.querySelector('.ds-project-map__body') || mapEl;
      const internalWidth = CONFIG.baseWidth;
      const panelWidth = Math.max(120, body.clientWidth || 280);
      
      const baseScale = Math.max(0.05, (panelWidth - 24) / internalWidth);
      _scale = baseScale * _zoomFactor;
      
      mirror.style.setProperty('--_scale', _scale);
      
      const scrollH = innerEl.scrollHeight;
      
      // Update track and mirror height. 
      // We always set it, even if 0, to ensure it doesn't get stuck at an old height.
      track.style.height = `${scrollH * _scale}px`;
      mirror.style.height = `${scrollH}px`;

      // Update Zoom Percentage Label
      const zoomLabel = mapEl.querySelector('.ds-project-map__zoom-label');
      if (zoomLabel) {
        zoomLabel.textContent = `${Math.round(_zoomFactor * 100)}%`;
      }

      // Disable buttons at limits
      const btnIn = mapEl.querySelector('.ds-project-map__btn-in');
      const btnOut = mapEl.querySelector('.ds-project-map__btn-out');
      if (btnIn) btnIn.disabled = (_zoomFactor >= 1.0);
      if (btnOut) btnOut.disabled = (_zoomFactor <= 0.2);
      
      _updateViewportIndicator(mapEl);
    }
  }

  function _handleInteraction(e, mapEl, isSmooth) {
    if (!_mainViewer) return;
    const rect = mapEl.getBoundingClientRect();
    const mapScroll = mapEl.scrollTop;
    
    // Calculate click Y relative to the start of the content (after padding)
    const paddingTop = parseInt(window.getComputedStyle(mapEl).paddingTop) || 0;
    const clickY = e.clientY - rect.top + mapScroll - paddingTop;
    
    const targetScroll = (clickY / _scale) - (_mainViewer.clientHeight / 2);
    _mainViewer.scrollTo({ top: targetScroll, behavior: isSmooth ? 'smooth' : 'auto' });
  }

  // ============================================
  // Public API
  // ============================================
  return {
    render: function(mount, viewerEl) {
      if (!mount || !viewerEl) return null;
      _mainViewer = viewerEl;

      const root = DesignSystem.createElement('div', 'ds-project-map');
      const body = DesignSystem.createElement('div', 'ds-project-map__body');
      const track = DesignSystem.createElement('div', 'ds-project-map__track');
      const mirror = DesignSystem.createElement('div', 'ds-project-map__mirror');
      const viewport = DesignSystem.createElement('div', 'ds-project-map__viewport');
      const overlay = DesignSystem.createElement('div', 'ds-project-map__overlay');

      track.appendChild(mirror);
      track.appendChild(viewport);
      track.appendChild(overlay);
      body.appendChild(track);
      root.appendChild(body);

      // Zoom Footer Bar
      const footer = DesignSystem.createElement('div', 'ds-project-map__footer');
      
      const btnOut = DesignSystem.createButton({
        leadingIcon: 'minus',
        variant: 'ghost',
        offLabel: true,
        title: 'Zoom Out',
        className: 'ds-project-map__btn-out',
        onClick: (e) => {
          e.stopPropagation();
          _zoomFactor = Math.max(0.2, _zoomFactor - 0.1);
          _applyZoom(root);
        }
      });

      const zoomLabel = DesignSystem.createElement('span', 'ds-project-map__zoom-label', { text: '70%' });
      
      const btnIn = DesignSystem.createButton({
        leadingIcon: 'plus',
        variant: 'ghost',
        offLabel: true,
        title: 'Zoom In',
        className: 'ds-project-map__btn-in',
        disabled: false, // Initial 70%
        onClick: (e) => {
          e.stopPropagation();
          _zoomFactor = Math.min(1.0, _zoomFactor + 0.1);
          _applyZoom(root);
        }
      });
      
      footer.appendChild(btnOut);
      footer.appendChild(zoomLabel);
      footer.appendChild(btnIn);
      root.appendChild(footer);

      mount.appendChild(root);

      // Interaction listeners
      let isDragging = false;
      let hasMoved = false;

      overlay.onmousedown = () => { 
        isDragging = true; 
        hasMoved = false; 
      };

      overlay.addEventListener('mousemove', (e) => { 
        if (isDragging) {
          hasMoved = true;
          _handleInteraction(e, body, false); // Interaction is relative to scroll body
        }
      });

      overlay.onclick = (e) => {
        if (!hasMoved) {
          _handleInteraction(e, body, true);
        }
      };

      window.addEventListener('mouseup', () => { 
        isDragging = false; 
      });

      // Initial load
      this.update(root, viewerEl);

      return root;
    },

    update: function(mapEl, viewerEl) {
      if (!mapEl || !viewerEl) return;
      _mainViewer = viewerEl;

      // Robust content retrieval
      let content = '';
      const viewer = window.MarkdownViewer ? window.MarkdownViewer.getInstance() : null;
      if (viewer && viewer.state) {
        content = viewer.state.content || '';
      }

      // If in edit mode, the latest content is in the textarea
      const textarea = document.getElementById('edit-textarea');
      if (textarea && viewer && viewer.state.mode === 'edit') {
        content = textarea.value;
      }

      if (_updateTimer) clearTimeout(_updateTimer);
      
      // Cancel previous fetch if still running
      if (_abortController) {
        _abortController.abort();
      }
      _abortController = new AbortController();
      const { signal } = _abortController;
      
      const requestId = ++_lastRequestId;
      
      // If content is empty or significantly different, show skeleton immediately
      if (!content || _currentContent === '') {
        const mirror = mapEl.querySelector(SELECTORS.mirror);
        if (mirror) {
          mirror.innerHTML = '';
          mirror.appendChild(UIUtils.renderSkeleton('map'));
        }
      }

      _updateTimer = setTimeout(async () => {
        // Fallback: If content is still empty, fetch it directly inside the async block
        if (!content && window.AppState && AppState.currentFile) {
          try {
            const res = await fetch(`/api/file/raw?path=${encodeURIComponent(AppState.currentFile)}`, { signal });
            if (res.ok) {
              const data = await res.json();
              content = data.content || '';
            }
          } catch (_err) { 
            if (_err.name === 'AbortError') return;
          }
        }

        // Validate again before network call
        if (requestId !== _lastRequestId) return;

        const html = await _fetchRenderedHTML(content, signal);
        
        // Final validation after network call
        if (requestId !== _lastRequestId || html === null) return;

        // Only lock the content state after a successful fetch
        _currentContent = content;

        const mirror = mapEl.querySelector(SELECTORS.mirror);
        const track = mapEl.querySelector(SELECTORS.track);

        if (mirror && track) {
          // Ensure base structure exists
          mirror.innerHTML = `<div class="md-render-body"><div class="md-content-inner">${html || ''}</div></div>`;
          
          // Sync Design Tokens (Zoom, etc.) from AppState/Global Styles
          const zoom = window.AppState?.settings?.textZoom || 100;
          mirror.style.setProperty('--preview-zoom', zoom);

          // Apply initial zoom and measurements through a shared logic
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              _applyZoom(mapEl);
            });
          });

          // Get the inner content element for post-processing
          const innerEl = mirror.querySelector(SELECTORS.content);
          if (innerEl) {
            // 1. Attach ResizeObserver for high-fidelity height sync
            if (_resizeObserver) _resizeObserver.disconnect();
            
            if (window.ResizeObserver) {
              _resizeObserver = new ResizeObserver(() => {
                requestAnimationFrame(() => _applyZoom(mapEl));
              });
              _resizeObserver.observe(innerEl);
            }

            // 2. Post-process for Mermaid/CodeBlocks
            if (html && window.processMermaid) window.processMermaid(innerEl);
            if (html && window.CodeBlockModule) window.CodeBlockModule.process(innerEl);
            
            // 3. Initial layout pass
            requestAnimationFrame(() => _applyZoom(mapEl));
          }
        }
      }, CONFIG.updateDebounce);
    },

    syncScroll: function(mapEl) {
      if (!mapEl) return;
      requestAnimationFrame(() => _updateViewportIndicator(mapEl));
    },

    destroy: function() {
      if (_updateTimer) clearTimeout(_updateTimer);
      if (_abortController) _abortController.abort();
      if (_resizeObserver) _resizeObserver.disconnect();
      _currentContent = '';
    },

    reset: function(mapEl) {
      if (_updateTimer) clearTimeout(_updateTimer);
      if (_resizeObserver) {
        _resizeObserver.disconnect();
        _resizeObserver = null;
      }
      if (_abortController) {
        _abortController.abort();
        _abortController = null;
      }
      _lastRequestId++; // Invalidate any pending timeouts
      _currentContent = '';
      if (!mapEl) return;
      const mirror = mapEl.querySelector(SELECTORS.mirror);
      const track = mapEl.querySelector(SELECTORS.track);
      if (mirror) {
        mirror.innerHTML = '';
        mirror.appendChild(UIUtils.renderSkeleton('map'));
        mirror.style.height = 'auto';
      }
      if (track) {
        track.style.height = '100%';
      }
    }
  };
})();

window.ProjectMap = ProjectMap;
