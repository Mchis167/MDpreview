/* global AppState, DesignSystem, MarkdownViewer, CommentsModule, CollectModule, EditorModule, TabsModule, loadFile, SyncService */
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
      radius: 'var(--_section-radius)',
      tooltipPos: 'top'
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
      onClick: () => this.handleDiscard(),
      tooltipPos: 'top'
    });
    
    const saveBtn = DesignSystem.createButton({
      label: 'Save to Workspace',
      variant: 'primary',
      radius: 'var(--_btn-radius)',
      onClick: () => this.handleSave(),
      tooltipPos: 'top'
    });

    this.draftActions.appendChild(discardBtn);
    this.draftActions.appendChild(saveBtn);

    // Assemble
    this.toolbarEl.appendChild(leftSection);
    this.toolbarEl.appendChild(this.divider);
    this.toolbarEl.appendChild(this.draftActions);
    this.container.appendChild(this.toolbarEl);

    this.targetContainer.appendChild(this.container);

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
    let syncData = AppState.forceSyncContext || null;
    
    // Clear forced context after use
    if (AppState.forceSyncContext) delete AppState.forceSyncContext;

    if (!syncData) {
      syncData = (prevMode === 'edit')
        ? this.captureEditorSyncData()
        : (prevMode === 'read' || prevMode === 'comment' || prevMode === 'collect' ? this.captureReadViewSyncData() : null);
    }

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
    return window.SyncService ? SyncService.captureReadViewSyncData() : { scrollPct: 0 };
  }

  captureReadViewLine() {
    const data = this.captureReadViewSyncData();
    return data.line || null;
  }

  captureEditorSyncData() {
    return window.SyncService ? SyncService.captureEditorSyncData() : {};
  }

  scrollEditorToLine(lineNum, offset = 0, length = 0) {
    if (window.SyncService) SyncService.scrollEditorToLine(lineNum, offset, length);
  }

  scrollReadViewToLine(line, selectionText = '', isRealSelection = false) {
    if (window.SyncService) SyncService.scrollReadViewToLine(line, selectionText, isRealSelection);
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
