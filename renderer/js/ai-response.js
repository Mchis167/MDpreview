/* ============================================================
   ai-response.js — Logic for AI Response tab (Issue #29)
   ============================================================ */

const AIResponseModule = (() => {
  let displayedContent = '';
  
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

  return { init, toggleFooter };
})();
