/* global AppState, SettingsService, DesignSystem, FileService, TreeDragManager, 
   TreeViewComponent, SidebarSectionHeader, SidebarModule, RecentlyViewedModule, showToast, ScrollContainer */
/* ============================================================
   tree.js — Sidebar File Tree logic with Sorting and DND
   ============================================================ */

const TreeModule = (() => {
  let treeData = [];
  let currentQuery = '';
  const state = {
    selectedPaths: [],
    lastSelectedPath: null,
    renamingPath: null,
    sortMethod: (typeof AppState !== 'undefined' && AppState.settings && AppState.settings.sortMethod) || localStorage.getItem('mdpreview_sort_method') || 'alphabetical_asc',
    expandedPaths: JSON.parse(localStorage.getItem('mdpreview_expanded_paths') || '[]'),
    customOrders: JSON.parse(localStorage.getItem('mdpreview_custom_orders') || '{}')
  };
  let hiddenItemsV2Component = null;

  let v2Component = null;

  const SORT_ICONS = {
    alphabetical_asc: DesignSystem.getIcon('sort-alpha-asc'),
    alphabetical_desc: DesignSystem.getIcon('sort-alpha-desc'),
    time_asc: DesignSystem.getIcon('sort-time-asc'),
    time_desc: DesignSystem.getIcon('sort-time-desc'),
    custom: DesignSystem.getIcon('sort-custom')
  };

  function init() {
    // 0. Refresh state from persistent storage
    if (typeof AppState !== 'undefined' && AppState.settings && AppState.settings.sortMethod) {
      state.sortMethod = AppState.settings.sortMethod;
    }

    // 1. Initialize Header Actions
    const addBtn = new IconActionButton({
      id: 'add-btn',
      title: 'Add new...',
      iconName: 'plus',
      onClick: (e) => {
        _hideContextMenu();
        const items = [
          { label: 'New File', icon: 'file-plus', shortcut: '⌘N', onClick: () => _createNewItem('root', 'file') },
          { label: 'New Folder', icon: 'folder-plus', shortcut: '⇧⌘N', onClick: () => _createNewItem('root', 'directory') },
          { divider: true },
          { label: 'Import from System', icon: 'copy-plus', onClick: () => _handleImportFromSystem('root', 'copy') },
          { label: 'Move into Workspace', icon: 'folder-input', onClick: () => _handleImportFromSystem('root', 'move') }
        ];
        if (typeof DesignSystem !== 'undefined') DesignSystem.createContextMenu(e, items);
      }
    });

    const sortBtn = new IconActionButton({
      id: 'sort-btn',
      title: 'Sort files',
      iconName: 'sort',
      onClick: (e) => _showSortMenu(e)
    });

    const searchBtn = new IconActionButton({
      id: 'enter-search-btn',
      title: 'Search files',
      iconName: 'search',
      onClick: () => {
        if (typeof SidebarModule !== 'undefined') SidebarModule.activateSearch();
      }
    });

    // 2. Initialize Section Header
    const header = new SidebarSectionHeader({
      title: 'ALL FILES',
      collapsible: {
        sectionId: 'file-explorer-section',
        storageKey: 'mdpreview_explorer_collapsed',
        appStateKey: 'explorerCollapsed'
      },
      actions: [
        [addBtn],
        [sortBtn, searchBtn]
      ]
    });

    const mount = document.getElementById('file-explorer-header-mount');
    if (mount) {
      mount.innerHTML = '';
      mount.appendChild(header.render());
    }

    const searchMount = document.getElementById('search-results-header-mount');
    if (searchMount) {
      const searchHeader = new SidebarSectionHeader({
        title: 'SEARCH RESULTS',
        collapsible: {
          sectionId: 'search-results-section',
          storageKey: 'mdpreview_search_collapsed'
        }
      });
      searchMount.innerHTML = '';
      searchMount.appendChild(searchHeader.render());
    }

    // 3. Initialize Hidden Items Header
    const hiddenHeader = new SidebarSectionHeader({
      title: 'HIDDEN FROM TREE',
      defaultCollapsed: true,
      collapsible: {
        sectionId: 'hidden-items-section'
      }
    });

    const hiddenMount = document.getElementById('hidden-items-header-mount');
    if (hiddenMount) {
      hiddenMount.innerHTML = '';
      hiddenMount.appendChild(hiddenHeader.render());
    }

    // Sync sort icon
    _updateSortBtnIcon();

    // Global click to deselect
    document.addEventListener('mousedown', (e) => {
      // Define "Safe Zones" where clicking should NOT trigger tree deselection
      const isSafeZone = !!e.target.closest(
        '.tree-item, ' +              // Tree items themselves
        '.tab-item, ' +               // Tab items
        '.tab-bar-container, ' +      // Entire tab bar area (including right actions)
        '.ds-change-action-view-bar, ' + // Floating mode switch bar
        '#right-sidebar-wrap, ' +     // Right sidebar (Comments/Collect)
        '.ctx-menu, .modal'           // UI overlays
      );

      if (!isSafeZone) {
        deselectAll();
      }
    });

    // Root Context Menu Handler for all scroll containers
    document.addEventListener('contextmenu', (e) => {
      const container = e.target.closest('.ds-scroll-container');
      if (container && !e.target.closest('.tree-item')) {
        e.preventDefault();
        const isHiddenArea = !!e.target.closest('#hidden-items-section');
        const targetPath = 'root';
        
        let items = [];
        if (!isHiddenArea) {
          items = [
            { label: 'New File', icon: 'file-plus', shortcut: '⌘N', onClick: () => _createNewItem(targetPath, 'file') },
            { label: 'New Folder', icon: 'folder-plus', shortcut: '⇧⌘N', onClick: () => _createNewItem(targetPath, 'directory') },
            { divider: true },
            { label: 'Import from System', icon: 'copy-plus', onClick: () => _handleImportFromSystem(targetPath, 'copy') },
            { label: 'Move into Workspace', icon: 'folder-input', onClick: () => _handleImportFromSystem(targetPath, 'move') },
            { divider: true },
            { label: 'Collapse All Folders', icon: 'folder-minus', shortcut: '⌘[', onClick: () => collapseAll() },
            { divider: true }
          ];
        }

        items.push(
          { label: 'Open Workspace in Finder', icon: 'external-link', onClick: () => {
            if (typeof AppState !== 'undefined' && AppState.currentWorkspace) {
              FileService.revealInFinder(AppState.currentWorkspace.path);
            }
          }},
          { label: 'Refresh Tree', icon: 'refresh-cw', onClick: () => load() }
        );

        if (typeof DesignSystem !== 'undefined') {
          DesignSystem.createContextMenu(e, items);
        }
      }
    });
  }

  function _handleNewItemShortcut(type) {
    let targetPath = 'root';
    const hiddenPaths = new Set(AppState.settings.hiddenPaths || []);

    if (state.selectedPaths.length > 0) {
      const lastPath = state.selectedPaths[state.selectedPaths.length - 1];
      
      // If the selected path itself is hidden, default to root to protect hidden section
      if (hiddenPaths.has(lastPath)) {
        targetPath = 'root';
      } else {
        const node = _findNodeByPath(treeData, lastPath);
        if (node) {
          targetPath = node.type === 'directory' 
            ? node.path 
            : (node.path.substring(0, node.path.lastIndexOf('/')) || 'root');
          
          // Final check: if calculated target parent is hidden, fallback to root
          if (hiddenPaths.has(targetPath)) targetPath = 'root';
        }
      }
    }
    _createNewItem(targetPath, type);
  }

  function _updateSortBtnIcon() {
    const btn = document.getElementById('sort-btn');
    if (btn) {
      btn.innerHTML = SORT_ICONS[state.sortMethod] || SORT_ICONS.alphabetical_asc;
      const svg = btn.querySelector('svg');
      if (svg) {
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
      }
    }
  }



  async function load() {
    if (TreeDragManager.getIsDragging()) return; // Block loading while dragging

    // Show professional skeleton state
    // Show professional skeleton state
    const mountPoint = document.getElementById('file-tree-mount');
    if (mountPoint) {
      let treeEl = document.getElementById('file-tree');
      if (!treeEl) {
        treeEl = document.createElement('div');
        treeEl.id = 'file-tree';
        const scrollContainer = ScrollContainer.create(treeEl, {
          className: 'ds-scrollbar-thin'
        });
        mountPoint.appendChild(scrollContainer);
      }

      if (!v2Component) {
        v2Component = new TreeViewComponent({
          mount: treeEl,
          onClick: _handleClick,
          onMouseDown: _handleMouseDown,
          onContextMenu: _handleContextMenu,
          onDelete: _handleDelete,
          onRename: _handleRename,
          onFinishRename: _finishRename,
          onMouseLeave: _handleMouseLeave
        });
      }
      v2Component.renderSkeleton(10);
    }

    const expandedPaths = new Set();
    const saveExpanded = (nodes) => {
      nodes.forEach(n => {
        if (n.type === 'directory' && n.expanded) {
          expandedPaths.add(n.path);
          if (n.children) saveExpanded(n.children);
        }
      });
    };
    saveExpanded(treeData);

    const { showHidden, hideEmptyFolders, flatView } = AppState.settings;
    const newData = await FileService.fetchFiles({
      showHidden,
      hideEmpty: hideEmptyFolders,
      flat: flatView
    });

    const restoreExpanded = (nodes) => {
      nodes.forEach(n => {
        if (n.type === 'directory') {
          if (expandedPaths.has(n.path)) n.expanded = true;
          if (n.children) restoreExpanded(n.children);
        }
      });
    };
    restoreExpanded(newData);

    // 3. APPLY PERSISTED STATE (Expanded folders)
    const applyPersistence = (nodes) => {
      nodes.forEach(node => {
        if (node.type === 'directory') {
          if (state.expandedPaths.includes(node.path)) {
            node.expanded = true;
          }
          if (node.children) applyPersistence(node.children);
        }
      });
    };
    applyPersistence(newData);

    treeData = newData;
    render();
  }

  function render(isQuickRender = false, overrideActivePath = null) {
    if (TreeDragManager.getIsDragging() && !isQuickRender) return;

    _sortNodesRecursively(treeData, '');
    
    const hiddenPaths = new Set(AppState.settings.hiddenPaths || []);

    // 1. Filter Main Tree (Visible)
    const filterVisible = (nodes) => {
      return nodes.reduce((acc, node) => {
        if (hiddenPaths.has(node.path)) return acc;
        const newNode = { ...node };
        if (node.type === 'directory' && node.children) {
          newNode.children = filterVisible(node.children);
        }
        acc.push(newNode);
        return acc;
      }, []);
    };

    const visibleData = filterVisible(treeData);
    const filtered = filterTree(visibleData, currentQuery);

    // 2. Filter Hidden List
    const getHidden = (nodes) => {
      let out = [];
      nodes.forEach(n => {
        if (hiddenPaths.has(n.path)) {
          out.push(n);
        } else if (n.type === 'directory' && n.children) {
          out = out.concat(getHidden(n.children));
        }
      });
      return out;
    };
    const hiddenData = getHidden(treeData);

    // ── Main Explorer Re-mounting Logic ──
    const mountPoint = document.getElementById('file-tree-mount');
    if (mountPoint && (!v2Component || !document.body.contains(v2Component.mount))) {
      mountPoint.innerHTML = ''; // Ensure clean slate
      const treeEl = document.createElement('div');
      treeEl.id = 'file-tree';
      const scrollContainer = ScrollContainer.create(treeEl, { className: 'ds-scrollbar-thin' });
      mountPoint.appendChild(scrollContainer);

      v2Component = new TreeViewComponent({
        mount: treeEl,
        onClick: _handleClick,
        onMouseDown: _handleMouseDown,
        onContextMenu: _handleContextMenu,
        onDelete: _handleDelete,
        onRename: _handleRename,
        onFinishRename: _finishRename,
        onMouseLeave: _handleMouseLeave
      });
    }

    // ── Hidden Items Re-mounting Logic ──
    const hMountPoint = document.getElementById('hidden-items-mount');
    if (hMountPoint && (!hiddenItemsV2Component || !document.body.contains(hiddenItemsV2Component.mount))) {
      hMountPoint.innerHTML = '';
      const hListEl = document.createElement('div');
      hListEl.id = 'hidden-items-list';
      const hScrollContainer = ScrollContainer.create(hListEl, { 
        className: 'ds-scrollbar-thin'
      });
      hMountPoint.appendChild(hScrollContainer);

      hiddenItemsV2Component = new TreeViewComponent({
        mount: hListEl,
        onClick: _handleClick,
        onMouseDown: _handleMouseDown,
        onContextMenu: _handleContextMenu,
        onDelete: _handleDelete,
        onRename: _handleRename,
        onFinishRename: _finishRename,
        onMouseLeave: _handleMouseLeave
      });
    }

    // Update UI via Components
    if (v2Component) {
      v2Component.update(
        filtered,
        state.selectedPaths,
        currentQuery,
        state.sortMethod,
        overrideActivePath || AppState.currentFile,
        state.renamingPath
      );
    }

    if (hiddenItemsV2Component) {
      hiddenItemsV2Component.update(
        hiddenData,
        state.selectedPaths,
        '',
        state.sortMethod,
        overrideActivePath || AppState.currentFile,
        state.renamingPath
      );
    }

    // ── NEW: Auto-hide Hidden Section if empty ──
    const hiddenSection = document.getElementById('hidden-items-section');
    if (hiddenSection) {
      const hasHidden = hiddenData.length > 0;
      hiddenSection.style.display = hasHidden ? 'flex' : 'none';
      
      // Also hide the divider before it
      const divider = hiddenSection.previousElementSibling;
      if (divider && divider.classList.contains('sidebar-divider')) {
        divider.style.display = hasHidden ? 'block' : 'none';
      }
    }
  }

  function _sortNodesRecursively(nodes, parentPath) {
    if (!nodes) return;

    nodes.sort((a, b) => {
      // Directories always first (unless in Custom Mode)
      if (state.sortMethod !== 'custom' && a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }

      if (state.sortMethod.startsWith('alphabetical')) {
        const res = a.name.localeCompare(b.name);
        return state.sortMethod.endsWith('_desc') ? -res : res;
      } else if (state.sortMethod.startsWith('time')) {
        const res = (a.mtime || 0) - (b.mtime || 0);
        return state.sortMethod.endsWith('_desc') ? -res : res;
      } else if (state.sortMethod === 'custom') {
        const order = state.customOrders[parentPath || 'root'] || [];
        const idxA = order.indexOf(a.name);
        const idxB = order.indexOf(b.name);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    nodes.forEach(n => {
      if (n.type === 'directory' && n.children) {
        _sortNodesRecursively(n.children, n.path);
      }
    });
  }

  /**
   * ── NEW: INDEPENDENT HANDLERS ──
   * Các hàm này tách biệt logic nghiệp vụ khỏi UI
   */
  async function _handleToggle(node) {
    // Find the real node in the original treeData to avoid toggling clones
    const realNode = _findNodeByPath(treeData, node.path);
    if (!realNode || realNode.type !== 'directory') return;

    realNode.expanded = !realNode.expanded;

    // Persist expanded state
    if (realNode.expanded) {
      if (!state.expandedPaths.includes(realNode.path)) state.expandedPaths.push(realNode.path);
    } else {
      state.expandedPaths = state.expandedPaths.filter(p => p !== realNode.path);
    }
    localStorage.setItem('mdpreview_expanded_paths', JSON.stringify(state.expandedPaths));
    if (typeof AppState !== 'undefined' && AppState.savePersistentState) AppState.savePersistentState();

    render(true);
  }

  function _handleClick(e, node, itemEl) {
    const isMulti = e && (e.ctrlKey || e.metaKey);
    const isShift = e && e.shiftKey;
    const container = itemEl ? itemEl.closest('.ds-tree-view') : null;
    const isChevron = e && e.target && e.target.closest('.item-chevron-wrap');

    // 1. Handle Chevron Toggle (Independent of selection)
    if (isChevron && node.type === 'directory') {
      _handleToggle(node);
      return;
    }

    // 2. Handle Selection Logic
    if (isMulti) {
      const idx = state.selectedPaths.indexOf(node.path);
      if (idx > -1) state.selectedPaths.splice(idx, 1);
      else state.selectedPaths.push(node.path);
      render(true);
    } else if (isShift && container) {
      let lastPath = state.selectedPaths.length > 0 ? state.selectedPaths[state.selectedPaths.length - 1] : AppState.currentFile;
      const allItems = Array.from(container.querySelectorAll('.tree-item'));
      const startIdx = lastPath ? allItems.findIndex(el => el.dataset.path === lastPath) : -1;
      const endIdx = allItems.findIndex(el => el.dataset.path === node.path);

      if (startIdx > -1 && endIdx > -1) {
        const [min, max] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];
        for (let i = min; i <= max; i++) {
          const path = allItems[i].dataset.path;
          if (!state.selectedPaths.includes(path)) state.selectedPaths.push(path);
        }
      } else {
        if (!state.selectedPaths.includes(node.path)) state.selectedPaths.push(node.path);
      }
      render(true);
    } else {
      const wasAlreadySelected = state.selectedPaths.length === 1 && state.selectedPaths[0] === node.path;
      const isLabelClick = e && e.target && e.target.classList.contains('item-label');

      state.selectedPaths = [node.path];

      // Smart Click to Rename: If already selected and clicking label again (FILES ONLY)
      if (node.type === 'file' && wasAlreadySelected && isLabelClick) {
        _handleRename(null, node, itemEl);
        return;
      }

      // If clicking a directory (not chevron), we still toggle it for convenience
      // but we ALSO select it.
      if (node.type === 'directory') {
        _handleToggle(node);
      } else {
        if (window.loadFile && AppState.currentFile !== node.path) {
          window.loadFile(node.path).catch(_err => {
            console.warn('Failed to load file from tree click:', node.path);
          });
        }
      }

      render(true, node.path);
    }
  }

  async function _handleRename(e, node, _itemEl) {
    if (e && e.stopPropagation) e.stopPropagation();
    state.renamingPath = node.path;
    render(true); // Re-render to show input
  }

  function _handleDelete(e, node) {
    e.stopPropagation();
    if (typeof DesignSystem !== 'undefined') {
      DesignSystem.showConfirm({
        title: 'Delete File',
        message: `Are you sure you want to delete "${node.name}"? This action cannot be undone.`,
        onConfirm: async () => {
          const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
          const absPath = (wsPath + '/' + node.path).replace(/\/\//g, '/');
          const res = await FileService.deleteFile(absPath);
          if (res.success) {
            if (AppState.currentFile === node.path) AppState.currentFile = null;
            load();
          }
        }
      });
    }
  }

  function _handleContextMenu(e, node, itemEl) {
    e.preventDefault();

    // Check if clicked item is part of existing selection
    if (!state.selectedPaths.includes(node.path)) {
      state.selectedPaths = [node.path];
      render(true);
    }

    if (typeof DesignSystem !== 'undefined') {
      const isMulti = state.selectedPaths.length > 1;
      const isFolder = node.type === 'directory';

      let items = [];

      if (!isMulti) {
        // Determine where to create new items: current folder or sibling of current file
        const targetPath = isFolder ? node.path : (node.path.substring(0, node.path.lastIndexOf('/')) || 'root');
        const hiddenPaths = AppState.settings.hiddenPaths || [];
        const isHidden = hiddenPaths.includes(node.path);

        items = [
          { label: 'Rename', icon: 'edit', shortcut: 'Enter', onClick: () => _handleRename(e, node, itemEl) }
        ];

        if (isFolder) {
          items.push({ label: 'Collapse Other Folders', icon: 'chevrons-down-up', shortcut: '⇧⌘[', onClick: () => collapseOthers(node.path) });
          items.push({ divider: true });
        }

        if (!isHidden) {
          items.push(
            { label: 'Duplicate', icon: 'copy', shortcut: '⌘D', onClick: () => _handleDuplicate(e, node) },
            { divider: true },
            { label: 'New File', icon: 'file-plus', shortcut: '⌘N', onClick: () => _createNewItem(targetPath, 'file') },
            { label: 'New Folder', icon: 'folder-plus', shortcut: '⇧⌘N', onClick: () => _createNewItem(targetPath, 'directory') },
            { divider: true },
            { label: 'Import from System', icon: 'copy-plus', onClick: () => _handleImportFromSystem(node, 'copy') },
            { label: 'Move into Workspace', icon: 'folder-input', onClick: () => _handleImportFromSystem(node, 'move') },
            { divider: true }
          );
        } else {
          items.push({ divider: true });
        }

        items.push(
          { label: 'Reveal in Finder', icon: 'external-link', onClick: () => _handleRevealInFinder(e, node) },
          { label: 'Copy Relative Path', icon: 'clipboard', onClick: () => _handleCopyPath(node, 'relative') },
          { divider: true },
          { 
            label: isHidden ? 'Unhide' : 'Hide from Tree', 
            icon: isHidden ? 'eye' : 'eye-off', 
            shortcut: '⇧⌘H',
            onClick: () => _handleToggleHidden(node) 
          },
          { divider: true },
          { label: 'Delete', icon: 'trash', danger: true, shortcut: '⌘⌫', onClick: () => _handleDelete(e, node) }
        );
      } else {
        const pathsForBatch = [...state.selectedPaths];
        const hiddenPaths = AppState.settings.hiddenPaths || [];
        const isCurrentlyHidden = hiddenPaths.includes(node.path);

        items = [
          { 
            label: isCurrentlyHidden ? `Show (${pathsForBatch.length} items) in Tree` : `Hide (${pathsForBatch.length} items) from Tree`, 
            icon: isCurrentlyHidden ? 'eye' : 'eye-off', 
            onClick: () => _handleBatchToggleHidden(!isCurrentlyHidden, pathsForBatch) 
          },
          { label: `Delete (${pathsForBatch.length} items)`, icon: 'trash', danger: true, onClick: () => _handleBatchOp('delete') },
          { label: 'Copy Paths', icon: 'clipboard', onClick: () => _handleBatchCopyPaths() }
        ];
      }

      DesignSystem.createContextMenu(e, items);
    }
  }

  function _handleBatchCopyPaths() {
    const text = state.selectedPaths.join('\n');
    navigator.clipboard.writeText(text);
    if (typeof showToast === 'function') showToast(`Paths for ${state.selectedPaths.length} items copied`);
  }

  async function _handleDuplicate(e, node) {
    const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
    const absPath = (wsPath.replace(/\/$/, '') + '/' + node.path).replace(/\/\//g, '/');
    const res = await FileService.duplicateFile(absPath);
    if (res.success) {
      load();
    }
  }

  async function _handleRevealInFinder(e, node) {
    const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
    const absPath = (wsPath.replace(/\/$/, '') + '/' + node.path).replace(/\/\//g, '/');
    FileService.revealInFinder(absPath);
  }

  async function _handleImportFromSystem(targetNodeOrPath, mode = 'copy') {
    const filePaths = await FileService.openFiles({
      title: mode === 'move' ? 'Move Files into Workspace' : 'Import Files from System'
    });
    if (!filePaths || filePaths.length === 0) return;

    let targetDir = 'root';
    if (typeof targetNodeOrPath === 'object') {
      targetDir = targetNodeOrPath.type === 'directory' 
        ? targetNodeOrPath.path 
        : (targetNodeOrPath.path.substring(0, targetNodeOrPath.path.lastIndexOf('/')) || 'root');
    }

    const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
    const destFolderAbs = (wsPath.replace(/\/$/, '') + '/' + (targetDir === 'root' ? '' : targetDir)).replace(/\/\//g, '/');

    let successCount = 0;
    for (const srcAbs of filePaths) {
      const fileName = srcAbs.split(/[\\/]/).pop();
      const destAbs = (destFolderAbs + '/' + fileName).replace(/\/\//g, '/');
      
      let res;
      if (mode === 'move') {
        res = await FileService.moveFile(srcAbs, destAbs);
      } else {
        res = await FileService.copyFile(srcAbs, destAbs);
      }
      if (res.success) successCount++;
    }

    if (successCount > 0) {
      if (typeof showToast === 'function') showToast(`${mode === 'move' ? 'Moved' : 'Imported'} ${successCount} files`);
      load();
    }
  }

  function _handleCopyPath(node, type = 'relative') {
    const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
    const path = type === 'relative' ? node.path : (wsPath + '/' + node.path).replace(/\/\//g, '/');
    navigator.clipboard.writeText(path);
    if (typeof showToast === 'function') showToast('Path copied to clipboard');
  }

  function _handleMouseDown(e, node, itemEl) {
    if (e.button !== 0) return; // Chỉ chuột trái
    const isCustomOrder = state.sortMethod === 'custom';
    const context = { state, treeData, load, _findNodeByPath, handleToggleHidden: _handleToggleHidden, handleBatchToggleHidden: _handleBatchToggleHidden };
    if (isCustomOrder) TreeDragManager.initVIPDrag(e, itemEl, node, context);
    else TreeDragManager.initStandardDrag(e, itemEl, node, context);
  }

  function _handleMouseLeave(e, node, _itemEl) {
    if (TreeDragManager.getIsDragging()) return;
    if (node.type !== 'directory') return;
    const idx = state.selectedPaths.indexOf(node.path);
    if (idx > -1) {
      state.selectedPaths.splice(idx, 1);
      render(true);
    }
  }

  function _handleToggleHidden(node) {
    const hiddenPaths = AppState.settings.hiddenPaths || [];
    const isHiding = !hiddenPaths.includes(node.path);
    _handleBatchToggleHidden(isHiding, [node.path]);
  }

  async function _handleBatchToggleHidden(hide, explicitPaths = null, keepSelection = false) {
    const currentHidden = new Set(AppState.settings.hiddenPaths || []);
    const pathsToProcess = explicitPaths || [...state.selectedPaths];
    
    if (pathsToProcess.length === 0) return;

    pathsToProcess.forEach(p => {
      if (hide) {
        currentHidden.add(p);
        
        // Tab Sync: Close tab if file/folder is hidden
        if (typeof TabsModule !== 'undefined') {
          // Use a spread copy to avoid index shifting bugs when removing from state.openFiles
          const openFiles = [...(TabsModule.getOpenFiles() || [])];
          openFiles.forEach(f => {
            // Close if exact match or if file is inside hidden folder
            if (f === p || f.startsWith(p + '/')) {
              TabsModule.remove(f, true);
            }
          });
        }
      } else {
        currentHidden.delete(p);
      }
    });
    
    if (!keepSelection) state.selectedPaths = []; 
    
    await SettingsService.update('hiddenPaths', Array.from(currentHidden));
    
    if (typeof showToast === 'function') {
      showToast(`${hide ? 'Hidden' : 'Unhidden'} ${pathsToProcess.length} items`);
    }
    
    render(true);
  }

  function _findNodeByPath(nodes, path) {
    if (!path) return null;
    for (const n of nodes) {
      if (n.path === path) return n;
      if (n.children) {
        const found = _findNodeByPath(n.children, path);
        if (found) return found;
      }
    }
    return null;
  }

  function _showSortMenu(e) {
    const methods = [
      { id: 'alphabetical', label: 'Name', icons: { asc: 'sort-alpha-asc', desc: 'sort-alpha-desc' } },
      { id: 'time', label: 'Last Updated', icons: { asc: 'sort-time-asc', desc: 'sort-time-desc' } },
      { id: 'custom', label: 'Custom Order', icon: 'sort-custom' }
    ];

    const items = methods.map(m => {
      const isCurrent = state.sortMethod.startsWith(m.id);
      let displayIcon = '';
      let targetMethod = '';

      if (m.id === 'custom') {
        displayIcon = m.icon;
        targetMethod = 'custom';
      } else {
        const isDesc = isCurrent && state.sortMethod.endsWith('_desc');
        displayIcon = isDesc ? m.icons.desc : m.icons.asc;
        targetMethod = isCurrent 
          ? (state.sortMethod.endsWith('_asc') ? m.id + '_desc' : m.id + '_asc')
          : m.id + '_asc';
      }

      return {
        label: m.label,
        icon: displayIcon,
        active: isCurrent,
        onClick: () => {
          state.sortMethod = targetMethod;
          localStorage.setItem('mdpreview_sort_method', targetMethod);
          if (typeof AppState !== 'undefined') {
            AppState.settings.sortMethod = targetMethod;
            if (AppState.savePersistentState) AppState.savePersistentState();
          }
          _updateSortBtnIcon();
          load();
        }
      };
    });

    DesignSystem.createContextMenu(e, items);
  }

  /**
   * Helper to expand all parent directories for a given path
   */
  function _revealPath(path) {
    if (!path) return false;
    const segments = path.split('/');
    if (segments.length <= 1) return false;

    let changed = false;
    let currentPath = '';

    for (let i = 0; i < segments.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${segments[i]}` : segments[i];
      if (!state.expandedPaths.includes(currentPath)) {
        state.expandedPaths.push(currentPath);
        const node = _findNodeByPath(treeData, currentPath);
        if (node) node.expanded = true;
        changed = true;
      }
    }

    if (changed) {
      localStorage.setItem('mdpreview_expanded_paths', JSON.stringify(state.expandedPaths));
    }
    return changed;
  }

  function setActiveFile(filePath) {
    if (!filePath) return;

    // 0. Auto-expand parent folders if collapsed
    const changed = _revealPath(filePath);
    if (changed) {
      render(true);
    }

    const trees = document.querySelectorAll('.ds-tree-view');
    if (!trees.length) return;

    trees.forEach(container => {
      // 1. Remove active class from previously active item in THIS container
      const prev = container.querySelector('.tree-item.active');
      if (prev) {
        if (prev.dataset.path === filePath) return; // Already active in this container
        prev.classList.remove('active');
      }

      // 2. Add active class to the new path if it exists in THIS container
      const current = container.querySelector(`.tree-item[data-path="${filePath.replace(/"/g, '\\"')}"]`);
      if (current) {
        current.classList.add('active');
        
        // 3. Ensure it's scrolled into view
        requestAnimationFrame(() => {
          current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }
    });
  }

  function filterTree(nodes, q) {
    if (!q) return nodes;
    return nodes.reduce((acc, node) => {
      const matchSelf = node.name.toLowerCase().includes(q);
      if (node.type === 'directory') {
        const filteredChildren = filterTree(node.children, q);
        if (matchSelf || filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren, expanded: true });
        }
      } else if (matchSelf) {
        acc.push(node);
      }
      return acc;
    }, []);
  }

  function _hideContextMenu() {
    const existing = document.querySelector('.ctx-menu');
    if (existing) existing.remove();
  }

  // ── Multi-selection Helpers ─────────────────────────────
  function toggleSelect(path, _skipSync = false) {
    const idx = state.selectedPaths.indexOf(path);
    if (idx > -1) state.selectedPaths.splice(idx, 1);
    else state.selectedPaths.push(path);
    state.lastSelectedPath = path;
    _syncSelectionUI();
  }

  function _selectRange(path, skipSync = false) {
    const allVisible = Array.from(document.querySelectorAll('.tree-item'));
    const allPaths = allVisible.map(el => el.dataset.path);
    const startIdx = allPaths.indexOf(state.lastSelectedPath);
    const endIdx = allPaths.indexOf(path);
    if (startIdx === -1) { toggleSelect(path, skipSync); return; }
    const min = Math.min(startIdx, endIdx);
    const max = Math.max(startIdx, endIdx);
    const range = allPaths.slice(min, max + 1);
    state.selectedPaths = Array.from(new Set([...state.selectedPaths, ...range]));
    state.lastSelectedPath = path;
    _syncSelectionUI();
  }

  function deselectAll(_skipSync = false) {
    state.selectedPaths = [];
    state.lastSelectedPath = null;
    _syncSelectionUI();
  }

  function syncSelectionFromTabs(_paths) {
    // Disabled: Independent selection between Sidebar and TabBar
    /*
    state.selectedPaths = [...paths];
    _syncSelectionUI();
    */
  }

  function _syncSelectionUI() {
    document.querySelectorAll('.tree-item').forEach(el => {
      const path = el.dataset.path;
      const isActive = el.classList.contains('active');
      const isSelected = state.selectedPaths.includes(path) && !isActive;
      el.classList.toggle('selected', isSelected);
    });
  }

  async function _handleBatchOp(type) {
    const paths = [...state.selectedPaths];
    if (paths.length === 0) return;
    if (type === 'delete') {
      DesignSystem.showConfirm({
        title: 'Delete Items',
        message: `Delete ${paths.length} items?`,
        onConfirm: async () => {
          try {
            for (const p of paths) {
              const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
              const absPath = wsPath ? wsPath.replace(/\/$/, '') + '/' + p : p;
              await FileService.deleteFile(absPath);
            }
            state.selectedPaths = [];
            load();
          } catch (err) {
            if (typeof showToast === 'function') showToast(`Batch Error: ${err.message}`, 'error');
          }
        }
      });
      return;
    }
    const destFolder = await FileService.openFolder();
    if (!destFolder) return;
    for (const p of paths) {
      const fileName = p.split('/').pop();
      const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
      const srcAbs = wsPath ? wsPath.replace(/\/$/, '') + '/' + p : p;
      const destAbs = destFolder.replace(/\/$/, '') + '/' + fileName;
      if (type === 'move') await FileService.moveFile(srcAbs, destAbs);
      else await window.electronAPI.copyFile(srcAbs, destAbs);
    }
    state.selectedPaths = [];
    load();
  }



  async function _finishRename(node, newName, save) {
    const originalName = node.name;
    const oldPath = node.path;
    state.renamingPath = null; // Clear state

    if (save && newName && newName !== originalName) {
      if (!newName.toLowerCase().endsWith('.md') && node.type === 'file') newName += '.md';
      const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
      const oldAbs = (wsPath.replace(/\/$/, '') + '/' + oldPath).replace(/\/\//g, '/');
      const dir = oldPath.substring(0, oldPath.lastIndexOf('/') + 1);
      const newRelative = dir + newName;
      const newAbs = (wsPath.replace(/\/$/, '') + '/' + newRelative).replace(/\/\//g, '/');

      const res = await FileService.renameFile(oldAbs, newAbs);
      if (res.success) {
        TreeDragManager.syncCustomOrder(oldPath, newRelative, state);
        if (typeof RecentlyViewedModule !== 'undefined') RecentlyViewedModule.swap(oldPath, newRelative);
        if (AppState.currentFile === oldPath) AppState.currentFile = newRelative;
        load();
      } else {
        render(true);
      }
    } else {
      render(true);
    }
  }

  async function _createNewItem(parentPath, type) {
    const isRoot = parentPath === 'root';
    const parentData = isRoot ? treeData : _findNodeByPath(treeData, parentPath);

    if (!isRoot && parentData && parentData.type === 'directory') {
      parentData.expanded = true;
    }

    const siblings = isRoot ? treeData : (parentData ? parentData.children : []);
    let baseName = type === 'file' ? 'untitled.md' : 'New Folder';
    let newName = baseName;
    let counter = 1;

    const exists = (name) => siblings.some(s => s.name.toLowerCase() === name.toLowerCase());

    while (exists(newName)) {
      if (type === 'file') {
        newName = `untitled ${counter++}.md`;
      } else {
        newName = `New Folder ${counter++}`;
      }
    }

    const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
    const relativePath = isRoot ? newName : (parentPath.replace(/\/$/, '') + '/' + newName);
    const absPath = (wsPath.replace(/\/$/, '') + '/' + relativePath).replace(/\/\//g, '/');

    let res;
    if (type === 'file') {
      res = await FileService.createFile(absPath, '');
    } else {
      res = await FileService.createFolder(absPath);
    }

    if (res.success) {

      // Register in Custom Order if parent has one
      if (state.customOrders[parentPath]) {
        if (!state.customOrders[parentPath].includes(newName)) {
          state.customOrders[parentPath].push(newName);
          localStorage.setItem('mdpreview_custom_orders', JSON.stringify(state.customOrders));
          if (typeof AppState !== 'undefined' && AppState.savePersistentState) AppState.savePersistentState();
        }
      }

      await load();

      // Find the new element and start renaming it
      setTimeout(() => {
        const container = document.getElementById('file-tree');
        const newEl = container.querySelector(`.tree-item[data-path="${relativePath}"]`);
        if (newEl) {
          const newNode = _findNodeByPath(treeData, relativePath);
          if (newNode) _handleRename(null, newNode, newEl);
        }
      }, 100);
    } else {
      if (typeof showToast === 'function') showToast(`Error: ${res.error}`, 'error');
    }
  }

  function collapseAll() {
    const collapseNodes = (nodes) => {
      nodes.forEach(node => {
        if (node.type === 'directory') {
          node.expanded = false;
          if (node.children) collapseNodes(node.children);
        }
      });
    };
    collapseNodes(treeData);
    state.expandedPaths = [];
    localStorage.setItem('mdpreview_expanded_paths', JSON.stringify(state.expandedPaths));
    if (typeof AppState !== 'undefined' && AppState.savePersistentState) AppState.savePersistentState();
    render(true);
  }

  function collapseOthers(targetPath) {
    if (!targetPath) return;
    
    // Calculate paths to keep expanded (all parent segments)
    const segments = targetPath.split('/');
    const pathsToKeep = new Set();
    let current = '';
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      pathsToKeep.add(current);
    }

    const collapseExcept = (nodes) => {
      nodes.forEach(node => {
        if (node.type === 'directory') {
          if (!pathsToKeep.has(node.path)) {
            node.expanded = false;
          }
          if (node.children) collapseExcept(node.children);
        }
      });
    };
    
    collapseExcept(treeData);
    
    // Filter expandedPaths
    state.expandedPaths = state.expandedPaths.filter(p => pathsToKeep.has(p));
    localStorage.setItem('mdpreview_expanded_paths', JSON.stringify(state.expandedPaths));
    if (typeof AppState !== 'undefined' && AppState.savePersistentState) AppState.savePersistentState();
    render(true);
  }

  function _esc(t) {
    const div = document.createElement('div');
    div.textContent = t;
    return div.innerHTML;
  }


  function clear() {
    treeData = [];
    const container = document.getElementById('file-tree');
    if (container) container.innerHTML = '';
  }

  return {
    init,
    load,
    getTreeData: () => treeData,
    openFile: (path) => {
      const node = _findNodeByPath(treeData, path);
      if (node) _handleClick(null, node);
    },
    setActiveFile,
    clear,
    deselectAll,
    syncSelectionFromTabs,
    getState: () => state,
    // API for Components
    handleToggle: _handleToggle,
    handleClick: _handleClick,
    handleRename: _handleRename,
    finishRename: _finishRename,
    handleDelete: _handleDelete,
    handleContextMenu: _handleContextMenu,
    handleMouseDown: _handleMouseDown,
    handleBatchToggleHidden: _handleBatchToggleHidden, // Exported for multi-select
    collapseAll,
    collapseOthers,
    createNewFile: () => _handleNewItemShortcut('file'),
    createNewFolder: () => _handleNewItemShortcut('directory'),
    renameSelected: () => {
      if (state.selectedPaths.length === 1) {
        const path = state.selectedPaths[0];
        const el = document.querySelector(`.tree-item[data-path="${path}"]`);
        const node = _findNodeByPath(treeData, path);
        if (el && node) _handleRename(null, node, el);
      }
    },
    duplicateSelected: () => {
      if (state.selectedPaths.length === 1) {
        const path = state.selectedPaths[0];
        const node = _findNodeByPath(treeData, path);
        if (node) _handleDuplicate(null, node);
      }
    },
    deleteSelected: () => {
      if (state.selectedPaths.length > 0) _handleBatchOp('delete');
    },
    toggleHiddenItems: () => {
      if (state.selectedPaths.length > 0) {
        const firstPath = state.selectedPaths[0];
        const hiddenPaths = AppState.settings.hiddenPaths || [];
        const isHiding = !hiddenPaths.includes(firstPath);
        _handleBatchToggleHidden(isHiding, state.selectedPaths);
      }
    }
  };
})();

window.TreeModule = TreeModule;
