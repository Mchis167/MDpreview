/**
 * ScrollModule — Persists and restores scroll positions for files
 */
const ScrollModule = (() => {
  const STORAGE_KEY = 'md-scroll-positions';
  let positions = {};

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
    
    // Save on scroll (debounced)
    const viewer = document.getElementById('md-viewer');
    if (viewer) {
      viewer.addEventListener('scroll', _debounce(() => {
        const ws = AppState.currentWorkspace;
        if (AppState.currentFile && ws) {
          const key = `${ws.id}:${AppState.currentFile}`;
          positions[key] = viewer.scrollTop;
          _persist();
        }
      }, 200));
    }

    // Save on app close
    window.addEventListener('beforeunload', () => {
      const ws = AppState.currentWorkspace;
      if (AppState.currentFile && ws && viewer) {
        const key = `${ws.id}:${AppState.currentFile}`;
        positions[key] = viewer.scrollTop;
        _persist();
      }
    });
  }

  /**
   * Manually save current scroll position for a specific file
   */
  function save(filePath) {
    const ws = AppState.currentWorkspace;
    const viewer = document.getElementById('md-viewer');
    if (viewer && filePath && ws) {
      const key = `${ws.id}:${filePath}`;
      positions[key] = viewer.scrollTop;
      _persist();
    }
  }

  /**
   * Restore scroll position for a file
   */
  function restore(filePath) {
    const ws = AppState.currentWorkspace;
    const viewer = document.getElementById('md-viewer');
    if (!viewer || !ws) return;

    const key = `${ws.id}:${filePath}`;
    if (filePath && positions[key] !== undefined) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        viewer.scrollTop = positions[key];
      });
    } else {
      viewer.scrollTop = 0;
    }
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

  return { init, save, restore, remove, clear, clearForWorkspace };
})();
