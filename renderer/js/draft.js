/* ============================================================
   draft.js — Logic for Multiple Draft tabs
   ============================================================ */

const DraftModule = (() => {
  // Map of drafts: { [draftId]: { draftContent, renderedHtml, lastTouched } }
  let drafts = {};
  let renderTicket = 0;
  
  const elements = {
    variants: {
      placeholder: null,
      input:       null
    },
    footers: {
      markdown:    null,
      draft:       null
    }
  };

  function init() {
    elements.variants.placeholder = document.getElementById('draft-placeholder-variant');
    elements.variants.input       = document.getElementById('draft-input-variant');
    
    elements.footers.markdown = document.getElementById('markdown-footer');
    elements.footers.draft    = document.getElementById('draft-footer');

    const importBtn = document.getElementById('draft-quick-import');
    if (importBtn) {
      importBtn.addEventListener('click', () => handleFileImport());
    }

    _setupDragAndDrop();

    // Switch to input variant by default
    setVariant('input');
  }

  function setVariant(variantName) {
    if (elements.variants.placeholder) {
      elements.variants.placeholder.style.display = (variantName === 'placeholder' ? 'flex' : 'none');
    }
    if (elements.variants.input) {
      elements.variants.input.style.display = (variantName === 'input' ? 'flex' : 'none');
    }
  }

  async function renderPreview(content, id) {
    const draftId = id || (window.AppState ? AppState.currentFile : null);
    if (!draftId || !draftId.startsWith('__DRAFT_')) return;

    if (!drafts[draftId]) drafts[draftId] = { lastTouched: Date.now() };
    
    const finalContent = content !== undefined ? content : (drafts[draftId].draftContent || '');
    
    // ── Ticket System for Race Conditions ──────────────────
    const currentTicket = ++renderTicket;

    if (!finalContent || finalContent.trim() === '') {
      if (mdContent) {
        const inner = mdContent.querySelector('.md-content-inner') || mdContent;
        if (inner) inner.innerHTML = '';
      }
      return;
    }

    try {
      const res = await fetch('/api/render-raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: finalContent })
      });

      if (!res.ok) throw new Error('Render failed');
      const data = await res.json();

      // Cancel if a newer render request was started
      if (currentTicket !== renderTicket) return;

      // Update Viewer
      const emptyState = document.getElementById('empty-state');
      const mdContent  = document.getElementById('md-content');

      if (emptyState) emptyState.style.display = 'none';
      if (mdContent) {
        const inner = mdContent.querySelector('.md-content-inner') || mdContent;
        inner.innerHTML = data.html;
        
        // Only show mdContent if NOT in edit mode
        if (AppState.currentMode !== 'edit') {
            mdContent.style.display = 'block';
        }
        
        // Process Mermaid (global from app.js / mermaid.js)
        if (typeof processMermaid === 'function') processMermaid(inner);
        
        // Process Code Blocks (global from code-blocks.js)
        if (typeof CodeBlockModule !== 'undefined') CodeBlockModule.process(inner);
      }

      // Update header
      updateHeader('draft');

      // Update local state
      drafts[draftId].renderedHtml = data.html;
      drafts[draftId].draftContent = finalContent;
      drafts[draftId].lastTouched = Date.now();
      
      saveToStorage(); // Persist rendered draft
      
      // If we are in edit mode, sync the editor with the new content
      if (AppState.currentMode === 'edit' && typeof EditorModule !== 'undefined') {
          EditorModule.setOriginalContent(finalContent);
      }
      
      // Reset scroll
      const viewer = document.getElementById('md-viewer');
      if (viewer) viewer.scrollTop = 0;

    } catch (err) {
      console.error(err);
    }
  }

  function toggleFooter(mode) {
    if (elements.footers.markdown) {
      elements.footers.markdown.style.display = (mode === 'markdown' ? 'flex' : 'none');
    }
    if (elements.footers.draft) {
      elements.footers.draft.style.display = (mode === 'draft' ? 'flex' : 'none');
    }
  }

  function updateHeader(mode) {
    const wsNameEl   = document.getElementById('header-workspace-name');
    const fileNameEl = document.getElementById('header-file-name');

    if (mode === 'draft') {
      const draftId = AppState.currentFile;
      displayName = getDisplayName(draftId).toUpperCase();

      if (wsNameEl) wsNameEl.innerText = displayName;
      if (fileNameEl) {
        fileNameEl.style.display = 'none';
      }
    } else {
      // Restore from AppState using the global function in app.js
      if (typeof updateHeaderUI === 'function') {
        updateHeaderUI();
      }
    }
  }

  // ── Helper ────────────────────────────────────────────────
  function getDraftContent(id) { 
    const draftId = id || (window.AppState ? AppState.currentFile : null);
    if (!draftId || !drafts[draftId]) return '';
    return drafts[draftId].draftContent || ''; 
  }

  function getDraftViewMode(id) {
    const draftId = id || (window.AppState ? AppState.currentFile : null);
    return drafts[draftId] ? (drafts[draftId].viewMode || null) : null;
  }

  function setDraftViewMode(id, mode) {
    const draftId = id || (window.AppState ? AppState.currentFile : null);
    if (!draftId) return;
    ensureDraftMeta(draftId);
    drafts[draftId].viewMode = mode;
    saveToStorage();
  }

  function getDisplayName(id) {
    const draftId = id || (window.AppState ? AppState.currentFile : null);
    if (!draftId) return 'New Draft';
    
    ensureDraftMeta(draftId);
    return drafts[draftId].displayName || 'Draft';
  }

  function ensureDraftMeta(id) {
    if (!drafts[id]) drafts[id] = {};
    if (!drafts[id].displayName) {
      // Find the smallest available positive integer not in use
      const usedNumbers = new Set(
        Object.values(drafts)
          .map(d => d.displayName)
          .filter(name => name && name.startsWith('Draft '))
          .map(name => parseInt(name.replace('Draft ', ''), 10))
          .filter(num => !isNaN(num))
      );

      let nextNum = 1;
      while (usedNumbers.has(nextNum)) {
        nextNum++;
      }

      drafts[id].displayName = `Draft ${nextNum}`;
      drafts[id].lastTouched = Date.now();
    }
  }
  
  function setDraftContent(val, id) { 
    const draftId = id || (window.AppState ? AppState.currentFile : null);
    if (!draftId) return;
    ensureDraftMeta(draftId);
    drafts[draftId].draftContent = val; 
    drafts[draftId].lastTouched = Date.now();
    saveToStorage();
  }

  function getRenderedHtml(id) {
    const draftId = id || (window.AppState ? AppState.currentFile : null);
    if (!draftId || !drafts[draftId]) return '';
    return drafts[draftId].renderedHtml || '';
  }

  // ── File Import & Drag-and-Drop ────────────────────────────
  async function handleFileImport() {
    try {
      if (window.electronAPI && window.electronAPI.pickAndReadFile) {
        const fileData = await window.electronAPI.pickAndReadFile();
        if (fileData && fileData.content) {
          _setChatInput(fileData.content);
        }
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (file) {
            const content = await file.text();
            _setChatInput(content);
          }
        };
        input.click();
      }
    } catch (err) {
      console.error('File import failed:', err);
    }
  }

  function _setupDragAndDrop() {
    const container = elements.variants.input;
    if (!container) return;

    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      container.classList.add('drag-over');
    });

    container.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      container.classList.remove('drag-over');
    });

    container.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      container.classList.remove('drag-over');

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.name.toLowerCase().endsWith('.md')) {
          const content = await file.text();
          _setChatInput(content);
        } else {
          if (typeof showToast === 'function') showToast('Please drop a Markdown (.md) file.', 'error');
        }
      }
    });
  }

  function _setChatInput(content) {
    const draftId = window.AppState ? AppState.currentFile : null;
    if (!draftId) return;
    
    if (!drafts[draftId]) drafts[draftId] = {};
    drafts[draftId].draftContent = content;
    drafts[draftId].lastTouched = Date.now();
    
    saveToStorage(); 
    renderPreview(content, draftId);
  }

  function saveToStorage() {
    if (typeof AppState === 'undefined' || !AppState.currentWorkspace) return;
    const key = `drafts_v2_${AppState.currentWorkspace.id}`;
    localStorage.setItem(key, JSON.stringify(drafts));
    
    // Trigger server sync
    if (AppState.savePersistentState) AppState.savePersistentState();
  }

  function loadFromStorage(workspaceId) {
    if (!workspaceId) {
      drafts = {};
      return;
    }

    const key = `drafts_v2_${workspaceId}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      try {
        const allDrafts = JSON.parse(saved);
        drafts = allDrafts || {};
        
        // 1. Migration fallback for legacy key (one-time)
        const oldKey = `draft_${workspaceId}`;
        const oldSaved = localStorage.getItem(oldKey);
        if (Object.keys(drafts).length === 0 && oldSaved) {
            const oldData = JSON.parse(oldSaved);
            const legacyId = `__DRAFT_LEGACY_${Date.now()}__`;
            drafts[legacyId] = {
              draftContent: oldData.draftContent || '',
              renderedHtml: oldData.renderedHtml || '',
              lastTouched: Date.now()
            };
            localStorage.removeItem(oldKey);
        }
        
        saveToStorage();
      } catch (e) {
        console.error('Error parsing draft data', e);
        drafts = {};
      }
    } else {
      drafts = {};
    }
  }

  /**
   * Explicitly initialize a new draft to prevent ghost content
   * and ensure correct numbering.
   */
  function createDraft(id) {
    if (!id) return;
    drafts[id] = {
      draftContent: '',
      renderedHtml: '',
      lastTouched: Date.now(),
      viewMode: 'edit'
    };
    ensureDraftMeta(id);
    saveToStorage();
    return drafts[id];
  }

  async function clear(id) {
    const draftId = id || (window.AppState ? AppState.currentFile : null);
    if (!draftId) return;

    delete drafts[draftId];

    if (draftId === (window.AppState ? AppState.currentFile : null)) {
      if (typeof EditorModule !== 'undefined') {
        EditorModule.setOriginalContent('');
      }
    }

    saveToStorage();
    syncPreview();
  }

  // Sync the main viewer with Draft's content
  function syncPreview() {
    const draftId = window.AppState ? AppState.currentFile : null;
    const emptyState = document.getElementById('empty-state');
    const mdContent  = document.getElementById('md-content');
    
    const data = drafts[draftId];
    
    if (!data || !data.draftContent) {
      if (emptyState) {
        emptyState.style.display = 'flex';
        const h2 = emptyState.querySelector('h2');
        const p  = emptyState.querySelector('p');
        if (h2) h2.innerText = 'MDpreview';
        if (p)  p.innerText = 'Draft is empty or not found.';
      }
      if (mdContent) {
        mdContent.style.display = 'none';
        // ── Surgical Cleanup ─────────────────────────────────
        // Clear innerHTML to prevent "ghost content" from previous files
        const inner = mdContent.querySelector('.md-content-inner') || mdContent;
        if (inner) inner.innerHTML = '';
      }
      return;
    }

    if (!data.renderedHtml) {
      // If content exists but HTML is missing (e.g. rapid switch before save finished),
      // trigger a silent render to fill the gap.
      renderPreview(data.draftContent, draftId);
      return;
    }

    // Restore previously rendered content
    if (emptyState) emptyState.style.display = 'none';
    if (mdContent) {
      mdContent.style.display = 'block';
      const inner = mdContent.querySelector('.md-content-inner') || mdContent;
      inner.innerHTML = data.renderedHtml;
      
      // Diagrams need to be reprocessed since we updated innerHTML
      if (typeof processMermaid === 'function') processMermaid(inner);
      
      // Process Code Blocks
      if (typeof CodeBlockModule !== 'undefined') CodeBlockModule.process(inner);
      
      // Update header
      updateHeader('draft');
    }
  }

  return { init, toggleFooter, updateHeader, syncPreview, renderPreview, clear, getDraftContent, setDraftContent, getRenderedHtml, saveToStorage, loadFromStorage, getDraftViewMode, setDraftViewMode, getDisplayName, createDraft };
})();

window.DraftModule = DraftModule;
