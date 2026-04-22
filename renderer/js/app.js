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
  lastMarkdownFile: null, // Tracks original file when in Draft mode
  commentMode:      false,
  socket:           null,
  
  // Theme & Explorer settings (persisted in localStorage)
  settings: {
    accentColor:      localStorage.getItem('md-accent-color') || '#ffbf48',
    bgEnabled:        localStorage.getItem('md-bg-enabled') === 'true',
    bgImage:          localStorage.getItem('md-bg-image') || '',
    textZoom:         parseInt(localStorage.getItem('md-text-zoom') || '100', 10),
    codeZoom:         parseInt(localStorage.getItem('md-code-zoom') || '100', 10),
    showHidden:       localStorage.getItem('md-show-hidden') === 'true',
    hideEmptyFolders: localStorage.getItem('md-hide-empty') === 'true',
    flatView:         localStorage.getItem('md-flat-view') === 'true'
  },

  /**
   * Called when sidebar mode changes (Space <-> Draft)
   */
  onModeChange(mode) {
    if (mode === 'ai') {
      // 1. Store and switch to AI virtual file
      if (AppState.currentFile !== '__AI_RESPONSE__') {
        ScrollModule.save(AppState.currentFile);
        AppState.lastMarkdownFile = AppState.currentFile;
        AppState.currentFile = '__AI_RESPONSE__';
        ScrollModule.restore('__AI_RESPONSE__');
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

      // 5. Ensure Draft tab is open
      if (typeof TabsModule !== 'undefined') {
        TabsModule.open('__AI_RESPONSE__');
      }

      // 6. Refresh toolbar UI state: Force 'edit' for new Draft
      if (typeof AppState.updateToolbarUI === 'function') {
        AppState.updateToolbarUI('edit');
      }
    } else {
      // Mode: space
      // 1. Restore the original file
      if (AppState.lastMarkdownFile) {
        ScrollModule.save('__AI_RESPONSE__');
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

      // 3. Refresh toolbar UI state
      if (typeof AppState.updateToolbarUI === 'function') {
        AppState.updateToolbarUI(AppState.currentMode || 'read');
      }
    }
  }
};

/**
 * Apply theme settings to the document
 */
function applyTheme() {
  const { accentColor, bgEnabled, bgImage, textZoom, codeZoom } = AppState.settings;
  
  // Update text zoom
  document.documentElement.style.setProperty('--preview-zoom', textZoom || 100);
  document.documentElement.style.setProperty('--code-zoom',    codeZoom || 100);
  
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

  // 1. Dirty check if we are in 'edit' mode before switching files
  if (AppState.currentMode === 'edit') {
    if (typeof EditorModule !== 'undefined' && EditorModule.isDirty()) {
      if (confirm(`You have unsaved changes in the current file. Save them before switching to ${filePath.split('/').pop()}?`)) {
        const saved = await EditorModule.save();
        if (!saved) return; // Cancel switch if save failed
      }
    }
  }

  const res = await fetch(`/api/render?file=${encodeURIComponent(filePath)}`);
  if (!res.ok) throw new Error(`Failed to load file: ${filePath}`);
  const data = await res.json();

  // Save current scroll before switching
  if (AppState.currentFile) {
    ScrollModule.save(AppState.currentFile);
  }

  AppState.currentFile = filePath;
  TabsModule.open(filePath);

  const emptyState = document.getElementById('empty-state');
  const mdContent  = document.getElementById('md-content');

  if (emptyState) emptyState.style.display = 'none';
  if (mdContent) {
    mdContent.style.display = 'block';
    const inner = mdContent.querySelector('.md-content-inner') || mdContent;
    inner.innerHTML = data.html;
    await processMermaid(inner); // processMermaid defined in mermaid.js
    if (typeof CodeBlockModule !== 'undefined') CodeBlockModule.process(inner);
  }

  updateHeaderUI();
  await CommentsModule.loadForFile(filePath);
  if (typeof CollectModule !== 'undefined') CollectModule.loadForFile(filePath);
  RecentlyViewedModule.add(filePath);

  // Force 'edit' for Draft, 'read' for normal documents
  if (typeof AppState.updateToolbarUI === 'function') {
    const targetMode = (filePath === '__AI_RESPONSE__') ? 'edit' : 'read';
    AppState.updateToolbarUI(targetMode);
  } else if (AppState.commentMode) {
    CommentsModule.applyCommentMode();
  }

  TreeModule.setActiveFile(filePath);
  ScrollModule.restore(filePath);
}

function setNoFile() {
  AppState.currentFile = null;

  const emptyState = document.getElementById('empty-state');
  const mdContent  = document.getElementById('md-content');

  if (emptyState) emptyState.style.display = 'flex';
  if (mdContent)  mdContent.style.display  = 'none';

  updateHeaderUI();

  if (typeof CommentsModule !== 'undefined') CommentsModule.clearUI();
  if (typeof CollectModule !== 'undefined') CollectModule.loadForFile(null);

  // Hide secondary toolbar
  if (typeof AppState.updateToolbarUI === 'function') {
    AppState.updateToolbarUI(AppState.currentMode || 'read');
  }
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
    wsNameEl.innerText = (AppState.currentWorkspace ? AppState.currentWorkspace.name.toUpperCase() : 'UNKNOWN') + '.';
    fileNameEl.innerText = AppState.currentFile.split('/').pop();
  } else {
    wsNameEl.innerText = AppState.currentWorkspace ? AppState.currentWorkspace.name.toUpperCase() + '.' : 'TOUCH.';
    fileNameEl.innerText = 'Select a file';
  }
}

/**
 * Update Sidebar Toggle Icon to match Figma (Lucide style)
 */
function updateSidebarToggleIcon(isCollapsed) {
  const btn = document.getElementById('sidebar-toggle-btn');
  if (!btn) return;
  
  if (isCollapsed) {
    // arrow-right-to-line
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 12H3"/><path d="m11 18 6-6-6-6"/><path d="M21 5v14"/>
      </svg>
    `;
  } else {
    // arrow-left-to-line
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m9 6-6 6 6 6"/><path d="M3 12h12"/><path d="M21 19V5"/>
      </svg>
    `;
  }
}

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSocket();
  initMermaid();          // mermaid.js
  initZoom();             // zoom.js
  initSegmentedControl(); // toolbar.js
  initToolbarBtns();      // toolbar.js
  initGlobalShortcuts();  // toolbar.js
  initSidebarModeSwitcher(); // sidebar.js
  initSidebarRevamp();       // sidebar.js
  initSidebarResizer();      // sidebar.js
  SettingsModule.init();     // settings.js
  AIResponseModule.init();   // ai-response.js (Issue #29)
  ScrollModule.init();       // scroll.js
  TabsModule.init();         // tabs.js
  if (typeof CollectModule !== 'undefined') CollectModule.init(); // collect.js

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

/**
 * Global Toast Notification
 */
function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    container.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"/><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
        </div>
        <div class="toast-message"></div>
        <div class="toast-close" onclick="this.closest('.toast-container').classList.remove('show')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </div>
      </div>
    `;
    document.body.appendChild(container);
  }
  
  container.querySelector('.toast-message').textContent = message;
  
  // Clear any existing timer
  if (container._timer) clearTimeout(container._timer);
  
  container.classList.add('show');
  
  container._timer = setTimeout(() => {
    container.classList.remove('show');
  }, 3000);
}

