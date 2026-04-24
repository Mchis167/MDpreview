/* ============================================================
   app.js — Core state, file loading, socket connection, boot
   Other responsibilities live in dedicated modules:
     zoom.js     — Zoom modal
     mermaid.js  — Diagram rendering
     toolbar.js  — Toolbar buttons + Read/Comment toggle
     sidebar.js  — Mode switcher, search, resizer
   ============================================================ */


window.AppState = {
  currentFile: null,
  currentWorkspace: null,
  commentMode: false,
  socket: null,

  // Theme & Explorer settings (persisted in localStorage + Server)
  settings: {
    accentColor: localStorage.getItem('md-accent-color') || '#ffbf48',
    bgEnabled: localStorage.getItem('md-bg-enabled') === 'true',
    bgImage: localStorage.getItem('md-bg-image') || '',
    textZoom: parseInt(localStorage.getItem('md-text-zoom') || '100', 10),
    codeZoom: parseInt(localStorage.getItem('md-code-zoom') || '100', 10),
    showHidden: localStorage.getItem('md-show-hidden') === 'true',
    hideEmptyFolders: localStorage.getItem('md-hide-empty') === 'true',
    flatView: localStorage.getItem('md-flat-view') === 'true',
    fontText: localStorage.getItem('md-font-text') || 'Inter',
    fontCode: localStorage.getItem('md-font-code') || 'Roboto Mono',
    sortMethod: localStorage.getItem('mdpreview_sort_method') || 'alphabetical_asc',
    recentCollapsed: localStorage.getItem('mdpreview_recent_collapsed') === 'true',
    sidebarWidth: parseInt(localStorage.getItem('mdpreview_sidebar_left_width') || '260', 10),
    rightSidebarWidth: parseInt(localStorage.getItem('mdpreview_sidebar_right_width') || '300', 10),
    rightSidebarOpen: localStorage.getItem('md-right-sidebar-open') === 'true',
    rightSidebarTab: localStorage.getItem('md-right-sidebar-tab') || 'comments'
  },

  /**
   * Loads the global state from the server and merges it with localStorage
   */
  async loadPersistentState() {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) return;
      const data = await res.json();

      const hasServerData = data && (data.settings || data.allTabs);

      // 1. Restore Settings
      if (data.settings) {
        Object.assign(this.settings, data.settings);
        Object.keys(data.settings).forEach(key => {
          const storageKey = this._getStorageKey(key);
          if (storageKey) localStorage.setItem(storageKey, data.settings[key]);
        });
      }

      // 2. Restore Tabs for all workspaces
      if (data.allTabs) {
        Object.keys(data.allTabs).forEach(wsId => {
          localStorage.setItem(`tabs_${wsId}`, JSON.stringify(data.allTabs[wsId]));
        });
      }

      // 2b. Restore Recently Viewed
      if (data.allRecent) {
        Object.keys(data.allRecent).forEach(wsId => {
          localStorage.setItem(`mdpreview_recent_${wsId}`, JSON.stringify(data.allRecent[wsId]));
        });
      }

      // 2c. Restore Globals
      if (data.sessionModes) localStorage.setItem('mdpreview_session_modes', JSON.stringify(data.sessionModes));
      if (data.customOrders) localStorage.setItem('mdpreview_custom_orders', JSON.stringify(data.customOrders));
      if (data.expandedPaths) localStorage.setItem('mdpreview_expanded_paths', JSON.stringify(data.expandedPaths));
      if (data.scrollPositions) localStorage.setItem('md-scroll-positions', JSON.stringify(data.scrollPositions));

      // 3. First-time sync: If server is empty but local has data, push to server
      if (!hasServerData) {
        const hasLocalData = Object.keys(localStorage).some(k =>
          k.startsWith('tabs_') ||
          k.startsWith('md-') ||
          k === 'mdpreview_custom_orders' ||
          k === 'mdpreview_expanded_paths'
        );
        if (hasLocalData) {
          console.log('AppState: Initializing server state from local data...');
          this.savePersistentState();
        }
      }

      applyTheme();
    } catch (e) {
      console.warn('Failed to load persistent state from server:', e);
    }
  },

  /**
   * Saves the current state to the server (with debouncing)
   */
  async savePersistentState() {
    if (this._saveTimer) clearTimeout(this._saveTimer);

    this._saveTimer = setTimeout(async () => {
      try {
        const allTabs = {};
        const allRecent = {};

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;
          if (key.startsWith('tabs_')) {
            const wsId = key.replace('tabs_', '');
            try { allTabs[wsId] = JSON.parse(localStorage.getItem(key)); } catch (e) { }
          }
          else if (key.startsWith('mdpreview_recent_')) {
            const wsId = key.replace('mdpreview_recent_', '');
            try { allRecent[wsId] = JSON.parse(localStorage.getItem(key)); } catch (e) { }
          }
        }

        const state = {
          settings: this.settings,
          allTabs,
          allRecent,
          sessionModes: JSON.parse(localStorage.getItem('mdpreview_session_modes') || '{}'),
          customOrders: JSON.parse(localStorage.getItem('mdpreview_custom_orders') || '{}'),
          expandedPaths: JSON.parse(localStorage.getItem('mdpreview_expanded_paths') || '[]'),
          scrollPositions: JSON.parse(localStorage.getItem('md-scroll-positions') || '{}'),
          lastUpdated: new Date().toISOString()
        };

        await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state)
        });

        this._saveTimer = null;
      } catch (e) {
        console.warn('Failed to save state to server:', e);
      }
    }, 500);
  },

  _getStorageKey(settingsKey) {
    const map = {
      accentColor: 'md-accent-color',
      bgEnabled: 'md-bg-enabled',
      bgImage: 'md-bg-image',
      textZoom: 'md-text-zoom',
      codeZoom: 'md-code-zoom',
      showHidden: 'md-show-hidden',
      hideEmptyFolders: 'md-hide-empty',
      flatView: 'md-flat-view',
      fontText: 'md-font-text',
      fontCode: 'md-font-code',
      sortMethod: 'mdpreview_sort_method',
      recentCollapsed: 'mdpreview_recent_collapsed',
      sidebarWidth: 'mdpreview_sidebar_left_width',
      rightSidebarWidth: 'mdpreview_sidebar_right_width',
      rightSidebarOpen: 'md-right-sidebar-open',
      rightSidebarTab: 'md-right-sidebar-tab'
    };
    return map[settingsKey];
  },

  getFileViewMode(path) {
    if (path && path.startsWith('__DRAFT_')) {
      if (typeof DraftModule !== 'undefined') return DraftModule.getDraftViewMode(path) || 'edit';
    }
    try {
      const modes = JSON.parse(localStorage.getItem('mdpreview_session_modes') || '{}');
      return modes[path] || 'read';
    } catch (e) {
      return 'read';
    }
  },

  setFileViewMode(path, mode) {
    if (path && path.startsWith('__DRAFT_')) {
      if (typeof DraftModule !== 'undefined') DraftModule.setDraftViewMode(path, mode);
    } else {
      try {
        const modes = JSON.parse(localStorage.getItem('mdpreview_session_modes') || '{}');
        modes[path] = mode;
        localStorage.setItem('mdpreview_session_modes', JSON.stringify(modes));
        if (AppState.savePersistentState) AppState.savePersistentState();
      } catch (e) { }
    }
  },

  /**
   * Called when sidebar mode changes (Space <-> Draft)
   */
  async onModeChange(mode, targetId) {
    // ── Dirty check before switching ────────────
    if (AppState.currentMode === 'edit' && typeof EditorModule !== 'undefined' && EditorModule.isDirty()) {
      const isDraft = AppState.currentFile && AppState.currentFile.startsWith('__DRAFT_');
      const isFirstEdit = EditorModule.getOriginalContent() === '';

      if (isDraft || isFirstEdit) {
        await EditorModule.save();
      } else {
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

      // 1. Initialize for NEW Draft
      if (!isSwitching && typeof DraftModule !== 'undefined') {
        DraftModule.createDraft(draftId);
        if (typeof EditorModule !== 'undefined') {
          EditorModule.setOriginalContent('');
        }
      }

      // 2. Switch to Draft virtual file
      if (AppState.currentFile !== draftId) {
        ScrollModule.save(AppState.currentFile);
        AppState.currentFile = draftId;
        ScrollModule.restore(draftId);
      }

      // 3. UI Updates
      if (typeof CommentsModule !== 'undefined') CommentsModule.loadForFile(draftId);
      if (AppState.commentMode && typeof CommentsModule !== 'undefined') CommentsModule.removeCommentMode();

      const viewer = document.getElementById('md-viewer');
      if (viewer) viewer.setAttribute('data-active-mode', 'draft');

      if (typeof DraftModule !== 'undefined') DraftModule.syncPreview();
      if (typeof TabsModule !== 'undefined') TabsModule.open(draftId);

      // 4. Refresh toolbar UI state
      if (typeof AppState.updateToolbarUI === 'function') {
        let targetMode = AppState.getFileViewMode(draftId);
        if (!isSwitching || !DraftModule.getDraftContent(draftId)) targetMode = 'edit';
        AppState.updateToolbarUI(targetMode);
      }

      const mdContent = document.getElementById('md-content');
      if (mdContent) {
        mdContent.classList.add('fade-in');
        setTimeout(() => mdContent.classList.remove('fade-in'), 300);
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
  root.style.setProperty('--code-zoom', s.codeZoom || 100);

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

  // Update Select Arrow SVG with dynamic color
  const arrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${s.accentColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
  root.style.setProperty('--select-arrow', `url("data:image/svg+xml,${encodeURIComponent(arrowSvg)}")`);

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
  if (typeof io === 'undefined' || AppState.socket) return;
  AppState.socket = io();

  AppState.socket.on('file-changed', ({ file }) => {
    if (file === AppState.currentFile) {
      loadFile(AppState.currentFile).catch(() => { });

      // ── UX-02 Polish: Sync original content if editor is clean ──
      if (AppState.currentMode === 'edit' && typeof EditorModule !== 'undefined') {
        if (!EditorModule.isDirty()) {
          // Fetch raw content silently and update originalContent to match disk
          fetch(`/api/file/raw?path=${encodeURIComponent(file)}`)
            .then(res => res.json())
            .then(data => {
              if (data && data.content) EditorModule.setOriginalContent(data.content);
            })
            .catch(() => { });
        }
      }
    }
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
          if (saved) loadFile(filePath).catch(() => { });
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
  const mdContent = document.getElementById('md-content');

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
  const mdContent = document.getElementById('md-content');
  const editViewer = document.getElementById('edit-viewer');

  if (emptyState) emptyState.style.display = 'flex';
  if (mdContent) mdContent.style.display = 'none';
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
    let displayName = AppState.currentFile.split('/').pop();
    if (displayName.toLowerCase().endsWith('.md')) {
      displayName = displayName.substring(0, displayName.length - 3);
    }
    fileNameEl.innerText = displayName;
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
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Load persistent state from server (priority over localStorage)
  await AppState.loadPersistentState();

  // 2. Initial UI setup
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
  SidebarModule.init();      // sidebar.js

  // 3. Functional Modules
  SettingsModule.init();     // settings.js
  DraftModule.init();        // draft.js
  ScrollModule.init();       // scroll.js

  // 4. Tab System (triggers initial loadFile)
  TabsModule.init();         // tabs.js

  if (typeof CollectModule !== 'undefined') CollectModule.init(); // collect.js
  if (typeof CommentsModule !== 'undefined') CommentsModule.init(); // comments.js

  setTimeout(() => {
    if (typeof TreeModule !== 'undefined') TreeModule.init();
    if (typeof WorkspaceModule !== 'undefined') WorkspaceModule.init();
    if (typeof RecentlyViewedModule !== 'undefined') {
      RecentlyViewedModule.init();
      RecentlyViewedModule.render();
    }
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
