/* ============================================================
   toolbar.js — Toolbar action buttons and Read/Comment mode toggle
   initSegmentedControl() uses AppState from app.js.
   ============================================================ */

function initToolbarBtns() {
  const scrollBtn = document.getElementById('scroll-top-btn');
  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
      const viewer = document.getElementById('md-viewer');
      if (viewer) viewer.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const rebuildBtn = document.getElementById('rebuild-btn');
  if (rebuildBtn) {
    rebuildBtn.addEventListener('click', () => {
      if (confirm('Rebuild and relaunch the application?')) {
        window.electronAPI.rebuildApp();
      }
    });
  }

  const fsBtn = document.getElementById('fullscreen-btn');
  if (fsBtn) {
    const iconMax = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
    const iconMin = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;

    fsBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });

    document.addEventListener('fullscreenchange', () => {
      const isFS = !!document.fullscreenElement;
      fsBtn.innerHTML = isFS ? iconMin : iconMax;
      document.body.classList.toggle('is-fullscreen', isFS);
    });
  }

  initSidebarToggle();
  initDraftActions();
}

function initSidebarToggle() {
  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  const sidebarWrap = document.getElementById('sidebar-left-wrap');
  if (!toggleBtn || !sidebarWrap) return;

  const iconOpen = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
    <rect width="18" height="18" x="3" y="3" rx="2" />
  </svg>`; // Figma style: arrow pointing left (collapse)
  const iconClosed = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
    <rect width="18" height="18" x="3" y="3" rx="2" />
  </svg>`; // Figma style: arrow pointing right (expand)

  const updateIcon = (isCollapsed) => {
    if (typeof window.updateSidebarToggleIcon === 'function') {
      window.updateSidebarToggleIcon(isCollapsed);
    } else {
      toggleBtn.innerHTML = isCollapsed ? iconClosed : iconOpen;
    }
  };

  // Initial state
  const isCollapsed = localStorage.getItem('mdpreview_sidebar_left_collapsed') === 'true';
  if (isCollapsed) {
    sidebarWrap.classList.add('sidebar-collapsed');
    updateIcon(true);
  } else {
    updateIcon(false);
  }

  toggleBtn.addEventListener('click', () => {
    const nowCollapsed = sidebarWrap.classList.toggle('sidebar-collapsed');
    localStorage.setItem('mdpreview_sidebar_left_collapsed', nowCollapsed);
    updateIcon(nowCollapsed);
  });
}


// ── Mode Sync Helpers ────────────────────────────────────────

// Get the data-line of the .md-line element containing the current read view selection
function captureReadViewLine() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const mdContent = document.getElementById('md-content');
  if (!mdContent || !mdContent.contains(range.commonAncestorContainer)) return null;

  let node = range.startContainer.nodeType === Node.TEXT_NODE
    ? range.startContainer.parentElement
    : range.startContainer;

  while (node && node !== mdContent) {
    if (node.dataset && node.dataset.line) return parseInt(node.dataset.line);
    node = node.parentElement;
  }
  return null;
}

// Get 1-indexed line number of textarea cursor
function captureEditorLine() {
  const textarea = document.getElementById('edit-textarea');
  if (!textarea) return null;
  return textarea.value.substring(0, textarea.selectionStart).split('\n').length;
}

// Scroll textarea cursor to a 1-indexed line number
function scrollEditorToLine(lineNum) {
  const textarea = document.getElementById('edit-textarea');
  if (!textarea || !lineNum) return;
  const lines = textarea.value.split('\n');
  let charPos = 0;
  for (let i = 0; i < Math.min(lineNum - 1, lines.length - 1); i++) {
    charPos += lines[i].length + 1;
  }
  textarea.focus();
  textarea.setSelectionRange(charPos, charPos);
}

