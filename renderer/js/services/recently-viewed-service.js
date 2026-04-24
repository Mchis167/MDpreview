/**
 * RecentlyViewedService.js — Logic for managing recently viewed files.
 * 
 * Target: Session persistence and quick access.
 * Standard: Atomic Design V2 (Service).
 */
const RecentlyViewedModule = (() => {
  const MAX_RECENT = 3;
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
    try { return data ? JSON.parse(data) : []; } catch (e) { return []; }
  }

  function render() {
    const ws = AppState.currentWorkspace;
    if (!ws) return;
    const list = document.getElementById('recently-viewed-list');
    const section = document.getElementById('recently-viewed-section');
    if (!list || !section) return;

    const recentPaths = _getRaw(STORAGE_KEY + ws.id);
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
        onClick: async (e, node) => {
          e.stopPropagation();
          try { await loadFile(node.path); } catch (err) { remove(node.path); }
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

  function setActiveFile(filePath) {
    render();
  }

  function init() {
    const section = document.getElementById('recently-viewed-section');
    const mount = document.getElementById('recently-viewed-header-mount');
    
    if (section && mount) {
      const isCollapsed = (typeof AppState !== 'undefined' && AppState.settings.recentCollapsed) || localStorage.getItem('mdpreview_recent_collapsed') === 'true';
      if (isCollapsed) section.classList.add('collapsed');
      
      const toggleBtn = new IconActionButton({
        id: 'recently-viewed-toggle',
        title: 'Toggle section',
        iconName: 'chevron-down',
        onClick: (e) => {
          const collapsed = section.classList.toggle('collapsed');
          localStorage.setItem('mdpreview_recent_collapsed', collapsed);
          if (typeof AppState !== 'undefined') {
            AppState.settings.recentCollapsed = collapsed;
            if (AppState.savePersistentState) AppState.savePersistentState();
          }
        }
      });
      
      const header = new SidebarSectionHeader({
        title: 'RECENTLY VIEWED',
        actions: [toggleBtn]
      });

      mount.innerHTML = '';
      mount.appendChild(header.render());
    }
  }

  return { add, remove, swap, render, setActiveFile, init };
})();

window.RecentlyViewedModule = RecentlyViewedModule;
