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

  let v2Component = null;
  let searchV2Component = null;

  const SORT_ICONS = {
    alphabetical_asc: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 13h6"/><path d="m2 16 4.5-9 4.5 9"/><path d="M18 16V7"/><path d="m14 11 4-4 4 4"/></svg>`, // lucide:a-arrow-up
    alphabetical_desc: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 13h6"/><path d="m2 16 4.5-9 4.5 9"/><path d="M18 7v9"/><path d="m14 12 4 4 4-4"/></svg>`, // lucide:a-arrow-down
    time_asc: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 18 4-4 4 4"/><path d="M16 2v4"/><path d="M18 22v-8"/><path d="M21 11.3V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.3"/><path d="M3 10h18"/><path d="M8 2v4"/></svg>`, // lucide:calendar-arrow-up
    time_desc: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 18 4 4 4-4"/><path d="M16 2v4"/><path d="M18 14v8"/><path d="M21 11.3V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.3"/><path d="M3 10h18"/><path d="M8 2v4"/></svg>`, // lucide:calendar-arrow-down
    custom: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.1 6.27a2 2 0 0 0 0 3.46l9.07 4.09a2 2 0 0 0 1.66 0l9.07-4.09a2 2 0 0 0 0-3.46z"/><path d="m2.1 14.73 9.07 4.09a2 2 0 0 0 1.66 0l9.07-4.09"/><path d="m2.1 10.54 9.07 4.09a2 2 0 0 0 1.66 0l9.07-4.09"/></svg>` // lucide:layers
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
          { label: 'New File', icon: 'file-plus', onClick: () => _createNewItem('root', 'file') },
          { label: 'New Folder', icon: 'folder-plus', onClick: () => _createNewItem('root', 'directory') }
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
      actions: [addBtn, sortBtn, searchBtn]
    });

    const mount = document.getElementById('file-explorer-header-mount');
    if (mount) {
      mount.innerHTML = '';
      mount.appendChild(header.render());
    }

    const searchMount = document.getElementById('search-results-header-mount');
    if (searchMount) {
      const searchHeader = new SidebarSectionHeader({
        title: 'SEARCH RESULTS'
      });
      searchMount.innerHTML = '';
      searchMount.appendChild(searchHeader.render());
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

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      // Ignore if user is typing in an input or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        deselectAll();
      }

      if (e.key === 'Enter' || e.key === 'F2') {
        if (state.selectedPaths.length === 1) {
          const path = state.selectedPaths[0];
          const container = document.getElementById('file-tree');
          const el = container.querySelector(`.tree-item[data-path="${path}"]`);
          const node = _findNodeByPath(treeData, path);
          if (el && node) _handleRename(null, node, el);
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedPaths.length > 0) {
          _handleBatchOp('delete');
        }
      }
    });

    // Root Context Menu & Scroll Mask
    const container = document.querySelector('.sidebar-tree-scroll');
    if (container) {
      container.addEventListener('scroll', () => {
        const scrolled = container.scrollTop > 0;
        container.style.setProperty('--top-fade', scrolled ? '16px' : '0px');
      });
      container.oncontextmenu = (e) => {
        // If clicking on an item, let its own context menu handle it
        if (e.target.closest('.tree-item')) return;

        e.preventDefault();
        e.stopPropagation();
        _hideContextMenu();

        const menu = document.createElement('div');
        menu.className = 'ctx-menu';
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;

        const newFileItem = document.createElement('div');
        newFileItem.className = 'ctx-item';
        newFileItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M9 15h6"/><path d="M12 12v6"/></svg> New File`;
        newFileItem.onclick = () => { _hideContextMenu(); _createNewItem('root', 'file'); };
        menu.appendChild(newFileItem);

        const newFolderItem = document.createElement('div');
        newFolderItem.className = 'ctx-item';
        newFolderItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><path d="M12 10v6"/><path d="M9 13h6"/></svg> New Folder`;
        newFolderItem.onclick = () => { _hideContextMenu(); _createNewItem('root', 'directory'); };
        menu.appendChild(newFolderItem);

        menu.appendChild(document.createElement('div')).className = 'ctx-divider';

        const openFinderItem = document.createElement('div');
        openFinderItem.className = 'ctx-item';
        openFinderItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> Open Workspace in Finder`;
        openFinderItem.onclick = () => {
          _hideContextMenu();
          if (typeof AppState !== 'undefined' && AppState.currentWorkspace) {
            FileService.revealInFinder(AppState.currentWorkspace.path);
          }
        };
        menu.appendChild(openFinderItem);

        document.body.appendChild(menu);
        const closeMenu = (ev) => { if (!menu.contains(ev.target)) _hideContextMenu(); };
        document.addEventListener('mousedown', closeMenu, { once: true });
      };
    }
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
    const container = document.getElementById('file-tree');
    if (container) {
      if (!v2Component) {
        v2Component = new TreeViewComponent({
          mount: container,
          onClick: _handleClick,
          onMouseDown: _handleMouseDown,
          onContextMenu: _handleContextMenu,
          onDelete: _handleDelete,
          onRename: _handleRename,
          onFinishRename: _finishRename,
          onMouseLeave: _handleMouseLeave,
          showSpacer: true
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

  function render(isQuickRender = false) {
    if (TreeDragManager.getIsDragging() && !isQuickRender) return;

    _sortNodesRecursively(treeData, '');
    const filtered = filterTree(treeData, currentQuery);

    // Initialize V2 Component if not exists
    if (!v2Component) {
      const container = document.getElementById('file-tree');
      if (container) {
        v2Component = new TreeViewComponent({
          mount: container,
          onClick: _handleClick,
          onMouseDown: _handleMouseDown,
          onContextMenu: _handleContextMenu,
          onDelete: _handleDelete,
          onRename: _handleRename,
          onFinishRename: _finishRename,
          onMouseLeave: _handleMouseLeave,
          showSpacer: true
        });
      }
    }

    // Update UI via V2 Component
    if (v2Component) {
      v2Component.update(
        filtered,
        state.selectedPaths,
        currentQuery,
        state.sortMethod,
        AppState.currentFile,
        state.renamingPath
      );
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
    if (node.type !== 'directory') return;
    node.expanded = !node.expanded;

    // Persist expanded state
    if (node.expanded) {
      if (!state.expandedPaths.includes(node.path)) state.expandedPaths.push(node.path);
    } else {
      state.expandedPaths = state.expandedPaths.filter(p => p !== node.path);
    }
    localStorage.setItem('mdpreview_expanded_paths', JSON.stringify(state.expandedPaths));
    if (typeof AppState !== 'undefined' && AppState.savePersistentState) AppState.savePersistentState();

    render(true);
  }

  function _handleClick(e, node, itemEl) {
    const isMulti = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;

    if (isMulti) {
      // Toggle selection
      const idx = state.selectedPaths.indexOf(node.path);
      if (idx > -1) state.selectedPaths.splice(idx, 1);
      else state.selectedPaths.push(node.path);
      render(true);
    } else if (isShift) {
      // Range selection
      let lastPath = state.selectedPaths.length > 0 ? state.selectedPaths[state.selectedPaths.length - 1] : AppState.currentFile;

      const container = document.getElementById('file-tree');
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
        // Fallback: If no starting point, just select this one
        if (!state.selectedPaths.includes(node.path)) state.selectedPaths.push(node.path);
      }
      render(true);
    } else {
      // Standard selection
      const wasAlreadySelected = state.selectedPaths.length === 1 && state.selectedPaths[0] === node.path;
      const isLabelClick = e.target.classList.contains('item-label');

      state.selectedPaths = [node.path];

      // Smart Click to Rename: If already selected and clicking label again (FILES ONLY)
      if (node.type === 'file' && wasAlreadySelected && isLabelClick) {
        _handleRename(null, node, itemEl);
        return;
      }

      if (node.type === 'directory') {
        _handleToggle(node);
      } else {
        if (window.loadFile) {
          window.loadFile(node.path).catch(err => {
            console.warn('Failed to load file from tree click:', node.path);
          });
        }
      }
      render(true);
    }
  }

  async function _handleRename(e, node, itemEl) {
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

        items = [
          { label: 'Rename', icon: 'edit', onClick: () => _handleRename(e, node, itemEl) },
          { label: 'Duplicate', icon: 'copy', onClick: () => _handleDuplicate(e, node) },
          { divider: true },
          { label: 'New File', icon: 'file-plus', onClick: () => _createNewItem(targetPath, 'file') },
          { label: 'New Folder', icon: 'folder-plus', onClick: () => _createNewItem(targetPath, 'directory') },
          { divider: true },
          { label: 'Reveal in Finder', icon: 'external-link', onClick: () => _handleRevealInFinder(e, node) },
          { label: 'Copy Relative Path', icon: 'clipboard', onClick: () => _handleCopyPath(node, 'relative') },
          { divider: true },
          { label: 'Delete', icon: 'trash', danger: true, onClick: () => _handleDelete(e, node) }
        ];
      } else {
        items = [
          { label: `Delete (${state.selectedPaths.length} items)`, icon: 'trash', danger: true, onClick: () => _handleBatchOp('delete') },
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

  function _handleCopyPath(node, type = 'relative') {
    const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
    const path = type === 'relative' ? node.path : (wsPath + '/' + node.path).replace(/\/\//g, '/');
    navigator.clipboard.writeText(path);
    if (typeof showToast === 'function') showToast('Path copied to clipboard');
  }

  function _handleMouseDown(e, node, itemEl) {
    if (e.button !== 0) return; // Chỉ chuột trái
    const isCustomOrder = state.sortMethod === 'custom';
    const context = { state, treeData, load, _findNodeByPath };
    if (isCustomOrder) TreeDragManager.initVIPDrag(e, itemEl, node, context);
    else TreeDragManager.initStandardDrag(e, itemEl, node, context);
  }

  function _handleMouseLeave(e, node, itemEl) {
    if (TreeDragManager.getIsDragging()) return;
    if (node.type !== 'directory') return;
    const idx = state.selectedPaths.indexOf(node.path);
    if (idx > -1) {
      state.selectedPaths.splice(idx, 1);
      render(true);
    }
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
    _hideContextMenu();
    const menu = document.createElement('div');
    menu.className = 'ctx-menu';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;

    const methods = [
      { id: 'alphabetical', label: 'Name', icons: { asc: SORT_ICONS.alphabetical_asc, desc: SORT_ICONS.alphabetical_desc } },
      { id: 'time', label: 'Last Updated', icons: { asc: SORT_ICONS.time_asc, desc: SORT_ICONS.time_desc } },
      { id: 'custom', label: 'Custom Order', icon: SORT_ICONS.custom }
    ];

    function setSortMethod(method) {
      state.sortMethod = method;
      localStorage.setItem('mdpreview_sort_method', method);
      if (typeof AppState !== 'undefined') {
        AppState.settings.sortMethod = method;
        if (AppState.savePersistentState) AppState.savePersistentState();
      }
      load();
    }

    methods.forEach(m => {
      const isCurrent = state.sortMethod.startsWith(m.id);
      const item = document.createElement('div');
      item.className = 'ctx-item' + (isCurrent ? ' active' : '');

      let displayIcon = '';
      if (m.id === 'custom') {
        displayIcon = m.icon;
      } else {
        const isDesc = isCurrent && state.sortMethod.endsWith('_desc');
        displayIcon = isDesc ? m.icons.desc : m.icons.asc;
      }

      let checkmark = isCurrent ? `<svg style="margin-left:auto;" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` : '';

      item.innerHTML = `${displayIcon} <span>${m.label}</span> ${checkmark}`;
      item.onclick = () => {
        if (m.id === 'custom') {
          setSortMethod('custom');
        } else {
          if (state.sortMethod === m.id + '_asc') setSortMethod(m.id + '_desc');
          else setSortMethod(m.id + '_asc');
        }
        _updateSortBtnIcon();
        _hideContextMenu();
        render();
      };
      menu.appendChild(item);
    });

    document.body.appendChild(menu);
    const closeMenu = (ev) => { if (!menu.contains(ev.target)) _hideContextMenu(); };
    document.addEventListener('mousedown', closeMenu, { once: true });
  }

  function search(q) {
    currentQuery = (q || '').toLowerCase();
    const resultsCont = document.getElementById('search-results-list');
    const resultsSection = document.getElementById('search-results-section');
    if (resultsSection) resultsSection.classList.toggle('hidden', !currentQuery);

    if (resultsCont) {
      if (currentQuery) {
        const matches = _flattenAndFilter(treeData || [], currentQuery);

        if (!searchV2Component) {
          searchV2Component = new TreeViewComponent({
            mount: resultsCont,
            onClick: _handleClick,
            onMouseDown: _handleMouseDown,
            onContextMenu: _handleContextMenu,
            onDelete: _handleDelete,
            onRename: _handleRename,
            onFinishRename: _finishRename,
            showSpacer: true
          });
        }

        searchV2Component.update(matches, state.selectedPaths, currentQuery, state.sortMethod, AppState.currentFile, state.renamingPath);
      } else {
        resultsCont.innerHTML = '';
      }
    }
    render();
  }

  function _flattenAndFilter(nodes, q) {
    let out = [];
    nodes.forEach(n => {
      if (n.type === 'file' && n.name.toLowerCase().includes(q)) out.push(n);
      if (n.type === 'directory' && n.children) out = out.concat(_flattenAndFilter(n.children, q));
    });
    return out;
  }

  function setActiveFile(filePath) {
    const container = document.getElementById('file-tree');
    if (!container) return;

    // 1. Remove active class from previously active item
    const prev = container.querySelector('.tree-item.active');
    if (prev) {
      if (prev.dataset.path === filePath) return; // Already active, skip
      prev.classList.remove('active');
    }

    // 2. Add active class to the new path
    if (filePath) {
      // Use attribute selector for O(1) targeted DOM search instead of queryAll
      const current = container.querySelector(`.tree-item[data-path="${filePath.replace(/"/g, '\\"')}"]`);
      if (current) current.classList.add('active');
    }
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
  function toggleSelect(path, skipSync = false) {
    const idx = state.selectedPaths.indexOf(path);
    if (idx > -1) state.selectedPaths.splice(idx, 1);
    else state.selectedPaths.push(path);
    state.lastSelectedPath = path;
    _syncSelectionUI();
    if (!skipSync && typeof TabsModule !== 'undefined') TabsModule.syncSelectionFromTree(state.selectedPaths);
  }

  function selectRange(path, skipSync = false) {
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
    if (!skipSync && typeof TabsModule !== 'undefined') TabsModule.syncSelectionFromTree(state.selectedPaths);
  }

  function deselectAll(skipSync = false) {
    state.selectedPaths = [];
    state.lastSelectedPath = null;
    _syncSelectionUI();
    if (!skipSync && typeof TabsModule !== 'undefined') TabsModule.syncSelectionFromTree([]);
  }

  function syncSelectionFromTabs(paths) {
    state.selectedPaths = [...paths];
    _syncSelectionUI();
  }

  function _syncSelectionUI() {
    document.querySelectorAll('.tree-item').forEach(el => {
      const isSelected = state.selectedPaths.includes(el.dataset.path);
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
    search,
    setActiveFile,
    clear,
    deselectAll,
    syncSelectionFromTabs,
    // API for Components
    handleToggle: _handleToggle,
    handleClick: _handleClick,
    handleRename: _handleRename,
    finishRename: _finishRename,
    handleDelete: _handleDelete,
    handleContextMenu: _handleContextMenu,
    handleMouseDown: _handleMouseDown
  };
})();

window.TreeModule = TreeModule;
