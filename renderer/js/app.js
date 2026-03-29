/* ============================================================
   app.js — Core state, file loading, mermaid, zoom, socket
   Vanilla CSS version — no Tailwind / Lucide CDN
   ============================================================ */

const AppState = {
  currentFile:      null,
  currentWorkspace: null,
  commentMode:      false,
  socket:           null
};

// ── Mermaid init ──────────────────────────────────────────────
function initMermaid() {
  if (typeof mermaid === 'undefined') return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      primaryColor:        '#ffbf48',
      primaryTextColor:    '#000000',
      primaryBorderColor:  '#e6a800',
      lineColor:           '#aaaaaa',
      secondaryColor:      '#2a2a3e',
      tertiaryColor:       '#1d1d2e',
      mainBkg:             '#2d2d42',
      nodeBorder:          '#5a5a7a',
      clusterBkg:          'rgba(255,255,255,0.04)',
      titleColor:          '#ffffff',
      edgeLabelBackground: '#1a1a2e',
      fontFamily:          'Inter, sans-serif'
    }
  });
}

// ── Socket ────────────────────────────────────────────────────
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
  });
}

// ── File loading ──────────────────────────────────────────────
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
    const sep = `<svg class="breadcrumb-sep" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
    const fileName = filePath.split('/').pop();
    breadcrumb.innerHTML = `${homeIcon} ${sep} <span>${AppState.currentWorkspace.name}</span> ${sep} <span>${fileName}</span>`;
  }

  await processMermaid(mdContent);
  await CommentsModule.loadForFile(filePath);

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

// ── Mermaid processing ────────────────────────────────────────
async function processMermaid(container) {
  if (typeof mermaid === 'undefined') return;
  const nodes = [];
  container.querySelectorAll('pre > code.language-mermaid').forEach(el => {
    const wrapper = document.createElement('div');
    wrapper.className = 'mermaid';
    wrapper.textContent = el.textContent;
    el.closest('pre').replaceWith(wrapper);
    nodes.push(wrapper);
  });
  if (nodes.length > 0) {
    try {
      await mermaid.run({ nodes });
      setupMermaidClicks(container);
    } catch (err) {
      console.error('Mermaid render error:', err);
    }
  }
}

function setupMermaidClicks(container) {
  container.querySelectorAll('.mermaid').forEach(div => {
    div.onclick = () => openZoom(div);
  });
}

// ── Zoom modal ────────────────────────────────────────────
let zoomScale = 1, zoomX = 0, zoomY = 0;
let zoomMoving = false, zoomStartX = 0, zoomStartY = 0;
let _zoomNatW = 0, _zoomNatH = 0;

function updateZoomTransform() {
  const el = document.getElementById('zoom-container');
  if (el) el.style.transform = `translate(${zoomX}px, ${zoomY}px) scale(${zoomScale})`;
}

function updateZoomPercent() {
  const pct = document.getElementById('zoom-pct');
  if (pct) pct.textContent = Math.round(zoomScale * 100) + '%';
}

function fitZoom() {
  if (!_zoomNatW || !_zoomNatH) return;
  const padX = 80, padY = 130;
  const scaleX = (window.innerWidth - padX * 2) / _zoomNatW;
  const scaleY = (window.innerHeight - padY * 2) / _zoomNatH;
  zoomScale = Math.min(scaleX, scaleY);
  zoomX = (window.innerWidth - _zoomNatW * zoomScale) / 2;
  zoomY = (window.innerHeight - _zoomNatH * zoomScale) / 2;
  updateZoomTransform();
  updateZoomPercent();
}

function openZoom(mermaidDiv) {
  const svg = mermaidDiv.querySelector('svg');
  if (!svg) return;

  const modal     = document.getElementById('zoom-modal');
  const container = document.getElementById('zoom-container');
  container.innerHTML = '';

  const clone = svg.cloneNode(true);
  const rect  = svg.getBoundingClientRect();
  const vb    = svg.viewBox?.baseVal;

  _zoomNatW = (vb && vb.width  > 0) ? vb.width  : (rect.width  || 800);
  _zoomNatH = (vb && vb.height > 0) ? vb.height : (rect.height || 600);

  clone.setAttribute('width',  _zoomNatW);
  clone.setAttribute('height', _zoomNatH);
  clone.style.cssText = `width:${_zoomNatW}px;height:${_zoomNatH}px;display:block;`;

  container.appendChild(clone);
  modal.classList.add('show');

  // Fit after paint so viewport dimensions are accurate
  requestAnimationFrame(fitZoom);
}

function closeZoom() {
  document.getElementById('zoom-modal').classList.remove('show');
}

function initZoom() {
  document.getElementById('zoom-close')  ?.addEventListener('click', closeZoom);
  document.getElementById('zoom-fit-btn')?.addEventListener('click', fitZoom);

  document.getElementById('zoom-in-btn')?.addEventListener('click', () => {
    zoomScale = Math.min(10, zoomScale * 1.3);
    zoomX = (window.innerWidth  - _zoomNatW * zoomScale) / 2;
    zoomY = (window.innerHeight - _zoomNatH * zoomScale) / 2;
    updateZoomTransform(); updateZoomPercent();
  });

  document.getElementById('zoom-out-btn')?.addEventListener('click', () => {
    zoomScale = Math.max(0.05, zoomScale / 1.3);
    zoomX = (window.innerWidth  - _zoomNatW * zoomScale) / 2;
    zoomY = (window.innerHeight - _zoomNatH * zoomScale) / 2;
    updateZoomTransform(); updateZoomPercent();
  });

  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeZoom(); });

  const modal = document.getElementById('zoom-modal');
  if (!modal) return;

  // Pan with mouse drag
  modal.addEventListener('mousedown', e => {
    if (e.target.closest('#zoom-close') || e.target.closest('#zoom-controls-bar')) return;
    zoomMoving = true;
    zoomStartX = e.clientX - zoomX;
    zoomStartY = e.clientY - zoomY;
  });
  window.addEventListener('mousemove', e => {
    if (!zoomMoving) return;
    zoomX = e.clientX - zoomStartX;
    zoomY = e.clientY - zoomStartY;
    updateZoomTransform();
  });
  window.addEventListener('mouseup', () => { zoomMoving = false; });

  // Comment Resizer
  const cr = document.getElementById('comment-resizer');
  const cw = document.getElementById('comment-sidebar-wrap');
  if (cr && cw) {
    cr.onmousedown = e => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = cw.offsetWidth;
      const onMove = mm => {
        const delta = startX - mm.clientX;
        const newW = Math.min(600, Math.max(200, startW + delta));
        cw.style.width = newW + 'px';
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
  }

  // Wheel zoom toward cursor
  modal.addEventListener('wheel', e => {
    e.preventDefault();
    const factor   = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const newScale = Math.min(10, Math.max(0.05, zoomScale * factor));
    const xs = (e.clientX - zoomX) / zoomScale;
    const ys = (e.clientY - zoomY) / zoomScale;
    zoomScale = newScale;
    zoomX = e.clientX - xs * zoomScale;
    zoomY = e.clientY - ys * zoomScale;
    updateZoomTransform();
  }, { passive: false });
}

// ── Segmented Control ─────────────────────────────────────────
function initSegmentedControl() {
  const segments = document.querySelectorAll('.mode-segment');
  const bg       = document.getElementById('segment-bg');
  const sidebar  = document.getElementById('comment-sidebar-wrap');
  const control  = document.querySelector('.segmented-control');

  const updateUI = (mode) => {
    AppState.commentMode = (mode === 'comment');

    let activeSeg = null;
    segments.forEach(seg => {
      const isActive = seg.dataset.mode === mode;
      seg.classList.toggle('active', isActive);
      if (isActive) activeSeg = seg;
    });

    if (activeSeg && bg && control) {
      const segRect = activeSeg.getBoundingClientRect();
      const conRect = control.getBoundingClientRect();
      bg.style.width = `${segRect.width}px`;
      bg.style.transform = `translateX(${segRect.left - conRect.left - 5}px)`;
    }

    if (mode === 'read') {
      if (sidebar) {
        sidebar.classList.remove('opening');
        sidebar.classList.remove('open');
        sidebar.style.width = ''; // Clear inline width from resizer
      }
      if (typeof CommentsModule !== 'undefined') CommentsModule.removeCommentMode();
    } else {
      if (sidebar) {
        sidebar.classList.add('opening');
        sidebar.classList.add('open');
        // Animation cleanup: remove opening trigger class after items are revealed
        setTimeout(() => sidebar.classList.remove('opening'), 800);
      }
      if (typeof CommentsModule !== 'undefined') CommentsModule.applyCommentMode();
    }
  };

  segments.forEach(seg => {
    seg.addEventListener('click', () => updateUI(seg.dataset.mode));
  });

  // Small delay for layout
  setTimeout(() => updateUI('read'), 100);
}

// ── Toolbar buttons ───────────────────────────────────────────
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
      fsBtn.innerHTML = document.fullscreenElement ? iconMin : iconMax;
    });
  }
}

// ── Sidebar Resizer ───────────────────────────────────────────
function initSidebarResizer() {
  const sidebar = document.getElementById('sidebar-left');
  const resizer = document.getElementById('sidebar-resizer');
  if (!sidebar || !resizer) return;

  let isResizing = false;

  resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const newWidth = e.clientX - sidebar.getBoundingClientRect().left;
    if (newWidth >= 200 && newWidth <= 480) {
      sidebar.style.width = `${newWidth}px`;
    }
  });

  window.addEventListener('mouseup', () => {
    if (!isResizing) return;
    isResizing = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  });
}

// ── Search ────────────────────────────────────────────────────
function initSearch() {
  const searchInput = document.getElementById('sidebar-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      TreeModule.search(e.target.value);
    });
  }
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSocket();
  initMermaid();
  initZoom();
  initSegmentedControl();
  initToolbarBtns();
  initSearch();
  initSidebarResizer();

  setTimeout(() => {
    if (typeof WorkspaceModule !== 'undefined') WorkspaceModule.init();
  }, 0);
});
