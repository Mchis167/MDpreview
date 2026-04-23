/* ============================================================
   tree.js — Sidebar File Tree logic
   ============================================================ */

const TreeModule = (() => {
  let treeData = [];
  let currentQuery = '';

  const svgChevronDown = `<svg class="item-chevron" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
  const svgFolder = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`;
  const svgFile = `<svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.33341 6L7.33341 4L5.33341 2M2.66675 2L0.666748 4L2.66675 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  async function load() {
    // 1. Save expanded states
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
    
    // 2. Restore expanded states
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

  function render() {
    currentStagger = 0;
    const container = document.getElementById('file-tree');
    if (!container) return;
    container.innerHTML = '';

    const filtered = filterTree(treeData, currentQuery);
    if (filtered.length === 0) {
      container.innerHTML = '<div style="padding:20px; color:rgba(255,255,255,0.2); font-size:12px; text-align:center;">No files found.</div>';
      return;
    }

    let globalIdx = 0;
    const renderNodes = (nodes, parentEl) => {
      const fragment = document.createDocumentFragment();
      nodes.forEach(node => {
        const el = createNodeEl(node);
        fragment.appendChild(el);
      });
      parentEl.appendChild(fragment);
    };

    renderNodes(filtered, container);
  }

  let currentStagger = 0;
  function createNodeEl(node) {
    const idx = currentStagger++;
    const wrapper = document.createElement('div');
    wrapper.className = 'tree-node-wrapper';

    const itemEl = document.createElement('div');
    itemEl.className = 'tree-item ' + (node.type === 'directory' ? 'tree-item-directory' : 'tree-item-file') + (node.path === AppState.currentFile ? ' active' : '');
    itemEl.style.setProperty('--stagger', idx);
    
    const icon = node.type === 'directory' ? svgFolder : svgFile;
    const chevron = node.type === 'directory' ? svgChevronDown : '<span style="width:12px;flex-shrink:0;"></span>';
    const trashIcon = node.type === 'file' ? `
      <div class="item-delete-btn" title="Delete file">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      </div>` : '';

    itemEl.dataset.path = node.path;
    itemEl.innerHTML = `
      ${chevron}
      <div class="item-icon-wrap">${icon}</div>
      <span class="item-label" title="${_esc(node.name)}">${_esc(node.name)}</span>
      ${trashIcon}
    `;

    if (node.type === 'directory') {
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

      if (node.expanded) {
        renderChildren();
      }
      
      itemEl.onclick = (e) => {
        e.stopPropagation();
        node.expanded = !node.expanded;
        if (node.expanded) {
          renderChildren();
          childrenCont.classList.remove('hidden');
        } else {
          childrenCont.classList.add('hidden');
        }
        itemEl.querySelector('.item-chevron').style.transform = node.expanded ? 'rotate(0)' : 'rotate(-90deg)';
      };

      // Initial rotation
      const chevronEl = itemEl.querySelector('.item-chevron');
      if (chevronEl) {
        chevronEl.style.transform = node.expanded ? 'rotate(0)' : 'rotate(-90deg)';
      }
      
      wrapper.appendChild(itemEl);
      wrapper.appendChild(childrenCont);
    } else {
      const label = itemEl.querySelector('.item-label');
      label.ondblclick = (e) => {
        e.stopPropagation();
        _startRename(itemEl, node);
      };

      itemEl.onclick = () => {
        loadFile(node.path);
      };

      // Handle delete button click
      const deleteBtn = itemEl.querySelector('.item-delete-btn');
      if (deleteBtn) {
        deleteBtn.onclick = async (e) => {
          e.stopPropagation();
          const fileName = node.path.split('/').pop();
          DesignSystem.showConfirm({
            title: 'Delete File',
            message: `Are you sure you want to delete "${fileName}"? This action cannot be undone.`,
            onConfirm: async () => {
              if (!window.electronAPI || !window.electronAPI.deleteFile) {
                if (typeof showToast === 'function') showToast('Error: File deletion API not available.', 'error');
                return;
              }
              // Build absolute path — tree stores relative paths, IPC needs absolute
              const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
              const absPath = wsPath ? wsPath.replace(/\/$/, '') + '/' + node.path : node.path;
              const result = await window.electronAPI.deleteFile(absPath);
              if (result.success) {
                if (typeof showToast === 'function') showToast(`Deleted ${fileName}`);
                
                // Remove from recently viewed and scroll persistence if exists
                if (typeof RecentlyViewedModule !== 'undefined') {
                  RecentlyViewedModule.remove(node.path);
                }
                if (typeof ScrollModule !== 'undefined') {
                  ScrollModule.remove(node.path);
                }

                // If it was the active file, clear view
                if (AppState.currentFile === node.path) {
                  AppState.currentFile = null;
                  const mdContent = document.getElementById('md-content');
                  const editViewer = document.getElementById('edit-viewer');
                  const emptyState = document.getElementById('empty-state');
                  
                  if (mdContent) mdContent.style.display = 'none';
                  if (editViewer) editViewer.style.display = 'none';
                  if (emptyState) emptyState.style.display = 'flex';
                  
                  if (typeof updateHeaderUI === 'function') updateHeaderUI();
                }

                // Reload the tree
                load();
              } else {
                if (typeof showToast === 'function') showToast(`Error deleting file: ${result.error}`, 'error');
              }
            }
          });
        };
      }

      // ── Context Menu [Lợi: Thêm Duplicate & Rename] ──────────
      itemEl.oncontextmenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        _hideContextMenu();

        const menu = document.createElement('div');
        menu.className = 'ctx-menu';
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;

        const renameItem = document.createElement('div');
        renameItem.className = 'ctx-item';
        renameItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg> Rename`;
        renameItem.onclick = () => {
          _hideContextMenu();
          _startRename(itemEl, node);
        };

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
            // Tự động mở file mới
            const newRelativePath = res.path.replace(wsPath.replace(/\/$/, ''), '').replace(/^\//, '');
            setTimeout(() => loadFile(newRelativePath), 100);
          } else {
            if (typeof showToast === 'function') showToast('Duplicate failed: ' + res.error, 'error');
          }
        };

        const deleteItem = document.createElement('div');
        deleteItem.className = 'ctx-item';
        deleteItem.style.color = '#ff4d4d';
        deleteItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> Delete`;
        deleteItem.onclick = () => {
          _hideContextMenu();
          if (deleteBtn) deleteBtn.click();
        };

        menu.appendChild(renameItem);
        menu.appendChild(duplicateItem);
        menu.appendChild(document.createElement('div')).className = 'ctx-divider';
        menu.appendChild(deleteItem);

        document.body.appendChild(menu);

        const closeMenu = (e) => {
          if (!menu.contains(e.target)) _hideContextMenu();
        };
        document.addEventListener('mousedown', closeMenu, { once: true });
      };

      wrapper.appendChild(itemEl);
    }

    return wrapper;
  }

  function search(q) {
    currentQuery = (q || '').toLowerCase();
    const resultsCont = document.getElementById('search-results-list');
    const resultsSection = document.getElementById('search-results-section');

    if (resultsSection) {
      resultsSection.classList.toggle('hidden', !currentQuery);
    }

    if (resultsCont) {
      if (!currentQuery) {
        resultsCont.innerHTML = '';
      } else {
        const matches = _flattenAndFilter(treeData || [], currentQuery);
        resultsCont.innerHTML = '';
        if (matches.length === 0) {
          resultsCont.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:12px; padding:32px 0; opacity:0.5; color:var(--text-90);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 10V8C20.0005 7.68345 19.9384 7.36992 19.8172 7.07747C19.6961 6.78503 19.5182 6.51944 19.294 6.296L15.706 2.708C15.4825 2.48316 15.2167 2.30483 14.9238 2.18331C14.631 2.06179 14.317 1.99949 14 2H6C5.46957 2 4.96086 2.21072 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H10.35" stroke="currentColor" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 2V7C14 7.26522 14.1054 7.51957 14.2929 7.70711C14.4804 7.89464 14.7348 8 15 8H20M16 14C15.4696 14 14.9609 14.2107 14.5858 14.5858C14.2107 14.9609 14 15.4696 14 16M16 22C15.4696 22 14.9609 21.7893 14.5858 21.4142C14.2107 21.0391 14 20.5304 14 20M20 14C20.5304 14 21.0391 14.2107 21.4142 14.5858C21.7893 14.9609 22 15.4696 22 16M20 22C20.5304 22 21.0391 21.7893 21.4142 21.4142C21.7893 21.0391 22 20.5304 22 20" stroke="currentColor" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div class="section-label" style="text-align:center; width:100%; margin:0; color:inherit;">No File Founded</div>
            </div>`;
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

  async function _startRename(itemEl, node) {
    const label = itemEl.querySelector('.item-label');
    const originalName = node.name;
    const originalText = label.innerText;

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
        // Auto-append .md if missing
        if (!newName.toLowerCase().endsWith('.md')) {
          newName += '.md';
        }
        
        // If after auto-append it's still the same as original, just cancel
        if (newName === originalName) {
            label.innerText = originalText;
            return;
        }

        const wsPath = AppState.currentWorkspace ? AppState.currentWorkspace.path : '';
        const oldAbs = (wsPath.replace(/\/$/, '') + '/' + node.path).replace(/\/\//g, '/');
        
        // Build new path
        const dir = node.path.substring(0, node.path.lastIndexOf('/') + 1);
        const newRelative = dir + newName;
        const newAbs = (wsPath.replace(/\/$/, '') + '/' + newRelative).replace(/\/\//g, '/');

        const res = await window.electronAPI.renameFile(oldAbs, newAbs);
        if (res.success) {
          if (typeof showToast === 'function') showToast('Renamed file');
          
          // Update recently viewed
          if (typeof RecentlyViewedModule !== 'undefined') {
            RecentlyViewedModule.swap(node.path, newRelative);
          }

          // If active file was renamed, update AppState
          if (AppState.currentFile === node.path) {
            AppState.currentFile = newRelative;
            if (typeof updateHeaderUI === 'function') updateHeaderUI();
          }
          load();
        } else {
          if (typeof showToast === 'function') showToast('Rename failed: ' + res.error, 'error');
          label.innerText = originalText;
        }
      } else {
        label.innerText = originalText;
      }
    };

    input.onblur = () => finish(true);
    input.onkeydown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    };
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

  return { load, search, setActiveFile, clear };
})();
