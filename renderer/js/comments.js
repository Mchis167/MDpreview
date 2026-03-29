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
    _renderList();
    _markLinesWithComments();
  }

  // ── Clear all comments for current file ──────────────────────
  async function clear() {
    const ws   = AppState.currentWorkspace;
    const file = AppState.currentFile;
    if (!ws || !file) return;
    comments = await window.electronAPI.clearComments(ws.id, file);
    _renderList();
    _markLinesWithComments();
  }

  // ── Copy all comments to clipboard ───────────────────────────
  function copyAll() {
    if (!comments.length) return;
    const file  = AppState.currentFile || 'unknown';
    const lines = [`--- Comments ---`, `File: ${file}`, ``];
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
    navigator.clipboard.writeText(lines.join('\n'));
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
      setTimeout(() => input.focus(), 50);
    }

    const rect = anchorBtn.getBoundingClientRect();
    let left = rect.right + 10;
    let top  = rect.top;

    if (left + 350 > window.innerWidth - 10) left = rect.left - 360;
    top = Math.max(10, Math.min(top, window.innerHeight - 220));

    form.style.left = `${left}px`;
    form.style.top  = `${top}px`;
    form.classList.add('show');
  }

  function _hideForm() {
    const form = document.getElementById('comment-form');
    if (form) form.classList.remove('show');
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

  function _bindEvents() {
    document.getElementById('cancel-comment').addEventListener('click', _hideForm);
    document.getElementById('save-comment').addEventListener('click', _submitForm);
    document.getElementById('copy-comments-btn').addEventListener('click', copyAll);
    document.getElementById('clear-comments-btn').addEventListener('click', () => {
      if (comments.length && confirm('Clear all comments?')) clear();
    });

    const input = document.getElementById('comment-input');
    const form  = document.getElementById('comment-form');
    const saveBtn = document.getElementById('save-comment');

    input.addEventListener('input', () => {
      const text = input.value.trim();
      saveBtn.disabled = !text;
      form.setAttribute('data-mode', text ? 'filled' : 'empty');
    });

    document.getElementById('edit-comment-btn').addEventListener('click', () => {
      input.value = document.getElementById('comment-text-display').textContent;
      saveBtn.disabled = !input.value.trim();
      form.setAttribute('data-mode', 'filled');
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

  return { loadForFile, applyCommentMode, removeCommentMode, clearUI };
})();
