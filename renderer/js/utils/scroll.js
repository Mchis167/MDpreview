/**
 * ScrollModule — Persists and restores scroll positions for files
 */
const ScrollModule = (() => {
  const STORAGE_KEY = 'md-scroll-positions';
  let positions = {};

  let scrollContainer = null;

  function init() {
    // Load from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        positions = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load scroll positions', e);
    }
    
    // Save on app close
    window.addEventListener('beforeunload', () => {
      const ws = AppState.currentWorkspace;
      if (AppState.currentFile && ws && scrollContainer) {
        const key = `${ws.id}:${AppState.currentFile}`;
        positions[key] = scrollContainer.scrollTop;
        _persist();
      }
    });
  }

  /**
   * Set the element to watch for scroll events
   * @param {HTMLElement} el 
   */

  let activeFileInContainer = null;

  function setContainer(el, filePath) {
    scrollContainer = el;
    activeFileInContainer = filePath;

    if (!el) return;

    // Use a robust way to ensure only one listener exists
    if (!el._scrollListenerAttached) {
      el.addEventListener('scroll', _debounce(() => {
        const ws = AppState.currentWorkspace;
        const currentFile = activeFileInContainer;

        // Guard: Only save if this file is actually the one supposed to be active
        if (currentFile !== AppState.currentFile) return;

        if (currentFile && ws && el && !window._isMDViewerRendering && !window._isGlobalSyncing && !window._suppressScrollSync) {
          const currentScroll = el.scrollTop;
          const key = `${ws.id}:${currentFile}`;

          if (currentScroll === 0 && positions[key] > 0) {
             if (window._isMDViewerRendering) {
               return;
             }
             if (el.scrollHeight > 0 && el.scrollHeight <= el.clientHeight) {
               return;
             }
          }

          if (currentScroll > 0 || positions[key] !== undefined) {
             positions[key] = currentScroll;
             _persist();
          }
        }
      }, 150));
      el._scrollListenerAttached = true;
    }

    _enableSmoothWheel(el);
  }

  /**
   * Manually save current scroll position for a specific file
   */
  function save(filePath) {
    const ws = AppState.currentWorkspace;
    const container = scrollContainer || document.getElementById('md-viewer-mount');
    
    if (container && filePath && ws) {
      // VISIBILITY GUARD: If element is hidden (offsetParent null), it returns scrollTop 0.
      // We MUST NOT save in this state as it overwrites good data.
      if (container.offsetParent === null && container.tagName !== 'BODY') {
        return;
      }

      const currentScroll = container.scrollTop;
      const key = `${ws.id}:${filePath}`;
      
      // SMART GUARD: If current is 0, but we have a saved position > 0, 
      // and we are currently in a rendering/transition state, PROTECT the saved value.
      if (currentScroll === 0 && positions[key] > 0) {
        if (window._isMDViewerRendering) {
          return;
        }
        
        if (container.scrollHeight > 0 && container.scrollHeight <= container.clientHeight) {
           return;
        }
      }

      positions[key] = currentScroll;
      _persist();
    }
  }

  /**
   * Restore scroll position for a file
   */
  function restore(filePath) {
    const ws = AppState.currentWorkspace;
    const container = scrollContainer || document.getElementById('md-viewer-mount');
    
    if (!container || !ws || !filePath) return;
    
    const key = `${ws.id}:${filePath}`;
    const pos = positions[key];
    
    if (pos !== undefined && pos > 0) {
      if (container._scrollObserver) {
        container._scrollObserver.disconnect();
      }

      let attempts = 0;
      const maxAttempts = 15;
      
      const tryScroll = () => {
        if (!container) return true;
        const canScrollToTarget = container.scrollHeight >= pos + container.clientHeight - 5;

        if (canScrollToTarget || attempts >= maxAttempts) {
          container.scrollTop = pos;
          if (container._scrollObserver) {
            container._scrollObserver.disconnect();
            container._scrollObserver = null;
          }
          return true;
        }
        attempts++;
        return false;
      };

      if (tryScroll()) return;

      container._scrollObserver = new ResizeObserver(() => {
        if (tryScroll()) return;
      });
      container._scrollObserver.observe(container);

      const fallback = () => {
         if (!tryScroll() && attempts < maxAttempts) {
           requestAnimationFrame(fallback);
         }
      };
      requestAnimationFrame(fallback);
    } else {
      if (container) container.scrollTop = 0;
    }
  }

  /**
   * Enables smooth wheel physics for the preview viewport.
   * Intercepts con lăn chuột ticks, but delegates natural smooth trackpad swipes.
   */
  function _enableSmoothWheel(el) {
    if (!el || !el.classList.contains('md-viewer-viewport')) return;
    if (el._smoothWheelAttached) return;

    let targetScrollTop = el.scrollTop;
    let isAnimating = false;
    const friction = 0.18;

    el.addEventListener('wheel', (e) => {
      // 💡 Only intercept con lăn chuột vật lý (integer deltaY)
      // Keep trackpad natural swipes (fractional deltaY) untouched
      if (Math.abs(e.deltaY) % 1 !== 0) {
        targetScrollTop = el.scrollTop;
        return;
      }

      e.preventDefault();

      // Sync targetScrollTop nếu animation đã dừng (e.g. sau file switch + restore)
      if (!isAnimating) {
        targetScrollTop = el.scrollTop;
      }

      // Temporarily suppress scroll sync during active inertia phase to avoid jank
      window._suppressScrollSync = true;

      targetScrollTop += e.deltaY;
      targetScrollTop = Math.max(0, Math.min(targetScrollTop, el.scrollHeight - el.clientHeight));

      if (!isAnimating) {
        _animate();
      }
    }, { passive: false });

    function _animate() {
      if (!el) {
        isAnimating = false;
        window._suppressScrollSync = false;
        return;
      }
      isAnimating = true;
      const current = el.scrollTop;
      const diff = targetScrollTop - current;

      if (Math.abs(diff) < 0.5) {
        el.scrollTop = targetScrollTop;
        isAnimating = false;
        window._suppressScrollSync = false;
        return;
      }

      el.scrollTop = current + diff * friction;
      requestAnimationFrame(_animate);
    }

    el._smoothWheelAttached = true;
  }

  function _persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
      if (typeof AppState !== 'undefined' && AppState.savePersistentState) {
        AppState.savePersistentState();
      }
    } catch (e) {
      console.error('Failed to persist scroll positions', e);
    }
  }

  function _debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Remove scroll position for a specific file in current workspace
   */
  function remove(filePath) {
    const ws = AppState.currentWorkspace;
    const key = ws ? `${ws.id}:${filePath}` : filePath;
    
    if (positions[key] !== undefined) {
      delete positions[key];
      _persist();
    }
  }

  /**
   * Clear all scroll positions for a specific workspace
   */
  function clearForWorkspace(wsId) {
    const prefix = `${wsId}:`;
    Object.keys(positions).forEach(key => {
      if (key.startsWith(prefix)) {
        delete positions[key];
      }
    });
    _persist();
  }

  function clear() {
    positions = {};
    _persist();
  }

  return { init, setContainer, save, restore, remove, clear, clearForWorkspace };
})();

// Export to global scope
window.ScrollModule = ScrollModule;
