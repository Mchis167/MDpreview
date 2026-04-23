/* ============================================================
   tree.js — Sidebar File Tree logic with Sorting and DND
   ============================================================ */

const TreeModule = (() => {
  let treeData = [];
  let currentQuery = '';
  const state = {
    selectedPaths: [],
    lastSelectedPath: null,
    sortMethod: localStorage.getItem('mdpreview_sort_method') || 'alphabetical_asc',
    customOrders: JSON.parse(localStorage.getItem('mdpreview_custom_orders') || '{}')
  };

  const svgChevronDown = `<svg class="item-chevron" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
  const svgFolder = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`;
  const svgFile = `<svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.33341 6L7.33341 4L5.33341 2M2.66675 2L0.666748 4L2.66675 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const SORT_ICONS = {
    alphabetical_asc: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 13h6"/><path d="m2 16 4.5-9 4.5 9"/><path d="M18 16V7"/><path d="m14 11 4-4 4 4"/></svg>`, // lucide:a-arrow-up
    alphabetical_desc: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 13h6"/><path d="m2 16 4.5-9 4.5 9"/><path d="M18 7v9"/><path d="m14 12 4 4 4-4"/></svg>`, // lucide:a-arrow-down
    time_asc: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 18 4-4 4 4"/><path d="M16 2v4"/><path d="M18 22v-8"/><path d="M21 11.3V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.3"/><path d="M3 10h18"/><path d="M8 2v4"/></svg>`, // lucide:calendar-arrow-up
    time_desc: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 18 4 4 4-4"/><path d="M16 2v4"/><path d="M18 14v8"/><path d="M21 11.3V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.3"/><path d="M3 10h18"/><path d="M8 2v4"/></svg>`, // lucide:calendar-arrow-down
    custom: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.1 6.27a2 2 0 0 0 0 3.46l9.07 4.09a2 2 0 0 0 1.66 0l9.07-4.09a2 2 0 0 0 0-3.46z"/><path d="m2.1 14.73 9.07 4.09a2 2 0 0 0 1.66 0l9.07-4.09"/><path d="m2.1 10.54 9.07 4.09a2 2 0 0 0 1.66 0l9.07-4.09"/></svg>` // lucide:layers
  };

  function init() {
    const sortBtn = document.getElementById('sort-btn');
    if (sortBtn) {
      _updateSortBtnIcon();
      sortBtn.onclick = (e) => {
        e.stopPropagation();
        _showSortMenu(e);
      };
    }

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

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedPaths.length > 0) {
          _handleBatchOp('delete');
        }
      }
    });

    // Root Context Menu
    const container = document.querySelector('.sidebar-tree-scroll');
    if (container) {
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

        const newDraftItem = document.createElement('div');
        newDraftItem.className = 'ctx-item';
        newDraftItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> New Draft`;
        newDraftItem.onclick = () => { 
          _hideContextMenu(); 
          if (typeof AppState !== 'undefined' && typeof AppState.onModeChange === 'function') {
            AppState.onModeChange('draft');
          }
        };
        menu.appendChild(newDraftItem);

        document.body.appendChild(menu);
        const closeMenu = (ev) => { if (!menu.contains(ev.target)) _hideContextMenu(); };
        document.addEventListener('mousedown', closeMenu, { once: true });
      };
    }
  }

  function _updateSortBtnIcon() {
    const sortBtn = document.getElementById('sort-btn');
    if (!sortBtn) return;
    const icon = SORT_ICONS[state.sortMethod] || SORT_ICONS.custom;
    sortBtn.innerHTML = icon;
  }

  let isGlobalDragging = false;

  async function load() {
    if (isGlobalDragging) return; // Block loading while dragging
    // ... rest of load logic
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
    const query = new URLSearchParams({
      showHidden: !!showHidden,
      hideEmpty:  !!hideEmptyFolders,
      flat:       !!flatView
    });

    const res = await fetch(`/api/files?${query}`).catch(() => null);
    if (!res || !res.ok) return;
    const newData = await res.json();
    
    const restoreExpanded = (nodes) => {
      nodes.forEach(n => {
        if (n.type === 'directory') {
          if (expandedPaths.has(n.path)) n.expanded = true;
          if (n.children) restoreExpanded(n.children);
        }
      });
    };
    restoreExpanded(newData);

    treeData = newData;
    render();
  }

  function render(isQuickRender = false) {
    if (isGlobalDragging && !isQuickRender) return; 
    
    currentStagger = 0;
    const container = document.getElementById('file-tree');
    if (!container) return;

    _sortNodesRecursively(treeData, '');
    const filtered = filterTree(treeData, currentQuery);
    
    if (filtered.length === 0) {
      container.innerHTML = '<div style="padding:20px; color:rgba(255,255,255,0.2); font-size:12px; text-align:center;">No files found.</div>';
      return;
    }

    const renderNodes = (nodes, parentEl) => {
      const fragment = document.createDocumentFragment();
      nodes.forEach(node => {
        if (isQuickRender) currentStagger = 0;
        const el = createNodeEl(node);
        fragment.appendChild(el);
      });
      parentEl.appendChild(fragment);
    };

    const newFragment = document.createDocumentFragment();
    renderNodes(filtered, newFragment);
    container.replaceChildren(...newFragment.childNodes);
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

  let currentStagger = 0;
  function createNodeEl(node) {
    const idx = currentStagger++;
    const wrapper = document.createElement('div');
    wrapper.dataset.nodeId = Math.random().toString(36).substring(2, 9); // Identity Tag
    wrapper.className = 'tree-node-wrapper';

    const isSelected = state.selectedPaths.includes(node.path);
    const itemEl = document.createElement('div');
    itemEl.className = 'tree-item ' + (node.type === 'directory' ? 'tree-item-directory' : 'tree-item-file') + (node.path === AppState.currentFile ? ' active' : '') + (isSelected ? ' selected' : '');
    itemEl.style.setProperty('--stagger', idx);
    
    // Enable dragging for all modes (Move vs Reorder)
    itemEl.draggable = true;
    
    const icon = node.type === 'directory' ? svgFolder : svgFile;
    const chevron = node.type === 'directory' ? svgChevronDown : '<span style="width:12px;flex-shrink:0;"></span>';
    const trashIcon = `
      <div class="item-delete-btn" title="Delete ${node.type}">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      </div>`;

    itemEl.dataset.path = node.path;
    itemEl.innerHTML = `
      ${chevron}
      <div class="item-icon-wrap">${icon}</div>
      <span class="item-label" title="${_esc(node.name)}">${_esc(node.name)}</span>
      ${trashIcon}
    `;

    const childrenCont = document.createElement('div');
    childrenCont.className = 'folder-children' + (node.expanded ? '' : ' hidden');
    
    const renderChildren = () => {
      if (node.children && childrenCont.innerHTML === '') {
        const fragment = document.createDocumentFragment();
        node.children.forEach(child => {
          fragment.appendChild(createNodeEl(child));
        });
        childrenCont.appendChild(fragment);
      }
    };

    if (node.type === 'directory' && node.expanded) {
      renderChildren();
    }

    // ── Interaction: Click ──────────────────────────────────
    itemEl.onclick = (e) => {
      e.stopPropagation();
      const isMod = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      if (isShift) selectRange(node.path);
      else if (isMod) toggleSelect(node.path);
      else {
        state.selectedPaths = [node.path];
        state.lastSelectedPath = node.path;
        if (node.type === 'directory') {
          node.expanded = !node.expanded;
          if (node.expanded) {
            renderChildren();
            childrenCont.classList.remove('hidden');
          } else {
            childrenCont.classList.add('hidden');
          }
          const c = itemEl.querySelector('.item-chevron');
          if (c) c.style.transform = node.expanded ? 'rotate(0)' : 'rotate(-90deg)';
        } else {
          loadFile(node.path);
        }
      }
      _syncSelectionUI();
    };

    // ── VIP Drag & Drop Engine ──────────────────────────────
    itemEl.onmousedown = (e) => {
      // Only allow dragging with Left Click
      if (e.button !== 0) return;
      // Don't drag if clicking buttons
      if (e.target.closest('.item-delete-btn') || e.target.closest('.item-chevron')) return;

      if (state.sortMethod === 'custom') {
        _initVIPDrag(e, itemEl, node);
      } else {
        _initStandardDrag(e, itemEl, node);
      }
    };

    // Remove legacy DND handlers as they are no longer needed
    itemEl.draggable = false;
    itemEl.ondragstart = null;
    itemEl.ondragover = null;
    itemEl.ondragleave = null;
    itemEl.ondrop = null;
    itemEl.ondragend = null;

    // ── Interaction: Double Click (Rename) ──────────────────
    const label = itemEl.querySelector('.item-label');
    label.ondblclick = (e) => {
      e.stopPropagation();
      _startRename(itemEl, node);
    };

    // ── Interaction: Delete Button ──────────────────────────
    const deleteBtn = itemEl.querySelector('.item-delete-btn');
    if (deleteBtn) {
      deleteBtn.onclick = async (e) => {
        e.stopPropagation();
        const fileName = node.name;
        DesignSystem.showConfirm({
          title: 'Delete Item',
          message: `Are you sure you want to delete "${fileName}"? This action cannot be undone.`,
          onConfirm: async () => {
            try {
              const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
              const absPath = wsPath ? wsPath.replace(/\/$/, '') + '/' + node.path : node.path;
              const result = await window.electronAPI.deleteFile(absPath);
              if (result.success) {
                if (typeof showToast === 'function') showToast(`Deleted ${fileName}`);
                if (typeof RecentlyViewedModule !== 'undefined') RecentlyViewedModule.remove(node.path);
                if (AppState.currentFile === node.path) {
                  AppState.currentFile = null;
                  if (typeof setNoFile === 'function') setNoFile();
                }
                load();
              } else {
                if (typeof showToast === 'function') showToast(`Error: ${result.error}`, 'error');
              }
            } catch (err) {
              if (typeof showToast === 'function') showToast(`System Error: ${err.message}`, 'error');
            }
          }
        });
      };
    }

    // ── Interaction: Context Menu ───────────────────────────
    itemEl.oncontextmenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      _hideContextMenu();

      if (!state.selectedPaths.includes(node.path)) {
        state.selectedPaths = [node.path];
        state.lastSelectedPath = node.path;
        _syncSelectionUI();
      }

      const isBatch = state.selectedPaths.length > 1;
      const menu = document.createElement('div');
      menu.className = 'ctx-menu';
      menu.style.left = `${e.clientX}px`;
      menu.style.top = `${e.clientY}px`;

      if (!isBatch) {
        const newFileItem = document.createElement('div');
        newFileItem.className = 'ctx-item';
        newFileItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M9 15h6"/><path d="M12 12v6"/></svg> New File`;
        newFileItem.onclick = () => { 
          _hideContextMenu(); 
          const parentPath = node.type === 'directory' ? node.path : (node.path.substring(0, node.path.lastIndexOf('/')) || 'root');
          _createNewItem(parentPath, 'file'); 
        };
        menu.appendChild(newFileItem);

        const newFolderItem = document.createElement('div');
        newFolderItem.className = 'ctx-item';
        newFolderItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><path d="M12 10v6"/><path d="M9 13h6"/></svg> New Folder`;
        newFolderItem.onclick = () => { 
          _hideContextMenu(); 
          const parentPath = node.type === 'directory' ? node.path : (node.path.substring(0, node.path.lastIndexOf('/')) || 'root');
          _createNewItem(parentPath, 'directory'); 
        };
        menu.appendChild(newFolderItem);

        menu.appendChild(document.createElement('div')).className = 'ctx-divider';

        const renameItem = document.createElement('div');
        renameItem.className = 'ctx-item';
        renameItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg> Rename`;
        renameItem.onclick = () => { _hideContextMenu(); _startRename(itemEl, node); };
        menu.appendChild(renameItem);

        const duplicateItem = document.createElement('div');
        duplicateItem.className = 'ctx-item';
        duplicateItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> Duplicate`;
        duplicateItem.onclick = async () => {
          _hideContextMenu();
          const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
          const absPath = wsPath ? wsPath.replace(/\/$/, '') + '/' + node.path : node.path;
          const res = await window.electronAPI.duplicateFile(absPath);
          if (res.success) {
            if (typeof showToast === 'function') showToast('File duplicated');
            load();
          }
        };
        menu.appendChild(duplicateItem);
      }

      const moveItem = document.createElement('div');
      moveItem.className = 'ctx-item';
      moveItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H9a7 7 0 0 0 0 14h1"/></svg> Move to...`;
      moveItem.onclick = () => { _hideContextMenu(); _handleBatchOp('move'); };
      menu.appendChild(moveItem);

      const copyItem = document.createElement('div');
      copyItem.className = 'ctx-item';
      copyItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> Copy to...`;
      copyItem.onclick = () => { _hideContextMenu(); _handleBatchOp('copy'); };
      menu.appendChild(copyItem);

      menu.appendChild(document.createElement('div')).className = 'ctx-divider';

      const deleteItem = document.createElement('div');
      deleteItem.className = 'ctx-item';
      deleteItem.style.color = '#ff4d4d';
      deleteItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> ${isBatch ? `Delete ${state.selectedPaths.length} items` : 'Delete'}`;
      deleteItem.onclick = () => { _hideContextMenu(); _handleBatchOp('delete'); };
      menu.appendChild(deleteItem);

      document.body.appendChild(menu);
      const closeMenu = (ev) => { if (!menu.contains(ev.target)) _hideContextMenu(); };
      document.addEventListener('mousedown', closeMenu, { once: true });
    };

    if (node.type === 'directory') {
      const c = itemEl.querySelector('.item-chevron');
      if (c) c.style.transform = node.expanded ? 'rotate(0)' : 'rotate(-90deg)';
      wrapper.appendChild(itemEl);
      wrapper.appendChild(childrenCont);
    } else {
      wrapper.appendChild(itemEl);
    }

    return wrapper;
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
          state.sortMethod = 'custom';
        } else {
          if (state.sortMethod === m.id + '_asc') state.sortMethod = m.id + '_desc';
          else state.sortMethod = m.id + '_asc';
        }
        localStorage.setItem('mdpreview_sort_method', state.sortMethod);
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
      if (!currentQuery) {
        resultsCont.innerHTML = '';
      } else {
        const matches = _flattenAndFilter(treeData || [], currentQuery);
        resultsCont.innerHTML = '';
        if (matches.length === 0) {
          resultsCont.innerHTML = `<div style="padding:32px 0; opacity:0.5; text-align:center;">No files found.</div>`;
        } else {
          const fragment = document.createDocumentFragment();
          matches.forEach(m => {
            const el = createNodeEl(m);
            el.onclick = (e) => { e.stopPropagation(); loadFile(m.path); };
            fragment.appendChild(el);
          });
          resultsCont.appendChild(fragment);
        }
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
    document.querySelectorAll('.tree-item').forEach(el => {
      el.classList.toggle('active', el.dataset.path === filePath);
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
              await window.electronAPI.deleteFile(absPath);
            }
            if (typeof showToast === 'function') showToast(`Deleted ${paths.length} items`);
            state.selectedPaths = [];
            load();
          } catch (err) {
            if (typeof showToast === 'function') showToast(`Batch Error: ${err.message}`, 'error');
          }
        }
      });
      return;
    }
    const destFolder = await window.electronAPI.openFolder();
    if (!destFolder) return;
    for (const p of paths) {
      const fileName = p.split('/').pop();
      const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
      const srcAbs = wsPath ? wsPath.replace(/\/$/, '') + '/' + p : p;
      const destAbs = destFolder.replace(/\/$/, '') + '/' + fileName;
      if (type === 'move') await window.electronAPI.moveFile(srcAbs, destAbs);
      else await window.electronAPI.copyFile(srcAbs, destAbs);
    }
    state.selectedPaths = [];
    load();
  }

  async function _startRename(itemEl, node) {
    const label = itemEl.querySelector('.item-label');
    const originalName = node.name;
    label.innerHTML = '';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-rename-input';
    input.value = originalName;
    label.appendChild(input);
    input.select();
    input.focus();
    const finish = async (save) => {
      if (input._done) return;
      input._done = true;
      let newName = input.value.trim();
      if (save && newName && newName !== originalName) {
        if (!newName.toLowerCase().endsWith('.md') && node.type === 'file') newName += '.md';
        const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
        const oldAbs = (wsPath.replace(/\/$/, '') + '/' + node.path).replace(/\/\//g, '/');
        const dir = node.path.substring(0, node.path.lastIndexOf('/') + 1);
        const newRelative = dir + newName;
        const newAbs = (wsPath.replace(/\/$/, '') + '/' + newRelative).replace(/\/\//g, '/');
        const res = await window.electronAPI.renameFile(oldAbs, newAbs);
        if (res.success) {
          _syncCustomOrder(node.path, newRelative);
          if (typeof RecentlyViewedModule !== 'undefined') RecentlyViewedModule.swap(node.path, newRelative);
          if (AppState.currentFile === node.path) AppState.currentFile = newRelative;
          load();
        } else label.innerText = originalName;
      } else label.innerText = originalName;
    };
    input.onblur = () => finish(true);
    input.onkeydown = (e) => {
      if (e.key === 'Enter') finish(true);
      if (e.key === 'Escape') finish(false);
    };
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
      res = await window.electronAPI.createFile(absPath, '');
    } else {
      res = await window.electronAPI.createFolder(absPath);
    }

    if (res.success) {
      if (typeof showToast === 'function') showToast(`Created ${type}: ${newName}`);
      
      // Register in Custom Order if parent has one
      if (state.customOrders[parentPath]) {
        if (!state.customOrders[parentPath].includes(newName)) {
          state.customOrders[parentPath].push(newName);
          localStorage.setItem('mdpreview_custom_orders', JSON.stringify(state.customOrders));
        }
      }

      await load();
      
      // Find the new element and start renaming it
      setTimeout(() => {
        const newEl = document.querySelector(`.tree-item[data-path="${relativePath}"]`);
        if (newEl) {
          const newNode = _findNodeByPath(treeData, relativePath);
          if (newNode) _startRename(newEl, newNode);
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

  // ── VIP Drag Engine Implementation ───────────────────────
  let dragProxy = null;
  let dragStartY = 0;
  let dragStartX = 0;
  let dragStartRect = null;
  let dragItemHeight = 0;
  let dragScrollCont = null;
  let dragInitialScroll = 0;

  function _initVIPDrag(e, itemEl, node) {
    isGlobalDragging = true;
    dragStartY = e.clientY;
    dragStartX = e.clientX;
    dragStartRect = itemEl.getBoundingClientRect();
    dragItemHeight = dragStartRect.height;
    dragScrollCont = document.querySelector('.sidebar-tree-scroll');
    dragInitialScroll = dragScrollCont ? dragScrollCont.scrollTop : 0;

    // 1. BUILD VISUAL MAP (Flattened Tree)
    const treeContainer = document.getElementById('file-tree');
    const allWrappers = Array.from(treeContainer.querySelectorAll('.tree-node-wrapper'));
    const visualMap = allWrappers.map(wrapper => {
      const item = wrapper.querySelector('.tree-item');
      if (!item) return null;
      const path = item.dataset.path;
      const rect = item.getBoundingClientRect();
      const level = (path.match(/\//g) || []).length;
      return { el: item, wrapper, path, level, rect, type: item.classList.contains('tree-item-directory') ? 'directory' : 'file' };
    }).filter(Boolean);

    // Multi-selection
    const isItemSelected = state.selectedPaths.includes(node.path);
    const draggedItems = isItemSelected 
      ? state.selectedPaths.map(p => {
          const m = visualMap.find(item => item.path === p);
          return m ? { path: p, name: p.split('/').pop(), el: m.el, wrapper: m.wrapper, type: m.type } : null;
        }).filter(Boolean)
      : [{ path: node.path, name: node.name, el: itemEl, wrapper: itemEl.closest('.tree-node-wrapper'), type: node.type }];

    // Auto-collapse dragged folder
    if (node.type === 'directory' && node.expanded) {
      node.expanded = false;
      const childrenCont = itemEl.closest('.tree-node-wrapper').querySelector('.folder-children');
      if (childrenCont) childrenCont.style.display = 'none';
      const icon = itemEl.querySelector('.tree-item-icon i');
      if (icon) icon.className = 'ri-folder-fill';
    }

    let currentX = e.clientX;
    let isDraggingStarted = false;
    let animationFrameId = null;
    let currentY = e.clientY;

    // State of the current "Drop Target"
    let target = {
      parentPath: '', // '' means root
      index: 0,
    };

    const updateUI = () => {
      if (!dragProxy) return;

      const deltaY = currentY - dragStartY;
      const scrollDelta = dragScrollCont ? (dragScrollCont.scrollTop - dragInitialScroll) : 0;
      dragProxy.style.transform = `translateY(${deltaY + scrollDelta}px) scale(1.02)`;

      // 1. BINARY SEARCH for nearest item (O(log N))
      let low = 0, high = visualMap.length - 1;
      while (low <= high) {
        let mid = (low + high) >> 1;
        let midCenter = (visualMap[mid].rect.top - scrollDelta) + visualMap[mid].rect.height / 2;
        if (currentY < midCenter) high = mid - 1;
        else low = mid + 1;
      }
      let nearestIdx = Math.max(0, Math.min(visualMap.length - 1, high));

      if (nearestIdx !== -1) {
        const near = visualMap[nearestIdx];
        const nearTop = near.rect.top - scrollDelta;
        const nearBottom = near.rect.bottom - scrollDelta;
        
        // Find if we are actually closer to the item below nearestIdx
        const isOverTop = currentY < (nearTop + near.rect.height / 3);
        const isOverBottom = currentY > (nearBottom - near.rect.height / 3);
        const isOverMiddle = !isOverTop && !isOverBottom;

        let splitIdx = nearestIdx; 
        
        if (near.type === 'directory' && isOverMiddle && !draggedItems.some(di => di.path === near.path)) {
          // ACTION: Move INTO directory
          target = { parentPath: near.path, index: 0, level: near.level + 1, type: 'into', y: nearTop + near.rect.height / 2 };
          splitIdx = -1; 
        } else {
          // ACTION: Move BETWEEN items
          const yPos = isOverTop ? nearTop : nearBottom;
          if (isOverBottom) splitIdx++; 
          
          const xDelta = currentX - dragStartX;
          const levelShift = Math.round(xDelta / 20); 
          
          let dropLevel = near.level;
          let dropParent = near.path.substring(0, near.path.lastIndexOf('/')) || '';
          
          if (levelShift < 0) {
            for (let i = 0; i < Math.abs(levelShift); i++) {
              if (dropParent) {
                dropLevel--;
                dropParent = dropParent.substring(0, dropParent.lastIndexOf('/')) || '';
              }
            }
          }

          target = { parentPath: dropParent, level: dropLevel, type: 'between', y: yPos, nearPath: near.path, isAfter: isOverBottom };
        }

        // 2. OPTIMIZED SPREADING (Change Detection)
        const draggedPathsMap = new Set(draggedItems.map(di => di.path));
        let draggedSoFar = 0;

        visualMap.forEach((m, idx) => {
          const isBeingDragged = draggedPathsMap.has(m.path);
          if (isBeingDragged) {
            draggedSoFar++;
            return;
          }
          
          let offset = 0;
          if (draggedSoFar > 0) offset -= (dragItemHeight * draggedSoFar);
          if (splitIdx !== -1 && idx >= splitIdx) offset += (dragItemHeight * draggedItems.length);
          
          // Performance: Only update DOM if transform actually changed
          const currentTransform = m.el.style.transform;
          const newTransform = offset !== 0 ? `translateY(${offset}px)` : '';
          if (currentTransform !== newTransform) {
            m.el.style.transform = newTransform;
          }
        });
      }

      if (dragScrollCont) {
        const rect = dragScrollCont.getBoundingClientRect();
        const threshold = 60;
        if (currentY < rect.top + threshold) dragScrollCont.scrollTop -= 5;
        if (currentY > rect.bottom - threshold) dragScrollCont.scrollTop += 5;
      }

      animationFrameId = requestAnimationFrame(updateUI);
    };

    const onMouseMove = (moveEvent) => {
      currentY = moveEvent.clientY;
      currentX = moveEvent.clientX;
      const dist = Math.sqrt(Math.pow(currentY - dragStartY, 2) + Math.pow(currentX - dragStartX, 2));

      if (!isDraggingStarted && dist > 5) {
        isDraggingStarted = true;
        
        dragProxy = itemEl.cloneNode(true);
        dragProxy.classList.add('is-dragging-vip');
        dragProxy.style.width = `${dragStartRect.width}px`;
        dragProxy.style.height = `${dragStartRect.height}px`;
        dragProxy.style.left = `${dragStartRect.left}px`;
        dragProxy.style.top = `${dragStartRect.top}px`;
        
        if (draggedItems.length > 1) {
          const badge = document.createElement('div');
          badge.className = 'drag-badge';
          badge.style.cssText = 'position:absolute; top:-8px; right:-8px; background:var(--accent-color); color:#000; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold; box-shadow:0 2px 8px rgba(0,0,0,0.3);';
          badge.innerText = draggedItems.length;
          dragProxy.appendChild(badge);
          dragProxy.style.boxShadow = '4px 4px 0 rgba(255,255,255,0.1), 8px 8px 0 rgba(255,255,255,0.05)';
        }

        document.body.appendChild(dragProxy);

        treeContainer.classList.add('is-dragging-active');
        draggedItems.forEach(di => di.wrapper.classList.add('tree-item-placeholder'));
        animationFrameId = requestAnimationFrame(updateUI);
      }
    };

    const onMouseUp = async () => {
      const treeContainer = document.getElementById('file-tree');
      if (treeContainer) treeContainer.classList.remove('is-dragging-active');
      visualMap.forEach(m => {
        m.el.style.transform = '';
      });

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      if (!isDraggingStarted) {
        isGlobalDragging = false;
        return;
      }

      if (dragProxy) {
        const destParentPath = target.parentPath;
        const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
        
        // Calculate new index in target parent
        let orderKey = destParentPath || 'root';
        let currentOrder = [...(state.customOrders[orderKey] || [])];
        if (currentOrder.length === 0) {
          const pNode = destParentPath === '' ? treeData : _findNodeByPath(treeData, destParentPath);
          currentOrder = (pNode ? (destParentPath === '' ? pNode : pNode.children) : []).map(c => c.name);
        }

        // Logic for "Between" vs "Into"
        if (target.type === 'between') {
          const nearName = target.nearPath.split('/').pop();
          let idx = currentOrder.indexOf(nearName);
          if (target.isAfter) idx++;
          target.index = idx;
        }

        let movedCount = 0;
        const draggedNames = draggedItems.map(di => di.path.split('/').pop());

        // Perform actual move/reorder
        for (const item of draggedItems) {
          const fileName = item.path.split('/').pop();
          const srcRel = item.path;
          const destRel = (destParentPath ? (destParentPath + '/' + fileName) : fileName).replace(/\/\//g, '/');

          if (srcRel !== destRel) {
            // Change Parent (Actual FS Move)
            const srcAbs = (wsPath + '/' + srcRel).replace(/\/\//g, '/');
            const destAbs = (wsPath + '/' + destRel).replace(/\/\//g, '/');
            
            if (item.type === 'directory' && destRel.startsWith(item.path + '/')) continue; // Prevent recursion

            const res = await window.electronAPI.moveFile(srcAbs, destAbs);
            if (res.success) {
              movedCount++;
              if (AppState.currentFile === srcRel) AppState.currentFile = destRel;
              if (typeof RecentlyViewedModule !== 'undefined') RecentlyViewedModule.swap(srcRel, destRel);
            }
          }
        }

        // Update Custom Orders for target
        currentOrder = currentOrder.filter(name => !draggedNames.includes(name));
        let insertIdx = target.index;
        if (insertIdx > currentOrder.length) insertIdx = currentOrder.length;
        currentOrder.splice(insertIdx, 0, ...draggedNames);
        state.customOrders[orderKey] = currentOrder;
        localStorage.setItem('mdpreview_custom_orders', JSON.stringify(state.customOrders));

        if (movedCount > 0 || target.index !== -1) {
          if (destParentPath) {
            const pNode = _findNodeByPath(treeData, destParentPath);
            if (pNode) pNode.expanded = true;
          }
          isGlobalDragging = false;
          load();
        }

        dragProxy.style.opacity = '0';
        dragProxy.style.transform += ' scale(0.8)';
        setTimeout(() => {
          if (dragProxy) dragProxy.remove();
          dragProxy = null;
          isGlobalDragging = false;
        }, 300);
      } else {
        isGlobalDragging = false;
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function _initStandardDrag(e, itemEl, node) {
    if (isGlobalDragging) return;
    isGlobalDragging = true;

    const dragStartX = e.clientX;
    const dragStartY = e.clientY;
    let dragProxy = null;
    let isDraggingStarted = false;
    let currentTargetEl = null;
    let targetPath = null;

    const isItemSelected = state.selectedPaths.includes(node.path);
    const draggedPaths = isItemSelected ? [...state.selectedPaths] : [node.path];
    const draggedItems = draggedPaths.map(p => {
      const el = document.querySelector(`.tree-item[data-path="${p.replace(/'/g, "\\'")}"]`);
      const nodeData = _findNodeByPath(treeData, p);
      return { path: p, el, type: nodeData ? nodeData.type : 'file', name: p.split('/').pop() };
    }).filter(di => di.el);

    const onMouseMove = (moveEvent) => {
      const dist = Math.sqrt(Math.pow(moveEvent.clientX - dragStartX, 2) + Math.pow(moveEvent.clientY - dragStartY, 2));

      if (!isDraggingStarted && dist > 8) {
        isDraggingStarted = true;
        
        // 1. Create Proxy (Compact stack style)
        dragProxy = document.createElement('div');
        dragProxy.className = 'standard-drag-proxy';
        
        const icon = document.createElement('i');
        icon.className = draggedItems[0].type === 'directory' ? 'ri-folder-fill' : 'ri-file-text-line';
        dragProxy.appendChild(icon);

        const label = document.createElement('span');
        label.innerText = draggedItems.length === 1 ? draggedItems[0].name : `${draggedItems.length} items`;
        dragProxy.appendChild(label);

        if (draggedItems.length > 1) {
          const badge = document.createElement('div');
          badge.className = 'drag-badge';
          badge.innerText = draggedItems.length;
          dragProxy.appendChild(badge);
        }

        document.body.appendChild(dragProxy);

        // 2. Dim sources
        draggedItems.forEach(di => di.el.classList.add('is-dragging-source'));
      }

      if (isDraggingStarted && dragProxy) {
        dragProxy.style.left = `${moveEvent.clientX}px`;
        dragProxy.style.top = `${moveEvent.clientY}px`;

        // 3. Target Detection (Optimized with Area Awareness)
        const elUnder = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
        
        // Find if we are over an item or an expanded folder area
        const itemUnder = elUnder ? elUnder.closest('.tree-item') : null;
        const folderAreaUnder = (!itemUnder && elUnder) ? elUnder.closest('.folder-children') : null;
        
        let primaryTarget = null;
        let secondaryTarget = null;
        let finalPath = null;

        if (itemUnder) {
          const path = itemUnder.getAttribute('data-path');
          const isDir = itemUnder.classList.contains('tree-item-directory');
          
          if (isDir) {
            primaryTarget = itemUnder;
            finalPath = path;
          } else {
            // Over a file: target is parent directory
            secondaryTarget = itemUnder;
            const parentPath = path.substring(0, path.lastIndexOf('/')) || '';
            primaryTarget = document.querySelector(`.tree-item[data-path="${parentPath.replace(/'/g, "\\'")}"]`);
            finalPath = parentPath;
          }
        } else if (folderAreaUnder) {
          // Over the gap in an expanded folder area
          primaryTarget = folderAreaUnder.previousElementSibling;
          if (primaryTarget && primaryTarget.classList.contains('tree-item')) {
            finalPath = primaryTarget.getAttribute('data-path');
          } else {
            primaryTarget = null; // Safety check
          }
        }

        // Apply Highlights
        if (currentTargetEl !== primaryTarget || secondaryTarget !== secondaryTarget) {
          // Clear old
          const treeContainer = document.getElementById('file-tree');
          treeContainer.querySelectorAll('.drag-hover, .drag-hover-secondary').forEach(el => {
            el.classList.remove('drag-hover', 'drag-hover-secondary');
          });
          treeContainer.classList.remove('drag-hover-root');

          currentTargetEl = primaryTarget;
          
          if (primaryTarget) {
            // Prevent dropping into itself or its own children
            const isInvalid = draggedItems.some(di => finalPath === di.path || finalPath.startsWith(di.path + '/'));
            if (!isInvalid) {
              primaryTarget.classList.add('drag-hover');
              if (secondaryTarget) secondaryTarget.classList.add('drag-hover-secondary');
              targetPath = finalPath;
            } else {
              targetPath = null;
            }
          } else {
            // Check for Root
            const treeRect = treeContainer.getBoundingClientRect();
            const isInsideTree = moveEvent.clientX >= treeRect.left && moveEvent.clientX <= treeRect.right &&
                                 moveEvent.clientY >= treeRect.top && moveEvent.clientY <= treeRect.bottom;
            if (isInsideTree) {
              currentTargetEl = treeContainer;
              currentTargetEl.classList.add('drag-hover-root');
              targetPath = '';
            } else {
              targetPath = null;
            }
          }
        }
      }
    };

    const onMouseUp = async () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      if (!isDraggingStarted) {
        isGlobalDragging = false;
        return;
      }

      // 1. Cleanup UI
      if (dragProxy) dragProxy.remove();
      draggedItems.forEach(di => di.el.classList.remove('is-dragging-source'));
      
      const treeContainer = document.getElementById('file-tree');
      if (treeContainer) {
        treeContainer.querySelectorAll('.drag-hover, .drag-hover-secondary').forEach(el => {
          el.classList.remove('drag-hover', 'drag-hover-secondary');
        });
        treeContainer.classList.remove('drag-hover-root');
      }

      // 2. Perform Move
      if (targetPath !== null) {
        const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
        let movedCount = 0;

        for (const item of draggedItems) {
          const srcRel = item.path;
          const destRel = (targetPath + '/' + item.name).replace(/\/\//g, '/');

          if (srcRel !== destRel) {
            const srcAbs = (wsPath + '/' + srcRel).replace(/\/\//g, '/');
            const destAbs = (wsPath + '/' + destRel).replace(/\/\//g, '/');
            
            const res = await window.electronAPI.moveFile(srcAbs, destAbs);
            if (res.success) {
              movedCount++;
              _syncCustomOrder(srcRel, destRel);
              if (AppState.currentFile === srcRel) AppState.currentFile = destRel;
              if (typeof RecentlyViewedModule !== 'undefined') RecentlyViewedModule.swap(srcRel, destRel);
            }
          }
        }

        if (movedCount > 0) {
          const pNode = _findNodeByPath(treeData, targetPath);
          if (pNode) pNode.expanded = true;
          load();
        }
      }

      isGlobalDragging = false;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * Proactively syncs custom order metadata when files are moved or renamed.
   * Ensures no ghost entries are left behind and new items are registered.
   */
  function _syncCustomOrder(oldPath, newPath) {
    const oldParent = oldPath.substring(0, oldPath.lastIndexOf('/')) || 'root';
    const newParent = newPath.substring(0, newPath.lastIndexOf('/')) || 'root';
    const oldName = oldPath.split('/').pop();
    const newName = newPath.split('/').pop();

    if (oldParent === newParent) {
      // CASE 1: Rename in same folder
      if (state.customOrders[oldParent]) {
        state.customOrders[oldParent] = state.customOrders[oldParent].map(n => n === oldName ? newName : n);
      }
    } else {
      // CASE 2: Move between folders
      // Remove from old
      if (state.customOrders[oldParent]) {
        state.customOrders[oldParent] = state.customOrders[oldParent].filter(n => n !== oldName);
        if (state.customOrders[oldParent].length === 0) delete state.customOrders[oldParent];
      }
      // Add to new
      if (state.customOrders[newParent]) {
        if (!state.customOrders[newParent].includes(newName)) {
          state.customOrders[newParent].push(newName);
        }
      }
    }
    localStorage.setItem('mdpreview_custom_orders', JSON.stringify(state.customOrders));
  }

  function clear() {
    treeData = [];
    const container = document.getElementById('file-tree');
    if (container) container.innerHTML = '';
  }

  return { init, load, search, setActiveFile, clear, deselectAll, syncSelectionFromTabs };
})();

window.TreeModule = TreeModule;
