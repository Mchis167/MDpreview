/* ============================================================
   collect.js — Idea collection (bookmark) module
   ============================================================ */

const CollectModule = (() => {
  let ideas = [];
  let currentFilePath = null;

  const svgBookmark = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`;
  const svgCheck = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>`;

  // ── Persistence ──────────────────────────────────────────
  function _getStorageKey(filePath) {
    return `mdpreview_ideas_${filePath}`;
  }

  function loadForFile(filePath) {
    if (!filePath) {
      ideas = [];
      _renderList();
      return;
    }
    currentFilePath = filePath;
    const stored = localStorage.getItem(_getStorageKey(filePath));
    ideas = stored ? JSON.parse(stored) : [];
    _renderList();
  }

  function _saveToStorage() {
    if (currentFilePath) {
      localStorage.setItem(_getStorageKey(currentFilePath), JSON.stringify(ideas));
    }
  }

  // ── CRUD ─────────────────────────────────────────────────
  function addIdea(text) {
    if (!text || text.trim() === '') return;
    
    const newIdea = {
      id: Date.now(),
      text: text.trim(),
      timestamp: new Date().toISOString()
    };
    
    ideas.push(newIdea);
    _saveToStorage();
    _renderList();
    
    if (typeof showToast === 'function') {
      showToast('Idea bookmarked!');
    }
  }

  function removeIdea(id) {
    ideas = ideas.filter(i => i.id !== id);
    _saveToStorage();
    _renderList();
  }

  function clearAll() {
    if (!ideas.length) return;
    if (confirm('Clear all collected ideas for this file?')) {
      ideas = [];
      _saveToStorage();
      _renderList();
    }
  }

  // ── Copy Functionality ───────────────────────────────────
  function copyAll() {
    if (!ideas.length) return;
    
    const lines = [];
    ideas.forEach((idea, index) => {
      lines.push(`idea ${index + 1}`);
      lines.push(idea.text);
      if (index < ideas.length - 1) {
        lines.push('');
        lines.push('----');
        lines.push('');
      }
    });
    
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      if (typeof showToast === 'function') {
        showToast(`Copied ${ideas.length} ideas to clipboard`);
      }
      
      // Feedback animation on button
      const btn = document.getElementById('copy-ideas-btn');
      if (btn) {
        const originalIcon = btn.innerHTML;
        btn.innerHTML = svgCheck;
        btn.style.color = 'var(--accent-color)';
        setTimeout(() => {
          btn.innerHTML = originalIcon;
          btn.style.color = '';
        }, 1500);
      }
    });
  }

  // ── Rendering ────────────────────────────────────────────
  function _renderList() {
    const list = document.getElementById('collect-list');
    const noIdeas = document.getElementById('no-ideas');
    if (!list || !noIdeas) return;

    list.innerHTML = '';
    
    if (ideas.length === 0) {
      noIdeas.style.display = 'flex';
      return;
    }
    
    noIdeas.style.display = 'none';

    ideas.forEach((idea, index) => {
      const item = document.createElement('div');
      item.className = 'idea-item';
      item.innerHTML = `
        <div class="idea-item-header">
          <span class="idea-item-label">IDEA ${index + 1}</span>
          <button class="idea-item-delete" title="Remove">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="idea-item-content">${_esc(idea.text)}</div>
      `;
      
      item.querySelector('.idea-item-delete').onclick = (e) => {
        e.stopPropagation();
        removeIdea(idea.id);
      };
      
      list.appendChild(item);
    });
  }

  function _esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Selection Logic ──────────────────────────────────────
  let trigger = null;

  function applyCollectMode() {
    if (!trigger) {
      trigger = document.createElement('button');
      trigger.className = 'collect-trigger';
      trigger.innerHTML = svgBookmark;
      trigger.title = 'Bookmark selection';
      trigger.onclick = _onTriggerClick;
      document.body.appendChild(trigger);
    }
    
    document.addEventListener('mouseup', _handleSelection);
    document.addEventListener('keyup', _handleSelection);
  }

  function removeCollectMode() {
    if (trigger) trigger.classList.remove('show');
    document.removeEventListener('mouseup', _handleSelection);
    document.removeEventListener('keyup', _handleSelection);
  }

  function _handleSelection() {
    const selection = window.getSelection();
    if (selection.isCollapsed || selection.toString().trim() === '') {
      if (trigger) trigger.classList.remove('show');
      return;
    }

    const range = selection.getRangeAt(0);
    const container = document.getElementById('md-content');
    
    if (!container.contains(range.commonAncestorContainer)) {
      if (trigger) trigger.classList.remove('show');
      return;
    }

    const rects = range.getClientRects();
    if (rects.length === 0) return;
    
    const lastRect = rects[rects.length - 1];
    
    if (trigger) {
      trigger.style.left = `${lastRect.right + 5}px`;
      trigger.style.top = `${lastRect.bottom + 5}px`;

      if (lastRect.right + 40 > window.innerWidth) {
        trigger.style.left = `${lastRect.left - 40}px`;
      }
      
      trigger.classList.add('show');
    }
  }

  function _onTriggerClick(e) {
    e.stopPropagation();
    const selection = window.getSelection();
    if (selection.isCollapsed) return;

    const text = selection.toString().trim();
    addIdea(text);
    
    if (trigger) trigger.classList.remove('show');
    selection.removeAllRanges();
  }

  // ── Initialization ───────────────────────────────────────
  function init() {
    const clearBtn = document.getElementById('clear-ideas-btn');
    const copyBtn = document.getElementById('copy-ideas-btn');
    
    if (clearBtn) clearBtn.addEventListener('click', clearAll);
    if (copyBtn) copyBtn.addEventListener('click', copyAll);

    // Initial load if a file is already active
    if (typeof AppState !== 'undefined' && AppState.currentFile) {
      loadForFile(AppState.currentFile);
    }
    
    // Resizer logic
    _initResizer();
  }

  function _initResizer() {
    const wrap = document.getElementById('collect-sidebar-wrap');
    const resizer = document.getElementById('collect-resizer');
    if (!wrap || !resizer) return;

    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const width = window.innerWidth - e.clientX;
      if (width >= 200 && width <= 600) {
        wrap.style.width = width + 'px';
      }
    });

    window.addEventListener('mouseup', () => {
      if (!isResizing) return;
      isResizing = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    });
  }

  return {
    init,
    loadForFile,
    applyCollectMode,
    removeCollectMode,
    addIdea
  };
})();
