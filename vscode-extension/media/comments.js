(function () {
  const vscode = window.__mdpVscode;
  const mount = document.getElementById('md-viewer-mount');
  const content = document.getElementById('md-content');

  const sidebar = RightSidebar.init({
    mount: document.getElementById('right-sidebar-wrap'),
    storageKey: 'mdpreview_vscode_sidebar_right_width'
  });

  let comments = [];
  let archivedComments = [];
  let activeTab = 'inbox';
  let commentModeOn = false;
  let formTarget = null;
  let activeCommentId = null;

  // panel-right isn't in the app's icon set (the app has no collapse control
  // in this position). Registered through the public API rather than editing
  // the vendored registry, so re-vendoring never drops it.
  DesignSystem.registerIcons({
    'panel-right': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/></svg>`
  });

  // ---- expand to full editor ----
  // Ported from renderer/js/modules/comments.js's _renderExpandedModal +
  // the onExpand wiring in _bindEvents: the form's own "maximize-2" button
  // (comment-form-component.js) already calls onExpandCallback, but nothing
  // on this side ever supplied one, so the button did nothing.
  const formComp = CommentFormComponent.getInstance();
  let expandModal = null;
  let expandInput = null;

  function buildExpandModal() {
    const el = document.createElement('div');
    el.className = 'expanded-textarea-modal';
    el.innerHTML = `
      <div class="expanded-textarea-backdrop"></div>
      <div class="expanded-textarea-container">
        <div class="expanded-textarea-header">
          <div class="textarea-label">COMMENT FEEDBACK</div>
          <button type="button" class="textarea-expand-btn" title="Minimize">${
            DesignSystem.getIcon ? DesignSystem.getIcon('minimize-2') || '' : ''
          }</button>
        </div>
        <div class="expanded-textarea-tagslot"></div>
        <div class="expanded-textarea-body">
          <textarea class="expanded-textarea-input" placeholder="What's your feedback..."></textarea>
        </div>
        <div class="expanded-textarea-footer">
          <button type="button" class="ds-btn ds-btn-primary">Save Comment</button>
        </div>
      </div>`;
    document.body.appendChild(el);

    const input = el.querySelector('.expanded-textarea-input');
    const attachSlot = el.querySelector('.expanded-textarea-body');
    const close = () => {
      formComp.setText(input.value);
      MdpCompose.returnHome();
      el.classList.remove('show');
    };
    el.querySelector('.textarea-expand-btn').addEventListener('click', close);
    el.querySelector('.expanded-textarea-backdrop').addEventListener('click', close);
    input.addEventListener('input', () => formComp.setText(input.value));
    // Same slot the form's own Enter-to-save/Save button use — whichever
    // save flow is currently bound (new comment vs edit) fires either way.
    el.querySelector('.ds-btn-primary').addEventListener('click', () => {
      formComp.setText(input.value);
      formComp.saveBtn.click();
      MdpCompose.returnHome();
      el.classList.remove('show');
    });

    return { el, input, attachSlot };
  }

  let expandAttachSlot = null;
  ({ el: expandModal, input: expandInput, attachSlot: expandAttachSlot } = buildExpandModal());
  formComp.onExpand((text) => {
    expandInput.value = text;
    // Borrow the popup's own tag row/attach strip rather than keeping a
    // second copy in sync — the small "empty state" fallback (nothing has
    // called MdpCompose.attach yet) just shows the textarea alone.
    const { tagRow, strip } = MdpCompose.elements();
    const tagSlot = expandModal.querySelector('.expanded-textarea-tagslot');
    if (tagRow && tagSlot) tagSlot.appendChild(tagRow);
    if (strip && expandAttachSlot) expandAttachSlot.appendChild(strip);
    expandModal.classList.add('show');
    setTimeout(() => expandInput.focus(), 50);
  });

  // ---- comment mode toggle ----
  // Mirrors renderer/js/modules/comments.js's applyCommentMode/removeCommentMode:
  // outside comment mode, selecting text is just selecting text. The mode is
  // entered from the floating action bar and can be left either from there or
  // from the panel's own header button.

  const modeListeners = new Set();

  function setCommentMode(on) {
    commentModeOn = on;
    if (on) mount.setAttribute('data-active-mode', 'comment');
    else mount.removeAttribute('data-active-mode');

    if (!on) {
      trigger.classList.remove('show');
      CommentFormComponent.getInstance().hide();
      clearPendingHighlight();
      formTarget = null;
      window.getSelection().removeAllRanges();
    }
    renderPanel();
    modeListeners.forEach((fn) => fn(commentModeOn));
  }

  window.MdpComments = {
    isOn: () => commentModeOn,
    toggle: () => setCommentMode(!commentModeOn),
    onChange: (fn) => modeListeners.add(fn)
  };

  // ---- floating "+" trigger (real IconActionButton, real .comment-trigger CSS) ----

  const trigger = new IconActionButton({
    iconName: 'message-circle-plus',
    title: 'Add comment to selection',
    isPrimary: true,
    isLarge: true,
    className: 'comment-trigger',
    onClick: onTriggerClick
  }).render();
  document.body.appendChild(trigger);

  function getLineNumber(node) {
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    const lineEl = el && el.closest ? el.closest('.md-line') : null;
    return lineEl ? parseInt(lineEl.dataset.line, 10) : null;
  }

  // Positioning copied from the app's _handleSelection: trigger follows the
  // selection end (or start, if the drag went backwards), clamped to the
  // viewport.
  // Deliberately NOT gated on commentModeOn: the habit is read → select →
  // only then remember the mode is off, reopen it, select again. Showing the
  // trigger on any selection removes that round trip; the mode itself is
  // entered automatically when the comment is submitted.
  function handleSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.toString().trim() === '') {
      trigger.classList.remove('show');
      return;
    }
    const range = selection.getRangeAt(0);
    if (!content.contains(range.commonAncestorContainer)) {
      trigger.classList.remove('show');
      return;
    }
    const rects = range.getClientRects();
    if (rects.length === 0) {
      trigger.classList.remove('show');
      return;
    }
    const lastRect = rects[rects.length - 1];
    const firstRect = rects[0];
    const isForward = range.startContainer === selection.anchorNode && range.startOffset === selection.anchorOffset;
    let left = isForward ? lastRect.right + 5 : firstRect.left - 40;
    let top = isForward ? lastRect.bottom + 5 : firstRect.top - 40;
    if (left + 40 > window.innerWidth) left = window.innerWidth - 45;
    if (left < 5) left = 5;
    if (top < 5) top = 5;
    if (top + 40 > window.innerHeight) top = window.innerHeight - 45;

    trigger.style.display = 'flex';
    trigger.style.left = `${left}px`;
    trigger.style.top = `${top}px`;
    trigger.classList.add('show');
  }

  document.addEventListener('mouseup', handleSelection);
  document.addEventListener('keyup', handleSelection);

  function onTriggerClick() {
    const selection = window.getSelection();
    if (selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    const allLines = Array.from(content.querySelectorAll('.md-line'));
    const selectedLines = allLines.filter((el) => selection.containsNode(el, true));
    if (selectedLines.length === 0) return;

    const lineStart = parseInt(selectedLines[0].dataset.line, 10);
    const lineEnd = parseInt(selectedLines[selectedLines.length - 1].dataset.line, 10);
    const context = getSelectionContext(range);

    formTarget = { lineStart, lineEnd, selectedText, context };
    highlightPending(lineStart, lineEnd, selectedText, context);

    MdpCompose.attach(formComp);
    formComp.onSave((text) => {
      if (!formTarget) return;
      const compose = MdpCompose.getState();
      // A pasted screenshot on its own is a comment; text is only required
      // when nothing is attached.
      if (!text && !MdpCompose.hasAttachments()) return;
      clearPendingHighlight();
      vscode.postMessage({ type: 'saveComment', data: { ...formTarget, text, ...compose } });
      formComp.hide();
      window.getSelection().removeAllRanges();
      formTarget = null;
      // Submitting from outside comment mode drops you into it, so the panel
      // opens with the comment you just left — no extra toggle to remember.
      if (!commentModeOn) setCommentMode(true);
    });
    formComp.onCancel(() => {
      clearPendingHighlight();
      formTarget = null;
    });
    formComp.show(trigger, 'empty');
    MdpCompose.reset(); // after show(), which resets the form's own fields
  }

  function getSelectionContext(range) {
    let container = range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) container = container.parentElement;
    const lineEl = container.closest('.md-line');
    if (!lineEl) return { before: '', after: '' };

    const fullLineText = lineEl.textContent;
    const preRange = document.createRange();
    preRange.setStart(lineEl, 0);
    preRange.setEnd(range.startContainer, range.startOffset);
    const offsetStart = preRange.toString().length;
    return window.CommentAnchor.buildContext(fullLineText, offsetStart, range.toString());
  }

  // ---- pending-selection highlight (while the form is open) ----

  function highlightPending(lineStart, lineEnd, selectedText, context) {
    if (!selectedText) return;
    for (let i = lineStart; i <= lineEnd; i++) {
      const lineEls = content.querySelectorAll(`.md-line[data-line="${i}"]`);
      const lineEl = lineEls[lineEls.length - 1];
      if (!lineEl) continue;

      const fullContent = lineEl.textContent;
      const globalStartIdx = window.CommentAnchor.findAnchor(fullContent, selectedText, context);
      if (globalStartIdx === -1) continue;
      const globalEndIdx = globalStartIdx + selectedText.length;

      const walker = document.createTreeWalker(lineEl, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      let offset = 0;
      let node;
      while ((node = walker.nextNode())) {
        textNodes.push({ node, start: offset, end: offset + node.textContent.length, content: node.textContent });
        offset += node.textContent.length;
      }

      for (let ti = textNodes.length - 1; ti >= 0; ti--) {
        const ni = textNodes[ti];
        const iStart = Math.max(ni.start, globalStartIdx);
        const iEnd = Math.min(ni.end, globalEndIdx);
        if (iStart >= iEnd) continue;
        const lStart = iStart - ni.start;
        const lEnd = iEnd - ni.start;
        const frag = document.createDocumentFragment();
        if (lStart > 0) frag.appendChild(document.createTextNode(ni.content.substring(0, lStart)));
        const mark = document.createElement('mark');
        mark.className = 'comment-pending-range';
        mark.textContent = ni.content.substring(lStart, lEnd);
        frag.appendChild(mark);
        if (lEnd < ni.content.length) frag.appendChild(document.createTextNode(ni.content.substring(lEnd)));
        ni.node.parentNode.replaceChild(frag, ni.node);
      }
    }
  }

  function clearPendingHighlight() {
    content.querySelectorAll('mark.comment-pending-range').forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      }
    });
  }

  // ---- sidebar list ----
  // Ported from renderer/js/modules/comments.js's _renderList: same
  // RightSidebar module config, same item markup (line-ref label, context
  // snippet with the selection highlighted, body, delete action), same
  // hover-to-highlight and click-to-open-form behaviour. The Inbox/Archive
  // switch is the only addition — archive doesn't exist in the app.

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : str;
    return div.innerHTML;
  }

  function renderPanel() {
    if (!commentModeOn) {
      sidebar.close();
      return;
    }

    const isArchive = activeTab === 'archive';
    const items = isArchive ? archivedComments : comments;

    sidebar.setupModule({
      title: isArchive ? 'Archive' : 'Comment',
      actions: [
        {
          id: 'tab-inbox',
          icon: 'message',
          title: `Inbox (${comments.length})`,
          onClick: () => {
            activeTab = 'inbox';
            renderPanel();
          }
        },
        {
          id: 'tab-archive',
          icon: 'check-circle',
          title: `Archive (${archivedComments.length})`,
          onClick: () => {
            activeTab = 'archive';
            renderPanel();
          }
        },
        {
          id: 'clear',
          icon: 'trash',
          // Archived comments are still deletable, so the action stays in both
          // tabs; it only goes inert when the list it would clear is empty.
          title: isArchive ? 'Clear archive' : 'Clear all comments',
          onClick: () => {
            if (!items.length) return;
            vscode.postMessage({ type: isArchive ? 'clearArchive' : 'clearComments' });
          }
        }
      ],
      items,
      emptyState: {
        icon: 'message',
        text: isArchive ? 'Nothing archived yet' : 'No Comment yet'
      },
      renderItem: (c) => buildItem(c, isArchive)
    });

    decorateHeader(isArchive, items.length);
  }

  // RightSidebarComponent rebuilds its header on every setupModule, so these
  // touch-ups are reapplied each render: the collapse button (which the app's
  // sidebar has no equivalent of, hence prepended here rather than passed as
  // an action, which would land after the title), the active-tab marker, and
  // the disabled state of Clear.
  function decorateHeader(isArchive, itemCount) {
    const header = sidebar.mount.querySelector('.ds-sidebar-header');
    if (!header) return;

    if (!header.querySelector('.mdp-collapse-btn')) {
      const collapseBtn = new IconActionButton({
        iconName: 'panel-right',
        title: 'Close comments',
        className: 'mdp-collapse-btn',
        onClick: () => setCommentMode(false)
      }).render();
      header.prepend(collapseBtn);
    }

    const activeBtn = header.querySelector(`[data-action-id="tab-${activeTab}"]`);
    if (activeBtn) activeBtn.classList.add('is-active');

    const clearBtn = header.querySelector('[data-action-id="clear"]');
    if (clearBtn) clearBtn.toggleAttribute('disabled', itemCount === 0);
  }

  function buildItem(c, archived) {
    const isRange = c.lineEnd && c.lineEnd > c.lineStart;
    const lineRef = isRange ? `L${c.lineStart}–L${c.lineEnd}` : `Line ${c.lineStart}`;
    const isSelected = activeCommentId && c.id && c.id === activeCommentId;

    const item = DesignSystem.createElement('div', 'ds-sidebar-item' + (isSelected ? ' is-selected' : ''));
    item.dataset.id = c.id;

    let snippet;
    if (c.selectedText) {
      const b = c.context?.before ? '...' + c.context.before.slice(-15) : '';
      const a = c.context?.after ? c.context.after.slice(0, 15) + '...' : '';
      snippet = `${esc(b)} <span class="highlight-selection">${esc(c.selectedText)}</span> ${esc(a)}`;
    } else {
      snippet = esc(c.startLineContent || '');
    }

    const header = DesignSystem.createElement('div', 'ds-item-header');
    const headerGroup = DesignSystem.createElement('div', 'ds-item-header-group');
    headerGroup.appendChild(DesignSystem.createElement('div', 'ds-item-label', { text: lineRef.toUpperCase() }));
    headerGroup.appendChild(DesignSystem.createElement('div', 'ds-item-snippet', { html: snippet }));

    const actionsGroup = DesignSystem.createElement('div', 'ds-item-actions-group');
    if (archived) {
      actionsGroup.appendChild(
        new IconActionButton({
          iconName: 'undo',
          title: 'Restore to Inbox',
          className: 'ds-item-delete-btn',
          onClick: () => vscode.postMessage({ type: 'restoreComment', id: c.id })
        }).render()
      );
      actionsGroup.appendChild(
        new IconActionButton({
          iconName: 'x',
          title: 'Delete permanently',
          isDanger: true,
          className: 'ds-item-delete-btn',
          onClick: () => vscode.postMessage({ type: 'deleteArchivedComment', id: c.id })
        }).render()
      );
    } else {
      actionsGroup.appendChild(
        new IconActionButton({
          iconName: 'x',
          title: 'Delete',
          isDanger: true,
          className: 'ds-item-delete-btn',
          onClick: () => vscode.postMessage({ type: 'deleteComment', id: c.id })
        }).render()
      );
    }

    header.appendChild(headerGroup);
    header.appendChild(actionsGroup);

    item.appendChild(header);

    if (c.tag) {
      const badge = DesignSystem.createElement('div', `mdp-tag-badge mdp-tag-badge--${c.tag}`, {
        text: c.tag.toUpperCase()
      });
      item.appendChild(badge);
    }

    if (c.text) {
      item.appendChild(DesignSystem.createElement('div', 'ds-item-body', { html: esc(c.text) }));
    }

    if (Array.isArray(c.imageUris) && c.imageUris.length) {
      const strip = DesignSystem.createElement('div', 'mdp-item-attachments');
      c.imageUris.forEach((uri) => {
        const img = document.createElement('img');
        img.src = uri;
        img.alt = '';
        img.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.ZoomSystem) window.ZoomSystem.open(uri, 'image');
        });
        strip.appendChild(img);
      });
      item.appendChild(strip);
    }

    if (!archived) {
      item.onmouseenter = () => highlightLines(c.lineStart, c.lineEnd);
      item.onmouseleave = () => clearLineHighlights();
      item.onclick = () => onItemClick(c);
    }

    return item;
  }

  function highlightLines(start, end) {
    clearLineHighlights();
    const targetEnd = end || start;
    for (let i = start; i <= targetEnd; i++) {
      const line = content.querySelector(`.md-line[data-line="${i}"]`);
      if (line) line.classList.add('highlight-temp');
    }
  }

  function clearLineHighlights() {
    content.querySelectorAll('.md-line').forEach((l) => l.classList.remove('highlight-temp'));
  }

  function onItemClick(c) {
    activeCommentId = c.id;
    renderPanel();

    const targetLine = content.querySelector(`.md-line[data-line="${c.lineStart}"]`);
    if (!targetLine) return;

    targetLine.scrollIntoView({ behavior: 'auto', block: 'center' });
    targetLine.classList.add('pulse-highlight');
    setTimeout(() => targetLine.classList.remove('pulse-highlight'), 2000);

    // Anchor to the highlighted span itself rather than the full-width line
    // block: comment-form-component.js positions the popup off anchorRect.right,
    // and a line-wide rect can put that past the edge of the window.
    const anchor = content.querySelector(`mark.comment-range[data-id="${c.id}"]`) || targetLine;

    formTarget = { ...c };
    MdpCompose.attach(formComp);
    formComp.onEdit((text) => {
      formComp.show(anchor, 'filled', text);
      MdpCompose.reset(c); // seed the chips and thumbnails from the comment
      formComp.onSave((newText) => {
        const compose = MdpCompose.getState();
        if (!newText && !MdpCompose.hasAttachments()) return;
        vscode.postMessage({ type: 'saveComment', data: { ...formTarget, text: newText, ...compose } });
        formComp.hide();
        formTarget = null;
      });
    });
    MdpCompose.showView(c);
    formComp.show(anchor, 'view', c.text);
  }

  // ---- inline highlights ----
  // Ported from renderer/js/modules/comments.js (_markLinesWithComments +
  // _applyRobustHighlights): drift compensation when the file was edited
  // since the comment was created, and correct handling of selections that
  // span multiple DOM text nodes. Uses the real .comment-range class, which
  // the vendored CSS only tints while #md-viewer-mount is in comment mode —
  // same as the desktop app.

  function applyHighlights() {
    content.querySelectorAll('.comment-range').forEach((mark) => {
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
          mark.className = 'comment-range';
          mark.textContent = segmentText;
          const firstComment = Array.from(segmentComments)[0];
          mark.dataset.id = firstComment.id;
          if (segmentComments.size > 1) mark.title = `${segmentComments.size} comments`;
          // Same as clicking the comment in the panel — scrolls the document
          // to it, selects it in the list and opens its form. Matches what
          // renderer/js/modules/comments.js does for a highlight click.
          //
          // Guarded by the mode: these marks stay in the DOM once applied,
          // but the vendored CSS only tints them in comment mode, so outside
          // it the user would be clicking something they cannot see.
          mark.addEventListener('click', (e) => {
            if (!commentModeOn) return;
            e.stopPropagation();
            onItemClick(firstComment);
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
