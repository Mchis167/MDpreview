
const TabsModule = (function () {
  const state = {
    openFiles: [], // Array of file paths
    activeFile: null,
    selectedFiles: [], // Array of selected file paths
    lastSelectedFile: null // For shift-range selection
  };

  let tabBar = null;

  function init() {
    // Initialize the TabBar component with MDpreview-specific logic
    tabBar = TabBar.init({
      mount: document.getElementById('tab-bar-container'),
      onTabSwitch: (path, modifiers = {}) => {
        const { shiftKey, metaKey, ctrlKey, altKey } = modifiers;
        const modKey = metaKey || ctrlKey || altKey;

        if (shiftKey) {
          selectRange(path);
        } else if (modKey) {
          toggleSelect(path);
        } else {
          deselectAll();
          if (typeof window.loadFile === 'function') {
            window.loadFile(path);
          }
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
      // New: Context menu actions
      onCloseOthers: (path) => closeOthers(path),
      onCloseAll: () => closeAll(),
      onCloseSelected: () => closeSelected(),

      rightActions: [
        {
          id: 'scroll-top',
          title: 'Scroll to top',
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>`,
          onClick: () => {
            const viewer = document.getElementById('md-viewer');
            if (viewer) viewer.scrollTo({ top: 0, behavior: 'auto' });
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
        {
          id: 'shortcuts',
          title: 'Keyboard Shortcuts',
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" ry="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M7 16h10"/></svg>`,
          onClick: () => {
            if (typeof toggleShortcutsPopover === 'function') {
              toggleShortcutsPopover();
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
    
    // Trigger global state sync if possible
    if (AppState.savePersistentState) {
      AppState.savePersistentState();
    }
  }

  function switchWorkspace(workspaceId) {
    if (!workspaceId) {
      state.openFiles = [];
      state.activeFile = null;
      state.selectedFiles = [];
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
    
    state.selectedFiles = [];
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
    state.lastSelectedFile = filePath;
    deselectAll();
    saveToStorage();
    render();
  }

  // ── Multi-selection Logic ───────────────────────────────
  function toggleSelect(path, skipSync = false) {
    const idx = state.selectedFiles.indexOf(path);
    if (idx > -1) {
      state.selectedFiles.splice(idx, 1);
    } else {
      state.selectedFiles.push(path);
    }
    state.lastSelectedFile = path;
    render();
    if (!skipSync && typeof TreeModule !== 'undefined') {
        TreeModule.syncSelectionFromTabs(state.selectedFiles);
    }
  }

  function selectRange(path, skipSync = false) {
    if (!state.lastSelectedFile || !state.openFiles.includes(state.lastSelectedFile)) {
      toggleSelect(path, skipSync);
      return;
    }

    const startIdx = state.openFiles.indexOf(state.lastSelectedFile);
    const endIdx = state.openFiles.indexOf(path);
    const min = Math.min(startIdx, endIdx);
    const max = Math.max(startIdx, endIdx);

    const currentSet = new Set(state.selectedFiles);
    for (let i = min; i <= max; i++) {
      currentSet.add(state.openFiles[i]);
    }
    state.selectedFiles = Array.from(currentSet);
    render();
    if (!skipSync && typeof TreeModule !== 'undefined') {
        TreeModule.syncSelectionFromTabs(state.selectedFiles);
    }
  }

  function selectAll(skipSync = false) {
    state.selectedFiles = [...state.openFiles];
    render();
    if (!skipSync && typeof TreeModule !== 'undefined') {
        TreeModule.syncSelectionFromTabs(state.selectedFiles);
    }
  }

  function deselectAll(skipSync = false) {
    if (state.selectedFiles.length === 0) return; // Optimization: Already empty
    state.selectedFiles = [];
    render();
    if (!skipSync && typeof TreeModule !== 'undefined') {
        TreeModule.syncSelectionFromTabs([]);
    }
  }

  function syncSelectionFromTree(paths) {
    // Only select paths that are currently open in tabs
    const filtered = paths.filter(p => state.openFiles.includes(p));
    
    // Optimization: Compare if selection actually changed
    const current = state.selectedFiles;
    if (current.length === filtered.length && current.every((v, i) => v === filtered[i])) {
      return;
    }

    state.selectedFiles = filtered;
    render();
  }

  // ── Batch Closing Logic ────────────────────────────────

  async function closeAll() {
    const files = [...state.openFiles];
    const drafts = files.filter(f => f.startsWith("__DRAFT_"));

    if (drafts.length > 0) {
      DesignSystem.showConfirm({
        title: "Discard All Drafts",
        message: `Are you sure you want to discard all ${drafts.length} drafts? This cannot be undone.`,
        onConfirm: () => {
          files.forEach(f => _proceedRemove(f, true));
          saveToStorage();
          if (typeof DraftModule !== 'undefined' && AppState.currentWorkspace) {
            DraftModule.loadFromStorage(AppState.currentWorkspace.id);
          }
          render();
        }
      });
    } else {
      files.forEach(f => _proceedRemove(f, true));
      saveToStorage();
      if (typeof DraftModule !== 'undefined' && AppState.currentWorkspace) {
        DraftModule.loadFromStorage(AppState.currentWorkspace.id);
      }
      render();
    }
  }

  function closeOthers(path) {
    const files = state.openFiles.filter(f => f !== path);
    const drafts = files.filter(f => f.startsWith("__DRAFT_"));

    if (drafts.length > 0) {
      DesignSystem.showConfirm({
        title: "Discard Drafts",
        message: `This will discard ${drafts.length} unsaved drafts. Continue?`,
        onConfirm: () => {
          files.forEach(f => _proceedRemove(f, true));
          saveToStorage();
          if (typeof DraftModule !== 'undefined' && AppState.currentWorkspace) {
            DraftModule.loadFromStorage(AppState.currentWorkspace.id);
          }
          render();
        }
      });
    } else {
      files.forEach(f => _proceedRemove(f, true));
      saveToStorage();
      if (typeof DraftModule !== 'undefined' && AppState.currentWorkspace) {
        DraftModule.loadFromStorage(AppState.currentWorkspace.id);
      }
      render();
    }
  }

  function closeSelected() {
    const files = [...state.selectedFiles];
    if (files.length === 0) return;

    const drafts = files.filter(f => f.startsWith("__DRAFT_"));
    if (drafts.length > 0) {
      DesignSystem.showConfirm({
        title: "Discard Selected Drafts",
        message: `Discard ${drafts.length} selected drafts?`,
        onConfirm: () => {
          files.forEach(f => _proceedRemove(f, true));
          state.selectedFiles = [];
          saveToStorage();
          if (typeof DraftModule !== 'undefined' && AppState.currentWorkspace) {
            DraftModule.loadFromStorage(AppState.currentWorkspace.id);
          }
          render();
        }
      });
    } else {
      files.forEach(f => _proceedRemove(f, true));
      state.selectedFiles = [];
      saveToStorage();
      if (typeof DraftModule !== 'undefined' && AppState.currentWorkspace) {
        DraftModule.loadFromStorage(AppState.currentWorkspace.id);
      }
      render();
    }
  }

  function remove(filePath, skipConfirm = false) {
    if (filePath && filePath.startsWith("__DRAFT_") && !skipConfirm) {
      // Skip confirmation if draft is empty
      let content = "";
      if (
        window.AppState &&
        AppState.currentMode === "edit" &&
        filePath === AppState.currentFile
      ) {
        content = document.getElementById("edit-textarea")?.value || "";
      } else if (typeof DraftModule !== "undefined") {
        content = DraftModule.getDraftContent(filePath);
      }

      if (!content || content.trim() === "") {
        _proceedRemove(filePath);
        return;
      }

      DesignSystem.showConfirm({
        title: "Discard Draft",
        message:
          "Are you sure you want to discard this draft? This cannot be undone.",
        onConfirm: () => {
          remove(filePath, true); // Recursive call with skipConfirm = true
        },
      });
      return;
    }

    _proceedRemove(filePath);
  }

  function _proceedRemove(filePath, batch = false) {
    const index = state.openFiles.indexOf(filePath);
    if (index === -1) return;

    // Cleanup logic for Draft Mode
    if (filePath && filePath.startsWith("__DRAFT_")) {
      if (typeof DraftModule !== "undefined") DraftModule.clear(filePath);
      if (typeof EditorModule !== "undefined") EditorModule.setDirty(false);
    }

    state.openFiles.splice(index, 1);

    // Remove from selection if present
    const sIdx = state.selectedFiles.indexOf(filePath);
    if (sIdx > -1) state.selectedFiles.splice(sIdx, 1);

    if (state.activeFile === filePath) {
      state.activeFile = null;
      if (typeof window.AppState !== 'undefined') window.AppState.currentFile = null;
      if (typeof window.setNoFile === 'function') {
        window.setNoFile();
      }
    }

    if (!batch) {
      saveToStorage();
      render();
    }
  }

  function render() {
    if (tabBar) {
      tabBar.setState({
        openFiles: state.openFiles,
        activeFile: state.activeFile,
        selectedFiles: state.selectedFiles
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

  function reorder(oldIndex, newIndex) {
    if (oldIndex === newIndex) return;
    const files = [...state.openFiles];
    const [draggedItem] = files.splice(oldIndex, 1);
    files.splice(newIndex, 0, draggedItem);
    
    state.openFiles = files;
    saveToStorage();
    render();
  }

  return {
    init,
    open,
    remove,
    render,
    switchWorkspace,
    selectAll,
    deselectAll,
    closeAll,
    closeOthers,
    closeSelected,
    reorder,
    syncSelectionFromTree,
    getActive: () => state.activeFile,
    getOpenFiles: () => state.openFiles,
    getSelectedFiles: () => state.selectedFiles
  };
})();
