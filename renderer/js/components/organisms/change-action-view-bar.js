/* ============================================================
   organisms/change-action-view-bar.js — Design System Component
   ============================================================ */

class ChangeActionViewBarComponent {
  constructor(options = {}) {
    this.targetContainer = options.targetContainer || document.querySelector('.glass-main') || document.body;
    this.isStandalone = !!options.isStandalone; // If true, doesn't hook into global AppState
    
    this.container = null;
    this.toolbarEl = null;
    this.segmentedControl = null;
    this.draftActions = null;
    this.indicator = null;

    this.modes = [
      { id: 'read', icon: 'book-open', title: 'Read Mode' },
      { id: 'edit', icon: 'pen-line', title: 'Edit Mode' },
      { id: 'comment', icon: 'message-circle', title: 'Comment Mode' },
      { id: 'collect', icon: 'bookmark', title: 'Collect Mode' }
    ];

    this.init();
  }

  init() {
    // 1. Create Main Container
    const className = ['ds-change-action-view-bar-container', this.isStandalone ? 'preview-mode' : ''].join(' ');
    this.container = DesignSystem.createElement('div', className);

    this.toolbarEl = DesignSystem.createElement('div', 'ds-change-action-view-bar');
    
    // 2. Segmented Control Group (Adaptive & Concentric)
    const leftSection = DesignSystem.createElement('div', 'ds-toolbar-section-left');
    
    this.segmentedControlComponent = DesignSystem.createSegmentedControl({
      items: this.modes,
      activeId: AppState.currentMode || 'read',
      onChange: (modeId) => this.handleModeClick(modeId),
      // Use inherited variable from CSS
      radius: 'var(--_section-radius)'
    });

    this.segmentedControl = this.segmentedControlComponent.el;
    this.indicator = this.segmentedControlComponent.indicator;

    leftSection.appendChild(this.segmentedControl);

    // 3. Divider
    this.divider = DesignSystem.createElement('div', 'ds-toolbar-divider');

    // 4. Draft Actions (Button Group)
    this.draftActions = DesignSystem.createElement('div', 'ds-toolbar-buttons');
    
    const discardBtn = DesignSystem.createButton({
      label: 'Discard Draft',
      variant: 'ghost',
      radius: 'var(--_btn-radius)',
      onClick: () => this.handleDiscard()
    });

    const saveBtn = DesignSystem.createButton({
      label: 'Save to Workspace',
      variant: 'primary',
      radius: 'var(--_btn-radius)',
      onClick: () => this.handleSave()
    });

    this.draftActions.appendChild(discardBtn);
    this.draftActions.appendChild(saveBtn);

    // Assemble
    this.toolbarEl.appendChild(leftSection);
    this.toolbarEl.appendChild(this.divider);
    this.toolbarEl.appendChild(this.draftActions);
    this.container.appendChild(this.toolbarEl);

    this.targetContainer.appendChild(this.container);

    if (window.lucide) window.lucide.createIcons();

    // Hook into AppState if not standalone
    if (!this.isStandalone && window.AppState) {
        AppState.updateToolbarUI = async (mode) => {
            await this.updateUI(mode);
        };

        // Trigger initial state
        this.updateUI(AppState.currentMode || 'read');
    }
  }

  handleModeClick(modeId) {
    if (this.isStandalone) {
        this.updateUI(modeId);
        return;
    }
    
    // Trigger global update (which hits our updateUI)
    if (window.AppState && AppState.updateToolbarUI) {
      AppState.updateToolbarUI(modeId);
    }
  }

  // ── Mode Switch Logic (Migrated from toolbar.js) ────────────
  
