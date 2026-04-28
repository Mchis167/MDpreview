
const TabsModule = (function () {
  const state = {
    openFiles: [], // Array of file paths
    pinnedFiles: [], // Array of pinned file paths
    dirtyFiles: [], // Array of files with unsaved changes
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

          // Focus shift: Clear sidebar selection when switching files via tabs
          if (typeof TreeModule !== 'undefined') {
            TreeModule.deselectAll(true);
          }

          if (path !== state.activeFile) {
            if (typeof window.loadFile === 'function') {
              window.loadFile(path).catch(_err => {
                remove(path);
              });
            }
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
      onToggleSidebar: () => toggleSidebar(),
      // New: Context menu actions
      onCloseOthers: (path) => closeOthers(path),
      onCloseAll: () => closeAll(),
      onCloseSelected: () => closeSelected(),
      onPinTab: (path) => pin(path),
      onUnpinTab: (path) => unpin(path),

      rightActions: [
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

    // Global click to deselect tabs
    document.addEventListener('mousedown', (e) => {
      const isSafeZone = !!e.target.closest(
        '.tab-item, ' +               // Tab items themselves
        '.tab-bar-container, ' +      // Entire tab bar area
        '.ctx-menu, .modal'           // UI overlays
      );

      if (!isSafeZone) {
        deselectAll();
      }
    });

    // Global keyboard shortcuts for tabs
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        deselectAll();
      }
    });
  }

  function updateSidebarToggleIcon(isCollapsed) {
    const btn = document.getElementById('sidebar-toggle-btn');
    if (btn) {
      const iconName = isCollapsed ? 'sidebar-expand' : 'sidebar-collapse';
      btn.innerHTML = DesignSystem.getIcon(iconName);
      btn.title = isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar';
      // Sync premium tooltip
      DesignSystem.applyTooltip(btn, btn.title, 'bottom');
    }
  }

  function toggleSidebar() {
    const sidebarWrap = document.getElementById('sidebar-left-wrap');
    if (sidebarWrap) {
      const nowCollapsed = sidebarWrap.classList.toggle('sidebar-collapsed');
      localStorage.setItem('mdpreview_sidebar_left_collapsed', nowCollapsed);
      updateSidebarToggleIcon(nowCollapsed);
      return nowCollapsed;
    }
    return false;
  }

  // Exposed global for toolbar.js to call if needed (fallback)
  window.updateSidebarToggleIcon = updateSidebarToggleIcon;
  window.toggleSidebar = toggleSidebar;

  function saveToStorage() {
    if (typeof AppState === 'undefined' || !AppState.currentWorkspace) return;
    const key = `tabs_${AppState.currentWorkspace.id}`;
    const data = {
      openFiles: state.openFiles,
      pinnedFiles: state.pinnedFiles,
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
        state.pinnedFiles = data.pinnedFiles || [];
        state.activeFile = data.activeFile || null;
      } catch (_e) {
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
        window.loadFile(state.activeFile).catch(_err => {
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

  function setDirty(path, isDirty) {
    if (!path) return;
    const idx = state.dirtyFiles.indexOf(path);
    if (isDirty) {
      if (idx === -1) {
        state.dirtyFiles.push(path);
        render();
      }
    } else {
      if (idx > -1) {
        state.dirtyFiles.splice(idx, 1);
        render();
      }
    }
  }

  function pin(path) {
    if (!path) return;
    if (!state.pinnedFiles.includes(path)) {
      state.pinnedFiles.push(path);
      // Ensure it's in openFiles too
      if (!state.openFiles.includes(path)) {
        state.openFiles.push(path);
      }
      saveToStorage();
      render();
    }
  }

  function unpin(path) {
    if (!path) return;
    const idx = state.pinnedFiles.indexOf(path);
    if (idx > -1) {
      state.pinnedFiles.splice(idx, 1);
      saveToStorage();
      render();
    }
  }

  function togglePin(path) {
    if (!path) return;
    if (state.pinnedFiles.includes(path)) {
      unpin(path);
    } else {
      pin(path);
    }
  }

  // ── Private Helpers ─────────────────────────────────────
  function _getDisplayOrder() {
    const pinned = state.pinnedFiles.filter(f => state.openFiles.includes(f));
    const unpinned = state.openFiles.filter(f => !state.pinnedFiles.includes(f));
    return [...pinned, ...unpinned];
  }

  // ── Multi-selection Logic ───────────────────────────────
  function toggleSelect(path, _skipSync = false) {
    const idx = state.selectedFiles.indexOf(path);
    if (idx > -1) {
      state.selectedFiles.splice(idx, 1);
    } else {
      state.selectedFiles.push(path);
    }
    state.lastSelectedFile = path;
    render();
  }

  function selectRange(path, skipSync = false) {
    const displayOrder = _getDisplayOrder();
    if (!state.lastSelectedFile || !displayOrder.includes(state.lastSelectedFile)) {
      toggleSelect(path, skipSync);
      return;
    }

    const startIdx = displayOrder.indexOf(state.lastSelectedFile);
    const endIdx = displayOrder.indexOf(path);
    const min = Math.min(startIdx, endIdx);
    const max = Math.max(startIdx, endIdx);

    const currentSet = new Set(state.selectedFiles);
    for (let i = min; i <= max; i++) {
      currentSet.add(displayOrder[i]);
    }
    state.selectedFiles = Array.from(currentSet);
    render();
  }

  function selectAll(_skipSync = false) {
    state.selectedFiles = [...state.openFiles];
    render();
  }

  function deselectAll(_skipSync = false) {
    if (state.selectedFiles.length === 0) return; // Optimization: Already empty
    state.selectedFiles = [];
    render();
  }

  function syncSelectionFromTree(_paths) {
    // Disabled: Independent selection between Tabs and Tree
    /*
    const filtered = paths.filter(p => state.openFiles.includes(p));
    const current = state.selectedFiles;
    if (current.length === filtered.length && current.every((v, i) => v === filtered[i])) {
      return;
    }
    state.selectedFiles = filtered;
    render();
    */
  }

  // ── Batch Closing Logic ────────────────────────────────

  async function closeAll() {
    const files = state.openFiles.filter(f => !state.pinnedFiles.includes(f));
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
    const files = state.openFiles.filter(f => f !== path && !state.pinnedFiles.includes(f));
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

    // Remove from pinned if present
    const pIdx = state.pinnedFiles.indexOf(filePath);
    if (pIdx > -1) state.pinnedFiles.splice(pIdx, 1);

    if (state.activeFile === filePath) {
      state.activeFile = null;
      if (typeof window.AppState !== 'undefined') window.AppState.currentFile = null;
      if (typeof window.setNoFile === 'function') {
        window.setNoFile();
      }
    }

    // Cleanup logic for Scroll Position
    if (window.ScrollModule) {
      window.ScrollModule.remove(filePath);
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
        pinnedFiles: state.pinnedFiles,
        dirtyFiles: state.dirtyFiles,
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

    // Calculate display order to identify what was actually dragged
    const displayOrder = _getDisplayOrder();

    const draggedItem = displayOrder[oldIndex];
    if (!draggedItem) return;

    const isPinned = state.pinnedFiles.includes(draggedItem);

    if (isPinned) {
      // Reorder within pinnedFiles
      const pOldIdx = state.pinnedFiles.indexOf(draggedItem);
      // Pinned tabs are always at the start, so newIndex is relative to pinnedFiles
      // but we need to ensure it doesn't exceed pinned length
      const pinnedCount = state.pinnedFiles.filter(f => state.openFiles.includes(f)).length;
      const pNewIdx = Math.min(newIndex, pinnedCount - 1);

      state.pinnedFiles.splice(pOldIdx, 1);
      state.pinnedFiles.splice(pNewIdx, 0, draggedItem);
    } else {
      // Reorder within unpinned logic in openFiles
      // This is trickier because openFiles contains everything
      const [item] = state.openFiles.splice(state.openFiles.indexOf(draggedItem), 1);

      // Calculate where to insert in openFiles to match the intended newIndex in displayOrder
      // If newIndex is within pinned range, unpinned item moves to the very beginning of unpinned section
      const targetInDisplay = displayOrder[newIndex];
      let insertIdx = state.openFiles.indexOf(targetInDisplay);
      if (insertIdx === -1) {
        insertIdx = state.openFiles.length;
      } else if (newIndex > oldIndex) {
        insertIdx++;
      }

      state.openFiles.splice(insertIdx, 0, item);
    }

    saveToStorage();
    render();
  }

  function swap(oldPath, newPath) {
    const index = state.openFiles.indexOf(oldPath);
    if (index !== -1) {
      state.openFiles[index] = newPath;

      if (state.activeFile === oldPath) {
        state.activeFile = newPath;
        if (typeof window.AppState !== 'undefined') window.AppState.currentFile = newPath;
      }

      const sIdx = state.selectedFiles.indexOf(oldPath);
      if (sIdx !== -1) {
        state.selectedFiles[sIdx] = newPath;
      }

      if (state.lastSelectedFile === oldPath) {
        state.lastSelectedFile = newPath;
      }

      saveToStorage();
      render();
    }
  }

  return {
    init,
    open,
    remove,
    setDirty,
    swap,
    render,
    switchWorkspace,
    selectAll,
    deselectAll,
    closeAll,
    closeOthers,
    closeSelected,
    reorder,
    pin,
    unpin,
    togglePin,
    toggleSidebar,
    syncSelectionFromTree,
    getActive: () => state.activeFile,
    getOpenFiles: () => state.openFiles,
    getSelectedFiles: () => state.selectedFiles
  };
})();
window.TabsModule = TabsModule;
