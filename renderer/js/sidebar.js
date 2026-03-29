/* ── Recently Viewed ────────────────────────────────────────── */
const RecentlyViewedModule = (() => {
  const MAX_RECENT = 3;
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
    const list = document.getElementById('recently-viewed-list');
    const section = document.getElementById('recently-viewed-section');
    if (!list || !section) return;

    const recent = _getRaw(STORAGE_KEY + ws.id);
    if (recent.length === 0) { section.style.display = 'none'; return; }
    section.style.display = 'block';

    // Figma File Icon (identical to tree.js)
    const svgFile = `<svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.33341 6L7.33341 4L5.33341 2M2.66675 2L0.666748 4L2.66675 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    list.innerHTML = '';
    recent.forEach(path => {
      const fileName = path.split('/').pop();
      const item = document.createElement('div');
      item.className = 'recent-item' + (path === AppState.currentFile ? ' active' : '');
      item.dataset.path = path;
      item.innerHTML = `
        <div class="item-icon-wrap">${svgFile}</div>
        <div class="recent-item-label">${fileName}</div>
      `;
      item.onclick = e => { e.stopPropagation(); loadFile(path); };
      list.appendChild(item);
    });
  }

  return { add, render };
})();

function initSidebarModeSwitcher() {
  const btns = document.querySelectorAll('.sidebar-mode-btn');
  const indicator = document.getElementById('mode-indicator');
  const mdHeader = document.getElementById('sidebar-md-header');
  const expView = document.getElementById('sidebar-explorer-view');
  const searchView = document.getElementById('sidebar-search-view');
  const aiView = document.getElementById('sidebar-ai-view');

  function updateIndicator(btn) {
    if (!indicator) return;
    const idx = Array.from(btns).indexOf(btn);
    // Move indicator based on button index
    // Each button is 50% width
    indicator.style.transform = `translateX(${idx * 100}%)`;
  }

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.toggle('active', b === btn));
      updateIndicator(btn);

      if (btn.dataset.smode === 'ai') {
        if (mdHeader) mdHeader.style.display = 'none';
        expView.style.display = 'none';
        searchView.style.display = 'none';
        if (aiView) aiView.style.display = 'flex';
      } else {
        if (aiView) aiView.style.display = 'none';
        if (mdHeader) mdHeader.style.display = '';
        expView.style.display = 'flex';
        searchView.style.display = 'none';
      }
    });
  });

  // Initial position
  const active = document.querySelector('.sidebar-mode-btn.active');
  if (active) updateIndicator(active);
}

function initSidebarRevamp() {
  const mount = document.getElementById('sidebar-search-mount');
  const expView = document.getElementById('sidebar-explorer-view');
  const searchView = document.getElementById('sidebar-search-view');
  const mdHeader = document.getElementById('sidebar-md-header');
  const enterBtn = document.getElementById('enter-search-btn');

  const searchResults = document.getElementById('search-results-list');

  // Helper to toggle dividers
  const toggleDividers = (visible) => {
    document.querySelectorAll('.sidebar-divider').forEach(d => {
      d.style.display = visible ? 'block' : 'none';
    });
  };

  if (!mount || !enterBtn) return;

  // Initialize the reusable component
  const searchBar = SearchComponent.create({
    placeholder: 'Search...',
    onInput: (val) => {
      TreeModule.search(val.trim());
    },
    onExit: () => {
      expView.style.display = 'flex';
      if (mdHeader) mdHeader.style.display = '';
      searchView.style.display = 'none';
      toggleDividers(true);
      
      // Clear all search data
      searchBar.clear();
      TreeModule.search('');
      if (searchResults) searchResults.innerHTML = '';
    }
  });

  mount.appendChild(searchBar);

  enterBtn.addEventListener('click', () => {
    expView.style.display = 'none';
    if (mdHeader) mdHeader.style.display = 'none';
    searchView.style.display = 'flex';
    toggleDividers(false);
    
    // Auto focus and clear any leftover state just in case
    setTimeout(() => {
      searchBar.clear();
      TreeModule.search('');
      searchBar.focus();
    }, 50);
  });

  // Handle Escape key globally when search is active
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchView.style.display === 'flex') {
      const exitBtn = searchBar.querySelector('.exit-search-btn');
      if (exitBtn) exitBtn.click();
    }
  });
}

function initSidebarResizer() {
  const sidebar = document.getElementById('sidebar-left-wrap');
  const resizer = document.getElementById('sidebar-resizer');
  if (!sidebar || !resizer) return;

  let isResizing = false;

  // Load saved width
  const savedWidth = localStorage.getItem('mdpreview_sidebar_left_width');
  if (savedWidth) {
    sidebar.style.width = savedWidth + 'px';
  }

  resizer.addEventListener('mousedown', () => {
    isResizing = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  window.addEventListener('mousemove', e => {
    if (!isResizing) return;
    const rect = sidebar.getBoundingClientRect();
    const newWidth = e.clientX - rect.left;
    if (newWidth >= 256 && newWidth <= 600) {
      sidebar.style.width = `${newWidth}px`;
    }
  });

  window.addEventListener('mouseup', () => {
    if (!isResizing) return;
    isResizing = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
    
    // Save width
    const currentWidth = sidebar.offsetWidth;
    localStorage.setItem('mdpreview_sidebar_left_width', currentWidth);
  });
}
