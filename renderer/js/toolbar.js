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
  const segments = document.querySelectorAll('.mode-segment');
  const bg       = document.getElementById('segment-bg');
  const sidebar  = document.getElementById('comment-sidebar-wrap');
  const control  = document.querySelector('.segmented-control');

  const updateUI = (mode) => {
    AppState.commentMode = (mode === 'comment'); // AppState defined in app.js

    let activeSeg = null;
    segments.forEach(seg => {
      const isActive = seg.dataset.mode === mode;
      seg.classList.toggle('active', isActive);
      if (isActive) activeSeg = seg;
    });

    if (activeSeg && bg && control) {
      const segRect = activeSeg.getBoundingClientRect();
      const conRect = control.getBoundingClientRect();
      bg.style.width     = `${segRect.width}px`;
      bg.style.transform = `translateX(${segRect.left - conRect.left - 5}px)`;
    }

    if (mode === 'read') {
      if (sidebar) {
        sidebar.classList.remove('opening');
        sidebar.classList.remove('open');
        sidebar.style.width = '';
        sidebar.style.minWidth = '';
      }
      if (typeof CommentsModule !== 'undefined') CommentsModule.removeCommentMode();
    } else {
      if (sidebar) {
        // Remove open first so CSS starts from width:0, then add open to trigger transition
        sidebar.classList.remove('open');
        void sidebar.offsetWidth; // force browser reflow
        sidebar.classList.add('opening');
        sidebar.classList.add('open');

        // Apply saved width if exists
        const savedWidth = localStorage.getItem('mdpreview_sidebar_right_width');
        if (savedWidth) {
          sidebar.style.width = savedWidth + 'px';
          sidebar.style.minWidth = savedWidth + 'px';
        }

        setTimeout(() => sidebar.classList.remove('opening'), 800);
      }
      if (typeof CommentsModule !== 'undefined') CommentsModule.applyCommentMode();
    }
  };

  segments.forEach(seg => {
    seg.addEventListener('click', () => updateUI(seg.dataset.mode));
  });

  setTimeout(() => updateUI('read'), 100);
}
