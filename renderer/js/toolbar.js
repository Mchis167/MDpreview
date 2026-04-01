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
}

function initSidebarToggle() {
  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  const sidebarWrap = document.getElementById('sidebar-left-wrap');
  if (!toggleBtn || !sidebarWrap) return;

  const iconOpen = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19V5" /><path d="m13 19-7-7 7-7" /><path d="M21 12H6" /></svg>`; // arrow-left-to-line
  const iconClosed = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5v14" /><path d="m11 5 7 7-7 7" /><path d="M3 12h15" /></svg>`; // arrow-right-from-line

  const updateIcon = (isCollapsed) => {
    toggleBtn.innerHTML = isCollapsed ? iconClosed : iconOpen;
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


function initSegmentedControl() {
  const control  = document.querySelector('.segmented-control');
  if (!control) return;

  // Security: Ensure Edit segment exists (some users reported it missing in main app)
  if (control && control.querySelectorAll('.mode-segment').length < 3) {
      control.innerHTML = `
        <div id="segment-bg"></div>
        <button class="mode-segment" data-mode="read">Read</button>
        <button class="mode-segment" data-mode="edit">Edit</button>
        <button class="mode-segment" data-mode="comment">Comment</button>
      `;
  }

  const segments = control.querySelectorAll('.mode-segment');
  const bg       = document.getElementById('segment-bg');
  const sidebar  = document.getElementById('comment-sidebar-wrap');

  const updateUI = async (mode) => {
    if (typeof AppState === 'undefined') return;
    
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

    if (mode === 'read' || mode === 'comment') {
      if (AppState.currentFile) {
        if (mdContent) mdContent.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
      }
      
      // Sidebar
      if (mode === 'read') {
        if (sidebar) {
          sidebar.classList.remove('open');
          sidebar.style.width = '';
        }
        if (typeof CommentsModule !== 'undefined') CommentsModule.removeCommentMode();
      } else {
        if (sidebar) {
          sidebar.classList.add('open');
          const savedWidth = localStorage.getItem('mdpreview_sidebar_right_width');
          if (savedWidth) sidebar.style.width = savedWidth + 'px';
        }
        if (typeof CommentsModule !== 'undefined') CommentsModule.applyCommentMode();
      }
    } else if (mode === 'edit') {
      if (AppState.currentFile) {
        if (editViewer) editViewer.style.display = 'flex';
        if (emptyState) emptyState.style.display = 'none';
        await loadRawContent();
      }
      if (sidebar) {
        sidebar.classList.remove('open');
        sidebar.style.width = '';
      }
      if (typeof CommentsModule !== 'undefined') CommentsModule.removeCommentMode();
    }
  };

  async function loadRawContent() {
    if (!AppState.currentFile) return;

    if (AppState.currentFile === '__AI_RESPONSE__') {
        // For AI Response, the "raw" content is what's in the AI chat input
        const aiInput = document.getElementById('ai-chat-input');
        if (aiInput && typeof EditorModule !== 'undefined') {
            EditorModule.setOriginalContent(aiInput.value);
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

  segments.forEach(seg => {
    seg.addEventListener('click', () => updateUI(seg.dataset.mode));
  });

  // Expose updateUI to AppState so sidebar can trigger it
  AppState.updateToolbarUI = updateUI;

  setTimeout(() => updateUI('read'), 100);
}
