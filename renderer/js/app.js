/* ============================================================
   app.js — Core state, file loading, socket connection, boot
   Other responsibilities live in dedicated modules:
     zoom.js     — Zoom modal
     mermaid.js  — Diagram rendering
     toolbar.js  — Toolbar buttons + Read/Comment toggle
     sidebar.js  — Mode switcher, search, resizer
   ============================================================ */

// ── Mode Persistence (Hybrid State) ─────────────────────────
const sessionModes = {}; // Memory-only for regular files

window.AppState = {
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
    flatView:         localStorage.getItem('md-flat-view') === 'true',
    fontText:         localStorage.getItem('md-font-text') || 'Inter',
    fontCode:         localStorage.getItem('md-font-code') || 'Roboto Mono'
  },

  getFileViewMode(path) {
    if (!path) return 'read';
    // Case 1: Draft (Persistent via DraftModule)
    if (path.startsWith('__DRAFT_')) {
      return (typeof DraftModule !== 'undefined') ? (DraftModule.getDraftViewMode(path) || 'read') : 'read';
    }
    // Case 2: Regular File (Session-only)
    return sessionModes[path] || 'read';
  },

  setFileViewMode(path, mode) {
    if (!path) return;
    // Case 1: Draft
    if (path.startsWith('__DRAFT_')) {
      if (typeof DraftModule !== 'undefined') DraftModule.setDraftViewMode(path, mode);
    } else {
      // Case 2: Regular File
      sessionModes[path] = mode;
    }
  },

  /**
   * Called when sidebar mode changes (Space <-> Draft)
   */
  async onModeChange(mode, targetId) {
    // ── Dirty check before switching mode/file ────────────
    if (AppState.currentMode === 'edit' && typeof EditorModule !== 'undefined' && EditorModule.isDirty()) {
      const isDraft = AppState.currentFile && AppState.currentFile.startsWith('__DRAFT_');
      const isFirstEdit = EditorModule.getOriginalContent() === '';

      if (isDraft || isFirstEdit) {
        await EditorModule.save();
      } else {
        // For non-draft files, we might want to confirm, 
        // but since onModeChange is often a side-effect of a UI click,
        // we'll at least try to save if it's a draft.
        // If it's a real file, show confirm.
        DesignSystem.showConfirm({
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Save them before switching?',
          onConfirm: async () => {
            await EditorModule.save();
            this.onModeChange(mode, targetId);
          }
        });
        return;
      }
    }
    if (mode === 'draft') {
      const isSwitching = !!targetId;
      const draftId = targetId || `__DRAFT_${Date.now()}__`;

      // 1. Store and switch to Draft virtual file
      if (AppState.currentFile !== draftId) {
        ScrollModule.save(AppState.currentFile);
        if (!AppState.currentFile || !AppState.currentFile.startsWith('__DRAFT_')) {
          AppState.lastMarkdownFile = AppState.currentFile;
        }
        AppState.currentFile = draftId;
        ScrollModule.restore(draftId);
      }

      // 2. Load Draft-specific comments
      if (typeof CommentsModule !== 'undefined') {
        CommentsModule.loadForFile(draftId);
      }
      
      // 3. Clear triggers if in comment mode (they will be re-applied to Draft preview)
      if (AppState.commentMode && typeof CommentsModule !== 'undefined') {
        CommentsModule.removeCommentMode();
      }

      const viewer = document.getElementById('md-viewer');
      if (viewer) {
        viewer.setAttribute('data-active-mode', mode);
      }

      // 4. Sync Draft preview (handled by DraftModule)
      if (typeof DraftModule !== 'undefined') {
        DraftModule.syncPreview();
      }

      // 5. Ensure Draft tab is open
      if (typeof TabsModule !== 'undefined') {
        TabsModule.open(draftId);
      }

      // 6. Refresh toolbar UI state
      if (typeof AppState.updateToolbarUI === 'function') {
        let targetMode = AppState.getFileViewMode(draftId);
        if (!isSwitching) {
          targetMode = 'edit'; // New draft always starts in Edit
        } else {
          const content = (typeof DraftModule !== 'undefined') ? DraftModule.getDraftContent(draftId) : '';
          if (!content || content.trim() === '') {
            targetMode = 'edit';
          }
        }
        AppState.updateToolbarUI(targetMode);
      }

      const mdContent = document.getElementById('md-content');
      if (mdContent) {
        mdContent.classList.add('fade-in');
        setTimeout(() => mdContent.classList.remove('fade-in'), 300);
      }
    } else {
      // Mode: space
      // 1. Restore the original file
      if (AppState.lastMarkdownFile) {
        AppState.currentFile = AppState.lastMarkdownFile;
        AppState.lastMarkdownFile = null;
      }

      if (AppState.currentFile && !AppState.currentFile.startsWith('__DRAFT_')) {
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
  const root = document.documentElement;
  const s = AppState.settings;
  
  // Update zoom
  root.style.setProperty('--preview-zoom', s.textZoom || 100);
  root.style.setProperty('--code-zoom',    s.codeZoom || 100);
  
  // Update accent color (Hex)
  root.style.setProperty('--accent-color', s.accentColor);
  
  // Update accent color (RGB) for translucent tints
  const rgb = hexToRgb(s.accentColor);
  if (rgb) {
    root.style.setProperty('--accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  }
  
  // Update fonts
  root.style.setProperty('--font-text', s.fontText);
  root.style.setProperty('--font-code', s.fontCode);
  
  // Custom Background Logic
  const bgLayer = document.getElementById('app-background');

  if (bgLayer) {
    if (s.bgEnabled && s.bgImage) {
      bgLayer.style.backgroundImage = `url(${s.bgImage})`;
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

  AppState.socket.on('file-deleted', ({ file }) => {
    if (typeof TabsModule !== 'undefined') TabsModule.remove(file, true);
    if (typeof RecentlyViewedModule !== 'undefined') RecentlyViewedModule.remove(file);
    TreeModule.load();
  });

  AppState.socket.on('workspace-changed', () => {
    TreeModule.load();
    setNoFile();
    RecentlyViewedModule.render();
  });
}

// ── File Loading ─────────────────────────────────────────────
let loadTicket = 0;

async function loadFile(filePath) {
  if (!AppState.currentWorkspace) return;

  const currentTicket = ++loadTicket;

  // 1. Dirty check if we are in 'edit' mode before switching files
  if (AppState.currentMode === 'edit' && typeof EditorModule !== 'undefined' && EditorModule.isDirty()) {
    const isDraft = AppState.currentFile && AppState.currentFile.startsWith('__DRAFT_');
    const isFirstEdit = EditorModule.getOriginalContent() === '';

    if (isDraft || isFirstEdit) {
      // Auto-save and proceed silently
      await EditorModule.save();
    } else {
      DesignSystem.showConfirm({
        title: 'Unsaved Changes',
        message: `You have unsaved changes. Save them before switching to ${filePath.split('/').pop()}?`,
        onConfirm: async () => {
           const saved = await EditorModule.save();
           if (saved) loadFile(filePath);
        }
      });
      return;
    }
  }

  let data = { html: '' };
  if (filePath && filePath.startsWith('__DRAFT_')) {
    // For Draft, we don't fetch from server, we sync from DraftModule
    if (typeof DraftModule !== 'undefined') {
      data.html = DraftModule.getRenderedHtml ? DraftModule.getRenderedHtml(filePath) : '';
    }
  } else {
    try {
      const res = await fetch(`/api/render?file=${encodeURIComponent(filePath)}`);
      if (currentTicket !== loadTicket) return; // Cancel if newer request started
      
      if (!res.ok) {
        if (res.status === 404) {
          return;
        }
        throw new Error(`Failed to load file: ${filePath} (Status: ${res.status})`);
      }
      data = await res.json();
    } catch (err) {
      return;
    }
  }

  if (currentTicket !== loadTicket) return;

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
    mdContent.classList.add('fade-in');
    setTimeout(() => mdContent.classList.remove('fade-in'), 300);
    await processMermaid(inner); // processMermaid defined in mermaid.js
    if (typeof CodeBlockModule !== 'undefined') CodeBlockModule.process(inner);
  }

  updateHeaderUI();
  
  try {
    if (typeof CommentsModule !== 'undefined') await CommentsModule.loadForFile(filePath);
  } catch (e) { }

  try {
    if (typeof CollectModule !== 'undefined') CollectModule.loadForFile(filePath);
  } catch (e) { }

  RecentlyViewedModule.add(filePath);

  if (typeof AppState.updateToolbarUI === 'function') {
    let targetMode = AppState.getFileViewMode(filePath);
    
    // Draft specific override: always force Edit if empty
    if (filePath && filePath.startsWith('__DRAFT_')) {
      const content = (typeof DraftModule !== 'undefined') ? DraftModule.getDraftContent(filePath) : '';
      if (!content || content.trim() === '') {
        targetMode = 'edit';
      }
    }
    
    AppState.updateToolbarUI(targetMode);
  } else if (AppState.commentMode && typeof CommentsModule !== 'undefined') {
    CommentsModule.applyCommentMode();
  }

  TreeModule.setActiveFile(filePath);
  ScrollModule.restore(filePath);
}

function setNoFile() {
  AppState.currentFile = null;
  AppState.currentMode = 'read';

  const emptyState = document.getElementById('empty-state');
  const mdContent  = document.getElementById('md-content');
  const editViewer = document.getElementById('edit-viewer');

  if (emptyState) emptyState.style.display = 'flex';
  if (mdContent)  mdContent.style.display  = 'none';
  if (editViewer) editViewer.style.display = 'none';

  updateHeaderUI();

  if (typeof CommentsModule !== 'undefined') CommentsModule.clearUI();
  if (typeof CollectModule !== 'undefined') CollectModule.loadForFile(null);

  if (typeof TreeModule !== 'undefined') TreeModule.setActiveFile(null);
  if (typeof RecentlyViewedModule !== 'undefined') RecentlyViewedModule.setActiveFile(null);

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

  // If in Draft Response tab (checked externally via sidebar state or handled by draft.js),
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
  // 0. Initial theme application
  applyTheme();

  // 1. Core UI Components First
  ChangeActionViewBar.init(); // organisms/change-action-view-bar.js
  RightSidebar.init();        // organisms/right-sidebar.js

  // 2. Support Modules
  initSocket();
  initMermaid();          // mermaid.js
  initZoom();             // zoom.js
  initToolbarBtns();      // toolbar.js
  initGlobalShortcuts();  // toolbar.js
  initSidebarModeSwitcher(); // sidebar.js
  initSidebarRevamp();       // sidebar.js
  initSidebarResizer();      // sidebar.js

  // 3. Functional Modules
  SettingsModule.init();     // settings.js
  DraftModule.init();        // draft.js
  ScrollModule.init();       // scroll.js
  
  // 4. Tab System (triggers initial loadFile)
  TabsModule.init();         // tabs.js
  
  if (typeof CollectModule !== 'undefined') CollectModule.init(); // collect.js
  if (typeof CommentsModule !== 'undefined') CommentsModule.init(); // comments.js

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
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    container.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon"></div>
        <div class="toast-message"></div>
        <div class="toast-close">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </div>
      </div>
    `;
    document.body.appendChild(container);
    
    container.querySelector('.toast-close').onclick = () => {
      container.classList.remove('show');
    };
  }
  
  const content = container.querySelector('.toast-content');
  const icon = container.querySelector('.toast-icon');
  const messageEl = container.querySelector('.toast-message');
  
  // Set Type
  content.className = `toast-content ${type}`;
  messageEl.textContent = message;
  
  // Set Icon
  if (type === 'error') {
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  } else {
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"/><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`;
  }
  
  container.classList.add('show');
  
  // Auto hide
  if (container._timer) clearTimeout(container._timer);
  container._timer = setTimeout(() => {
    container.classList.remove('show');
  }, 4000);
}
