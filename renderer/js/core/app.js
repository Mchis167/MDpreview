/* global AppState, SidebarLeft, MarkdownViewer, RightSidebar, 
   SettingsService, SearchPalette, ShortcutsComponent, ShortcutService,
   TreeModule, WorkspaceModule, CollectModule, 
   DraftModule, EditorModule, 
   EditToolbarComponent,
   TabsModule, TabPreview, io, initMermaid, initZoom, ScrollModule, RecentlyViewedModule, ChangeActionViewBar, CommentsModule */
/* ============================================================
   app.js — Core state, file loading, socket connection, boot
   Other responsibilities live in dedicated modules:
     zoom.js     — Zoom modal
     mermaid.js  — Diagram rendering
   ============================================================ */


window.AppState = {
  currentFile: null,
  currentWorkspace: null,
  currentMode: 'read',
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
    hiddenPaths: (() => {
      try { return JSON.parse(localStorage.getItem('md-hidden-paths') || '[]'); } 
      catch (_e) { return []; }
    })(),
    showHiddenInSearch: localStorage.getItem('md-show-hidden-search') === 'true',
    fontText: localStorage.getItem('md-font-text') || 'Inter',
    fontCode: localStorage.getItem('md-font-code') || 'Roboto Mono',
    sortMethod: localStorage.getItem('mdpreview_sort_method') || 'alphabetical_asc',
    recentCollapsed: localStorage.getItem('mdpreview_recent_collapsed') === 'true',
    explorerCollapsed: localStorage.getItem('mdpreview_explorer_collapsed') === 'true',
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
          console.warn('AppState: Initializing server state from local data...');
          this.savePersistentState();
        }
      }

      if (typeof SettingsService !== 'undefined') {
        SettingsService.applyTheme();
      }
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
            try { allTabs[wsId] = JSON.parse(localStorage.getItem(key)); } catch (_e) { }
          }
          else if (key.startsWith('mdpreview_recent_')) {
            const wsId = key.replace('mdpreview_recent_', '');
            try { allRecent[wsId] = JSON.parse(localStorage.getItem(key)); } catch (_e) { }
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
    if (typeof SettingsService !== 'undefined') {
      return SettingsService.getStorageKey(settingsKey);
    }
    return null;
  },

  getFileViewMode(path) {
    if (path && path.startsWith('__DRAFT_')) {
      if (typeof DraftModule !== 'undefined') return DraftModule.getDraftViewMode(path) || 'edit';
    }
    try {
      const modes = JSON.parse(localStorage.getItem('mdpreview_session_modes') || '{}');
      return modes[path] || 'read';
    } catch (_e) {
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
      } catch (_e) { }
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

      const viewer = document.getElementById('md-viewer-mount');
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

// ── Socket ───────────────────────────────────────────────────
function initSocket() {
  if (typeof io === 'undefined' || AppState.socket) return;
  AppState.socket = io();

  AppState.socket.on('file-changed', ({ file }) => {
    if (file === AppState.currentFile) {
      loadFile(AppState.currentFile, { silent: true }).catch(() => { });

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

async function loadFile(filePath, options = {}) {
  const silent = !!options.silent;
  if (!AppState.currentWorkspace) return;

  // 1. Dirty check (PRIORITY: Before showing skeleton)
  if (AppState.currentMode === 'edit' && typeof EditorModule !== 'undefined' && EditorModule.isDirty()) {
    const isDraft = AppState.currentFile && AppState.currentFile.startsWith('__DRAFT_');
    const isFirstEdit = EditorModule.getOriginalContent() === '';

    if (isDraft || isFirstEdit) {
      // Auto-save and proceed silently
      await EditorModule.save();
    } else if (AppState.currentFile !== filePath) { // Only prompt if switching files
      DesignSystem.showConfirm({
        title: 'Unsaved Changes',
        message: `You have unsaved changes. Save them before switching to ${filePath.split('/').pop()}?`,
        onConfirm: async () => {
          const saved = await EditorModule.save();
          if (saved) loadFile(filePath, options).catch(() => { });
        }
      });
      return;
    }
  }

  const currentTicket = ++loadTicket;

  // ABSOLUTE FIRST PRIORITY: Save current scroll before ANY other logic fires
  if (AppState.currentFile && window.ScrollModule) {
    window.ScrollModule.save(AppState.currentFile);
  }

  // 0. Show skeleton only if NOT silent
  const viewer = MarkdownViewer.getInstance();
  const mdContent = document.getElementById('md-content');
  const inner = mdContent ? (mdContent.querySelector('.md-content-inner') || mdContent) : null;
  const emptyState = document.getElementById('empty-state');

  if (!silent) {
    if (emptyState) emptyState.style.display = 'none';
    if (mdContent && inner) {
      mdContent.style.display = 'block';
      inner.innerHTML = ''; 
      inner.classList.add('is-loading');
    }
    if (viewer) {
      viewer.setState({ mode: 'read', file: filePath, html: '<div class="skeleton-text" style="width: 100%; height: 200px;"></div>' });
    }
  }

  let data = { html: '' };
  if (filePath && filePath.startsWith('__DRAFT_')) {
    if (typeof DraftModule !== 'undefined') {
      data.html = DraftModule.getRenderedHtml ? DraftModule.getRenderedHtml(filePath) : '';
    }
  } else {
    try {
      const res = await fetch(`/api/render?file=${encodeURIComponent(filePath)}`);
      if (currentTicket !== loadTicket) return;

      if (!res.ok) {
        throw new Error(`Failed to load file: ${filePath} (Status: ${res.status})`);
      }
      data = await res.json();
    } catch (_err) {
      if (currentTicket === loadTicket && viewer) {
        viewer.setState({ mode: 'read', file: filePath, html: '<div class="ds-error-state">Failed to render markdown.</div>' });
      }
      return;
    }
  }

  if (currentTicket !== loadTicket) return;

  AppState.currentFile = filePath;
  TabsModule.open(filePath);

  if (viewer) {
    viewer.setState({ 
      mode: AppState.getFileViewMode(filePath), 
      file: filePath, 
      content: data.raw || '', 
      html: data.html 
    });
  } else if (mdContent && inner) {
    // Legacy fallback
    inner.innerHTML = data.html;
    inner.classList.remove('is-loading');
  }

  updateHeaderUI();

  try {
    if (typeof CommentsModule !== 'undefined') await CommentsModule.loadForFile(filePath);
  } catch (_e) { }

  try {
    if (typeof CollectModule !== 'undefined') CollectModule.loadForFile(filePath);
  } catch (_e) { }

  RecentlyViewedModule.add(filePath);

  if (typeof AppState.updateToolbarUI === 'function') {
    let targetMode = AppState.getFileViewMode(filePath);
    if (filePath && filePath.startsWith('__DRAFT_')) {
      const content = (typeof DraftModule !== 'undefined') ? DraftModule.getDraftContent(filePath) : '';
      if (!content || content.trim() === '') targetMode = 'edit';
    }
    AppState.updateToolbarUI(targetMode);
  }

  TreeModule.setActiveFile(filePath);
}

function setNoFile() {
  AppState.currentFile = null;
  AppState.currentMode = 'read';

  const viewer = MarkdownViewer.getInstance();
  if (viewer) {
    viewer.setState({ mode: 'empty', file: null, content: '', html: '' });
  } else {
    const emptyState = document.getElementById('empty-state');
    const mdContent = document.getElementById('md-content');
    const editViewer = document.getElementById('edit-viewer');

    if (emptyState) emptyState.style.display = 'flex';
    if (mdContent) mdContent.style.display = 'none';
    if (editViewer) editViewer.style.display = 'none';
  }

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


// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Load persistent state from server (priority over localStorage)
  await AppState.loadPersistentState();

  // 2. Initial UI setup
  if (typeof SettingsService !== 'undefined') {
    SettingsService.applyTheme();
  }

  // 1. Core UI Components First
  SidebarLeft.init();        // organisms/sidebar-left.js
  ChangeActionViewBar.init(); // organisms/change-action-view-bar.js
  RightSidebar.init();        // organisms/right-sidebar.js
  EditToolbarComponent.init(); // organisms/edit-toolbar-component.js

  // 2. Support Modules
  initSocket();
  initMermaid();          // mermaid.js
  initZoom();             // zoom.js

  // ── Shortcut Management ──
  if (typeof ShortcutService !== 'undefined' && typeof ShortcutsComponent !== 'undefined') {
    ShortcutService.init();
    
    // Register Default Groups from ShortcutsComponent
    const isMac = ShortcutService.isMac();
    const groups = ShortcutsComponent.getShortcutData(isMac);
    
    // Assign Handlers
    const handlers = {
      'mode-read': () => {
        const btn = document.querySelector('.ds-segment-item[data-id="read"]');
        if (btn) btn.click();
        else if (window.AppState?.onModeChange) AppState.onModeChange('read');
      },
      'mode-edit': () => {
        const btn = document.querySelector('.ds-segment-item[data-id="edit"]');
        if (btn) btn.click();
        else if (window.AppState?.onModeChange) AppState.onModeChange('edit');
      },
      'mode-comment': () => {
        const btn = document.querySelector('.ds-segment-item[data-id="comment"]');
        if (btn) btn.click();
        else if (window.AppState?.onModeChange) AppState.onModeChange('comment');
      },
      'mode-collect': () => {
        const btn = document.querySelector('.ds-segment-item[data-id="collect"]');
        if (btn) btn.click();
        else if (window.AppState?.onModeChange) AppState.onModeChange('collect');
      },
      'toggle-sidebar': () => {
        if (window.TabsModule?.toggleSidebar) window.TabsModule.toggleSidebar();
        else document.getElementById('sidebar-toggle-btn')?.click();
      },
      'focus-search': () => window.SearchPalette?.show(),
      'scroll-top': () => {
        const v = window.MarkdownViewer?.getInstance();
        const scrollEl = v ? v.getActiveScrollElement() : document.getElementById('md-viewer-mount');
        if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
      },
      'scroll-bottom': () => {
        const v = window.MarkdownViewer?.getInstance();
        const scrollEl = v ? v.getActiveScrollElement() : document.getElementById('md-viewer-mount');
        if (scrollEl) scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
      },
      'toggle-fullscreen': () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
      },
      'save-file': () => window.EditorModule?.save(),
      'undo': () => document.execCommand('undo'),
      'redo': () => document.execCommand('redo'),
      'markdown-helper': () => window.MarkdownHelperComponent?.open(),
      'select-all-tabs': () => window.TabsModule?.selectAll(),
      'close-active-tab': () => {
        const active = window.TabsModule?.getActive();
        if (active) window.TabsModule.remove(active);
      },
      'close-all-tabs': () => window.TabsModule?.closeAll(),
      'toggle-pin-tab': () => {
        const active = window.TabsModule?.getActive();
        if (active) window.TabsModule.togglePin(active);
      },
      'deselect-tabs': () => {
        if (window.TabsModule) window.TabsModule.deselectAll();
        if (window.TreeModule) window.TreeModule.deselectAll();
      },
      'new-file': () => {
        const btn = document.querySelector('[data-action-id="new-file"]');
        if (btn) btn.click();
        else if (window.TreeModule) window.TreeModule.createNewFile();
      },
      'new-folder': () => {
         if (window.TreeModule) window.TreeModule.createNewFolder();
      },
      'rename-selected': () => {
         if (window.TreeModule) window.TreeModule.renameSelected();
      },
      'duplicate-file': () => {
         if (window.TreeModule) window.TreeModule.duplicateSelected();
      },
      'delete-selected': () => {
         if (window.TreeModule) window.TreeModule.deleteSelected();
      },
      'workspace-picker': () => document.getElementById('workspace-switcher')?.click(),
      'hide-unhide': () => {
         if (window.TreeModule) window.TreeModule.toggleHiddenItems();
      },
      'collapse-all': () => {
         if (window.TreeModule) window.TreeModule.collapseAll();
      },
      'collapse-others': () => {
         if (window.TreeModule) {
           const state = window.TreeModule.getState();
           const target = state.selectedPaths.length > 0 ? state.selectedPaths[0] : null;
           if (target) window.TreeModule.collapseOthers(target);
         }
      },
      'keyboard-shortcuts': () => window.SearchPalette?.show('shortcut'),
      'open-settings': () => window.SettingsComponent?.toggle(),
      'close-cancel': () => {
         // Close Search
         if (window.SearchPalette && window.SearchPalette.isOpen()) {
           window.SearchPalette.hide();
         }
         // Close Settings
         if (window.SettingsComponent && window.SettingsComponent.activeInstance) {
           window.SettingsComponent.hide();
         }
         // Global deselect
         if (window.TabsModule) window.TabsModule.deselectAll();
         if (window.TreeModule) window.TreeModule.deselectAll();
      }
    };

    // Inject handlers into groups
    groups.forEach(group => {
      group.items.forEach(item => {
        if (handlers[item.id]) {
          item.handler = handlers[item.id];
        }
      });
    });

    ShortcutService.registerGroups(groups);
  }

  if (typeof SearchPalette !== 'undefined') SearchPalette.init();

  // 3. Functional Modules
  if (typeof SettingsService !== 'undefined') {
    SettingsService.applyTheme();
  }
  DraftModule.init();        // draft.js
  MarkdownViewer.init();      // organisms/markdown-viewer-component.js
  ScrollModule.init();       // scroll.js
  TabPreview.init();         // molecules/tab-preview.js
  ScrollModule.setContainer(document.getElementById('md-viewer-mount'));

  // 4. Tab System (triggers initial loadFile)
  TabsModule.init();         // tabs.js

  if (typeof CollectModule !== 'undefined') CollectModule.init(); // collect.js
  if (typeof window.TOCComponent !== 'undefined') window.TOCComponent.init(); // organisms/toc-component.js
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
 * Global Toast Notification
 */
function showToast(message, type = 'success', options = {}) {
  const toastId = options.id || 'default-toast';
  let container = document.getElementById(`toast-${toastId}`);
  
  if (!container) {
    container = document.createElement('div');
    container.id = `toast-${toastId}`;
    container.className = 'toast-container';
    container.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon"></div>
        <div class="toast-message"></div>
        <div class="toast-close">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </div>
        <div class="toast-progress-container">
          <div class="toast-progress-bar"></div>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    container.querySelector('.toast-close').onclick = () => {
      container.classList.remove('show');
      setTimeout(() => container.remove(), 400);
    };
  }

  const content = container.querySelector('.toast-content');
  const icon = container.querySelector('.toast-icon');
  const messageEl = container.querySelector('.toast-message');
  const progressBar = container.querySelector('.toast-progress-bar');

  // Set Type
  content.className = `toast-content ${type}`;
  if (options.progress !== undefined) {
    content.classList.add('has-progress');
    progressBar.style.width = `${options.progress}%`;
  } else {
    content.classList.remove('has-progress');
  }

  messageEl.textContent = message;

  // Set Icon
  if (type === 'error') {
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  } else {
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"/><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`;
  }

  container.classList.add('show');

  // Auto hide (unless sticky)
  if (container._timer) clearTimeout(container._timer);
  if (!options.sticky) {
    container._timer = setTimeout(() => {
      container.classList.remove('show');
      setTimeout(() => container.remove(), 400);
    }, options.duration || 4000);
  }
}
window.showToast = showToast;
