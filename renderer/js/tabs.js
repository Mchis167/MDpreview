
const TabsModule = (function () {
  const state = {
    openFiles: [], // Array of file paths
    activeFile: null
  };

  let tabBar = null;

  function init() {
    // Initialize the TabBar component with MDpreview-specific logic
    tabBar = TabBar.init({
      mount: document.getElementById('tab-bar-container'),
      onTabSwitch: (path) => {
        if (typeof window.loadFile === 'function') {
          window.loadFile(path);
        }
      },
      onTabClose: (path) => {
        remove(path);
      },
      onAddTab: () => {
        // Create a new Draft tab
        if (typeof AppState !== 'undefined' && typeof AppState.onModeChange === 'function') {
          AppState.onModeChange('draft');
        }
      },
      onToggleSidebar: () => {
        const sidebarWrap = document.getElementById('sidebar-left-wrap');
        if (sidebarWrap) {
          const nowCollapsed = sidebarWrap.classList.toggle('sidebar-collapsed');
          localStorage.setItem('mdpreview_sidebar_left_collapsed', nowCollapsed);
          updateSidebarToggleIcon(nowCollapsed);
        }
      },
      rightActions: [
        {
          id: 'rebuild',
          title: 'Rebuild & Relaunch',
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>`,
          onClick: () => {
            if (confirm('Rebuild and relaunch the application?')) {
              window.electronAPI.rebuildApp();
            }
          }
        },
        {
          id: 'scroll-top',
          title: 'Scroll to top',
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>`,
          onClick: () => {
            const viewer = document.getElementById('md-viewer');
            if (viewer) viewer.scrollTo({ top: 0, behavior: 'smooth' });
          }
        },
        {
          id: 'fullscreen',
          title: 'Fullscreen',
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
          onClick: () => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
          }
        },
        { type: 'divider' },
        {
          id: 'settings',
          title: 'Settings',
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>`,
          onClick: () => {
            if (typeof SettingsModule !== 'undefined') {
              SettingsModule.open();
            }
          }
        }
      ]
    });

    // Initial load if workspace is already set
    if (typeof AppState !== 'undefined' && AppState.currentWorkspace) {
      switchWorkspace(AppState.currentWorkspace.id);
    }

    // Handle full-screen icon sync
    document.addEventListener('fullscreenchange', () => {
      const isFS = !!document.fullscreenElement;
      document.body.classList.toggle('is-fullscreen', isFS);
      // We could update the icon in the action bar here if needed by re-rendering
      // but for now, we follow the simple approach.
    });

    // Handle Sidebar toggle icon initial state
    const isCollapsed = localStorage.getItem('mdpreview_sidebar_left_collapsed') === 'true';
    updateSidebarToggleIcon(isCollapsed);
  }

  function updateSidebarToggleIcon(isCollapsed) {
    const iconOpen = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6-6 6 6 6"/><path d="M3 12h12"/><path d="M21 19V5"/></svg>`;
    const iconClosed = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18 6-6-6-6"/><path d="M21 12H9"/><path d="M3 5v14"/></svg>`;
    
    const btn = document.querySelector('.tab-bar__toggle-btn');
    if (btn) {
      btn.innerHTML = isCollapsed ? iconClosed : iconOpen;
    }
  }

  // Exposed global for toolbar.js to call if needed (fallback)
  window.updateSidebarToggleIcon = updateSidebarToggleIcon;

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
    
    if (typeof DraftModule !== 'undefined') {
      DraftModule.loadFromStorage(workspaceId);
    }

    if (saved) {
      try {
        const data = JSON.parse(saved);
        state.openFiles = data.openFiles || [];
        state.activeFile = data.activeFile || null;
      } catch (e) {
        state.openFiles = [];
        state.activeFile = null;
      }
    } else {
      state.openFiles = [];
      state.activeFile = null;
    }
    
    render();

    if (state.activeFile) {
      if (typeof window.loadFile === 'function') {
        window.loadFile(state.activeFile).catch(err => {
          remove(state.activeFile);
        });
      }
    } else {
      if (typeof window.setNoFile === 'function') {
        window.setNoFile();
      }
    }
  }

  function open(filePath) {
    if (!filePath) return;
    if (!state.openFiles.includes(filePath)) {
      state.openFiles.push(filePath);
    }
    state.activeFile = filePath;
    saveToStorage();
    render();
  }

  function remove(filePath, e) {
    if (e) e.stopPropagation();

    if (filePath === '__DRAFT_MODE__') {
      const confirmed = confirm('Are you sure you want to discard this draft? This cannot be undone.');
      if (!confirmed) return;
      if (typeof DraftModule !== 'undefined' && typeof DraftModule.clear === 'function') {
        DraftModule.clear();
      }
    }

    const index = state.openFiles.indexOf(filePath);
    if (index === -1) return;

    state.openFiles.splice(index, 1);

    if (state.activeFile === filePath) {
      if (state.openFiles.length > 0) {
        const nextIndex = Math.min(index, state.openFiles.length - 1);
        const nextFile = state.openFiles[nextIndex];
        if (typeof window.loadFile === 'function') {
          window.loadFile(nextFile);
        }
      } else {
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
    if (tabBar) {
      tabBar.setState({
        openFiles: state.openFiles,
        activeFile: state.activeFile
      });
    }

    // Sync sidebar highlight
    if (typeof TreeModule !== 'undefined') {
      TreeModule.setActiveFile(state.activeFile);
    }
    if (typeof RecentlyViewedModule !== 'undefined') {
      RecentlyViewedModule.setActiveFile(state.activeFile);
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
 
