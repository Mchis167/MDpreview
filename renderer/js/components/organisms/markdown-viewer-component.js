/* ══════════════════════════════════════════════════
   MarkdownViewerComponent.js — The Shell
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class MarkdownViewerComponent {
  constructor(options = {}) {
    this.mount = options.mount || document.getElementById('md-viewer-mount');
    this.state = {
      mode: 'empty', // 'empty', 'read', 'edit'
      file: null,
      content: '',
      html: ''
    };
    this.activeComponent = null;
    this._scrollTopBtn = null;
    this.init();
  }

  init() {
    if (!this.mount) return;
    this.render();
  }

  /**
   * Main update entry point
   * @param {Object} newState 
   */
  setState(newState) {
    const fileChanged = newState.file !== undefined && newState.file !== this.state.file;
    const modeChanged = newState.mode !== undefined && newState.mode !== this.state.mode;
    
    // 1. Save scroll position before switching file OR mode
    // This prevents the "scroll jump" when moving between Read and Comment/Collect modes
    if ((fileChanged || modeChanged) && this.state.file && window.ScrollModule) {
      window.ScrollModule.save(this.state.file);
    }
    
    // 2. Update state
    this.state = { ...this.state, ...newState };

    if (modeChanged || fileChanged) {
      this.render();
    } else if (this.activeComponent && this.activeComponent.update) {
      this.activeComponent.update(this.state);
    }
  }

  render() {
    if (!this.mount) return;
    
    // Set rendering flag to prevent ScrollModule from saving noise during DOM changes
    window._isMDViewerRendering = true;
    
    try {
      // Clean up previous component if needed
      if (this.activeComponent && this.activeComponent.destroy) {
        this.activeComponent.destroy();
      }

      this.mount.innerHTML = '';
      
      switch(this.state.mode) {
        case 'read':
        case 'comment':
        case 'collect':
          this.activeComponent = new MarkdownPreview({ 
            mount: this.mount, 
            html: this.state.html,
            file: this.state.file
          });
          break;
        case 'edit':
          this.activeComponent = new MarkdownEditor({ 
            mount: this.mount, 
            content: this.state.content,
            file: this.state.file
          });
          break;
        default:
          this.activeComponent = new MarkdownEmptyState({ mount: this.mount });
      }

      // Add Floating Scroll Top Button if not in empty state
      if (this.state.mode !== 'empty') {
        this._renderFloatingScrollTop();
      }
    } finally {
      // Small delay to ensure browser processed the DOM changes before unlocking
      setTimeout(() => {
        window._isMDViewerRendering = false;
      }, 300);
    }
  }

  /**
   * Create and manage the floating 'Scroll to Top' button
   */
  _renderFloatingScrollTop() {
    this._scrollTopBtn = DesignSystem.createElement('div', 'floating-scroll-top', {
      id: 'floating-scroll-top',
      title: 'Scroll to top',
      html: DesignSystem.getIcon('chevron-up')
    });

    this._scrollTopBtn.onclick = () => {
      const scrollEl = this.mount.querySelector('#edit-textarea') || this.mount.querySelector('.md-content') || this.mount;
      scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
    };

    this.mount.appendChild(this._scrollTopBtn);

    // Listen for scroll on the active container
    const scrollEl = this.mount.querySelector('#edit-textarea') || this.mount.querySelector('.md-content') || this.mount;
    if (scrollEl) {
      scrollEl.onscroll = () => {
        if (scrollEl.scrollTop > 300) {
          this._scrollTopBtn.classList.add('is-visible');
        } else {
          this._scrollTopBtn.classList.remove('is-visible');
        }
      };
    }
  }
}

/* ── MarkdownEmptyState ── */
class MarkdownEmptyState {
  constructor({ mount }) {
    this.mount = mount;
    this.render();
  }

