/* ============================================================
   draft.js — Logic for Draft tab
   ============================================================ */

const DraftModule = (() => {
  let displayedContent = '';
  let draftContent     = '';
  let renderedHtml     = '';
  
  const elements = {
    chatComponent:  null,
    chatInput:      null,
    extraInput:     null,
    previewBtn:     null,
    statusBadge:    null,
    statusText:     null,
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

  function updateBadgeState(currentVal) {
    // No longer used since badge is removed
  }

  async function renderPreview(content) {
    const finalContent = content || draftContent;
    if (!finalContent) return;

    // Check for existing comments
    if (typeof CommentsModule !== 'undefined' && CommentsModule.getCommentCount() > 0) {
        // Automatically clear comments or ask? 
        // For Draft mode, let's just clear them to keep it snappy
        await CommentsModule.clear();
    }

    try {
      const res = await fetch('/api/render-raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: finalContent })
      });

      if (!res.ok) throw new Error('Render failed');
      const data = await res.json();

      // Update Viewer
      const emptyState = document.getElementById('empty-state');
      const mdContent  = document.getElementById('md-content');
      const wsNameEl   = document.getElementById('header-workspace-name');
      const fileNameEl = document.getElementById('header-file-name');

      if (emptyState) emptyState.style.display = 'none';
      if (mdContent) {
        const inner = mdContent.querySelector('.md-content-inner') || mdContent;
        inner.innerHTML = data.html;
        renderedHtml = data.html; // Store for tab switching
        
        // Only show mdContent if NOT in edit mode
        if (AppState.currentMode !== 'edit') {
            mdContent.style.display = 'block';
        }
        
        // Process Mermaid (global from app.js / mermaid.js)
        if (typeof processMermaid === 'function') processMermaid(inner);
        
        // Process Code Blocks (global from code-blocks.js)
        if (typeof CodeBlockModule !== 'undefined') CodeBlockModule.process(inner);
      }

      if (wsNameEl)  wsNameEl.innerText = (AppState.currentWorkspace ? AppState.currentWorkspace.name : 'DRAFT').toUpperCase() + '.';
      if (fileNameEl) fileNameEl.innerText = 'Draft Preview';

      // Update local state
      displayedContent = finalContent;
      draftContent     = finalContent;
      
      saveToStorage(); // Persist rendered draft
      
      // If we are in edit mode, sync the editor with the new content
      if (AppState.currentMode === 'edit' && typeof EditorModule !== 'undefined') {
          EditorModule.setOriginalContent(finalContent);
      }
      
      // Reset scroll
      document.getElementById('md-viewer').scrollTop = 0;

    } catch (err) {
      console.error(err);
    } finally {
      // Done
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
      if (wsNameEl) wsNameEl.innerText = 'NEW DRAFT';
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
  function getDraftContent() { return draftContent; }
  function setDraftContent(val) { draftContent = val; }

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
          alert('Please drop a Markdown (.md) file.');
        }
      }
    });
  }

  function _setChatInput(content) {
    draftContent = content;
    saveToStorage(); // Persist change
    renderPreview(content);
  }

  function saveToStorage() {
    if (typeof AppState === 'undefined' || !AppState.currentWorkspace) return;
    const key = `draft_${AppState.currentWorkspace.id}`;
    const data = {
      displayedContent,
      draftContent,
      renderedHtml
    };
    localStorage.setItem(key, JSON.stringify(data));
  }

  function loadFromStorage(workspaceId) {
    if (!workspaceId) {
      displayedContent = '';
      draftContent = '';
      renderedHtml = '';
      return;
    }

    const key = `draft_${workspaceId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        displayedContent = data.displayedContent || '';
        draftContent = data.draftContent || '';
        renderedHtml = data.renderedHtml || '';
      } catch (e) {
        console.error('Error parsing draft data', e);
        displayedContent = '';
        draftContent = '';
        renderedHtml = '';
      }
    } else {
      displayedContent = '';
      draftContent = '';
      renderedHtml = '';
    }
  }

  async function clear() {
    displayedContent = '';
    draftContent = '';
    renderedHtml = '';

    const chatInput = document.getElementById('draft-chat-input');
    const extraInput = document.getElementById('draft-extra-input');
    if (chatInput) chatInput.value = '';
    if (extraInput) extraInput.value = '';

    // Clear expanded input if exist
    const expandedInput = document.getElementById('draft-expanded-input');
    if (expandedInput) expandedInput.value = '';

    updateBadgeState('');
    saveToStorage(); // Clear from storage too
    syncPreview();
  }

  // Sync the main viewer with Draft's displayedContent
  function syncPreview() {
    const emptyState = document.getElementById('empty-state');
    const mdContent  = document.getElementById('md-content');
    
    if (!displayedContent || !renderedHtml) {
      if (emptyState) {
        emptyState.style.display = 'flex';
        // Restore default text if needed
        const h2 = emptyState.querySelector('h2');
        const p  = emptyState.querySelector('p');
        if (h2) h2.innerText = 'MDpreview';
        if (p)  p.innerText = 'Select a Markdown file from the sidebar or click the workspace switcher to get started.';
      }
      if (mdContent)  mdContent.style.display  = 'none';
      return;
    }

    // Restore previously rendered content
    if (emptyState) emptyState.style.display = 'none';
    if (mdContent) {
      mdContent.style.display = 'block';
      const inner = mdContent.querySelector('.md-content-inner') || mdContent;
      inner.innerHTML = renderedHtml;
      
      // Diagrams need to be reprocessed since we updated innerHTML
      if (typeof processMermaid === 'function') processMermaid(inner);
      
      // Process Code Blocks
      if (typeof CodeBlockModule !== 'undefined') CodeBlockModule.process(inner);
      
      // Update header
      updateHeader('draft');
    }
  }

  return { init, toggleFooter, updateHeader, syncPreview, renderPreview, clear, getDraftContent, setDraftContent, saveToStorage, loadFromStorage };
})();