  async updateUI(modeId) {
    if (!this.toolbarEl) return;
    if (typeof AppState === 'undefined') return;
    
    if (!this.isStandalone) {
        const hasFile = !!AppState.currentFile;
        this.container.style.display = hasFile ? 'flex' : 'none';
        if (!hasFile) return; // Safe: _isSyncing not yet set
    }

    // Strict Sync Guard to prevent loops
    if (this._isSyncing) return;
    this._isSyncing = true;
    window._isGlobalSyncing = true; // Global flag for other modules to honor

    const targetMode = modeId || AppState.currentMode || 'read';

    // ── Visibility Check ──────────────────────────────────
    const viewer = document.getElementById('md-viewer-mount');

    if (viewer) {
      viewer.setAttribute('data-active-mode', targetMode);
    }

    // ── Sync Logic (Capture while still visible) ──────────
    const prevMode = AppState.currentMode;
    const syncData = (prevMode === 'edit')
      ? this.captureEditorSyncData()
      : (prevMode === 'read' || prevMode === 'comment' || prevMode === 'collect' ? this.captureReadViewSyncData() : null);

    // ── Dirty Check ───────────────────────────────────────
    if (prevMode === 'edit' && targetMode !== 'edit' && typeof EditorModule !== 'undefined' && EditorModule.isDirty()) {
        const isDraft = AppState.currentFile && AppState.currentFile.startsWith('__DRAFT_');
        const isFirstEdit = EditorModule.getOriginalContent() === '';

        if (isDraft || isFirstEdit) {
            await EditorModule.save();
        } else {
            DesignSystem.showConfirm({
                title: 'Unsaved Changes',
                message: 'You have unsaved changes. Save them before switching?',
                onConfirm: async () => {
                    this._isSyncing = false;
                    window._isGlobalSyncing = false;
                    const saved = await EditorModule.save();
                    if (saved) {
                        this._proceedUpdateUI(targetMode, syncData, prevMode);
                    }
                },
                onCancel: () => {
                    this._isSyncing = false;
                    window._isGlobalSyncing = false;
                    this.updateUI('edit');
                }
            });
            return;
        }
    }

    try {
      await this._proceedUpdateUI(targetMode, syncData, prevMode);
    } finally {
      // Small delay to let DOM settle after mode switch
      setTimeout(() => {
        this._isSyncing = false;
        window._isGlobalSyncing = false;
      }, 400);
    }

    // Save mode preference
    if (AppState.currentFile && typeof AppState.setFileViewMode === 'function') {
        AppState.setFileViewMode(AppState.currentFile, targetMode);
    }
  }

  async _proceedUpdateUI(targetMode, syncData, prevMode) {

    // ── Update AppState ───────────────────────────────────
    AppState.commentMode = (targetMode === 'comment');
    AppState.currentMode = targetMode;

    // ── Update Component UI ───────────────────────────────
    if (this.segmentedControlComponent) {
      this.segmentedControlComponent.updateActive(targetMode);
    }

    if (targetMode === 'read' || targetMode === 'comment' || targetMode === 'collect') {
      const viewerComp = MarkdownViewer.getInstance();
      if (viewerComp) {
        viewerComp.setState({ 
          mode: targetMode,
          file: AppState.currentFile
        });
      } else {
        const mdContent   = document.getElementById('md-content');
        const emptyState  = document.getElementById('empty-state');
        if (mdContent) mdContent.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
      }

      if (typeof CommentsModule !== 'undefined') CommentsModule.removeCommentMode();
      if (typeof CollectModule !== 'undefined') CollectModule.removeCollectMode();

      if (targetMode === 'comment') {
        if (typeof CommentsModule !== 'undefined') CommentsModule.applyCommentMode();
      } else if (targetMode === 'collect') {
        if (typeof CollectModule !== 'undefined') {
          CollectModule.loadForFile(AppState.currentFile);
          CollectModule.applyCollectMode();
        }
      }

      if (AppState.currentFile && AppState.currentFile.startsWith('__DRAFT_')) {
        if (typeof DraftModule !== 'undefined') DraftModule.syncPreview();
      }

      if (prevMode === 'edit' && syncData) {
        requestAnimationFrame(() => {
          this.scrollReadViewToLine(syncData.line, syncData.selectionText, syncData.isRealSelection);
        });
      }
    } else if (targetMode === 'edit') {
      const viewerComp = MarkdownViewer.getInstance();
      const _currentSelection = window.getSelection().toString().trim();
      const mdContentMount = document.getElementById('md-content'); // Might not exist if we just switched
      
      const viewerMount = document.getElementById('md-viewer-mount');
      const _currentScrollPct = (mdContentMount && viewerMount) ? (viewerMount.scrollTop / (viewerMount.scrollHeight - viewerMount.clientHeight || 1)) : 0;

      if (AppState.currentFile) {
        if (viewerComp) {
          // Set sync context for the editor component to consume on mount
          if (syncData) AppState.lastSyncContext = syncData;

          viewerComp.setState({ 
            mode: 'edit',
            file: AppState.currentFile
          });
        }
        
        await this.loadRawContent();
        
        // Secondary sync after content is loaded to ensure accuracy
        if (typeof EditorModule !== 'undefined' && syncData) {
          EditorModule.focusWithContext({ ...syncData, _fileKey: AppState.currentFile || 'default' });
        }
      }
      
      if (typeof CommentsModule !== 'undefined') CommentsModule.removeCommentMode();
      if (typeof CollectModule !== 'undefined') CollectModule.removeCollectMode();
    }

    // ── Apply Subtle Fade-In Animation (Only for Major Mode Swaps) ──
    const isMajorChange = (prevMode === 'edit' || targetMode === 'edit');
    const activeView = (targetMode === 'edit') ? document.getElementById('edit-viewer') : document.getElementById('md-content');
    
    if (isMajorChange && activeView) {
      activeView.classList.remove('ds-sync-fade-in');
      void activeView.offsetWidth; // Force reflow
      activeView.classList.add('ds-sync-fade-in');
    }

    // ── Draft Actions ─────────────────────────────────────
    const isDraft = this.isStandalone ? this.showDraftActions : (window.AppState && AppState.currentFile && AppState.currentFile.startsWith('__DRAFT_'));
    if (this.divider) this.divider.style.display = isDraft ? 'block' : 'none';
    if (this.draftActions) this.draftActions.style.display = isDraft ? 'flex' : 'none';
  }