// Scroll read view to a 1-indexed line number using data-line attributes
function scrollReadViewToLine(lineNum) {
  if (!lineNum) return;
  const viewer = document.getElementById('md-viewer');
  if (!viewer) return;

  let target = viewer.querySelector(`[data-line="${lineNum}"]`);
  if (!target) {
    const allLines = Array.from(viewer.querySelectorAll('[data-line]'));
    if (!allLines.length) return;
    target = allLines.reduce((closest, el) =>
      Math.abs(parseInt(el.dataset.line) - lineNum) < Math.abs(parseInt(closest.dataset.line) - lineNum)
        ? el : closest
    );
  }
  if (target) target.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function initSegmentedControl() {
  const control  = document.querySelector('.segmented-control');
  if (!control) return;

  // Security: Ensure segments exist
  if (control && control.querySelectorAll('.mode-segment').length < 4) {
      control.innerHTML = `
        <div id="segment-bg"></div>
        <button class="mode-segment" data-mode="read">Read</button>
        <button class="mode-segment" data-mode="edit">Edit</button>
        <button class="mode-segment" data-mode="comment">Comment</button>
        <button class="mode-segment" data-mode="collect">Collect</button>
      `;
  }

  const segments = control.querySelectorAll('.mode-segment');
  const bg       = document.getElementById('segment-bg');
  const sidebar  = document.getElementById('comment-sidebar-wrap');
  const collectSidebar = document.getElementById('collect-sidebar-wrap');

  const updateUI = async (mode) => {
    if (typeof AppState === 'undefined') return;

    // ── File Selection Guard ──────────────────────────────────
    const toolbar = document.getElementById('secondary-toolbar');
    if (toolbar) {
      toolbar.style.display = AppState.currentFile ? 'flex' : 'none';
    }

    if (!AppState.currentFile) return;

    // Capture scroll/cursor position before switching
    const prevMode = AppState.currentMode;
    let syncLine = null;
    if ((prevMode === 'read' || prevMode === 'comment') && mode === 'edit') {
      syncLine = captureReadViewLine();
    } else if (prevMode === 'edit' && mode !== 'edit') {
      syncLine = captureEditorLine();
    }

    // Dirty check before leaving 'edit' mode
    if (AppState.currentMode === 'edit' && mode !== 'edit') {
        if (typeof EditorModule !== 'undefined' && EditorModule.isDirty()) {
            if (confirm('You have unsaved changes. Save them before switching?')) {
                const saved = await EditorModule.save();
                if (!saved) return; // Stop if save failed
            }
        }
    }

    AppState.commentMode = (mode === 'comment');
    AppState.currentMode = mode;

    let activeSeg = null;
    segments.forEach(seg => {
      const isActive = seg.dataset.mode === mode;
      seg.classList.toggle('active', isActive);
      if (isActive) activeSeg = seg;
    });

    if (activeSeg && bg && control) {
      bg.style.width     = `${activeSeg.offsetWidth}px`;
      bg.style.transform = `translateX(${activeSeg.offsetLeft - 5}px)`;
    }

    const mdContent   = document.getElementById('md-content');
    const editViewer  = document.getElementById('edit-viewer');
    const emptyState  = document.getElementById('empty-state');

    // Basic visibility
    if (mdContent)  mdContent.style.display  = 'none';
    if (editViewer) editViewer.style.display = 'none';

    if (mode === 'read' || mode === 'comment' || mode === 'collect') {
      if (AppState.currentFile) {
        if (mdContent) mdContent.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
      }

      // Sidebar Reset
      if (sidebar) {
        sidebar.classList.remove('open');
        sidebar.style.width = '';
      }
      if (collectSidebar) {
        collectSidebar.classList.remove('open');
        collectSidebar.style.width = '';
      }

      // Selection Mode Reset
      if (typeof CommentsModule !== 'undefined') CommentsModule.removeCommentMode();
      if (typeof CollectModule !== 'undefined') CollectModule.removeCollectMode();

      // Mode Specific Logic
      if (mode === 'comment') {
        if (sidebar) {
          sidebar.classList.add('open');
          const savedWidth = localStorage.getItem('mdpreview_sidebar_right_width');
          if (savedWidth) sidebar.style.width = savedWidth + 'px';
        }
        if (typeof CommentsModule !== 'undefined') CommentsModule.applyCommentMode();
      } else if (mode === 'collect') {
        if (collectSidebar) {
          collectSidebar.classList.add('open');
          // For now ideas list is 320px
          collectSidebar.style.width = '320px';
          
          // Load ideas for file
          if (typeof CollectModule !== 'undefined') {
            CollectModule.loadForFile(AppState.currentFile);
            CollectModule.applyCollectMode();
          }
        }
      }

      // Sync scroll: coming from edit, jump to where the cursor was
      if (prevMode === 'edit' && syncLine) {
        requestAnimationFrame(() => scrollReadViewToLine(syncLine));
      }
    } else if (mode === 'edit') {
      if (AppState.currentFile) {
        if (editViewer) editViewer.style.display = 'flex';
        if (emptyState) emptyState.style.display = 'none';
        await loadRawContent();
        // Sync scroll: coming from read/comment, jump to selected line
        if (syncLine) scrollEditorToLine(syncLine);
      }
      
      // Sidebar Reset
      if (sidebar) {
        sidebar.classList.remove('open');
        sidebar.style.width = '';
      }
      if (collectSidebar) {
        collectSidebar.classList.remove('open');
        collectSidebar.style.width = '';
      }

      if (typeof CommentsModule !== 'undefined') CommentsModule.removeCommentMode();
      if (typeof CollectModule !== 'undefined') CollectModule.removeCollectMode();
    }

    // ── Draft Specific UI Toggle ───────────────────────────────
    const draftActions = document.getElementById('draft-actions-group');
    if (draftActions) {
      draftActions.style.display = (AppState.currentFile === '__DRAFT_MODE__') ? 'flex' : 'none';
    }
  };

  segments.forEach(seg => {
    seg.addEventListener('click', () => updateUI(seg.dataset.mode));
  });

  // Expose updateUI to AppState so sidebar can trigger it
  AppState.updateToolbarUI = updateUI;

  setTimeout(() => updateUI('read'), 100);
}

// ── Draft Actions ───────────────────────────────────────────
function initDraftActions() {
  const saveBtn    = document.getElementById('draft-save-btn');
  const discardBtn = document.getElementById('draft-discard-btn');

  if (saveBtn) {
    saveBtn.onclick = async () => {
      if (typeof DraftModule === 'undefined') return;
      const content = DraftModule.getDraftContent();
      if (!content) {
          alert('Draft is empty.');
          return;
      }

      const fileName = prompt('Save Draft as File\nEnter filename (with .md extension):', 'untitled.md');
      if (!fileName) return;

      const cleanName = fileName.endsWith('.md') ? fileName : fileName + '.md';
      const filePath = `${AppState.currentWorkspace.path}/${cleanName}`;

      try {
        const res = await fetch('/api/file/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: filePath, content })
        });

        if (res.ok) {
          if (typeof showToast === 'function') showToast('Draft saved as file!');
          
          // Hide buttons immediately
          const group = document.getElementById('draft-actions-group');
          if (group) group.style.display = 'none';

          // Close Draft tab and open new file
          if (typeof TabsModule !== 'undefined') {
            TabsModule.remove('__DRAFT_MODE__');
            if (typeof loadFile === 'function') loadFile(filePath);
          }
        } else {
          const errData = await res.json();
          alert('Failed to save file: ' + (errData.error || 'Unknown error'));
        }
      } catch (err) {
        console.error(err);
        alert('Error saving file.');
      }
    };
  }

  if (discardBtn) {
    discardBtn.onclick = () => {
      if (confirm('Are you sure you want to discard this draft? This cannot be undone.')) {
        // Hide buttons immediately
        const group = document.getElementById('draft-actions-group');
        if (group) group.style.display = 'none';

        if (typeof TabsModule !== 'undefined') {
          TabsModule.remove('__DRAFT_MODE__');
          if (typeof DraftModule !== 'undefined') {
            DraftModule.clear();
          }
        }
      }
    };
  }
}

