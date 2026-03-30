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
  lastMarkdownFile: null, // Tracks original file when in AI mode
  commentMode:      false,
  socket:           null,
  
  // Theme settings (persisted in localStorage)
  settings: {
    accentColor: localStorage.getItem('md-accent-color') || '#ffbf48',
    bgEnabled:   localStorage.getItem('md-bg-enabled') === 'true',
    bgImage:     localStorage.getItem('md-bg-image') || ''
  },

  /**
   * Called when sidebar mode changes (Markdown <-> AI)
   */
  onModeChange(mode) {
    if (mode === 'ai') {
      // 1. Store and switch to AI virtual file
      if (AppState.currentFile !== '__AI_RESPONSE__') {
        AppState.lastMarkdownFile = AppState.currentFile;
        AppState.currentFile = '__AI_RESPONSE__';
      }

      // 2. Load AI-specific comments
      if (typeof CommentsModule !== 'undefined') {
        CommentsModule.loadForFile('__AI_RESPONSE__');
      }
      
      // 3. Clear triggers if in comment mode (they will be re-applied to AI preview)
      if (AppState.commentMode && typeof CommentsModule !== 'undefined') {
        CommentsModule.removeCommentMode();
      }

      // 4. Sync AI preview (handled by AIResponseModule)
      if (typeof AIResponseModule !== 'undefined') {
        AIResponseModule.syncPreview();
      }
    } else {
      // Mode: markdown
      // 1. Restore the original file
      if (AppState.lastMarkdownFile) {
        AppState.currentFile = AppState.lastMarkdownFile;
        AppState.lastMarkdownFile = null;
      }

      if (AppState.currentFile && AppState.currentFile !== '__AI_RESPONSE__') {
        loadFile(AppState.currentFile);
      } else {
        setNoFile();
      }

      // 2. Restore comment mode triggers
      if (AppState.commentMode && typeof CommentsModule !== 'undefined') {
        CommentsModule.applyCommentMode();
      }
    }
  }
};

/**
 * Apply theme settings to the document
 */
function applyTheme() {
  const { accentColor, bgEnabled, bgImage } = AppState.settings;
  
  // Update accent color (Hex)
  document.documentElement.style.setProperty('--accent-color', accentColor);
  
  // Update accent color (RGB) for translucent tints
  const rgb = hexToRgb(accentColor);
  if (rgb) {
    document.documentElement.style.setProperty('--accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  }
  
  // Update background
  const bgLayer = document.getElementById('app-background');

  if (bgLayer) {
    if (bgEnabled && bgImage) {
      bgLayer.style.backgroundImage = `url(${bgImage})`;
      bgLayer.style.display = 'block';
    } else {
      bgLayer.style.display = 'none';
    }
  }
}




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
    RecentlyViewedModule.render();
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

  if (emptyState) emptyState.style.display = 'none';
  if (mdContent) {
    mdContent.style.display = 'block';
    mdContent.innerHTML = data.html;
  }

  updateHeaderUI();

  await processMermaid(mdContent); // processMermaid defined in mermaid.js
  await CommentsModule.loadForFile(filePath);
  RecentlyViewedModule.add(filePath);

  if (AppState.commentMode) CommentsModule.applyCommentMode();
  TreeModule.setActiveFile(filePath);
  document.getElementById('md-viewer').scrollTop = 0;
}

function setNoFile() {
  AppState.currentFile = null;

  const emptyState = document.getElementById('empty-state');
  const mdContent  = document.getElementById('md-content');

  if (emptyState) emptyState.style.display = 'flex';
  if (mdContent)  mdContent.style.display  = 'none';

  updateHeaderUI();

  if (typeof CommentsModule !== 'undefined') CommentsModule.clearUI();
}

/**
 * Global function to sync the toolbar header with AppState
 */
function updateHeaderUI() {
  const wsNameEl = document.getElementById('header-workspace-name');
  const fileNameEl = document.getElementById('header-file-name');

  if (!wsNameEl || !fileNameEl) return;

  // If in AI Response tab (checked externally via sidebar state or handled by ai-response.js),
  // this function will be overridden or skipped.
  // But generally, show workspace and file:
  
  fileNameEl.style.display = ''; // Ensure visible

  if (AppState.currentFile) {
    wsNameEl.innerText = AppState.currentWorkspace.name.toUpperCase() + '.';
    fileNameEl.innerText = AppState.currentFile.split('/').pop();
  } else {
    wsNameEl.innerText = AppState.currentWorkspace ? AppState.currentWorkspace.name.toUpperCase() + '.' : 'TOUCH.';
    fileNameEl.innerText = 'Select a file';
  }
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
  SettingsModule.init();     // settings.js
  AIResponseModule.init();   // ai-response.js (Issue #29)

  setTimeout(() => {
    if (typeof WorkspaceModule !== 'undefined') WorkspaceModule.init();
    RecentlyViewedModule.render();
  }, 0);
});

/**
 * Utility: Convert Hex to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

