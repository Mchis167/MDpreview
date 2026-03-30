/* ============================================================
   ai-response.js — Logic for AI Response tab (Issue #29)
   ============================================================ */

const AIResponseModule = (() => {
  let displayedContent = '';
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
      ai:          null
    }
  };

  function init() {
    elements.chatComponent = document.getElementById('ai-chat-component');
    elements.chatInput     = document.getElementById('ai-chat-input');
    elements.extraInput    = document.getElementById('ai-extra-input');
    elements.previewBtn    = document.getElementById('ai-preview-btn');
    elements.statusBadge   = document.getElementById('ai-status-badge');
    elements.statusText    = elements.statusBadge ? elements.statusBadge.querySelector('.status-badge-text') : null;
    
    elements.variants.placeholder = document.getElementById('ai-placeholder-variant');
    elements.variants.input       = document.getElementById('ai-input-variant');
    
    elements.footers.markdown = document.getElementById('markdown-footer');
    elements.footers.ai       = document.getElementById('ai-footer');

    const importBtn = document.getElementById('ai-quick-import');
    if (importBtn) {
      importBtn.addEventListener('click', () => handleFileImport());
    }

    _setupDragAndDrop();

    if (!elements.chatInput || !elements.previewBtn) return;

    // ── Initialize TextAreas ──────────────────────────────────
    // Chat Input (with expansion)
    TextAreaModule.init({
      containerId:   'ai-chat-container',
      inputId:       'ai-chat-input',
      expandBtnId:   'ai-chat-expand',
      modalId:       'ai-expanded-modal',
      modalInputId:  'ai-expanded-input',
      minimizeBtnId: 'ai-minimize-btn',
      label:         'Input Chat Response',
      onInput:       (val) => updateBadgeState(val)
    });

    // Extra Input (no expansion requested yet)
    TextAreaModule.init({
      containerId: 'ai-extra-container',
      inputId:     'ai-extra-input',
      label:       'Additional Content'
    });

    // ── Preview Button ────────────────────────────────────────
    elements.previewBtn.addEventListener('click', () => renderPreview());

    // Switch to input variant by default (or based on some logic)
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
    const isMatched = (currentVal === displayedContent);
    
    if (elements.statusBadge) {
      elements.statusBadge.classList.toggle('is-updated', isMatched);
      elements.statusBadge.classList.toggle('is-pending', !isMatched);
    }
    
    if (elements.statusText) {
      elements.statusText.textContent = isMatched ? 'Content Updated' : 'Pending Update';
    }

    elements.previewBtn.disabled = isMatched;
  }

  async function renderPreview() {
    const content = elements.chatInput.value;
    if (!content) return;

    elements.previewBtn.disabled = true;
    elements.previewBtn.textContent = 'Rendering...';

    try {
      const res = await fetch('/api/render-raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
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
        mdContent.style.display = 'block';
        mdContent.innerHTML = data.html;
        renderedHtml = data.html; // Store for tab switching
        // Process Mermaid (global from app.js / mermaid.js)
        if (typeof processMermaid === 'function') processMermaid(mdContent);
      }

      if (wsNameEl)  wsNameEl.innerText = (AppState.currentWorkspace ? AppState.currentWorkspace.name : 'AI').toUpperCase() + '.';
      if (fileNameEl) fileNameEl.innerText = 'AI Response Preview';

      // Update local state
      displayedContent = content;
      updateBadgeState(content);
      
      // Reset scroll
      document.getElementById('md-viewer').scrollTop = 0;

    } catch (err) {
      console.error(err);
      alert('Failed to render preview.');
    } finally {
      elements.previewBtn.textContent = 'Preview';
      elements.previewBtn.disabled = (elements.chatInput.value === displayedContent);
    }
  }

  function toggleFooter(mode) {
    if (elements.footers.markdown) {
      elements.footers.markdown.style.display = (mode === 'markdown' ? 'flex' : 'none');
    }
    if (elements.footers.ai) {
      elements.footers.ai.style.display = (mode === 'ai' ? 'flex' : 'none');
    }
  }

  function updateHeader(mode) {
    const wsNameEl   = document.getElementById('header-workspace-name');
    const fileNameEl = document.getElementById('header-file-name');

    if (mode === 'ai') {
      if (wsNameEl) wsNameEl.innerText = 'NEW AI RESPONSE';
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

  // ── File Import & Drag-and-Drop ────────────────────────────
  async function handleFileImport() {
    try {
      // Use standard browser file input as a picker if electronAPI.pickAndReadFile is not yet implemented
      // But let's assume we want a real Electron dialog if possible.
      // If electronAPI.pickAndReadFile is missing, we'll fall back.
      if (window.electronAPI && window.electronAPI.pickAndReadFile) {
        const fileData = await window.electronAPI.pickAndReadFile();
        if (fileData && fileData.content) {
          _setChatInput(fileData.content);
        }
      } else {
        // Fallback: create invisible input
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
    if (elements.chatInput) {
      elements.chatInput.value = content;
      // Trigger status badge update
      updateBadgeState(content);
      // If there's an expanded textarea modal open, sync it too
      const expandedInput = document.getElementById('ai-expanded-input');
      if (expandedInput) expandedInput.value = content;
    }
  }

  // Sync the main viewer with AI's displayedContent
  function syncPreview() {
    const emptyState = document.getElementById('empty-state');
    const mdContent  = document.getElementById('md-content');
    
    if (!displayedContent || !renderedHtml) {
      if (emptyState) emptyState.style.display = 'flex';
      if (mdContent)  mdContent.style.display  = 'none';
      return;
    }

    // Restore previously rendered content
    if (emptyState) emptyState.style.display = 'none';
    if (mdContent) {
      mdContent.style.display = 'block';
      mdContent.innerHTML = renderedHtml;
      
      // Diagrams need to be reprocessed since we updated innerHTML
      if (typeof processMermaid === 'function') processMermaid(mdContent);
      
      // Update header
      updateHeader('ai');
    }
  }

  return { init, toggleFooter, updateHeader, syncPreview };
})();