async function loadRawContent() {
  if (!AppState.currentFile) return;

  if (AppState.currentFile === '__DRAFT_MODE__') {
      // For Draft, the "raw" content is what's in the DraftModule state
      if (typeof DraftModule !== 'undefined' && typeof EditorModule !== 'undefined') {
          EditorModule.setOriginalContent(DraftModule.getDraftContent());
      }
      return;
  }

  const res = await fetch(`/api/file/raw?path=${encodeURIComponent(AppState.currentFile)}`);

  if (res.ok) {
      const text = await res.text();
      if (typeof EditorModule !== 'undefined') {
          EditorModule.setOriginalContent(text);
      } else {
          const textarea = document.getElementById('edit-textarea');
          if (textarea) textarea.value = text;
      }
  }
}

// ── Keyboard Shortcuts Popover ───────────────────────────
function initShortcutsPopover() {
  const btn     = document.getElementById('shortcuts-btn');
  const popover = document.getElementById('shortcuts-popover');
  const closeBtn = document.getElementById('shortcuts-close-btn');
  if (!btn || !popover) return;

  const open  = () => popover.classList.add('open');
  const close = () => popover.classList.remove('open');
  const toggle = () => popover.classList.contains('open') ? close() : open();

  btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
  if (closeBtn) closeBtn.addEventListener('click', close);

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!popover.contains(e.target) && e.target !== btn) close();
  });

  // Expose close for Escape handler in global shortcuts
  return { open, close, toggle };
}

