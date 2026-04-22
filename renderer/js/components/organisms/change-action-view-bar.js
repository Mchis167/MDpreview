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

    // ── Sync Logic (Scroll/Line) ──────────────────────────
    const prevMode = AppState.currentMode;
    let syncLine = null;
    if ((prevMode === 'read' || prevMode === 'comment') && targetMode === 'edit') {
      syncLine = this.captureReadViewLine();
    } else if (prevMode === 'edit' && targetMode !== 'edit') {
      syncLine = this.captureEditorLine();
    }

    // ── Dirty Check ───────────────────────────────────────
    if (prevMode === 'edit' && targetMode !== 'edit') {
        if (typeof EditorModule !== 'undefined' && EditorModule.isDirty()) {
            if (confirm('You have unsaved changes. Save them before switching?')) {
                const saved = await EditorModule.save();
                if (!saved) return; // Stop if save failed
            }
        }
    }

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
      if (prevMode === 'edit' && syncLine) {
        requestAnimationFrame(() => this.scrollReadViewToLine(syncLine));
      }
    } else if (targetMode === 'edit') {
      if (AppState.currentFile) {
        if (editViewer) editViewer.style.display = 'flex';
        if (emptyState) emptyState.style.display = 'none';
        await this.loadRawContent();
        if (syncLine) this.scrollEditorToLine(syncLine);
      }
      
      if (typeof CommentsModule !== 'undefined') CommentsModule.removeCommentMode();
      if (typeof CollectModule !== 'undefined') CollectModule.removeCollectMode();
    }

    // ── Draft Actions ─────────────────────────────────────
    const isDraft = this.isStandalone ? this.showDraftActions : (window.AppState && AppState.currentFile === '__DRAFT_MODE__');
    if (this.divider) this.divider.style.display = isDraft ? 'block' : 'none';
    if (this.draftActions) this.draftActions.style.display = isDraft ? 'flex' : 'none';
  }

  // ── Helper Methods (Migrated from toolbar.js) ─────────────

  captureReadViewLine() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    const mdContent = document.getElementById('md-content');
    if (!mdContent || !mdContent.contains(range.commonAncestorContainer)) return null;

    let node = range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer.parentElement
      : range.startContainer;

    while (node && node !== mdContent) {
      if (node.dataset && node.dataset.line) return parseInt(node.dataset.line);
      node = node.parentElement;
    }
    return null;
  }

  captureEditorLine() {
    const textarea = document.getElementById('edit-textarea');
    if (!textarea) return null;
    return textarea.value.substring(0, textarea.selectionStart).split('\n').length;
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
    if (target) target.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  async loadRawContent() {
    if (!AppState.currentFile) return;

    if (AppState.currentFile === '__DRAFT_MODE__') {
        if (typeof DraftModule !== 'undefined' && typeof EditorModule !== 'undefined') {
            EditorModule.setOriginalContent(DraftModule.getDraftContent());
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
    if (typeof DraftModule === 'undefined' || !window.AppState) return;
    const content = DraftModule.getDraftContent();
    if (!content) {
      alert('Draft is empty.');
      return;
    }

    const fileName = prompt('Save Draft as File\\nEnter filename (with .md extension):', 'untitled.md');
    if (!fileName) return;

    const cleanName = fileName.endsWith('.md') ? fileName : fileName + '.md';
    const filePath = `${AppState.currentWorkspace.path}/${cleanName}`;

    try {
      const res = await fetch('/api/file/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content })
      });

      if (res.ok) {
        if (typeof showToast === 'function') showToast('Draft saved as file!');
        if (typeof TabsModule !== 'undefined') {
          TabsModule.remove('__DRAFT_MODE__');
          if (typeof loadFile === 'function') loadFile(filePath);
        }
      } else {
        const errData = await res.json();
        alert('Failed to save file: ' + (errData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error saving file.');
    }
  }

  handleDiscard() {
    if (confirm('Are you sure you want to discard this draft? This cannot be undone.')) {
      if (typeof TabsModule !== 'undefined') {
        TabsModule.remove('__DRAFT_MODE__');
        if (typeof DraftModule !== 'undefined') {
          DraftModule.clear();
        }
      }
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