  render() {
    const container = DesignSystem.createElement('div', 'empty-state', { id: 'empty-state' });
    container.innerHTML = `
      <div class="illus-wrap">
        <img src="../assets/Central Illustration.png" alt="MDpreview Welcome" class="center-illus">
      </div>
      <div class="empty-state-text">
        <h2>MDpreview</h2>
        <p>Select a Markdown file from the sidebar or<br>click the workspace switcher to get started.</p>
      </div>
    `;
    this.mount.appendChild(container);
  }
}

/* ── MarkdownPreview ── */
class MarkdownPreview {
  constructor({ mount, html, file }) {
    this.mount = mount;
    this.html = html;
    this.file = file;
    this.render();
  }

  render() {
    const container = DesignSystem.createElement('div', 'md-content md-render-body', { id: 'md-content' });
    const inner = DesignSystem.createElement('div', 'md-content-inner');
    inner.innerHTML = this.html;
    
    container.appendChild(inner);
    this.mount.appendChild(container);

    // Post-render integration (Small delay to ensure DOM is ready for calculations)
    if (window.ScrollModule) {
      window.ScrollModule.setContainer(this.mount, this.file);
      window.ScrollModule.restore(this.file);
    }
    
    // Mermaid and CodeBlocks still benefit from a frame delay for layout
    requestAnimationFrame(() => {
      try {
        if (window.processMermaid) window.processMermaid(inner);
      } catch (_e) { /* Mermaid error - gracefully skip */ }
      try {
        if (window.CodeBlockModule) window.CodeBlockModule.process(inner);
      } catch (_e) { /* CodeBlock error - gracefully skip */ }
    });
  }

  update({ html }) {
    this.html = html;
    const inner = this.mount.querySelector('.md-content-inner');
    if (inner) {
      inner.innerHTML = html;
      
      // Re-process for live updates (e.g. Drafts)
      if (window.processMermaid) window.processMermaid(inner);
      if (window.CodeBlockModule) window.CodeBlockModule.process(inner);

      // Ensure scroll is maintained if content size changed
      if (window.ScrollModule) {
        window.ScrollModule.restore(this.file);
      }
    }
  }
}

/* ── MarkdownEditor ── */
class MarkdownEditor {
  constructor({ mount, content, file }) {
    this.mount = mount;
    this.content = content;
    this.file = file;
    this.render();
  }

  render() {
    const container = DesignSystem.createElement('div', 'edit-viewer', { id: 'edit-viewer' });
    
    const textarea = DesignSystem.createElement('textarea', '', { 
      id: 'edit-textarea', 
      placeholder: 'Start writing...' 
    });
    textarea.value = this.content;
    
    const toolbar = this._createToolbar();
    
    container.appendChild(textarea);
    container.appendChild(toolbar);
    this.mount.appendChild(container);

    // Initialize Editor Logic
    if (window.EditorModule) {
      window.EditorModule.bindToElement(textarea);
    }

    // NEW: Tell ScrollModule to watch the textarea instead of the mount point in Edit mode
    if (window.ScrollModule) {
      window.ScrollModule.setContainer(textarea, this.file);
      window.ScrollModule.restore(this.file);
    }

    // Restore cursor if context exists in AppState
    const ctx = window.AppState && window.AppState.lastSyncContext;
    if (ctx && (ctx.line || ctx.scrollPct) && window.MarkdownLogicService) {
      window.MarkdownLogicService.syncCursor(textarea, ctx);
      window.AppState.lastSyncContext = null;
    }
  }

