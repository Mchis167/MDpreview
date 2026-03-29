/* ============================================================
   app.js — Core state, file loading, socket connection, boot
   Other responsibilities live in dedicated modules:
     zoom.js     — Zoom modal
     mermaid.js  — Diagram rendering
     toolbar.js  — Toolbar buttons + Read/Comment toggle
     sidebar.js  — Mode switcher, search, resizer
   ============================================================ */

const AppState = {
  currentFile:      null,
  currentWorkspace: null,
  commentMode:      false,
  socket:           null
};

// ── Recently Viewed ──────────────────────────────────────────
const RecentModule = (() => {
  const MAX_RECENT  = 3;
  const STORAGE_KEY = 'mdpreview_recent_';

  function add(filePath) {
    const ws = AppState.currentWorkspace;
    if (!ws || !filePath) return;
    const key = STORAGE_KEY + ws.id;
    let recent = _getRaw(key);
    recent = recent.filter(p => p !== filePath);
    recent.unshift(filePath);
    recent = recent.slice(0, MAX_RECENT);
    localStorage.setItem(key, JSON.stringify(recent));
    render();
  }

  function _getRaw(key) {
    const data = localStorage.getItem(key);
    try { return data ? JSON.parse(data) : []; } catch (e) { return []; }
  }

  function render() {
    const ws = AppState.currentWorkspace;
    if (!ws) return;
    const list    = document.getElementById('recently-viewed-list');
    const section = document.getElementById('recently-viewed-section');
    if (!list || !section) return;

    const recent = _getRaw(STORAGE_KEY + ws.id);
    if (recent.length === 0) { section.style.display = 'none'; return; }
    section.style.display = 'block';

    const svgFile = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14.5 2 14.5 7.5 20 7.5"/></svg>`;
    list.innerHTML = '';
    recent.forEach(path => {
      const item = document.createElement('div');
      item.className = 'recent-item';
      item.innerHTML = `<div class="recent-item-icon">${svgFile}</div><div class="recent-item-label">${path.split('/').pop()}</div>`;
      item.onclick = e => { e.stopPropagation(); loadFile(path); };
      list.appendChild(item);
    });
  }

  return { add, render };
})();

// ── Socket ───────────────────────────────────────────────────
function initSocket() {
  if (typeof io === 'undefined') return;
  AppState.socket = io();

  AppState.socket.on('file-changed', ({ file }) => {
    if (file === AppState.currentFile) loadFile(AppState.currentFile);
    TreeModule.load();
  });

  AppState.socket.on('tree-changed', () => { TreeModule.load(); });

  AppState.socket.on('workspace-changed', () => {
    TreeModule.load();
    setNoFile();
    RecentModule.render();
  });
}

// ── File Loading ─────────────────────────────────────────────
async function loadFile(filePath) {
  if (!AppState.currentWorkspace) return;

  const res = await fetch(`/api/render?file=${encodeURIComponent(filePath)}`);
  if (!res.ok) return;
  const data = await res.json();

  AppState.currentFile = filePath;

  const emptyState = document.getElementById('empty-state');
  const mdContent  = document.getElementById('md-content');
  const breadcrumb = document.getElementById('breadcrumb');

  emptyState.style.display = 'none';
  mdContent.style.display  = 'block';
  mdContent.innerHTML      = data.html;

  if (breadcrumb) {
    const homeIcon = `<svg class="home-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
    const sep      = `<svg class="breadcrumb-sep" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
    const fileName = filePath.split('/').pop();
    breadcrumb.innerHTML = `${homeIcon} ${sep} <span>${AppState.currentWorkspace.name}</span> ${sep} <span>${fileName}</span>`;
  }

  await processMermaid(mdContent); // processMermaid defined in mermaid.js
  await CommentsModule.loadForFile(filePath);
  RecentModule.add(filePath);

  if (AppState.commentMode) CommentsModule.applyCommentMode();
  TreeModule.setActiveFile(filePath);
  document.getElementById('md-viewer').scrollTop = 0;
}

function setNoFile() {
  AppState.currentFile = null;

  const emptyState = document.getElementById('empty-state');
  const mdContent  = document.getElementById('md-content');
  const breadcrumb = document.getElementById('breadcrumb');

  if (emptyState) emptyState.style.display = 'flex';
  if (mdContent)  mdContent.style.display  = 'none';

  if (breadcrumb) {
    const homeIcon = `<svg class="home-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
    breadcrumb.innerHTML = `${homeIcon} <span style="margin-left:8px;">Workspace</span>`;
  }

  if (typeof CommentsModule !== 'undefined') CommentsModule.clearUI();
}

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSocket();
  initMermaid();          // mermaid.js
  initZoom();             // zoom.js
  initSegmentedControl(); // toolbar.js
  initToolbarBtns();      // toolbar.js
  initSidebarModeSwitcher(); // sidebar.js
  initSidebarRevamp();       // sidebar.js
  initSidebarResizer();      // sidebar.js

  setTimeout(() => {
    if (typeof WorkspaceModule !== 'undefined') WorkspaceModule.init();
    RecentModule.render();
  }, 0);
});
