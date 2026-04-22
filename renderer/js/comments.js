/* ============================================================
   comments.js — Comment mode, form, save/load/copy/clear
   Vanilla CSS version — no Tailwind / Lucide CDN needed
   ============================================================ */

const CommentsModule = (() => {
  let comments        = [];
  let formTarget      = null;
  let activeCommentId = null;

  // SVG constants removed in favor of Lucide icon names in RightSidebar setup

  // ── Load comments for a file ─────────────────────────────────
  async function loadForFile(filePath) {
    const ws = AppState.currentWorkspace;
    if (!ws || !filePath) { comments = []; _renderList(); return; }
    comments = await window.electronAPI.getComments(ws.id, filePath);
    _renderList();
    _markLinesWithComments();
  }

  // ── Save a new or existing comment ──────────────────────────
  async function save(lineStart, lineEnd, startLineContent, endLineContent, text, selectedText, context, id = null, headingPath = null) {
    const ws   = AppState.currentWorkspace;
    const file = AppState.currentFile;
    if (!ws || !file) return;
    const comment = await window.electronAPI.saveComment(ws.id, file, {
      id, lineStart, lineEnd, startLineContent, endLineContent, text, selectedText, context, headingPath
    });

    if (id) {
      // Update local list
      const idx = comments.findIndex(c => c.id === id);
      if (idx !== -1) {
        comments[idx] = comment;
      } else {
        // Fallback: search by new ID if the old one wasn't found
        const idxNew = comments.findIndex(c => c.id === comment.id);
        if (idxNew !== -1) comments[idxNew] = comment;
        else comments.push(comment);
      }
    } else {
      comments.push(comment);
    }

    comments.sort((a, b) => a.lineStart - b.lineStart);
    _renderList();
    _markLinesWithComments();
  }

  // ── Delete a comment ─────────────────────────────────────────
  async function remove(commentId) {
    const ws   = AppState.currentWorkspace;
    const file = AppState.currentFile;
    if (!ws || !file) return;
    if (!confirm('Delete this comment?')) return;
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
    const count = comments.length;
    
    const lines = [
        `Dưới đây là [${count}] feedback cho tài liệu "${file}". Với mỗi block, hãy định vị ANCHOR bằng CONTEXT và POSITION, sau đó thực hiện FEEDBACK. Trả lời theo thứ tự comment.`,
        ``
    ];
    
    // Check for Additional Content if in AI mode
    if (file === '__DRAFT_MODE__') {
      const extra = document.getElementById('ai-extra-input')?.value.trim();
      if (extra) {
        lines.push(`================================================================`);
        lines.push(`[ADDITIONAL CONTENT / USER CONTEXT]`);
        lines.push(`----------------------------------------------------------------`);
        lines.push(extra);
        lines.push(`================================================================`);
        lines.push(``);
      }
    }

    comments.forEach((c, index) => {
      const anchor = (c.selectedText || c.startLineContent || 'N/A').trim();
      const lineRef = (c.lineStart === c.lineEnd) ? `L${c.lineStart}` : `L${c.lineStart} -> L${c.lineEnd}`;
      const before = (c.context?.before || '').trim();
      const after  = (c.context?.after || '').trim();
      const position = c.headingPath || "General";

      lines.push(`================================================================`);
      lines.push(`[COMMENT #${index + 1}]`);
      lines.push(`----------------------------------------------------------------`);
      lines.push(`ANCHOR: "${anchor}"`);
      lines.push(``);
      lines.push(`CONTEXT: "...${before} [${anchor}] ${after}..."`);
      lines.push(``);
      lines.push(`POSITION: ${position} (${lineRef})`);
      lines.push(``);
      lines.push(`FEEDBACK:`);
      lines.push(c.text);
      lines.push(`================================================================`);
      lines.push(``);
    });

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
        // Feedback logic
        if (typeof showToast === 'function') {
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
    const sidebar = RightSidebar.getInstance();
    if (!sidebar || AppState.currentMode !== 'comment') return;

    sidebar.setupModule({
      title: 'Comment',
      actions: [
        { id: 'clear', icon: 'trash', title: 'Clear all comments', onClick: () => { if (comments.length && confirm('Clear all comments?')) clear(); } },
        { id: 'copy', icon: 'copy', title: 'Copy all comments', onClick: copyAll }
      ],
      items: comments,
      emptyState: {
        icon: 'message',
        text: 'No Comment yet'
      },
      renderItem: (c, index) => {
        const isRange = c.lineEnd && c.lineEnd > c.lineStart;
        const lineRef = isRange ? `L${c.lineStart}–L${c.lineEnd}` : `Line ${c.lineStart}`;
        const isSelected = activeCommentId && c.id && c.id === activeCommentId;
        
        const item = DesignSystem.createElement('div', 'ds-sidebar-item' + (isSelected ? ' is-selected' : ''));
        item.dataset.id = c.id;

        let snippet = '';
        if (c.selectedText) {
          const b = c.context?.before ? '...' + c.context.before.slice(-15) : '';
          const a = c.context?.after ? c.context.after.slice(0, 15) + '...' : '';
          snippet = `${b} <span class="highlight-selection">${_esc(c.selectedText)}</span> ${a}`;
        } else {
          snippet = isRange ? `${c.startLineContent} ... ${c.endLineContent}` : (c.startLineContent || '');
          snippet = _esc(snippet);
        }

        item.innerHTML = `
          <div class="ds-item-header">
            <div class="ds-item-header-group">
              <div class="ds-item-label">${lineRef.toUpperCase()}</div>
              <div class="ds-item-snippet">${snippet}</div>
            </div>
            <button class="ds-item-delete-btn" data-id="${c.id}" title="Delete">
              ${DesignSystem.getIcon('x')}
            </button>
          </div>
          <div class="ds-item-body">${_esc(c.text)}</div>
        `;

        item.onmouseenter = () => _highlightLines(c.lineStart, c.lineEnd);
        item.onmouseleave = () => _clearHighlights();
        item.onclick      = () => _onItemClick(c);
        
        const delBtn = item.querySelector('.ds-item-delete-btn');
        if (delBtn) {
          delBtn.addEventListener('click', e => {
            e.stopPropagation();
            remove(c.id);
          });
        }
        return item;
      }
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
      targetLine.classList.add('pulse-highlight');
      setTimeout(() => targetLine.classList.remove('pulse-highlight'), 2000);

      formTarget = { 
        lineStart: comment.lineStart, 
        lineEnd: comment.lineEnd, 
        startLineContent: comment.startLineContent, 
        endLineContent: comment.endLineContent,
        selectedText: comment.selectedText,
        context: comment.context,
        headingPath: comment.headingPath,
        id: comment.id
      };
      _showForm(targetLine, 'view', comment.text);
    }
  }

  function _getHeadingPath(lineStart) {
    const container = document.getElementById('md-content');
    if (!container) return "General";
    const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const relevantHeadings = headings.filter(h => {
      const lineEl = h.closest('.md-line');
      if (!lineEl) return false;
      const lineNum = parseInt(lineEl.dataset.line, 10);
      return lineNum <= lineStart;
    });
    if (relevantHeadings.length === 0) return "General";
    let current = relevantHeadings[relevantHeadings.length - 1];
    let level = parseInt(current.tagName[1], 10);
    const path = [current.textContent.trim()];
    for (let i = relevantHeadings.length - 2; i >= 0; i--) {
      const h = relevantHeadings[i];
      const hLevel = parseInt(h.tagName[1], 10);
      if (hLevel < level) {
        path.unshift(h.textContent.trim());
        level = hLevel;
      }
    }
    return path.join(' > ');
  }

  function _clearHighlights() {
    document.querySelectorAll('.md-line').forEach(l => { 
      l.classList.remove('highlight-temp');
    });
  }

  // ── Mark exact text ranges that have comments ───────────────────
  function _markLinesWithComments() {
    document.querySelectorAll('.comment-range').forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      }
    });
    document.querySelectorAll('.md-line').forEach(b => b.classList.remove('has-comment'));

    const linesWithComments = new Set(comments.map(c => c.lineStart));
    comments.forEach(c => {
        if (c.lineEnd) {
            for (let i = c.lineStart; i <= c.lineEnd; i++) linesWithComments.add(i);
        }
    });

    linesWithComments.forEach(lineNum => {
      const lineEl = document.querySelector(`.md-line[data-line="${lineNum}"]`);
      if (!lineEl) return;
      lineEl.classList.add('has-comment');
      const lineComments = comments.filter(c => 
        lineNum >= c.lineStart && lineNum <= (c.lineEnd || c.lineStart)
      );
      _applyRobustHighlights(lineEl, lineComments);
    });
  }

  function _applyRobustHighlights(element, lineComments) {
    const textComments = lineComments.filter(c => !!c.selectedText);
    if (textComments.length === 0) return;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) textNodes.push(node);

    textNodes.forEach(textNode => {
      const content = textNode.textContent;
      const boundaries = new Set([0, content.length]);
      const nodeMap = new Map();
      textComments.forEach(c => {
        let startIdx = 0;
        while ((startIdx = content.indexOf(c.selectedText, startIdx)) !== -1) {
          const endIdx = startIdx + c.selectedText.length;
          boundaries.add(startIdx);
          boundaries.add(endIdx);
          for (let i = startIdx; i < endIdx; i++) {
            if (!nodeMap.has(i)) nodeMap.set(i, new Set());
            nodeMap.get(i).add(c);
          }
          startIdx = endIdx;
        }
      });
      if (boundaries.size <= 2 && nodeMap.size === 0) return;
      const sorted = Array.from(boundaries).sort((a, b) => a - b);
      const fragments = document.createDocumentFragment();
      for (let i = 0; i < sorted.length - 1; i++) {
        const start = sorted[i];
        const end = sorted[i+1];
        if (start === end) continue;
        const segmentText = content.substring(start, end);
        const segmentComments = nodeMap.get(start);
        if (segmentComments && segmentComments.size > 0) {
          const mark = document.createElement('mark');
          mark.className = 'comment-range';
          mark.textContent = segmentText;
          const firstComment = Array.from(segmentComments)[0];
          mark.dataset.id = firstComment.id;
          mark.dataset.ids = Array.from(segmentComments).map(c => c.id).join(',');
          if (segmentComments.size > 1) {
            mark.classList.add('multiple-comments');
            mark.title = `${segmentComments.size} comments here`;
          }
          mark.onclick = (e) => {
            e.stopPropagation();
            _onItemClick(firstComment);
          };
          fragments.appendChild(mark);
        } else {
          fragments.appendChild(document.createTextNode(segmentText));
        }
      }
      textNode.parentNode.replaceChild(fragments, textNode);
    });
  }

  // ── Apply comment mode (floating trigger) ─────────────────────
  let floatingTrigger = null;

  function applyCommentMode() {
    if (!floatingTrigger) {
      floatingTrigger = document.createElement('button');
      floatingTrigger.className = 'comment-trigger';
      floatingTrigger.innerHTML = DesignSystem.getIcon('message');
      floatingTrigger.title     = 'Add comment to selection';
      floatingTrigger.addEventListener('click', _onTriggerClick);
      document.body.appendChild(floatingTrigger);
    }
    
    document.addEventListener('mouseup', _handleSelection);
    document.addEventListener('keyup', _handleSelection);
    _renderList();
    _markLinesWithComments();
  }

  function removeCommentMode() {
    if (floatingTrigger) floatingTrigger.classList.remove('show');
    document.removeEventListener('mouseup', _handleSelection);
    document.removeEventListener('keyup', _handleSelection);
    _clearHighlights();
    _hideForm();
    
    const sidebar = RightSidebar.getInstance();
    if (sidebar) sidebar.close();
  }

  function _handleSelection() {
    const selection = window.getSelection();
    if (selection.isCollapsed || selection.toString().trim() === '') {
      if (floatingTrigger) floatingTrigger.classList.remove('show');
      return;
    }
    const range = selection.getRangeAt(0);
    const container = document.getElementById('md-content');
    if (!container.contains(range.commonAncestorContainer)) {
      if (floatingTrigger) floatingTrigger.classList.remove('show');
      return;
    }
    const rects = range.getClientRects();
    if (rects.length === 0) {
      if (floatingTrigger) floatingTrigger.classList.remove('show');
      return;
    }
    const lastRect = rects[rects.length - 1];
    const firstRect = rects[0];
    if (floatingTrigger) {
      const isForward = (range.startContainer === selection.anchorNode && range.startOffset === selection.anchorOffset);
      let left = isForward ? lastRect.right + 5 : firstRect.left - 40;
      let top  = isForward ? lastRect.bottom + 5 : firstRect.top - 40;
      if (left + 40 > window.innerWidth) left = window.innerWidth - 45;
      if (left < 5) left = 5;
      if (top < 5) top = 5;
      if (top + 40 > window.innerHeight) top = window.innerHeight - 45;
      floatingTrigger.style.left = `${left}px`;
      floatingTrigger.style.top  = `${top}px`;
      floatingTrigger.classList.add('show');
    }
  }

  function _onTriggerClick(e) {
    e.stopPropagation();
    const selection = window.getSelection();
    if (selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    const allLines = Array.from(document.querySelectorAll('.md-line'));
    const selectedLines = allLines.filter(el => selection.containsNode(el, true));
    if (selectedLines.length === 0) return;
    const lineStart = parseInt(selectedLines[0].dataset.line, 10);
    const lineEnd   = parseInt(selectedLines[selectedLines.length - 1].dataset.line, 10);
    const context = _getSelectionContext(range);
    formTarget = { 
      lineStart, 
      lineEnd, 
      startLineContent: _getLineText(selectedLines[0]), 
      endLineContent: _getLineText(selectedLines[selectedLines.length - 1]),
      selectedText,
      context,
      headingPath: _getHeadingPath(lineStart)
    };
    _showForm(floatingTrigger);
  }

  function _getSelectionContext(range) {
    const startNode = range.startContainer;
    const endNode = range.endContainer;
    let before = '';
    let after = '';
    const RADIUS = 60;
    if (startNode.nodeType === 3) {
      const fullText = startNode.textContent;
      const start = Math.max(0, range.startOffset - RADIUS);
      before = fullText.substring(start, range.startOffset).trimStart();
      if (start > 0) before = '...' + before;
    }
    if (endNode.nodeType === 3) {
      const fullText = endNode.textContent;
      const end = Math.min(fullText.length, range.endOffset + RADIUS);
      after = fullText.substring(range.endOffset, end).trimEnd();
      if (end < fullText.length) after = after + '...';
    }
    return { before, after };
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
    formTarget = null;
    activeCommentId = null;
    _renderList();
  }

  async function _submitForm() {
    const text = document.getElementById('comment-input').value.trim();
    if (!text || !formTarget) return;
    await save(
      formTarget.lineStart, 
      formTarget.lineEnd, 
      formTarget.startLineContent, 
      formTarget.endLineContent, 
      text,
      formTarget.selectedText,
      formTarget.context,
      formTarget.id,
      formTarget.headingPath
    );
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

  function initCommentDrag() {
    const form = document.getElementById('comment-form');
    if (!form) return;
    let isDragging = false;
    let startX, startY, initialX, initialY;
    form.addEventListener('mousedown', (e) => {
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
    initCommentDrag();
    document.getElementById('cancel-comment').addEventListener('click', _hideForm);
    document.getElementById('save-comment').addEventListener('click', _submitForm);
    const input = document.getElementById('comment-input');
    const form  = document.getElementById('comment-form');
    const saveBtn = document.getElementById('save-comment');
    
    if (!input || !form || !saveBtn) {
      console.warn('CommentsModule: Essential elements not found.');
      return;
    }
    input.addEventListener('focus', () => form.classList.add('is-typing'));
    input.addEventListener('blur', () => form.classList.remove('is-typing'));
    input.addEventListener('input', () => {
      const val = input.value.trim();
      saveBtn.disabled = !val;
      form.classList.toggle('is-filled', !!val);
      form.setAttribute('data-mode', val ? 'filled' : 'empty');
      _autoResize(input);
    });
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
      modal.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('expanded-textarea-backdrop')) closeExpand();
      });
    }
    document.getElementById('edit-comment-btn').addEventListener('click', () => {
      if (!formTarget) return;
      input.value = document.getElementById('comment-text-display').textContent;
      saveBtn.disabled = !input.value.trim();
      form.classList.toggle('is-filled', true);
      form.setAttribute('data-mode', 'filled'); // Switch to edit mode
      _autoResize(input);
      setTimeout(() => input.focus(), 50);
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey && !saveBtn.disabled) { e.preventDefault(); _submitForm(); }
      if (e.key === 'Escape') _hideForm();
    });
  }

  function init() {
    _bindEvents();
  }

  document.addEventListener('mousedown', (e) => {
    const form = document.getElementById('comment-form');
    if (form && form.classList.contains('show')) {
      if (!form.contains(e.target) && !e.target.closest('.ds-sidebar-item') && !e.target.closest('.comment-trigger')) {
        _hideForm();
      }
    }
  });

  return { init, loadForFile, applyCommentMode, removeCommentMode, clearUI, clear, getCommentCount: () => comments.length };
})();
