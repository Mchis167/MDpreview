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
    
    // 2. Segmented Control Group (New Wrapper)
    const leftSection = DesignSystem.createElement('div', 'ds-toolbar-section-left');
    
    this.segmentedControl = DesignSystem.createElement('div', 'ds-segmented-control');
    
    // Add sliding indicator
    this.indicator = DesignSystem.createElement('div', 'ds-segment-indicator');
    this.segmentedControl.appendChild(this.indicator);

    this.modes.forEach(mode => {
      const item = DesignSystem.createElement('div', 'ds-segment-item', {
        'data-mode': mode.id,
        'title': mode.title,
        'html': DesignSystem.getIcon(mode.icon)
      });
      
      item.addEventListener('mousedown', (e) => e.preventDefault());
      item.addEventListener('click', () => this.handleModeClick(mode.id));
      this.segmentedControl.appendChild(item);
    });

    leftSection.appendChild(this.segmentedControl);

    // 3. Divider
    this.divider = DesignSystem.createElement('div', 'ds-toolbar-divider');

    // 4. Draft Actions (Button Group)
    this.draftActions = DesignSystem.createElement('div', 'ds-toolbar-buttons');
    
    const discardBtn = DesignSystem.createElement('button', ['ds-btn', 'ds-btn-ghost'], {
      text: 'Discard Draft'
    });
    discardBtn.addEventListener('click', () => this.handleDiscard());

    const saveBtn = DesignSystem.createElement('button', ['ds-btn', 'ds-btn-primary'], {
      text: 'Save to Workspace'
    });
    saveBtn.addEventListener('click', () => this.handleSave());

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
        setTimeout(() => {
          this.updateUI(AppState.currentMode || 'read');
        }, 100);
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

    /* console.log('[ChangeActionViewBar] updateUI:', { 
      modeId, 
      currentFile: AppState.currentFile, 
      appMode: AppState.currentMode 
    }); */

    // Use AppState mode if modeId is not provided
    const targetMode = modeId || AppState.currentMode || 'read';

    // ── Visibility Check ──────────────────────────────────
    const viewer      = document.getElementById('md-viewer');
    
    if (!this.isStandalone) {
        const hasFile = !!AppState.currentFile;
        this.container.style.display = hasFile ? 'flex' : 'none';
        if (!hasFile) return;
    }

    if (viewer) {
      viewer.setAttribute('data-active-mode', targetMode);
    }

    // ── Sync Logic (Capture while still visible) ──────────
    const prevMode = AppState.currentMode;
    let syncData = null;
    if ((prevMode === 'read' || prevMode === 'comment') && targetMode === 'edit') {
      syncData = this.captureReadViewSyncData();
    } else if (prevMode === 'edit' && targetMode !== 'edit') {
      syncData = { line: this.captureEditorLine() };
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
                    const saved = await EditorModule.save();
                    if (saved) {
                        this._proceedUpdateUI(targetMode, syncData, prevMode);
                    }
                },
                onCancel: () => {
                    // Stay in edit mode if cancel
                    this.updateUI('edit');
                }
            });
            return;
        }
    }

    await this._proceedUpdateUI(targetMode, syncData, prevMode);
    
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
    const items = this.segmentedControl.querySelectorAll('.ds-segment-item');
    let activeItem = null;

    items.forEach(item => {
      const mode = item.getAttribute('data-mode');
      const isActive = mode === targetMode;
      item.classList.toggle('active', isActive);
      if (isActive) activeItem = item;
    });

    if (this.indicator && activeItem) {
      requestAnimationFrame(() => {
        this.indicator.style.width = `${activeItem.offsetWidth}px`;
        this.indicator.style.height = `${activeItem.offsetHeight}px`;
        this.indicator.style.left = `${activeItem.offsetLeft}px`;
        this.indicator.style.top = `${activeItem.offsetTop}px`;
      });
    }

    // ── Manage Viewers ────────────────────────────────────
    const mdContent   = document.getElementById('md-content');
    const editViewer  = document.getElementById('edit-viewer');
    const emptyState  = document.getElementById('empty-state');

    if (mdContent)  mdContent.style.display  = 'none';
    if (editViewer) editViewer.style.display = 'none';

    if (targetMode === 'read' || targetMode === 'comment' || targetMode === 'collect') {
      if (AppState.currentFile) {
        if (mdContent) mdContent.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
      }

      // Comments/Collect Modules - They handle RightSidebar setup/close internally
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

      // Sync scroll: coming from edit, jump to where the cursor was
      if (prevMode === 'edit' && syncData && syncData.line) {
        requestAnimationFrame(() => this.scrollReadViewToLine(syncData.line));
      }
    } else if (targetMode === 'edit') {
      const currentSelection = window.getSelection().toString().trim();
      const currentScrollPct = mdContent ? (document.getElementById('md-viewer').scrollTop / (document.getElementById('md-viewer').scrollHeight - document.getElementById('md-viewer').clientHeight || 1)) : 0;

      if (AppState.currentFile) {
        if (editViewer) editViewer.style.display = 'flex';
        if (emptyState) emptyState.style.display = 'none';
        await this.loadRawContent();
        
        if (typeof EditorModule !== 'undefined' && syncData) {
          EditorModule.focusWithContext(syncData);
        }
      }
      
      if (typeof CommentsModule !== 'undefined') CommentsModule.removeCommentMode();
      if (typeof CollectModule !== 'undefined') CollectModule.removeCollectMode();
    }

    // ── Draft Actions ─────────────────────────────────────
    const isDraft = this.isStandalone ? this.showDraftActions : (window.AppState && AppState.currentFile && AppState.currentFile.startsWith('__DRAFT_'));
    if (this.divider) this.divider.style.display = isDraft ? 'block' : 'none';
    if (this.draftActions) this.draftActions.style.display = isDraft ? 'flex' : 'none';
  }

  // ── Helper Methods (Migrated from toolbar.js) ─────────────

  /**
   * Captures sync data from Read View (Selection or Top Visible Line)
   */
  captureReadViewSyncData() {
    const sel = window.getSelection();
    const mdContent = document.getElementById('md-content');
    const viewer = document.getElementById('md-viewer');

    if (!mdContent || !viewer) return { scrollPct: 0 };

    // 1. Check for Selection first
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      if (mdContent.contains(range.commonAncestorContainer)) {
        let node = range.startContainer.nodeType === Node.TEXT_NODE
          ? range.startContainer.parentElement
          : range.startContainer;

        while (node && node !== mdContent) {
          if (node.dataset && node.dataset.line) {
            const line = parseInt(node.dataset.line, 10);
            const selectionText = sel.toString(); // Don't trim, preserve exact match
            return { line, selectionText };
          }
          node = node.parentElement;
        }
      }
    }

    // 2. Fallback: Find Top Visible Line
    const lines = Array.from(mdContent.querySelectorAll('[data-line]'));
    const viewerRect = viewer.getBoundingClientRect();
    const threshold = viewerRect.top + 60; 



    const topLineEl = lines.find(el => {
      const rect = el.getBoundingClientRect();
      return rect.bottom > threshold;
    });
    
    if (topLineEl) {
      const line = parseInt(topLineEl.dataset.line, 10);
      return { line };
    }

    // 3. Last Resort: Scroll Percentage
    const scrollPct = viewer.scrollTop / (viewer.scrollHeight - viewer.clientHeight || 1);

    return { scrollPct };
  }

  captureReadViewLine() {
    const data = this.captureReadViewSyncData();
    return data.line || null;
  }

  captureEditorLine() {
    const textarea = document.getElementById('edit-textarea');
    if (!textarea) return null;
    const pos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, pos);
    return textBefore.split('\n').length;
  }

  scrollEditorToLine(lineNum) {
    const textarea = document.getElementById('edit-textarea');
    if (!textarea || !lineNum) return;
    const lines = textarea.value.split('\n');
    let charPos = 0;
    for (let i = 0; i < Math.min(lineNum - 1, lines.length - 1); i++) {
      charPos += lines[i].length + 1;
    }
    textarea.focus();
    textarea.setSelectionRange(charPos, charPos);
  }

  scrollReadViewToLine(lineNum) {
    if (!lineNum) return;
    const viewer = document.getElementById('md-viewer');
    if (!viewer) return;

    let target = viewer.querySelector(`[data-line="${lineNum}"]`);
    if (!target) {
      const allLines = Array.from(viewer.querySelectorAll('[data-line]'));
      if (!allLines.length) return;
      target = allLines.reduce((closest, el) =>
        Math.abs(parseInt(el.dataset.line) - lineNum) < Math.abs(parseInt(closest.dataset.line) - lineNum)
          ? el : closest
      );
    }
    if (target) target.scrollIntoView({ block: 'center', behavior: 'auto' });
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
            await loadFile(cleanName);
            // Force UI update to hide draft buttons
            await this.updateUI('read');
          }
        }
      } else {
        const errData = await res.json();
        if (typeof showToast === 'function') showToast('Failed to save file: ' + (errData.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      console.error(err);
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
