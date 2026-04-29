/* global AppState, TOCComponent, EditToolbarComponent, EditorModule, MarkdownHelperComponent, MarkdownLogicService, ScrollModule, DesignSystem */

class MarkdownViewerComponent {
  constructor(options = {}) {
    this.mount = options.mount || document.getElementById('md-viewer-mount');
    this.state = {
      mode: 'empty', // 'empty', 'read', 'edit'
      file: null,
      content: '',
      html: ''
    };
    this.previewComp = null;
    this.editorComp = null;
    this.viewport = null;
    this._scrollTopBtn = null;
    this._tocBtn = null;
    this._comboBtn = null;
    this._floatingGroup = null;
    this._tocUpdateTimeout = null;
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
    if ((fileChanged || modeChanged) && this.state.file && ScrollModule) {
      ScrollModule.save(this.state.file);
    }
    
    const oldMode = this.state.mode;
    this.state = { ...this.state, ...newState };

    if (fileChanged) {
      this.render();
    } else if (modeChanged) {
      this._handleModeSwitch(oldMode, newState.mode);
      // Ensure hidden components are updated with latest state even on mode switch
      if (this.previewComp) this.previewComp.update(this.state);
      if (this.editorComp) this.editorComp.update(this.state);
    } else if (this.state.mode === 'edit' && this.editorComp) {
      this.editorComp.update(this.state);
    } else if (this.previewComp) {
      this.previewComp.update(this.state);
    }

    // Update TOC with debounce
    this._updateTOC();
  }

  render() {
    if (!this.mount) return;
    
    window._isMDViewerRendering = true;
    
    try {
      if (this.previewComp && this.previewComp.destroy) this.previewComp.destroy();
      if (this.editorComp && this.editorComp.destroy) this.editorComp.destroy();
      
      this.mount.innerHTML = '';
      this._tocBtn = null;
      this._comboBtn = null;
      this._floatingGroup = null;
      this._scrollTopBtn = null;
      
      // Reset TOC internal state to clear old content and show skeleton
      if (TOCComponent) TOCComponent.reset();
      
      if (this.state.mode === 'empty') {
        new MarkdownEmptyState({ mount: this.mount });
        return;
      }

      this.viewport = DesignSystem.createElement('div', 'md-viewer-viewport');
      this.mount.appendChild(this.viewport);

      // Render both but they control their own initial visibility
      this.previewComp = new MarkdownPreview({ 
        mount: this.viewport, 
        html: this.state.html,
        file: this.state.file
      });

      this.editorComp = new MarkdownEditor({ 
        mount: this.viewport, 
        content: this.state.content,
        file: this.state.file
      });

      this._handleModeSwitch(null, this.state.mode);

    } catch (_err) {
      // Error handled during individual component renders
    } finally {
      setTimeout(() => {
        window._isMDViewerRendering = false;
      }, 300);
    }
  }

  _handleModeSwitch(oldMode, newMode) {
    if (!this.mount || !this.viewport) return;

    this.mount.setAttribute('data-mode', newMode);

    const previewEl = this.viewport.querySelector('#md-content');
    const editorEl = this.viewport.querySelector('#edit-viewer');

    if (newMode === 'edit') {
      if (previewEl) previewEl.style.display = 'none';
      if (editorEl) editorEl.style.display = 'flex';
      if (this.editorComp) this.editorComp.activate();
    } else {
      if (previewEl) previewEl.style.display = 'flex';
      if (editorEl) editorEl.style.display = 'none';
      if (this.editorComp) this.editorComp.deactivate();
    }

    if (EditToolbarComponent) {
      const toolbar = EditToolbarComponent.getInstance();
      if (newMode === 'edit') {
        toolbar.show({
          onAction: (action) => EditorModule && EditorModule.applyAction(action),
          onSave: () => this.editorComp && this.editorComp._save(),
          onCancel: () => this.editorComp && this.editorComp._handleCancel(),
          onHelp: () => MarkdownHelperComponent && MarkdownHelperComponent.open()
        });
      } else {
        toolbar.hide();
      }
    }

    if (oldMode === 'comment' && window.CommentsModule) window.CommentsModule.removeCommentMode();
    if (oldMode === 'collect' && window.CollectModule) window.CollectModule.removeCollectMode();

    if (newMode === 'comment' && window.CommentsModule) window.CommentsModule.applyCommentMode();
    if (newMode === 'collect' && window.CollectModule) window.CollectModule.applyCollectMode();

    this._updateFloatingButtons();
    this._refreshScrollTopListener();
  }

  _updateFloatingButtons() {
    const mode = this.state.mode;
    if (!this._scrollTopBtn) this._renderFloatingScrollTop();
    
    if (mode === 'read' || mode === 'comment' || mode === 'collect') {
      if (!this._floatingGroup) this._renderFloatingActions();
      
      if (this._floatingGroup && !this.mount.contains(this._floatingGroup)) {
        this.mount.appendChild(this._floatingGroup);
      }

      if (this._floatingGroup) {
        this._floatingGroup.style.display = 'flex';
      }
      
      if (TOCComponent && TOCComponent.isVisible()) {
        TOCComponent.show(this.mount);
      }
      
      this.viewport.onscroll = () => {
        if (TOCComponent) TOCComponent.updateActiveHeading(this.viewport);
      };
    } else {
      if (this._floatingGroup) this._floatingGroup.style.display = 'none';
      
      if (TOCComponent) {
        TOCComponent.hide();
        this.mount.classList.remove('has-toc');
      }
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
      const scrollEl = this.getActiveScrollElement();
      if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
    };

    this.mount.prepend(this._scrollTopBtn);
    this._refreshScrollTopListener();
  }

