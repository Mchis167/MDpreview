
/* ============================================================
   tabs.js — Multi-file tab management
   ============================================================ */

const TabsModule = (function () {
  const state = {
    openFiles: [], // Array of file paths
    activeFile: null
  };

  function init() {
    const addBtn = document.getElementById('add-tab-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        // Create a new Draft tab
        if (typeof AppState !== 'undefined' && typeof AppState.onModeChange === 'function') {
          AppState.onModeChange('draft');
        }
      });
    }

    // Handle middle-click to close
    document.getElementById('tab-list').addEventListener('mousedown', (e) => {
      if (e.button === 1) { // Middle click
        const tab = e.target.closest('.tab-item');
        if (tab) {
          const path = tab.dataset.path;
          remove(path);
        }
      }
    });

    // Initial load if workspace is already set
    if (typeof AppState !== 'undefined' && AppState.currentWorkspace) {
      switchWorkspace(AppState.currentWorkspace.id);
    }
  }

  function saveToStorage() {
    if (typeof AppState === 'undefined' || !AppState.currentWorkspace) return;
    const key = `tabs_${AppState.currentWorkspace.id}`;
    const data = {
      openFiles: state.openFiles,
      activeFile: state.activeFile
    };
    localStorage.setItem(key, JSON.stringify(data));
  }

  function switchWorkspace(workspaceId) {
    if (!workspaceId) {
      state.openFiles = [];
      state.activeFile = null;
      render();
      return;
    }

    const key = `tabs_${workspaceId}`;
    const saved = localStorage.getItem(key);
    
    // Also load draft state for this workspace
    if (typeof DraftModule !== 'undefined') {
      DraftModule.loadFromStorage(workspaceId);
    }

    if (saved) {
      try {
        const data = JSON.parse(saved);
        state.openFiles = data.openFiles || [];
        state.activeFile = data.activeFile || null;
      } catch (e) {
        console.error('Error parsing tabs data', e);
        state.openFiles = [];
        state.activeFile = null;
      }
    } else {
      state.openFiles = [];
      state.activeFile = null;
    }
    
    render();

    // If there was an active file, try to load it
    if (state.activeFile) {
      if (typeof window.loadFile === 'function') {
        window.loadFile(state.activeFile).catch(err => {
          console.warn('Failed to restore active file, it might have been moved or deleted:', state.activeFile);
          // If file is missing, remove it from tabs
          remove(state.activeFile);
        });
      }
    } else {
      if (typeof window.setNoFile === 'function') {
        window.setNoFile();
      }
    }
  }

  /**
   * Add a file to tabs or switch to it if already open
   */
  function open(filePath) {
    if (!filePath) return;

    if (!state.openFiles.includes(filePath)) {
      state.openFiles.push(filePath);
    }
    state.activeFile = filePath;
    saveToStorage();
    render();
  }

  /**
   * Close a tab
   */
  function remove(filePath, e) {
    if (e) e.stopPropagation();

    // Special handling for Draft tab
    if (filePath === '__DRAFT_MODE__') {
      const confirmed = confirm('Are you sure you want to discard this draft? This cannot be undone.');
      if (!confirmed) return;

      // Clear draft content if possible
      if (typeof DraftModule !== 'undefined' && typeof DraftModule.clear === 'function') {
        DraftModule.clear();
      }
      
      // Hide buttons immediately
      const group = document.getElementById('draft-actions-group');
      if (group) group.style.display = 'none';
    }

    const index = state.openFiles.indexOf(filePath);
    if (index === -1) return;

    state.openFiles.splice(index, 1);

    if (state.activeFile === filePath) {
      if (state.openFiles.length > 0) {
        // Switch to the next available tab
        const nextIndex = Math.min(index, state.openFiles.length - 1);
        const nextFile = state.openFiles[nextIndex];
        // Trigger file load via app.js global function
        if (typeof window.loadFile === 'function') {
          window.loadFile(nextFile);
        }
      } else {
        // No tabs left
        state.activeFile = null;
        if (typeof window.setNoFile === 'function') {
          window.setNoFile();
        }
      }
    }
    
    saveToStorage();
    render();
  }

  function render() {
    const list = document.getElementById('tab-list');
    if (!list) return;

    list.innerHTML = '';

    state.openFiles.forEach(path => {
      const isDraft = path === '__DRAFT_MODE__';
      const fileName = isDraft ? 'New Draft' : path.split('/').pop();
      const isActive = path === state.activeFile;

      const tab = document.createElement('div');
      tab.className = `tab-item ${isActive ? 'active' : ''}`;
      tab.dataset.path = path;
      tab.title = path;

      const dot = isDraft ? '<span class="tab-draft-dot"></span>' : '';

      tab.innerHTML = `
        ${dot}
        <span class="tab-name">${fileName}</span>
        <div class="tab-close" title="Close tab">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </div>
      `;

      tab.addEventListener('click', () => {
        if (path !== state.activeFile) {
          if (typeof window.loadFile === 'function') {
            window.loadFile(path);
          }
        }
      });

      const closeBtn = tab.querySelector('.tab-close');
      closeBtn.addEventListener('click', (e) => remove(path, e));

      list.appendChild(tab);
    });

    // Sync sidebar highlight
    if (typeof TreeModule !== 'undefined' && state.activeFile) {
      TreeModule.setActiveFile(state.activeFile);
    }
  }

  return {
    init,
    open,
    remove,
    render,
    switchWorkspace,
    getActive: () => state.activeFile,
    getOpenFiles: () => state.openFiles
  };
})();
 
