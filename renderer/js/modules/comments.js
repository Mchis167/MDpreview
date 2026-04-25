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

    comments = await window.electronAPI.deleteComment(ws.id, file, commentId);
    _clearHighlights();
    _renderList();
    _markLinesWithComments();
    if (typeof showToast === 'function') showToast('Comment removed');
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
    if (file && file.startsWith('__DRAFT_')) {
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
      // Normalize whitespace for cleaner report
      const anchor = (c.selectedText || c.startLineContent || 'N/A').trim().replace(/\s+/g, ' ');
      const lineRef = (c.lineStart === c.lineEnd) ? `L${c.lineStart}` : `L${c.lineStart} -> L${c.lineEnd}`;
      const before = (c.context?.before || '').trim().replace(/\s+/g, ' ');
      const after  = (c.context?.after || '').trim().replace(/\s+/g, ' ');

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
        const btn = document.querySelector('.ds-header-action[data-action-id="copy"]');
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
        { id: 'clear', icon: 'trash', title: 'Clear all comments', onClick: () => clear() },
        { id: 'copy', icon: 'copy', title: 'Copy all comments', onClick: copyAll }
      ],
      items: comments,
      emptyState: {
        icon: 'message',
        text: 'No Comment yet'
      },
      renderItem: (c, _index) => {
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

        const header = DesignSystem.createElement('div', 'ds-item-header');
        const headerGroup = DesignSystem.createElement('div', 'ds-item-header-group');
        headerGroup.appendChild(DesignSystem.createElement('div', 'ds-item-label', { text: lineRef.toUpperCase() }));
        headerGroup.appendChild(DesignSystem.createElement('div', 'ds-item-snippet', { html: snippet }));

        const deleteBtn = new IconActionButton({
          iconName: 'x',
          title: 'Delete',
          isDanger: true,
          className: 'ds-item-delete-btn',
          onClick: () => remove(c.id)
        });

        header.appendChild(headerGroup);
        header.appendChild(deleteBtn.render());

        const body = DesignSystem.createElement('div', 'ds-item-body', { html: _esc(c.text) });

        item.appendChild(header);
        item.appendChild(body);

        item.onmouseenter = () => _highlightLines(c.lineStart, c.lineEnd);
        item.onmouseleave = () => _clearHighlights();
        item.onclick      = () => _onItemClick(c);
        
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
      targetLine.scrollIntoView({ behavior: 'auto', block: 'center' });
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

    // 1. Lấy toàn bộ text của dòng và danh sách các text nodes cùng offset của chúng
    const fullContent = element.textContent;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    let currentOffset = 0;
    let node;
    while (node = walker.nextNode()) {
      textNodes.push({
        node: node,
        start: currentOffset,
        end: currentOffset + node.textContent.length,
        content: node.textContent
      });
      currentOffset += node.textContent.length;
    }

    // 2. Tìm vị trí Global của từng comment
    const globalMatches = [];
    textComments.forEach(c => {
      let globalStartIdx = -1;
      
      // Search with Context
      if (c.context) {
        const cleanBefore = (c.context.before || '').replace(/^\.\.\./, '');
        const cleanAfter  = (c.context.after || '').replace(/\.\.\.$/, '');
        const fingerprint = cleanBefore + c.selectedText + cleanAfter;
        
        const matchIdx = fullContent.indexOf(fingerprint);
        if (matchIdx !== -1) {
          globalStartIdx = matchIdx + cleanBefore.length;
        }
      }

      // Fallback: Search for selected text alone if fingerprint fails
      if (globalStartIdx === -1) {
        const cleanText = c.selectedText.trim();
        // Try exact match first
        globalStartIdx = fullContent.indexOf(c.selectedText);
        
        // Try normalized whitespace match if exact fails
        if (globalStartIdx === -1) {
          const normalizedContent = fullContent.replace(/\s+/g, ' ');
          const normalizedSelected = cleanText.replace(/\s+/g, ' ');
          const normIdx = normalizedContent.indexOf(normalizedSelected);
          if (normIdx !== -1) {
             // This is a rough estimation, but better than no highlight
             globalStartIdx = normIdx; 
          }
        }
      }

      if (globalStartIdx !== -1) {
        globalMatches.push({
          comment: c,
          start: globalStartIdx,
          end: globalStartIdx + c.selectedText.length
        });
      }
    });

    // 3. Ánh xạ các Global Match ngược lại từng Text Node và thực hiện thay thế
    for (let i = textNodes.length - 1; i >= 0; i--) {
      const nodeInfo = textNodes[i];
      const boundaries = new Set([0, nodeInfo.content.length]);
      const nodeMap = new Map();

      globalMatches.forEach(m => {
        const intersectStart = Math.max(nodeInfo.start, m.start);
        const intersectEnd = Math.min(nodeInfo.end, m.end);

        if (intersectStart < intersectEnd) {
          const localStart = intersectStart - nodeInfo.start;
          const localEnd = intersectEnd - nodeInfo.start;
          
          boundaries.add(localStart);
          boundaries.add(localEnd);
          
          for (let j = localStart; j < localEnd; j++) {
            if (!nodeMap.has(j)) nodeMap.set(j, new Set());
            nodeMap.get(j).add(m.comment);
          }
        }
      });

      if (boundaries.size <= 2 && nodeMap.size === 0) continue;

      const sorted = Array.from(boundaries).sort((a, b) => a - b);
      const fragments = document.createDocumentFragment();
      
      for (let j = 0; j < sorted.length - 1; j++) {
        const start = sorted[j];
        const end = sorted[j+1];
        if (start === end) continue;
        
        const segmentText = nodeInfo.content.substring(start, end);
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
      nodeInfo.node.parentNode.replaceChild(fragments, nodeInfo.node);
    }
  }


  // ── Apply comment mode (floating trigger) ─────────────────────
  let floatingTrigger = null;

  function applyCommentMode() {
    if (!floatingTrigger) {
      const triggerBtn = new IconActionButton({
        iconName: 'message-circle-plus',
        title: 'Add comment to selection',
        isPrimary: true,
        isLarge: true,
        className: 'comment-trigger',
        onClick: (e) => _onTriggerClick(e)
      });
      
      floatingTrigger = triggerBtn.render();
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
    let container = range.commonAncestorContainer;
    if (container.nodeType === 3) container = container.parentElement;
    
    const lineEl = container.closest('.md-line');
    if (!lineEl) return { before: '', after: '' };


    const fullLineText = lineEl.textContent;
    
    // Tính toán offset của selection so với textContent của toàn bộ dòng
    const preRange = document.createRange();
    preRange.setStart(lineEl, 0);
    preRange.setEnd(range.startContainer, range.startOffset);
    const offsetStart = preRange.toString().length;
    const selectedText = range.toString();

    const RADIUS = 60;
    const before = fullLineText.substring(Math.max(0, offsetStart - RADIUS), offsetStart);
    const after  = fullLineText.substring(offsetStart + selectedText.length, offsetStart + selectedText.length + RADIUS);

    return { 
      before: before.length < RADIUS ? before : '...' + before, 
      after: after.length < RADIUS ? after : after + '...' 
    };


  }


  // ── Show / hide form ─────────────────────────────────────────

  function _showForm(anchorBtn, mode = 'empty', initialText = '') {
    const formComp = CommentFormComponent.getInstance();
    formComp.show(anchorBtn, mode, initialText);
  }

  function _hideForm() {
    const formComp = CommentFormComponent.getInstance();
    formComp.hide();
    formTarget = null;
    activeCommentId = null;
    _renderList();
  }

  async function _submitForm(text) {
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

  function _renderExpandedModal() {
    if (document.getElementById('expanded-comment-modal')) return;
    const el = document.createElement('div');
    el.id = 'expanded-comment-modal';
    el.className = 'expanded-textarea-modal';
    el.innerHTML = `
      <div class="expanded-textarea-backdrop"></div>
      <div class="expanded-textarea-container">
        <div class="expanded-textarea-header">
          <div class="textarea-label">COMMENT FEEDBACK</div>
          <button id="minimize-comment-btn" class="textarea-expand-btn" title="Minimize">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
              <line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </button>
        </div>
        <div class="expanded-textarea-body">
          <textarea id="expanded-comment-input" class="expanded-textarea-input" placeholder="What's your feedback..."></textarea>
        </div>
        <div class="expanded-textarea-footer">
          <button id="expanded-save-comment" class="ds-btn ds-btn-primary">Save Comment</button>
        </div>
      </div>`;
    document.body.appendChild(el);
  }

  function _bindEvents() {
    const formComp = CommentFormComponent.getInstance();
    
    formComp.onSave((text) => _submitForm(text));
    formComp.onCancel(() => _hideForm());
    
    formComp.onEdit((text) => {
      formComp.setMode('filled');
      formComp.setText(text);
    });

    formComp.onExpand((text) => {
      const modal = document.getElementById('expanded-comment-modal');
      const modalInput = document.getElementById('expanded-comment-input');
      if (modal && modalInput) {
        modalInput.value = text;
        modal.classList.add('show');
        setTimeout(() => modalInput.focus(), 50);
      }
    });

    // Handle expanded modal buttons
    const modalSaveBtn = document.getElementById('expanded-save-comment');
    const minimizeBtn = document.getElementById('minimize-comment-btn');
    const modalInput = document.getElementById('expanded-comment-input');
    const modal = document.getElementById('expanded-comment-modal');

    if (modalSaveBtn) {
      modalSaveBtn.onclick = async () => {
        await _submitForm(modalInput.value.trim());
        modal.classList.remove('show');
      };
    }

    if (minimizeBtn) {
      minimizeBtn.onclick = () => {
        formComp.setText(modalInput.value);
        modal.classList.remove('show');
      };
    }

    if (modalInput) {
      modalInput.addEventListener('input', () => {
        formComp.setText(modalInput.value);
      });
    }
    
    // Backdrop click
    const backdrop = modal?.querySelector('.expanded-textarea-backdrop');
    if (backdrop) {
      backdrop.onclick = () => {
        formComp.setText(modalInput.value);
        modal.classList.remove('show');
      };
    }
  }

  function init() {
    _renderExpandedModal();
    _bindEvents();
  }


  return { init, loadForFile, applyCommentMode, removeCommentMode, clearUI, clear, getCommentCount: () => comments.length };
})();
window.CommentsModule = CommentsModule;
