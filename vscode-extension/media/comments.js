(function () {
  const vscode = window.__mdpVscode;
  const content = document.getElementById('md-content');
  const panel = document.getElementById('mdp-comments-panel');

  let comments = [];
  let archivedComments = [];
  let activeTab = 'inbox';
  let pendingSelection = null;
  let commentModeOn = false;

  // ---- comment mode toggle ----

  const modeToggle = document.createElement('button');
  modeToggle.className = 'mdp-comment-mode-toggle';
  modeToggle.title = 'Bật/tắt Comment Mode';
  modeToggle.textContent = '💬';
  document.body.appendChild(modeToggle);

  modeToggle.addEventListener('click', () => {
    commentModeOn = !commentModeOn;
    modeToggle.classList.toggle('mdp-comment-mode-toggle--active', commentModeOn);
    if (!commentModeOn) {
      hideTrigger();
      hideForm();
      window.getSelection().removeAllRanges();
    }
    renderPanel();
  });

  // ---- floating "+" trigger + inline form ----

  const trigger = document.createElement('button');
  trigger.className = 'mdp-comment-trigger';
  trigger.textContent = '+';
  trigger.style.display = 'none';
  document.body.appendChild(trigger);

  const form = document.createElement('div');
  form.className = 'mdp-comment-form';
  form.style.display = 'none';
  form.innerHTML = `
    <textarea class="mdp-comment-form-input" placeholder="Viết nhận xét..."></textarea>
    <div class="mdp-comment-form-actions">
      <button class="mdp-comment-form-cancel" type="button">Huỷ</button>
      <button class="mdp-comment-form-submit" type="button">Lưu</button>
    </div>`;
  document.body.appendChild(form);
  const formInput = form.querySelector('.mdp-comment-form-input');

  function hideTrigger() {
    trigger.style.display = 'none';
    pendingSelection = null;
  }

  function hideForm() {
    form.style.display = 'none';
    formInput.value = '';
  }

  function positionNear(el, rect) {
    el.style.left = `${Math.min(rect.right, window.innerWidth - 220)}px`;
    el.style.top = `${window.scrollY + rect.bottom + 6}px`;
  }

  function getLineNumber(node) {
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    const lineEl = el && el.closest ? el.closest('.md-line') : null;
    return lineEl ? parseInt(lineEl.dataset.line, 10) : null;
  }

  function handleSelection() {
    if (!commentModeOn) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      hideTrigger();
      return;
    }
    const range = selection.getRangeAt(0);
    if (!content.contains(range.commonAncestorContainer)) {
      hideTrigger();
      return;
    }
    const selectedText = selection.toString();
    if (!selectedText.trim()) {
      hideTrigger();
      return;
    }

    const lineStart = getLineNumber(range.startContainer);
    const lineEnd = getLineNumber(range.endContainer);
    if (!lineStart || !lineEnd) {
      hideTrigger();
      return;
    }

    const startLineEl = range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer.parentElement.closest('.md-line')
      : range.startContainer.closest('.md-line');
    const startLineContent = startLineEl ? startLineEl.textContent : '';
    const offsetInLine = startLineContent.indexOf(selectedText.split('\n')[0]);
    const context = window.CommentAnchor.buildContext(
      startLineContent,
      offsetInLine === -1 ? 0 : offsetInLine,
      selectedText.split('\n')[0]
    );

    pendingSelection = { selectedText, lineStart, lineEnd, context, startLineContent };

    const rect = range.getBoundingClientRect();
    trigger.style.display = 'flex';
    positionNear(trigger, rect);
  }

  document.addEventListener('mouseup', (e) => {
    if (e.target === trigger || form.contains(e.target)) return;
    handleSelection();
  });

  trigger.addEventListener('click', () => {
    if (!pendingSelection) return;
    const rect = trigger.getBoundingClientRect();
    trigger.style.display = 'none';
    form.style.display = 'block';
    positionNear(form, rect);
    formInput.focus();
  });

  form.querySelector('.mdp-comment-form-cancel').addEventListener('click', () => {
    hideForm();
    hideTrigger();
  });

  form.querySelector('.mdp-comment-form-submit').addEventListener('click', submitComment);
  formInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment();
    if (e.key === 'Escape') { hideForm(); hideTrigger(); }
  });

  function submitComment() {
    const text = formInput.value.trim();
    if (!text || !pendingSelection) return;
    vscode.postMessage({ type: 'saveComment', data: { ...pendingSelection, text } });
    window.getSelection().removeAllRanges();
    hideForm();
    hideTrigger();
  }

  // ---- sidebar list (Inbox / Archive tabs) ----

  function renderPanel() {
    const hasAnything = comments.length || archivedComments.length;
    if (!hasAnything && !commentModeOn) {
      panel.innerHTML = '';
      panel.classList.remove('mdp-comments-panel--open');
      return;
    }
    panel.classList.add('mdp-comments-panel--open');

    const tabs = `
      <div class="mdp-comments-tabs">
        <button class="mdp-comments-tab${activeTab === 'inbox' ? ' mdp-comments-tab--active' : ''}" data-tab="inbox">
          Inbox${comments.length ? ` (${comments.length})` : ''}
        </button>
        <button class="mdp-comments-tab${activeTab === 'archive' ? ' mdp-comments-tab--active' : ''}" data-tab="archive">
          Archive${archivedComments.length ? ` (${archivedComments.length})` : ''}
        </button>
      </div>`;

    let body;
    if (activeTab === 'inbox') {
      body = comments.length
        ? comments
            .map(
              (c) => `
        <div class="mdp-comment-item" data-id="${c.id}" data-line="${c.lineStart}">
          <div class="mdp-comment-item-quote">${escapeHtml(c.selectedText || '')}</div>
          <div class="mdp-comment-item-body">${escapeHtml(c.text || '')}</div>
          <button class="mdp-comment-item-delete" data-id="${c.id}" title="Xoá">×</button>
        </div>`
            )
            .join('')
        : '<div class="mdp-comments-panel-empty">Bôi đen văn bản rồi bấm nút + để thêm nhận xét.</div>';
    } else {
      body = archivedComments.length
        ? archivedComments
            .map(
              (c) => `
        <div class="mdp-comment-item mdp-comment-item--archived" data-id="${c.id}">
          <div class="mdp-comment-item-quote">${escapeHtml(c.selectedText || '')}</div>
          <div class="mdp-comment-item-body">${escapeHtml(c.text || '')}</div>
          <div class="mdp-comment-item-actions">
            <button class="mdp-comment-item-restore" data-id="${c.id}">Khôi phục</button>
            <button class="mdp-comment-item-forget" data-id="${c.id}">Xoá vĩnh viễn</button>
          </div>
        </div>`
            )
            .join('')
        : '<div class="mdp-comments-panel-empty">Chưa có comment nào được Claude đọc.</div>';
    }

    panel.innerHTML = tabs + `<div class="mdp-comments-list">${body}</div>`;

    panel.querySelectorAll('.mdp-comments-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        renderPanel();
      });
    });

    panel.querySelectorAll('.mdp-comment-item-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        vscode.postMessage({ type: 'deleteComment', id: btn.dataset.id });
      });
    });
    panel.querySelectorAll('.mdp-comment-item-restore').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        vscode.postMessage({ type: 'restoreComment', id: btn.dataset.id });
      });
    });
    panel.querySelectorAll('.mdp-comment-item-forget').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        vscode.postMessage({ type: 'deleteArchivedComment', id: btn.dataset.id });
      });
    });
    panel.querySelectorAll('.mdp-comment-item[data-line]').forEach((item) => {
      item.addEventListener('click', () => {
        const lineEl = content.querySelector(`.md-line[data-line="${item.dataset.line}"]`);
        if (lineEl) lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- inline highlights ----
  // Ported from renderer/js/modules/comments.js (_markLinesWithComments +
  // _applyRobustHighlights) so highlighting behaves identically to the
  // Electron app: drift compensation when the file has been edited since
  // the comment was created, and correct handling of selections that span
  // multiple DOM text nodes (e.g. crossing a <strong> boundary).

  function applyHighlights() {
    content.querySelectorAll('.mdp-comment-mark').forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      }
    });

    comments.forEach((c) => {
      if (!c.selectedText) return;

      const currentLineEl = content.querySelector(`.md-line[data-line="${c.lineStart}"]`);
      const needsResync = !currentLineEl || !currentLineEl.textContent.includes(c.selectedText);
      if (!needsResync) return;

      let bestLineNum = -1;
      let bestScore = -1;
      const RADIUS = 30;
      const startScan = Math.max(1, c.lineStart - RADIUS);
      const endScan = c.lineStart + RADIUS;

      for (let i = startScan; i <= endScan; i++) {
        const scanEl = content.querySelector(`.md-line[data-line="${i}"]`);
        if (!scanEl) continue;

        const textContent = scanEl.textContent;
        let matchIdx = 0;
        while ((matchIdx = textContent.indexOf(c.selectedText, matchIdx)) !== -1) {
          const score = window.CommentAnchor.scoreContextMatch(textContent, matchIdx, c.selectedText.length, c.context);
          if (score > bestScore) {
            bestScore = score;
            bestLineNum = i;
          }
          matchIdx += c.selectedText.length || 1;
        }
      }

      if (bestLineNum !== -1) {
        const delta = bestLineNum - c.lineStart;
        c.lineStart = bestLineNum;
        if (c.lineEnd) c.lineEnd += delta;
      }
    });

    const linesWithComments = new Set();
    comments.forEach((c) => {
      linesWithComments.add(c.lineStart);
      if (c.lineEnd) {
        for (let i = c.lineStart; i <= c.lineEnd; i++) linesWithComments.add(i);
      }
    });

    linesWithComments.forEach((lineNum) => {
      const lineEls = content.querySelectorAll(`.md-line[data-line="${lineNum}"]`);
      if (!lineEls.length) return;
      const lineEl = lineEls[lineEls.length - 1];
      const lineComments = comments.filter((c) => lineNum >= c.lineStart && lineNum <= (c.lineEnd || c.lineStart));
      applyRobustHighlights(lineEl, lineComments);
    });
  }

  function applyRobustHighlights(element, lineComments) {
    const textComments = lineComments.filter((c) => !!c.selectedText);
    if (textComments.length === 0) return;

    const fullContent = element.textContent;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let currentOffset = 0;
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push({ node, start: currentOffset, end: currentOffset + node.textContent.length, content: node.textContent });
      currentOffset += node.textContent.length;
    }

    const globalMatches = [];
    textComments.forEach((c) => {
      const globalStartIdx = window.CommentAnchor.findAnchor(fullContent, c.selectedText, c.context);
      if (globalStartIdx !== -1) {
        globalMatches.push({ comment: c, start: globalStartIdx, end: globalStartIdx + c.selectedText.length });
      }
    });

    for (let i = textNodes.length - 1; i >= 0; i--) {
      const nodeInfo = textNodes[i];
      const boundaries = new Set([0, nodeInfo.content.length]);
      const nodeMap = new Map();

      globalMatches.forEach((m) => {
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
      const fragment = document.createDocumentFragment();

      for (let j = 0; j < sorted.length - 1; j++) {
        const start = sorted[j];
        const end = sorted[j + 1];
        if (start === end) continue;

        const segmentText = nodeInfo.content.substring(start, end);
        const segmentComments = nodeMap.get(start);

        if (segmentComments && segmentComments.size > 0) {
          const mark = document.createElement('mark');
          mark.className = 'mdp-comment-mark';
          mark.textContent = segmentText;
          const firstComment = Array.from(segmentComments)[0];
          mark.dataset.commentId = firstComment.id;
          if (segmentComments.size > 1) {
            mark.classList.add('mdp-comment-mark--multi');
            mark.title = `${segmentComments.size} comments`;
          }
          mark.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = panel.querySelector(`.mdp-comment-item[data-id="${firstComment.id}"]`);
            if (item) item.scrollIntoView({ behavior: 'smooth', block: 'center' });
          });
          fragment.appendChild(mark);
        } else {
          fragment.appendChild(document.createTextNode(segmentText));
        }
      }
      nodeInfo.node.parentNode.replaceChild(fragment, nodeInfo.node);
    }
  }

  document.addEventListener('mdp:content-rendered', applyHighlights);

  window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === 'comments') {
      comments = message.list || [];
      applyHighlights(); // may resync c.lineStart/lineEnd — run before the panel reads them
      renderPanel();
    } else if (message.type === 'archivedComments') {
      archivedComments = message.list || [];
      renderPanel();
    }
  });
})();
