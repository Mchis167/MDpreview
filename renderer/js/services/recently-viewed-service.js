/**
 * RecentlyViewedService.js — Logic for managing recently viewed files.
 * 
 * Target: Session persistence and quick access.
 * Standard: Atomic Design V2 (Service).
 */
const RecentlyViewedModule = (() => {
  const MAX_RECENT = 10;
  const STORAGE_KEY = 'mdpreview_recent_';
  let treeComp = null;

  function add(filePath) {
    if (filePath && filePath.startsWith('__DRAFT_')) return; // Ignore draft in recent
    const ws = AppState.currentWorkspace;
    if (!ws || !filePath) return;
    const key = STORAGE_KEY + ws.id;
    let recent = _getRaw(key);
    recent = recent.filter(p => p !== filePath);
    recent.unshift(filePath);
    recent = recent.slice(0, MAX_RECENT);
    localStorage.setItem(key, JSON.stringify(recent));
    if (typeof AppState !== 'undefined' && AppState.savePersistentState) AppState.savePersistentState();
    render();
  }

  function remove(filePath) {
    const ws = AppState.currentWorkspace;
    if (!ws || !filePath) return;
    const key = STORAGE_KEY + ws.id;
    let recent = _getRaw(key);
    recent = recent.filter(p => p !== filePath);
    localStorage.setItem(key, JSON.stringify(recent));
    if (typeof AppState !== 'undefined' && AppState.savePersistentState) AppState.savePersistentState();
    render();
  }

  function swap(oldPath, newPath) {
    const ws = AppState.currentWorkspace;
    if (!ws) return;
    const key = STORAGE_KEY + ws.id;
    let recent = _getRaw(key);
    const idx = recent.indexOf(oldPath);
    if (idx !== -1) {
      recent[idx] = newPath;
      localStorage.setItem(key, JSON.stringify(recent));
      if (typeof AppState !== 'undefined' && AppState.savePersistentState) AppState.savePersistentState();
      render();
    }
  }

  function _getRaw(key) {
    const data = localStorage.getItem(key);
    try { return data ? JSON.parse(data) : []; } catch (_e) { return []; }
  }

  function render() {
    const ws = AppState.currentWorkspace;
    if (!ws) return;
    const list = document.getElementById('recently-viewed-list');
    const section = document.getElementById('recently-viewed-section');
    if (!list || !section) return;

    let recentPaths = _getRaw(STORAGE_KEY + ws.id);
    
    // Filter out current active file and limit display to 5 items
    const activeFile = (typeof AppState !== 'undefined') ? AppState.currentFile : null;
    recentPaths = recentPaths.filter(path => path !== activeFile).slice(0, 5);

    if (recentPaths.length === 0) { section.style.display = 'none'; return; }
    section.style.display = 'block';

    const nodes = recentPaths.map(path => ({
      path,
      name: path.split('/').pop(),
      type: 'file'
    }));

    if (!treeComp) {
      treeComp = new TreeViewComponent({
        mount: list,
        deleteIcon: 'x',
        deleteTitle: 'Remove from history',
        onClick: async (e, node) => {
          e.stopPropagation();
          try { await loadFile(node.path); } catch (_err) { remove(node.path); }
        },
        onDelete: (e, node) => {
          e.stopPropagation();
          remove(node.path);
        },
        onMouseDown: () => { },
        onMouseLeave: () => { },
        onContextMenu: (e, node, itemEl) => {
          if (typeof TreeModule !== 'undefined') TreeModule.handleContextMenu(e, node, itemEl);
        },
        showSpacer: true,
        spacerHeight: '8px'
      });
    }

    treeComp.update(nodes, [], '', '', AppState.currentFile);
  }

  function setActiveFile(_filePath) {
    render();
  }

  function init() {
    const mount = document.getElementById('recently-viewed-header-mount');
    
    if (mount) {
      const header = new SidebarSectionHeader({
        title: 'RECENTLY VIEWED',
        collapsible: {
          sectionId: 'recently-viewed-section',
          storageKey: 'mdpreview_recent_collapsed',
          appStateKey: 'recentCollapsed'
        }
      });
      mount.innerHTML = '';
      mount.appendChild(header.render());
    }
  }

  return { add, remove, swap, render, setActiveFile, init };
})();

window.RecentlyViewedModule = RecentlyViewedModule;