  _createToolbar() {
    const wrap = DesignSystem.createElement('div', 'edit-toolbar-container');
    const toolbar = DesignSystem.createElement('div', 'edit-toolbar');

    // Group 1: Help
    const groupHelp = this._createGroup([
      { id: 'edit-help-btn', icon: 'help-circle', title: 'Markdown Help', onClick: () => window.MarkdownHelperComponent && window.MarkdownHelperComponent.open() }
    ]);
    toolbar.appendChild(groupHelp);
    toolbar.appendChild(DesignSystem.createElement('div', 'edit-divider'));

    // Group 2: Typography
    const groupTypography = this._createGroup([
      { action: 'h', icon: 'heading', title: 'Heading' },
      { action: 'b', icon: 'bold', title: 'Bold' },
      { action: 'i', icon: 'italic', title: 'Italic' },
      { action: 's', icon: 'strikethrough', title: 'Strikethrough' }
    ]);
    toolbar.appendChild(groupTypography);
    toolbar.appendChild(DesignSystem.createElement('div', 'edit-divider'));

    // Group 3: Content
    const groupContent = this._createGroup([
      { action: 'q', icon: 'quote', title: 'Quote' },
      { action: 'l', icon: 'link', title: 'Link' },
      { action: 'img', icon: 'image', title: 'Image' },
      { action: 'hr', icon: 'minus', title: 'Divider' }
    ]);
    toolbar.appendChild(groupContent);
    toolbar.appendChild(DesignSystem.createElement('div', 'edit-divider'));

    // Group 4: Lists
    const groupLists = this._createGroup([
      { action: 'ul', icon: 'list', title: 'Unordered List' },
      { action: 'ol', icon: 'list-ordered', title: 'Numbered List' },
      { action: 'tl', icon: 'check-square', title: 'Task List' }
    ]);
    toolbar.appendChild(groupLists);
    toolbar.appendChild(DesignSystem.createElement('div', 'edit-divider'));

    // Group 5: Advanced
    const groupAdvanced = this._createGroup([
      { action: 'c', icon: 'code', title: 'Inline Code' },
      { action: 'cb', icon: 'terminal', title: 'Code Block' },
      { action: 'tb', icon: 'table', title: 'Table' }
    ]);
    toolbar.appendChild(groupAdvanced);
    toolbar.appendChild(DesignSystem.createElement('div', 'edit-divider'));

    // Final Group: Actions
    const groupActions = DesignSystem.createElement('div', 'edit-button-group');
    const cancelBtn = DesignSystem.createButton({ label: 'Cancel', variant: 'ghost', onClick: () => this._handleCancel() });
    const saveBtn = DesignSystem.createButton({ label: 'Save', variant: 'primary-pill', onClick: () => this._save() });
    
    groupActions.appendChild(cancelBtn);
    groupActions.appendChild(saveBtn);
    toolbar.appendChild(groupActions);

    wrap.appendChild(toolbar);
    return wrap;
  }

  _createGroup(items) {
    const group = DesignSystem.createElement('div', 'edit-action-group');
    items.forEach(item => {
      const btn = DesignSystem.createElement('div', 'edit-tool-btn', { 
        title: item.title,
        'data-action': item.action || '',
        html: DesignSystem.getIcon(item.icon)
      });
      if (item.id) btn.id = item.id;
      if (item.onClick) {
        btn.onclick = item.onClick;
      } else {
        btn.onclick = () => {
          if (window.EditorModule) window.EditorModule.applyAction(item.action);
        };
      }
      group.appendChild(btn);
    });
    return group;
  }

  _switchTo(mode) {
    if (window.AppState && AppState.updateToolbarUI) {
      AppState.updateToolbarUI(mode);
    } else {
      const seg = document.querySelector(`.ds-segment-item[data-mode="${mode}"]`);
      if (seg) seg.click();
    }
  }

  async _save() {
    if (window.EditorModule) {
      const success = await window.EditorModule.save();
      if (success) this._switchTo('read');
    }
  }

  _handleCancel() {
    if (window.EditorModule) {
      window.EditorModule.revert();
    }
    this._switchTo('read');
  }

  update({ content }) {
    this.content = content;
    const textarea = this.mount.querySelector('#edit-textarea');
    if (textarea && textarea.value !== content) {
      // Syncing original content will update textarea.value AND preserve selection
      if (window.EditorModule) {
        window.EditorModule.setOriginalContent(content);
      } else {
        textarea.value = content;
      }
    }
  }

  destroy() {
    if (window.EditorModule) window.EditorModule.unbind();
  }
}

// Singleton Bridge
window.MarkdownViewer = (() => {
  let instance = null;
  return {
    init: (options) => {
      if (!instance) instance = new MarkdownViewerComponent(options);
      return instance;
    },
    getInstance: () => instance
  };
})();