  /**
   * Refreshes the scroll listener on the currently active container
   */
  _refreshScrollTopListener() {
    if (!this._scrollTopBtn) return;

    const scrollEl = this.getActiveScrollElement();
    if (!scrollEl) return;

    // Remove old listener if exists (via replacement of node or tracking)
    if (this._currentScrollEl === scrollEl) return;
    
    this._currentScrollEl = scrollEl;
    scrollEl.addEventListener('scroll', () => {
      if (scrollEl.scrollTop > 300) {
        this._scrollTopBtn.classList.add('is-visible');
      } else {
        this._scrollTopBtn.classList.remove('is-visible');
      }
    });
  }

  /**
   * Returns the currently active scrollable element
   */
  getActiveScrollElement() {
    if (this.state.mode === 'edit') {
      return this.mount.querySelector('#edit-textarea');
    }
    return this.viewport;
  }

  /**
   * Create and manage the floating action group (TOC + Combo)
   */
  _renderFloatingActions() {
    this._floatingGroup = DesignSystem.createElement('div', 'floating-action-group');
    this._floatingGroup.id = 'floating-action-group'; 

    // 1. TOC Button
    this._tocBtn = DesignSystem.createButton({
      variant: 'subtitle',
      offLabel: true,
      leadingIcon: 'list',
      title: 'Table of Contents',
      className: 'floating-toc-btn'
    });
    this._tocBtn.id = 'floating-toc-btn';

    this._tocBtn.onclick = (e) => {
      e.stopPropagation();
      if (TOCComponent) TOCComponent.toggle(this.mount);
    };

    // 2. Combo Button (Smart Copy & Drag)
    this._comboBtn = DesignSystem.createComboButton({
      label: 'Copy',
      variant: 'subtitle',
      leadingIcon: 'copy',
      className: 'floating-combo-btn',
      tooltip: 'Copy Markdown',
      mainAction: () => {
        if (this.state.content) {
          navigator.clipboard.writeText(this.state.content);
          if (window.showToast) window.showToast('Markdown copied to clipboard');
        }
      },
      toggleTooltip: 'Advanced Copy',
      toggleAction: () => {
        DesignSystem.createMenu(this._comboBtn, [
          { 
            label: 'Copy as File', 
            icon: 'file-plus', 
            onClick: async () => {
              if (!window.electronAPI) return;

              try {
                let res;
                if (this.state.file) {
                  // Case 1: Physical file on disk
                  res = await window.electronAPI.copyFileToClipboard(this.state.file);
                } else if (this.state.content) {
                  // Case 2: Draft/Generated content -> Copy as temp file
                  const fileName = (window.AppState && window.AppState.activeTabName) 
                    ? `${window.AppState.activeTabName}.md` 
                    : 'Untitled.md';
                  
                  // Convert string to Uint8Array for the buffer
                  const buffer = new TextEncoder().encode(this.state.content);
                  res = await window.electronAPI.copyFileFromBuffer(buffer, fileName);
                }

                if (res && res.success) {
                  if (window.showToast) window.showToast('File copied to clipboard');
                } else if (res) {
                  throw new Error(res.error);
                }
              } catch (err) {
                console.error('[DEBUG] Copy as File failed:', err);
                if (window.showToast) window.showToast(`Copy failed: ${err.message}`, 'error');
              }
            }
          },
          { 
            label: 'Copy for Google Docs', 
            icon: 'file-text', 
            onClick: async () => {
              if (this.state.html) {
                if (window.showToast) {
                  window.showToast('Preparing smart copy...', 'info', { id: 'gdoc-copy', sticky: true, progress: 0 });
                }
                
                try {
                   const previewInner = this.viewport.querySelector('.md-content-inner');
                   const sourceHtml = previewInner ? previewInner.innerHTML : this.state.html;

                   const result = await window.GDocUtil.transform(sourceHtml, this.mount);
                   const transformedHtml = result.html;
                   
                   const html = `<div style="font-family: sans-serif; color: #24292e;">${transformedHtml}</div>`;
                   
                   if (window.electronAPI && typeof window.electronAPI.writeClipboardAdvanced === 'function') {
                     const res = await window.electronAPI.writeClipboardAdvanced({
                       html: html,
                       text: this.state.content || ''
                     });
                     if (res.success) {
                       if (window.showToast) {
                         const msg = result.totalCount > 0 
                           ? `Smart copy ready! (${result.successCount}/${result.totalCount} charts)`
                           : 'Smart copy for GDocs ready!';
                         const type = result.failCount > 0 ? 'warn' : 'success';
                         window.showToast(msg, type, { id: 'gdoc-copy' });
                       }
                     } else {
                       throw new Error(res.error);
                     }
                   } else {
                     const blob = new Blob([html], { type: 'text/html' });
                     const textBlob = new Blob([this.state.content || ''], { type: 'text/plain' });
                     const item = new window.ClipboardItem({
                       'text/html': blob,
                       'text/plain': textBlob
                     });
                     await navigator.clipboard.write([item]);
                     if (window.showToast) window.showToast('Smart copy for GDocs ready!', 'success', { id: 'gdoc-copy' });
                   }
                } catch (err) {
                  console.error('[DEBUG] GDoc Smart copy failed:', err);
                  navigator.clipboard.writeText(this.state.content);
                  if (window.showToast) window.showToast('Markdown copied (Smart Copy failed)', 'error', { id: 'gdoc-copy' });
                }
              }
            }
          },
          { divider: true },
          { 
            label: 'Copy File Path', 
            icon: 'link', 
            onClick: () => {
              if (this.state.file) {
                navigator.clipboard.writeText(this.state.file);
                if (window.showToast) window.showToast('File path copied');
              }
            }
          }
        ], { align: 'right' });
      }
    });

    // ── Drag to Export ──
    const leadingIcon = this._comboBtn.querySelector('.ds-btn-icon-leading');
    if (leadingIcon) {
      leadingIcon.setAttribute('draggable', 'true');
      leadingIcon.style.cursor = 'grab';
      leadingIcon.title = 'Drag to export file';
      leadingIcon.ondragstart = (e) => {
        if (window.electronAPI && this.state.file) {
          const isElectron = !!window.electronAPI.isElectron;
          const hasDragFunc = typeof window.electronAPI.startFileDrag === 'function';

          if (isElectron) {
            // Electron native drag logic
            if (!hasDragFunc) {
              e.preventDefault();
              if (window.showToast) window.showToast('Please restart the app to enable Drag & Drop', 'error');
              return;
            }
            e.preventDefault();
            window.electronAPI.startFileDrag(this.state.file);
          } else if (hasDragFunc) {
            // Browser fallback: Use the DownloadURL trick (don't preventDefault)
            window.electronAPI.startFileDrag(this.state.file, e);
          }
        }
      };
    }

    this._floatingGroup.appendChild(this._tocBtn);
    this._floatingGroup.appendChild(this._comboBtn);

    this.mount.appendChild(this._floatingGroup);
    
    // Immediate initial sync
    this._updateTOC();
  }

