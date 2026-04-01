/* ============================================================
   comments.js — Comment mode, form, save/load/copy/clear
   Vanilla CSS version — no Tailwind / Lucide CDN needed
   ============================================================ */

const CommentsModule = (() => {
  let comments        = [];
  let formTarget      = null;
  let activeCommentId = null;

  const svgX = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  const svgMsg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;

  // ── Load comments for a file ─────────────────────────────────
  async function loadForFile(filePath) {
    const ws = AppState.currentWorkspace;
    if (!ws || !filePath) { comments = []; _renderList(); return; }
    comments = await window.electronAPI.getComments(ws.id, filePath);
    _renderList();
    _markLinesWithComments();
  }

  // ── Save a new comment ───────────────────────────────────────
  async function save(lineStart, lineEnd, startLineContent, endLineContent, text) {
    const ws   = AppState.currentWorkspace;
    const file = AppState.currentFile;
    if (!ws || !file) return;
    const comment = await window.electronAPI.saveComment(ws.id, file, {
      lineStart, lineEnd, startLineContent, endLineContent, text
    });
    comments.push(comment);
    comments.sort((a, b) => a.lineStart - b.lineStart);
    _renderList();
    _markLinesWithComments();
  }

  // ── Delete a comment ─────────────────────────────────────────
  async function remove(commentId) {
    const ws   = AppState.currentWorkspace;
    const file = AppState.currentFile;
    if (!ws || !file) return;
    comments = await window.electronAPI.deleteComment(ws.id, file, commentId);
    _clearHighlights();
    _renderList();
    _markLinesWithComments();
  }

  // ── Clear all comments for current file ──────────────────────
  async function clear() {
    const ws   = AppState.currentWorkspace;
    const file = AppState.currentFile;
    if (!ws || !file) return;
    comments = await window.electronAPI.clearComments(ws.id, file);
    _clearHighlights();
    _renderList();
    _markLinesWithComments();
  }

  // ── Copy all comments to clipboard ───────────────────────────
  function copyAll() {
    if (!comments.length) return;
    const file  = AppState.currentFile || 'unknown';
    const lines = [`--- Comments ---`, `File: ${file}`, ``];
    
    // Check for Additional Content if in AI mode (Issue #37)
    if (file === '__AI_RESPONSE__') {
      const extra = document.getElementById('ai-extra-input')?.value.trim();
      if (extra) {
        lines.push(`--- Additional Content ---`);
        lines.push(extra);
        lines.push(``);
        lines.push(`--- User Comments ---`);
      }
    }

    comments.forEach(c => {
      if (c.lineStart === c.lineEnd) {
        lines.push(`Line ${c.lineStart} ("${c.startLineContent}"): ${c.text}`);
      } else {
        lines.push(`Range Line ${c.lineStart}-${c.lineEnd}:`);
        lines.push(`  Start: "${c.startLineContent}"`);
        lines.push(`  End:   "${c.endLineContent}"`);
        lines.push(`  Comment: ${c.text}`);
      }
      lines.push('');
    });
    
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
        // Feedback logic (Issue #36)
        if (typeof showToast === 'function') {
            const count = comments.length;
            const msg = `Copied ${count} comment${count !== 1 ? 's' : ''}`;
            showToast(msg);
        }
        
        // Icon animation
        const btn = document.getElementById('copy-comments-btn');
        if (btn) {
            const originalIcon = btn.innerHTML;
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>`;
            btn.style.color = 'var(--accent-color)';
            setTimeout(() => {
                btn.innerHTML = originalIcon;
                btn.style.color = '';
            }, 1000);
        }
    });
  }

  // ── Render comment list in right sidebar ─────────────────────
  function _renderList() {
    const list      = document.getElementById('comment-list');
    const noComment = document.getElementById('no-comments');
    if (!list || !noComment) return;

    list.innerHTML = '';

    if (!comments.length) {
      noComment.style.display = 'flex';
      return;
    }

    noComment.style.display = 'none';

    comments.forEach(c => {
      const isRange = c.lineEnd && c.lineEnd > c.lineStart;
      const lineRef = isRange ? `L${c.lineStart}–L${c.lineEnd}` : `Line ${c.lineStart}`;

      const item = document.createElement('div');
      item.className = 'comment-item' + (c.id === activeCommentId ? ' selected' : '');
      item.dataset.id = c.id;

      const snippet = isRange
        ? `${c.startLineContent} ... ${c.endLineContent}`
        : (c.startLineContent || '');

      item.innerHTML = `
        <div class="comment-item-line">
          <div class="comment-item-header">
            <div class="comment-item-label">${lineRef.toUpperCase()}</div>
            <div class="comment-item-snippet">${_esc(snippet)}</div>
          </div>
          <button class="comment-item-delete" data-id="${c.id}" title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div class="comment-item-body">${_esc(c.text)}</div>
      `;

      item.onmouseenter = () => _highlightLines(c.lineStart, c.lineEnd);
      item.onmouseleave = () => _clearHighlights();
      item.onclick      = () => _onItemClick(c);
      
      const delBtn = item.querySelector('.comment-item-delete');
      if (delBtn) {
        delBtn.addEventListener('click', e => {
          e.stopPropagation();
          remove(c.id);
        });
      }
      list.appendChild(item);
    });
  }

  function _highlightLines(start, end) {
    _clearHighlights();
    const targetEnd = end || start;
    for (let i = start; i <= targetEnd; i++) {
      const line = document.querySelector(`.md-line[data-line="${i}"]`);
      if (line) line.classList.add('highlight-temp');
    }
  }

  function _onItemClick(comment) {
    activeCommentId = comment.id;
    _renderList(); // Refresh list to show selected state

    const targetLine = document.querySelector(`.md-line[data-line="${comment.lineStart}"]`);
    if (targetLine) {
      targetLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Temporary pulse effect on target line
      targetLine.classList.add('pulse-highlight');
      setTimeout(() => targetLine.classList.remove('pulse-highlight'), 2000);

      // Open Form in View Only mode
      const anchor = targetLine.querySelector('.comment-trigger');
      if (anchor) {
        formTarget = { 
          lineStart: comment.lineStart, 
          lineEnd: comment.lineEnd, 
          startLineContent: comment.startLineContent, 
          endLineContent: comment.endLineContent,
          id: comment.id
        };
        _showForm(anchor, 'view', comment.text);
      }
    }
  }

  function _clearHighlights() {
    document.querySelectorAll('.md-line').forEach(l => { 
      l.classList.remove('highlight-temp');
    });
  }

  // ── Mark lines that already have comments ───────────────────
  function _markLinesWithComments() {
    document.querySelectorAll('.md-line').forEach(b => b.classList.remove('has-comment'));
    comments.forEach(c => {
      const line = document.querySelector(`.md-line[data-line="${c.lineStart}"]`);
      if (line) line.classList.add('has-comment');
    });
  }

  // ── Apply comment mode (inject triggers) ─────────────────────
  function applyCommentMode() {
    document.querySelectorAll('.md-line').forEach(line => {
      if (line.querySelector('.comment-trigger')) return;
      const btn = document.createElement('button');
      btn.className = 'comment-trigger';
      btn.innerHTML = svgMsg;
      btn.title     = 'Add comment';
      btn.addEventListener('click', e => _onTriggerClick(e, line));
      line.appendChild(btn);
    });
  }

  // ── Remove comment mode ──────────────────────────────────────
  function removeCommentMode() {
    document.querySelectorAll('.comment-trigger').forEach(b => b.remove());
    _clearHighlights();
    _hideForm();
  }

  // ── Trigger click handler ─────────────────────────────────────
  function _onTriggerClick(e, lineEl) {
    e.stopPropagation();
    const selection = window.getSelection();
    let lineStart = parseInt(lineEl.dataset.line, 10);
    let lineEnd   = lineStart;
    let startContent = _getLineText(lineEl);
    let endContent   = startContent;

    if (!selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const container = document.getElementById('md-content');
      if (container.contains(range.commonAncestorContainer)) {
        const allLines = Array.from(document.querySelectorAll('.md-line'));
        const selectedLines = allLines.filter(el => selection.containsNode(el, true));
        if (selectedLines.length > 0) {
          lineStart = parseInt(selectedLines[0].dataset.line, 10);
          lineEnd   = parseInt(selectedLines[selectedLines.length - 1].dataset.line, 10);
          const startEl = selectedLines.find(el => _getLineText(el) !== '');
          const endEl   = [...selectedLines].reverse().find(el => _getLineText(el) !== '');
          startContent = _getLineText(startEl || selectedLines[0]);
          endContent   = _getLineText(endEl   || selectedLines[selectedLines.length - 1]);
        }
      }
    }

    formTarget = { lineStart, lineEnd, startLineContent: startContent, endLineContent: endContent };
    _showForm(e.currentTarget);
  }

  // ── Show / hide form ─────────────────────────────────────────
  function _showForm(anchorBtn, mode = 'empty', initialText = '') {
    const form  = document.getElementById('comment-form');
    const input = document.getElementById('comment-input');
    const display = document.getElementById('comment-text-display');
    const saveBtn = document.getElementById('save-comment');

    form.setAttribute('data-mode', mode);
    
    if (mode === 'view') {
      display.textContent = initialText;
    } else {
      input.value = initialText;
      saveBtn.disabled = !initialText.trim();
      _autoResize(input);
      setTimeout(() => input.focus(), 50);
    }

    const rect = anchorBtn.getBoundingClientRect();
    let left = rect.right + 10;
    let top  = rect.top;

    if (left + 350 > window.innerWidth - 10) left = rect.left - 360;
    top = Math.max(10, Math.min(top, window.innerHeight - 220));

    form.style.left = `${left}px`;
    top = Math.max(10, Math.min(top, window.innerHeight - (form.offsetHeight || 220)));
    form.style.top  = `${top}px`;
    form.classList.add('show');
    form.classList.remove('is-typing');
    form.classList.toggle('is-filled', !!initialText.trim());
  }

  function _hideForm() {
    const form = document.getElementById('comment-form');
    if (form) {
      form.classList.remove('show');
      form.classList.remove('is-typing');
    }
    // We don't manually hide modal here anymore, it's handled by TextAreaModule
    formTarget = null;
    activeCommentId = null;
    _renderList();
  }

  async function _submitForm() {
    const text = document.getElementById('comment-input').value.trim();
    if (!text || !formTarget) return;
    await save(formTarget.lineStart, formTarget.lineEnd, formTarget.startLineContent, formTarget.endLineContent, text);
    _hideForm();
    window.getSelection().removeAllRanges();
  }

  function _autoResize(el) {
    if (!el) return;
    el.style.height = 'auto';
    const newHeight = Math.min(el.scrollHeight, 240); 
    el.style.height = newHeight + 'px';
  }

  function _getLineText(el) {
    if (!el) return '';
    const clone   = el.cloneNode(true);
    const trigger = clone.querySelector('.comment-trigger');
    if (trigger) trigger.remove();
    let text = clone.textContent.trim();
    if (text.length > 100) text = text.substring(0, 100) + '...';
    return text;
  }

  function _esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function clearUI() {
    comments = [];
    _renderList();
    _clearHighlights();
  }

  function initCommentResizer() {
    const wrap    = document.getElementById('comment-sidebar-wrap');
    const resizer = document.getElementById('comment-resizer');
    if (!wrap || !resizer) return;

    let isResizing = false;

    // Load saved width
    const savedWidth = localStorage.getItem('mdpreview_sidebar_right_width');
    if (savedWidth) {
      // Only set if sidebar is actually open/opening
      if (wrap.classList.contains('open')) {
        wrap.style.width = savedWidth + 'px';
      }
    }

    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      // Right sidebar: width grows as mouse moves LEFT
      const width = window.innerWidth - e.clientX;
      if (width >= 256 && width <= 600) {
        wrap.style.width = width + 'px';
      }
    });

    window.addEventListener('mouseup', () => {
      if (!isResizing) return;
      isResizing = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';

      // Save width
      if (wrap.offsetWidth > 0) {
        localStorage.setItem('mdpreview_sidebar_right_width', wrap.offsetWidth);
      }
    });
  }

  function initCommentDrag() {
    const form = document.getElementById('comment-form');
    if (!form) return;

    let isDragging = false;
    let startX, startY;
    let initialX, initialY;

    form.addEventListener('mousedown', (e) => {
      // Don't drag if clicking buttons, textarea, or other interactive elements
      const interactive = ['BUTTON', 'TEXTAREA', 'INPUT', 'SVG', 'PATH'];
      if (interactive.includes(e.target.tagName) || e.target.closest('button')) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = form.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      
      form.style.zIndex = '3000';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      form.style.left = (initialX + dx) + 'px';
      form.style.top  = (initialY + dy) + 'px';
      
      // Remove scaling/transform that might interfere with manual positioning
      form.style.transform = 'none'; 
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        form.style.zIndex = '2000';
      }
    });
  }

  function _bindEvents() {
    initCommentResizer();
    initCommentDrag();
    document.getElementById('cancel-comment').addEventListener('click', _hideForm);
    document.getElementById('save-comment').addEventListener('click', _submitForm);
    document.getElementById('copy-comments-btn').addEventListener('click', copyAll);
    document.getElementById('clear-comments-btn').addEventListener('click', () => {
      if (comments.length && confirm('Clear all comments?')) clear();
    });

    const input = document.getElementById('comment-input');
    const form  = document.getElementById('comment-form');
    const saveBtn = document.getElementById('save-comment');

    // ── Original Form Logic (Restored) ─────────────────────
    input.addEventListener('focus', () => form.classList.add('is-typing'));
    input.addEventListener('blur', () => form.classList.remove('is-typing'));
    input.addEventListener('input', () => {
      const val = input.value.trim();
      saveBtn.disabled = !val;
      form.classList.toggle('is-filled', !!val);
      form.setAttribute('data-mode', val ? 'filled' : 'empty');
      _autoResize(input);
    });

    // Handle Expansion (Original local logic)
    const expandBtn = document.getElementById('expand-comment-btn');
    const modal = document.getElementById('expanded-comment-modal');
    const modalInput = document.getElementById('expanded-comment-input');
    const minimizeBtn = document.getElementById('minimize-comment-btn');
    const modalSaveBtn = document.getElementById('expanded-save-comment');

    if (expandBtn && modal && modalInput) {
      expandBtn.addEventListener('click', () => {
        modalInput.value = input.value;
        modal.classList.add('show');
        setTimeout(() => modalInput.focus(), 50);
      });

      const closeExpand = () => {
        input.value = modalInput.value;
        const val = input.value.trim();
        saveBtn.disabled = !val;
        form.classList.toggle('is-filled', !!val);
        modal.classList.remove('show');
        input.focus();
      };

      if (minimizeBtn) minimizeBtn.addEventListener('click', closeExpand);
      if (modalSaveBtn) {
        modalSaveBtn.addEventListener('click', async () => {
          await _submitForm();
          modal.classList.remove('show');
        });
      }

      modalInput.addEventListener('input', () => {
        const val = modalInput.value.trim();
        if (modalSaveBtn) modalSaveBtn.disabled = !val;
        input.value = modalInput.value;
        form.classList.toggle('is-filled', !!val);
        _autoResize(input);
      });
      
      // Close on backdrop
      modal.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('expanded-textarea-backdrop')) {
          closeExpand();
        }
      });
    }

    document.getElementById('edit-comment-btn').addEventListener('click', () => {
      input.value = document.getElementById('comment-text-display').textContent;
      saveBtn.disabled = !input.value.trim();
      form.classList.toggle('is-filled', true);
      form.setAttribute('data-mode', 'filled');
      _autoResize(input);
      setTimeout(() => input.focus(), 50);
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey && !saveBtn.disabled) { e.preventDefault(); _submitForm(); }
      if (e.key === 'Escape') _hideForm();
    });
  }

  document.addEventListener('mousedown', (e) => {
    const form = document.getElementById('comment-form');
    if (form && form.classList.contains('show')) {
      if (!form.contains(e.target) && !e.target.closest('.comment-item') && !e.target.closest('.comment-trigger')) {
        _hideForm();
        // Clear active selection in sidebar
        document.querySelectorAll('.comment-item.selected').forEach(i => i.classList.remove('selected'));
      }
    }
  });

  document.addEventListener('DOMContentLoaded', _bindEvents);

  return { loadForFile, applyCommentMode, removeCommentMode, clearUI, clear, getCommentCount: () => comments.length };
})();