  // ── Helper Methods (Migrated from toolbar.js) ─────────────

  /**
   * Captures a sync context snapshot from the Read View.
   *
   * Used when switching Read → Edit so the editor can open at the same
   * content position the user was reading. Returns an object consumed by
   * MarkdownLogicService.syncCursor().
   *
   * Priority order:
   *   1. User selection (isRealSelection: true)
   *      If the user has text highlighted in the Read view, captures the
   *      selection text, its data-line number, and char offset within the
   *      element. This is the most accurate anchor.
   *
   *   2. Center-visible line (isRealSelection: false)
   *      Finds the element at the visual center of the viewport using
   *      elementFromPoint(), extracts its plain text (filtering out UI
   *      chrome like code-block headers, SVG, aria-hidden nodes).
   *      The text is capped at 200 chars to keep fuzzy matching fast.
   *
   *   3. Proportional scroll fallback (isRealSelection: false)
   *      Returns scrollPct (0–1) when no data-line element is found.
   *      Consumed by syncCursor's scroll-only fallback path.
   *
   * NOTE on data-line vs raw line offset:
   *   The HTML renderer assigns data-line numbers from the markdown token
   *   stream, which may differ from raw file line numbers by 10–20 lines
   *   in long files (due to YAML frontmatter, blank-line collapsing, etc.).
   *   This is expected — MarkdownLogicService.syncCursor handles the offset
   *   via its Fuzzy Match + Delta Cache mechanism.
   *
   * @returns {{ line, offset, selectionText, isRealSelection, length? }
   *          | { line, selectionText, isRealSelection }
   *          | { scrollPct, isRealSelection }}
   */
  captureReadViewSyncData() {
    const sel = window.getSelection();
    const mdContent = document.getElementById('md-content');
    const viewer = document.getElementById('md-viewer-mount');

    if (!mdContent || !viewer) return { scrollPct: 0 };

    // 1. Check for Selection first
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      if (mdContent.contains(range.commonAncestorContainer)) {
        const node = range.startContainer;
        let el = node.nodeType === 1 ? node : node.parentElement;
        
        while (el && el !== mdContent && !el.hasAttribute('data-line') && !el.hasAttribute('data-source-line')) {
          el = el.parentElement;
        }

        if (el) {
          const line = parseInt(el.getAttribute('data-line') || el.getAttribute('data-source-line'), 10);
          const selectionText = sel.toString();
          
          // ── Robust Offset Calculation (Traversal) ──
          let offset = 0;
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
          let n;
          while (n = walker.nextNode()) {
            if (n === range.startContainer) {
              offset += range.startOffset;
              break;
            }
            offset += n.textContent.length;
          }

          return { line, offset, length: selectionText.length, selectionText, isRealSelection: true };
        }
      }
    }