  _updateTOC() {
    if (this._tocUpdateTimeout) clearTimeout(this._tocUpdateTimeout);
    
    // Only update TOC in non-edit modes
    if (this.state.mode === 'edit') return;

    this._tocUpdateTimeout = setTimeout(() => {
      if (TOCComponent && this.viewport) {
        const isSkeleton = !!(this.state.html && this.state.html.includes('skeleton-text'));
        const input = this.viewport.querySelector('.md-render-body') || this.viewport;
          
        TOCComponent.update(input, { 
          mode: this.state.mode, 
          isSkeleton: isSkeleton 
        });
      }
      this._tocUpdateTimeout = null;
    }, 800);
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
    if (ScrollModule) {
      ScrollModule.setContainer(this.mount, this.file);
      ScrollModule.restore(this.file);
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
      if (ScrollModule) {
        ScrollModule.restore(this.file);
      }

      // Sync TOC on live update
      const viewer = MarkdownViewer.getInstance();
      if (viewer && viewer._updateTOC) viewer._updateTOC();
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
    
    container.appendChild(textarea);
    this.mount.appendChild(container);
  }

  activate() {
    const textarea = this.mount.querySelector('#edit-textarea');
    if (textarea) {
      // Initialize Editor Logic
      if (EditorModule) {
        EditorModule.bindToElement(textarea);
      }

      // Tell ScrollModule to watch the textarea
      if (ScrollModule) {
        ScrollModule.setContainer(textarea, this.file);
        ScrollModule.restore(this.file);
      }

      // Restore cursor if context exists in AppState
      const ctx = window.AppState && window.AppState.lastSyncContext;
      if (ctx && (ctx.line || ctx.scrollPct) && MarkdownLogicService) {
        MarkdownLogicService.syncCursor(textarea, ctx);
        window.AppState.lastSyncContext = null;
      }
    }
  }

  deactivate() {
    if (EditorModule) {
      EditorModule.unbind();
    }
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
    if (EditorModule) {
      const success = await EditorModule.save();
      if (success) this._switchTo('read');
    }
  }

  _handleCancel() {
    if (EditorModule) {
      EditorModule.revert();
    }
    this._switchTo('read');
  }

  update({ content }) {
    this.content = content;
    const textarea = this.mount.querySelector('#edit-textarea');
    if (textarea && textarea.value !== content) {
      // Syncing original content will update textarea.value AND preserve selection
      if (EditorModule) {
        EditorModule.setOriginalContent(content);
      } else {
        textarea.value = content;
      }
    }
  }

  destroy() {
    if (EditorModule) EditorModule.unbind();
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