// ── Global Keyboard Shortcuts ────────────────────────────
function initGlobalShortcuts() {
  const shortcutsCtrl = initShortcutsPopover();
  if (!shortcutsCtrl) return;

  const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform) || (navigator.userAgentData && navigator.userAgentData.platform === 'macOS');

  // Update UI to show ⌘ symbols on Mac
  if (isMac) {
    document.querySelectorAll('#shortcuts-popover kbd').forEach(k => {
      if (k.textContent === 'Ctrl') k.textContent = '⌘';
    });
    // Handle Fullscreen special case for Mac UI
    const fsKbd = document.getElementById('kbd-fullscreen');
    if (fsKbd) {
      fsKbd.innerHTML = '<kbd>⌃</kbd><kbd>⌘</kbd><kbd>F</kbd>';
    }
  }

  document.addEventListener('keydown', (e) => {
    const mod = isMac ? e.metaKey : e.ctrlKey;

    // ── Escape: close any open overlays ─────────────────
    if (e.key === 'Escape') {
      shortcutsCtrl.close();
      const helpPopover = document.getElementById('edit-help-popover');
      if (helpPopover) helpPopover.classList.remove('open');
      return;
    }

    // Skip if user is typing in an input/textarea (except shortcuts we explicitly want)
    const activeTag = document.activeElement?.tagName;
    const inInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

    // ── Mod+/ — Keyboard shortcuts popover ─────────────
    if (mod && e.key === '/') {
      e.preventDefault();
      shortcutsCtrl.toggle();
      return;
    }

    // ── Mod+, — Settings ───────────────────────────────
    if (mod && e.key === ',') {
      e.preventDefault();
      const settingsBtn = document.getElementById('open-settings-btn');
      if (settingsBtn) settingsBtn.click();
      return;
    }

    // ── Mod+F — Search ──────────────────────────────────
    if (mod && e.key === 'f') {
      e.preventDefault();
      document.getElementById('enter-search-btn')?.click();
      return;
    }

    // ── Mod+O — Workspace Picker ─────────────────────────
    if (mod && e.key === 'o') {
      e.preventDefault();
      const wsBtn = document.getElementById('workspace-switcher');
      if (wsBtn) wsBtn.click();
      return;
    }

    // ── Mod+R — Rebuild & Relaunch ────────────────────────
    if (mod && e.key === 'r') {
      e.preventDefault();
      const rebuildBtn = document.getElementById('rebuild-btn');
      if (rebuildBtn) rebuildBtn.click();
      return;
    }

    // ── Mod+W — Close Tab ────────────────────────────────
    if (mod && e.key === 'w') {
      e.preventDefault();
      if (typeof TabsModule !== 'undefined') {
        const active = TabsModule.getActive();
        if (active) TabsModule.remove(active);
      }
      return;
    }

    // Skip remaining shortcuts when focused in a text field
    if (inInput) return;

    // ── Mod+1/2/3 — Mode switch ─────────────────────────
    if (mod && e.key === '1') {
      e.preventDefault();
      document.querySelector('.mode-segment[data-mode="read"]')?.click();
      return;
    }
    if (mod && e.key === '2') {
      e.preventDefault();
      document.querySelector('.mode-segment[data-mode="edit"]')?.click();
      return;
    }
    if (mod && e.key === '3') {
      e.preventDefault();
      document.querySelector('.mode-segment[data-mode="comment"]')?.click();
      return;
    }

    // ── Mod+B — Toggle sidebar ──────────────────────────
    if (mod && e.key === 'b') {
      e.preventDefault();
      document.getElementById('sidebar-toggle-btn')?.click();
      return;
    }

    // ── Mod+S — Save (edit mode only) ───────────────────
    if (mod && e.key === 's') {
      if (typeof AppState !== 'undefined' && AppState.currentMode === 'edit') {
        e.preventDefault();
        if (typeof EditorModule !== 'undefined') EditorModule.save();
      }
      return;
    }

    // ── Mod+↑/↓ — Scroll to top/bottom ─────────────────
    if (mod && e.key === 'ArrowUp') {
      e.preventDefault();
      const viewer = document.getElementById('md-viewer');
      if (viewer) viewer.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (mod && e.key === 'ArrowDown') {
      e.preventDefault();
      const viewer = document.getElementById('md-viewer');
      if (viewer) viewer.scrollTo({ top: viewer.scrollHeight, behavior: 'smooth' });
      return;
    }

    // ── Fullscreen ───────────────────────────────────────
    const isFullscreenKey = isMac 
      ? (e.metaKey && e.ctrlKey && e.key === 'f') // Cmd + Ctrl + F
      : (e.key === 'F11');                      // F11

    if (isFullscreenKey) {
      e.preventDefault();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      return;
    }
  });

  // ── Mod+H in edit mode — Markdown helper ────────────
  document.addEventListener('keydown', (e) => {
    const mod = isMac ? e.metaKey : e.ctrlKey;
    if (mod && e.key === 'h') {
      const editViewer = document.getElementById('edit-viewer');
      if (!editViewer || editViewer.style.display === 'none') return;
      e.preventDefault();
      const helpPopover = document.getElementById('edit-help-popover');
      if (helpPopover) helpPopover.classList.toggle('open');
    }
  });
}

