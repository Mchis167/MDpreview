/* ============================================================
   sidebar.js — Left sidebar: mode switcher, search, and resizer
   All functions are self-contained DOM interactions.
   ============================================================ */

function initSidebarModeSwitcher() {
  const btns       = document.querySelectorAll('.sidebar-mode-btn');
  const mdHeader   = document.getElementById('sidebar-md-header');
  const expView    = document.getElementById('sidebar-explorer-view');
  const searchView = document.getElementById('sidebar-search-view');
  const aiView     = document.getElementById('sidebar-ai-view');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.toggle('active', b === btn));

      if (btn.dataset.smode === 'ai') {
        if (mdHeader) mdHeader.style.display = 'none';
        expView.style.display    = 'none';
        searchView.style.display = 'none';
        if (aiView) aiView.style.display = 'flex';
      } else {
        if (aiView) aiView.style.display = 'none';
        if (mdHeader) mdHeader.style.display = '';
        expView.style.display    = 'flex';
        searchView.style.display = 'none';
      }
    });
  });
}

function initSidebarRevamp() {
  const enterBtn   = document.getElementById('enter-search-btn');
  const exitBtn    = document.getElementById('exit-search-btn');
  const expView    = document.getElementById('sidebar-explorer-view');
  const searchView = document.getElementById('sidebar-search-view');
  const input      = document.getElementById('sidebar-search-input');
  const mdHeader   = document.getElementById('sidebar-md-header');

  if (enterBtn && exitBtn) {
    enterBtn.addEventListener('click', () => {
      expView.style.display = 'none';
      if (mdHeader) mdHeader.style.display = 'none';
      searchView.style.display = 'flex';
      setTimeout(() => input.focus(), 50);
    });

    exitBtn.addEventListener('click', () => {
      expView.style.display = 'flex';
      if (mdHeader) mdHeader.style.display = '';
      searchView.style.display = 'none';
      input.value = '';
      TreeModule.search(''); // TreeModule defined in tree.js
    });
  }

  if (input) {
    input.addEventListener('input', () => {
      TreeModule.search(input.value.trim());
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') exitBtn.click();
    });
  }
}

function initSidebarResizer() {
  const sidebar = document.getElementById('sidebar-left');
  const resizer = document.getElementById('sidebar-resizer');
  if (!sidebar || !resizer) return;

  let isResizing = false;

  resizer.addEventListener('mousedown', () => {
    isResizing = true;
    document.body.style.cursor    = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  window.addEventListener('mousemove', e => {
    if (!isResizing) return;
    const newWidth = e.clientX - sidebar.getBoundingClientRect().left;
    if (newWidth >= 200 && newWidth <= 480) {
      sidebar.style.width = `${newWidth}px`;
    }
  });

  window.addEventListener('mouseup', () => {
    if (!isResizing) return;
    isResizing = false;
    document.body.style.cursor    = 'default';
    document.body.style.userSelect = 'auto';
  });
}