    // ── 2. Fallback: Center Visible Line (Strategic Anchor) ──
    const viewerRect = viewer.getBoundingClientRect();
    const centerX = viewerRect.left + (viewerRect.width / 2);
    const centerY = viewerRect.top + (viewerRect.height / 2);
    
    // Find element at visual center
    let centerEl = document.elementFromPoint(centerX, centerY);
    
    // Traverse up to find a data-line
    while (centerEl && centerEl !== mdContent && !centerEl.hasAttribute('data-line') && !centerEl.hasAttribute('data-source-line')) {
      centerEl = centerEl.parentElement;
    }
    
    if (centerEl) {
      const line = parseInt(centerEl.getAttribute('data-line') || centerEl.getAttribute('data-source-line'), 10);
      
      // ── Deep Content Extraction (Recursive Filter) ──
      const extractCleanText = (node) => {
        let text = "";
        node.childNodes.forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            text += child.textContent;
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            // Filter out UI decorations AND internal SVG/Technical tags
            const tagName = child.tagName.toUpperCase();
            const style = window.getComputedStyle(child);
            const isTechnicalTag = ['STYLE', 'DEFS', 'SCRIPT', 'METADATA', 'BUTTON', 'SVG'].includes(tagName);
            const isUI = isTechnicalTag || 
                         style.userSelect === 'none' ||
                         child.classList.contains('code-block-header') ||
                         child.hasAttribute('aria-hidden');
            
            if (!isUI) {
              text += extractCleanText(child);
            }
          }
        });
        return text;
      };

      const selectionText = extractCleanText(centerEl).trim().substring(0, 200);
      return { line, selectionText, isRealSelection: false };
    }

    // ── 3. Final Fallback: Proportional Scroll ──
    const scrollPct = viewer.scrollTop / (viewer.scrollHeight - viewer.clientHeight || 1);
    return { scrollPct, isRealSelection: false };
  }

  captureReadViewLine() {
    const data = this.captureReadViewSyncData();
    return data.line || null;
  }

  /**
   * Captures a sync context snapshot from the Edit View (textarea).
   *
   * Used when switching Edit → Read so the Read view can scroll to the same
   * content the user was editing. Returns an object consumed by
   * scrollReadViewToLine().
   *
   * selectionText strategy:
   *   - If user has text selected (isRealSelection: true) → use the raw
   *     selection as-is. The Read view will highlight it if found.
   *   - If cursor is on a "noisy" line (empty, separator like "---", or
   *     purely markdown symbols) → use the nearest non-noisy neighbor line
   *     (prev preferred over next) as the anchor text.
   *   - Otherwise → use the current line text.
   *
   *   In both fallback cases, markdown formatting symbols are stripped
   *   (# * ` _ ~ [ ] ( ) > - +) so the text can match the rendered HTML
   *   which doesn't contain raw markdown syntax.
   *   NOTE: digits and decimal points are intentionally preserved so that
   *   "SESSION 3" and "$0.001279" remain distinguishable.
   *
   * @returns {{ line, selectionText, scrollPct, isRealSelection, offset: 0 }}
   */
  captureEditorSyncData() {
    const textarea = document.getElementById('edit-textarea');
    if (!textarea) return {};

    const posStart = textarea.selectionStart;
    const posEnd = textarea.selectionEnd;
    const text = textarea.value;
    const lines = text.split('\n');

    const textBefore = text.substring(0, posStart);
    const lineIndex = textBefore.split('\n').length - 1;
    const line = lineIndex + 1;

    let selectionText = text.substring(posStart, posEnd);
    let isRealSelection = selectionText.trim().length > 0;

    // ── Smart Neighborhood Context (when no active selection) ──
    if (!isRealSelection) {
      const currentLineText = lines[lineIndex] || '';
      const prevLineText = lines[lineIndex - 1] || '';
      const nextLineText = lines[lineIndex + 1] || '';

      // "Noisy" = empty or only markdown/separator characters
      const isNoisy = (str) => !str.trim() || str.trim().match(/^[#*`_\-+=~> ]+$/);

      if (isNoisy(currentLineText)) {
        selectionText = (!isNoisy(prevLineText) ? prevLineText : nextLineText).replace(/[#*`_~\[\]()>\-+]/g, ' ').trim();
      } else {
        selectionText = currentLineText.replace(/[#*`_~\[\]()>\-+]/g, ' ').trim();
      }
    }

    const scrollPct = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight || 1);
    return { line, selectionText, scrollPct, isRealSelection, offset: 0 };
  }

  scrollEditorToLine(lineNum, offset = 0, length = 0) {
    const textarea = document.getElementById('edit-textarea');
    if (!textarea || !lineNum) return;

    if (window.MarkdownLogicService) {
        const fileKey = window.AppState?.currentFile || 'default';
        window.MarkdownLogicService.syncCursor(textarea, { line: lineNum, offset, length, _fileKey: fileKey });
    }
  }

  /**
   * Scrolls the Read View to the element that best matches (line, selectionText).
   *
   * Used when switching Edit → Read to bring the rendered HTML into alignment
   * with the editor's cursor position.
   *
   * ── Matching strategy ──────────────────────────────────────────
   *   1. Keyword Search (primary)
   *      Strips markdown formatting symbols from selectionText (# * ` _ ~ etc.)
   *      but keeps digits and decimal numbers intact.
   *      Splits into words (length > 2), then scores every [data-line] element
   *      within ±60 lines of the hint by counting how many words appear in its
   *      textContent. The highest-scoring element wins; ties broken by proximity
   *      to `line`.
   *
   *      The ±60 search range intentionally exceeds the typical data-line offset
   *      (~10–20 lines) that arises because the HTML renderer's line numbering
   *      diverges from raw textarea line numbers.
   *
   *   2. Exact line fallback
   *      If keyword search scores 0, falls back to querySelector('[data-line=N]').
   *
   * ── Stability loop ─────────────────────────────────────────────
   *   Runs inside requestAnimationFrame up to maxAttempts=5 times.
   *   Scrolls only when the target element's bounding rect has been stable
   *   for 3 consecutive frames (stableCount≥3) OR on the last attempt.
   *   This handles documents with Mermaid diagrams or lazy images that
   *   cause layout shifts after initial render.
   *
   * ── After scroll ───────────────────────────────────────────────
   *   - Wraps scrollIntoView() with _suppressScrollSync=true so
   *     ScrollModule's debounced listener does not save the sync position
   *     as the "user scroll" position for future restores.
   *   - Disconnects viewer._scrollObserver (set by ScrollModule.restore())
   *     to prevent it from overriding the synced position when a Mermaid
   *     diagram finishes rendering and triggers a resize event.
   *   - If isRealSelection=true, re-creates the browser text selection on
   *     the target element using a TreeWalker text-node search.
   *
   * @param {number}  line            - 1-based raw markdown line hint
   * @param {string}  [selectionText] - Text to search for (from captureEditorSyncData)
   * @param {boolean} [isRealSelection=false] - If true, re-highlight the text in Read view
   */
  scrollReadViewToLine(line, selectionText = '', isRealSelection = false) {
    const viewer = document.getElementById('md-viewer-mount');
    const mdContent = document.getElementById('md-content');
    if (!viewer || !mdContent) return;

    let attempts = 0;
    const maxAttempts = 5;
    let lastTop = -1;
    let stableCount = 0;

    const tryScroll = () => {
      let target = null;

      // 1. Smart Keyword Search (DOM Sandwich)
      if (selectionText && selectionText.trim().length > 3) {
        // Clean markdown symbols: # * ` _ ~ [ ] ( ) > - +
        const cleanSearchText = selectionText.replace(/[#*`_~\[\]()>\-+]/g, ' ').trim();
        const words = cleanSearchText.split(/\s+/).filter(w => w.length > 2);

        if (words.length > 0) {
          const allElements = Array.from(mdContent.querySelectorAll('[data-line], [data-source-line]'));

          // Find element with highest word density near the target line
          let bestMatch = null;
          let maxScore = 0;
          let bestDistance = Infinity;
          const searchRange = 60; // Wider range to handle data-line vs raw line offset

          allElements.forEach(el => {
            const elLine = parseInt(el.getAttribute('data-line') || el.getAttribute('data-source-line'), 10);
            if (Math.abs(elLine - line) > searchRange) return;

            const content = el.textContent;
            let score = 0;
            words.forEach(word => {
              if (content.includes(word)) score++;
            });

            const distance = Math.abs(elLine - line);
            // Prefer: higher score first, then closer line number as tiebreaker
            if (score > maxScore || (score === maxScore && score > 0 && distance < bestDistance)) {
              maxScore = score;
              bestMatch = el;
              bestDistance = distance;
            }
          });

          if (bestMatch && maxScore >= Math.min(words.length, 1)) {
            target = bestMatch;
          }
        }
      }

      // 2. Fallback to exact line number
      if (!target) {
        target = mdContent.querySelector(`[data-line="${line}"], [data-source-line="${line}"]`);
      }
      
      if (target) {
        const currentTop = target.getBoundingClientRect().top + window.scrollY;
        if (Math.abs(currentTop - lastTop) < 1) stableCount++;
        else stableCount = 0;
        lastTop = currentTop;

        // Fix: use maxAttempts - 1 so forced scroll fires on the LAST queued attempt
        if (stableCount >= 3 || attempts >= maxAttempts - 1) {
          // ── Suppress scroll save while we scroll to sync position ──
          window._suppressScrollSync = true;
          target.scrollIntoView({ behavior: 'auto', block: 'center' });
          requestAnimationFrame(() => { window._suppressScrollSync = false; });

          // ── Kill pending ScrollModule ResizeObserver to prevent it overriding sync position ──
          if (viewer._scrollObserver) {
            viewer._scrollObserver.disconnect();
            viewer._scrollObserver = null;
          }

          if (isRealSelection && selectionText) {
            try {
              const selection = window.getSelection();
              selection.removeAllRanges();

              // Walk text nodes to find exact position of selectionText
              const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null, false);
              let found = false;
              let node;
              while ((node = walker.nextNode()) && !found) {
                const idx = node.textContent.indexOf(selectionText);
                if (idx !== -1) {
                  const range = document.createRange();
                  range.setStart(node, idx);
                  range.setEnd(node, idx + selectionText.length);
                  selection.addRange(range);
                  found = true;
                }
              }

              // Fallback: select whole element if exact text not found in a single node
              if (!found) {
                const range = document.createRange();
                range.selectNodeContents(target);
                selection.addRange(range);
              }
            } catch(_e) {}
          }
          return;
        }
      }

      attempts++;
      if (attempts < maxAttempts) {
        requestAnimationFrame(tryScroll);
      }
    };

    requestAnimationFrame(tryScroll);
  }

  async loadRawContent() {
    if (!AppState.currentFile) return;

    if (AppState.currentFile && AppState.currentFile.startsWith('__DRAFT_')) {
        if (typeof DraftModule !== 'undefined' && typeof EditorModule !== 'undefined') {
            const content = DraftModule.getDraftContent();
            EditorModule.setOriginalContent(content);
        }
        return;
    }

    const res = await fetch(`/api/file/raw?path=${encodeURIComponent(AppState.currentFile)}`);
    if (res.ok) {
        const text = await res.text();
        if (typeof EditorModule !== 'undefined') {
            EditorModule.setOriginalContent(text);
        } else {
            const textarea = document.getElementById('edit-textarea');
            if (textarea) textarea.value = text;
        }
    }
  }

  async handleSave() {
    if (!window.AppState) return;

    let content = '';
    if (AppState.currentMode === 'edit' && typeof EditorModule !== 'undefined') {
      content = document.getElementById('edit-textarea')?.value || '';
    } else if (typeof DraftModule !== 'undefined') {
      content = DraftModule.getDraftContent();
    }

    if (!content) {
      if (typeof showToast === 'function') showToast('Draft is empty.', 'error');
      return;
    }

    // Helper to check if file exists
    const checkExists = async (name) => {
      try {
        const res = await fetch(`/api/file/exists?path=${encodeURIComponent(name)}`);
        const data = await res.json();
        return !!data.exists;
      } catch { return false; }
    };

    // 1. Find the first available "untitled X.md" name
    let suggestedName = 'untitled.md';
    let exists = await checkExists(suggestedName);
    let counter = 1;
    while (exists) {
      suggestedName = `untitled ${counter}.md`;
      exists = await checkExists(suggestedName);
      counter++;
    }

    DesignSystem.showPrompt({
      title: 'Save Draft to Workspace',
      message: 'Enter filename (with .md extension):',
      placeholder: 'untitled.md',
      defaultValue: suggestedName,
      onConfirm: async (fileName) => {
        if (!fileName) return;

        const cleanName = fileName.endsWith('.md') ? fileName : fileName + '.md';
        const filePath = `${AppState.currentWorkspace.path}/${cleanName}`;

        // 2. Check if user manually entered an existing name
        const userExists = await checkExists(cleanName);
        if (userExists) {
          DesignSystem.showConfirm({
            title: 'File Already Exists',
            message: `"${cleanName}" already exists. Do you want to replace it?`,
            onConfirm: () => this._doActualSave(cleanName, filePath, content)
          });
        } else {
          await this._doActualSave(cleanName, filePath, content);
        }
      }
    });
  }

  async _doActualSave(cleanName, filePath, content) {
    try {
      const res = await fetch('/api/file/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content })
      });

      if (res.ok) {
        if (typeof showToast === 'function') showToast('Draft saved as file!');
        if (typeof EditorModule !== 'undefined') EditorModule.setDirty(false);
        if (typeof DraftModule !== 'undefined') DraftModule.clear();
        
        if (typeof TabsModule !== 'undefined') {
          TabsModule.remove(AppState.currentFile, true);
          if (typeof loadFile === 'function') {
            await loadFile(cleanName, { silent: true });
            // Force UI update to hide draft buttons
            await this.updateUI('read');
          }
        }
      } else {
        const errData = await res.json();
        if (typeof showToast === 'function') showToast('Failed to save file: ' + (errData.error || 'Unknown error'), 'error');
      }
    } catch (_err) {
      if (typeof showToast === 'function') showToast('Error saving file.', 'error');
    }
  }

  handleDiscard() {
    // Skip confirmation if draft is empty
    let content = "";
    if (AppState.currentMode === "edit" && typeof EditorModule !== "undefined") {
      content = document.getElementById("edit-textarea")?.value || "";
    } else if (typeof DraftModule !== "undefined") {
      content = DraftModule.getDraftContent();
    }

    const isEffectivelyEmpty = !content || content.trim() === "";

    const proceedDiscard = () => {
      if (typeof TabsModule !== "undefined") {
        const fileToRemove = AppState.currentFile;
        TabsModule.remove(fileToRemove, true); // skipConfirm = true
        if (typeof DraftModule !== "undefined") {
          DraftModule.clear(fileToRemove);
        }
      }
    };

    if (isEffectivelyEmpty) {
      proceedDiscard();
    } else {
      DesignSystem.showConfirm({
        title: "Discard Draft",
        message:
          "Are you sure you want to discard this draft? This cannot be undone.",
        onConfirm: proceedDiscard,
      });
    }
  }
}

// Singleton bridge for existing app logic
const ChangeActionViewBar = (() => {
    let instance = null;
    return {
        init: () => {
            if (!instance) instance = new ChangeActionViewBarComponent();
            return instance;
        },
        getInstance: () => instance
    };
})();
// Export to window
window.ChangeActionViewBar = ChangeActionViewBar;
