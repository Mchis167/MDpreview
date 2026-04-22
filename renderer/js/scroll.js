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
        if (AppState.currentFile) {
          positions[AppState.currentFile] = viewer.scrollTop;
          _persist();
        }
      }, 200));
    }

    // Save on app close
    window.addEventListener('beforeunload', () => {
      if (AppState.currentFile && viewer) {
        positions[AppState.currentFile] = viewer.scrollTop;
        _persist();
      }
    });
  }

  /**
   * Manually save current scroll position for a specific file
   */
  function save(filePath) {
    const viewer = document.getElementById('md-viewer');
    if (viewer && filePath) {
      positions[filePath] = viewer.scrollTop;
      _persist();
    }
  }

  /**
   * Restore scroll position for a file
   */
  function restore(filePath) {
    const viewer = document.getElementById('md-viewer');
    if (!viewer) return;

    if (filePath && positions[filePath] !== undefined) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        viewer.scrollTop = positions[filePath];
      });
    } else {
      viewer.scrollTop = 0;
    }
  }

  function _persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
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

  return { init, save, restore };
})();
