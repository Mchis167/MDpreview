/* global AppState, TOCComponent, EditToolbarComponent, EditorModule, MarkdownHelperComponent, MarkdownLogicService, ScrollModule, DesignSystem, FileService, DraftModule, WikiService, WikiDrawer, BacklinksDrawer, MonacoService, MonacoSyncService, SyncService */

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
    this._editImportBtn = null;
    this._editAppendBtn = null;
    this._publishBtn = null;
    this._floatingGroup = null;
    this._tocUpdateTimeout = null;
    this.init();
  }

  init() {
    if (!this.mount) return;
    this.render();
  }

  show() {
    if (this.mount) {
      this.mount.style.display = 'flex';
    }
  }

  hide() {
    if (this.mount) {
      this.mount.style.display = 'none';
    }
  }

  /**
   * Main update entry point
   * @param {Object} newState 
   */
  setState(newState) {
    const fileChanged = newState.file !== undefined && newState.file !== this.state.file;
    const modeChanged = newState.mode !== undefined && newState.mode !== this.state.mode;

    // 1. Save scroll position before switching file OR mode
    // FIX: Do NOT save if we are entering 'empty' mode (Home) as it will be hidden/already saved
    if ((fileChanged || modeChanged) && this.state.file && newState.mode !== 'empty' && ScrollModule) {
      ScrollModule.save(this.state.file);
    }

    const oldMode = this.state.mode;

    // GUARD: If file changed but content/html are NOT provided, 
    // we MUST reset them to prevent "ghost content" leaking from previous file.
    if (fileChanged) {
      if (newState.content === undefined) newState.content = '';
      if (newState.html === undefined) newState.html = '';
    }

    this.state = { ...this.state, ...newState };

    if (fileChanged) {
      this.render(oldMode);
    } else if (modeChanged) {
      if (newState.mode === 'edit' && oldMode === 'read') {
        this._captureSyncContext();
      }
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

  render(oldMode = null) {
    if (!this.mount) return;

    window._isMDViewerRendering = true;

    try {
      if (this.previewComp && this.previewComp.destroy) {
        try { this.previewComp.destroy(); } catch (_e) { }
      }
      if (this.editorComp && this.editorComp.destroy) {
        try { this.editorComp.destroy(); } catch (_e) { }
      }

      this.mount.innerHTML = '';
      this._tocBtn = null;
      this._comboBtn = null;
      this._editImportBtn = null;
      this._editAppendBtn = null;
      this._publishBtn = null;
      this._floatingGroup = null;
      this._scrollTopBtn = null;

      // Reset TOC internal state to clear old content and show skeleton
      if (TOCComponent) TOCComponent.reset();

      if (this.state.mode === 'empty') {
        this._handleModeSwitch(oldMode, 'empty');
        if (window.ScrollModule) {
          window.ScrollModule.setContainer(null, null);
        }
        new MarkdownEmptyState({ mount: this.mount });
        return;
      }

      this.viewport = DesignSystem.createElement('div', 'md-viewer-viewport');
      this.mount.appendChild(this.viewport);

      // Add context menu listener
      this.viewport.oncontextmenu = (e) => this._handleContextMenu(e);

      // Render both but they control their own initial visibility
      this.previewComp = new MarkdownPreview({
        mount: this.viewport,
        html: this.state.html,
        file: this.state.file,
        options: {
          onInternalLink: (path, anchor) => {
            if (typeof WikiDrawer !== 'undefined') WikiDrawer.open(path, anchor);
            else if (window.loadFile) window.loadFile(path);
          }
        }
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
      // ── NEW: Correctly register the scroll container for persistence ──
      if (window.ScrollModule) {
        window.ScrollModule.setContainer(this.getActiveScrollElement(), this.state.file);
      }

      setTimeout(() => {
        window._isMDViewerRendering = false;
      }, 300);
    }
  }

  _handleModeSwitch(oldMode, newMode) {
    if (!this.mount) return;

    if (this.viewport) {
      const previewEl = this.viewport.querySelector('#md-content');
      const editorEl = this.viewport.querySelector('#edit-viewer');

      if (newMode === 'edit') {
        if (previewEl) previewEl.style.display = 'none';
        if (editorEl) editorEl.style.display = 'flex';
        if (this.editorComp) this.editorComp.activate();
      } else {
        if (previewEl) previewEl.style.display = 'block';
        if (editorEl) editorEl.style.display = 'none';
        if (this.editorComp) this.editorComp.deactivate();
      }
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

    if ((oldMode === 'comment' || newMode === 'empty') && window.CommentsModule) window.CommentsModule.removeCommentMode();
    if ((oldMode === 'collect' || newMode === 'empty') && window.CollectModule) window.CollectModule.removeCollectMode();

    if (newMode === 'comment' && window.CommentsModule) window.CommentsModule.applyCommentMode();
    if (newMode === 'collect' && window.CollectModule) window.CollectModule.applyCollectMode();

    this._updateFloatingButtons();

    // ── SYNC SCROLL CONTAINER ──
    if (window.ScrollModule) {
      window.ScrollModule.setContainer(this.getActiveScrollElement(), this.state.file);
    }

    this._refreshScrollTopListener();
  }

  _updateFloatingButtons() {
    const mode = this.state.mode;
    if (!this._scrollTopBtn) this._renderFloatingScrollTop();

    // Ensure group exists
    if (!this._floatingGroup) {
      this._floatingGroup = DesignSystem.createElement('div', 'floating-action-group');
      this._floatingGroup.id = 'floating-action-group';
      this.mount.appendChild(this._floatingGroup);
    }

    const isReadGroup = ['read', 'comment', 'collect'].includes(mode);
    const isEditGroup = mode === 'edit';

    // Toggle visibility
    if (isReadGroup && !this._tocBtn) this._renderReadFloatingActions();
    if (this._tocBtn) this._tocBtn.style.display = isReadGroup ? 'flex' : 'none';
    if (this._backlinksBtn) this._backlinksBtn.style.display = isReadGroup ? 'flex' : 'none';
    if (this._comboBtn) this._comboBtn.style.display = isReadGroup ? 'flex' : 'none';
    if (this._publishBtn) this._publishBtn.style.display = isReadGroup ? 'flex' : 'none';

    if (isReadGroup) this._updatePublishButtonState();

    if (isEditGroup && !this._editImportBtn) this._renderEditFloatingActions();

    if (this._editImportBtn) this._editImportBtn.style.display = isEditGroup ? 'flex' : 'none';
    if (this._editAppendBtn) this._editAppendBtn.style.display = isEditGroup ? 'flex' : 'none';

    if (isReadGroup) {
      if (TOCComponent && TOCComponent.isVisible()) {
        TOCComponent.show(this.mount);
      }

      this.viewport.onscroll = () => {
        if (TOCComponent) TOCComponent.updateActiveHeading(this.viewport);
      };
    } else {
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
      return MonacoService.getScrollContainer();
    }
    return this.viewport;
  }

  /**
   * Captures the current visible context (line/selection) for Read -> Edit sync
   */
  _captureSyncContext() {
    if (window.SyncService) {
      window.AppState.lastSyncContext = SyncService.captureReadViewSyncData();
    }
  }

  /**
   * Create and manage the floating action group (TOC + Combo)
   */
  _renderReadFloatingActions() {
    if (!this._floatingGroup) return;

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

    // 1.5. Backlinks Button
    this._backlinksBtn = DesignSystem.createButton({
      variant: 'subtitle',
      offLabel: true,
      leadingIcon: 'waypoints',
      title: 'Backlinks',
      className: 'floating-backlinks-btn'
    });
    this._backlinksBtn.id = 'floating-backlinks-btn';

    this._backlinksBtn.onclick = (e) => {
      e.stopPropagation();
      if (typeof BacklinksDrawer !== 'undefined' && this.state.file) {
        BacklinksDrawer.toggle(this.state.file);
      }
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
            onClick: () => this._handleCopyAsFile()
          },
          {
            label: 'Copy for Google Docs',
            icon: 'file-text',
            onClick: () => this._handleGDocCopy()
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
    this._floatingGroup.appendChild(this._backlinksBtn);
    this._floatingGroup.appendChild(this._comboBtn);

    // 3. Publish Button State
    this._updatePublishButtonState();

    // Immediate initial sync
    this._updateTOC();
  }

  /**
   * Refreshes the publish button based on the file's current publication state
   */
  _updatePublishButtonState() {
    if (!this._floatingGroup) return;
    const file = this.state.file;
    const info = window.PublishService ? window.PublishService.getPublishInfo(file) : null;

    // Remove old button if it exists in DOM
    if (this._publishBtn && this._publishBtn.parentElement) {
      this._publishBtn.remove();
    }

    if (!info) {
      // Regular Button when not published
      this._publishBtn = DesignSystem.createButton({
        label: 'Publish',
        variant: 'subtitle',
        leadingIcon: 'globe',
        id: 'floating-publish-btn',
        tooltip: 'Publish to Web',
        onClick: (e) => {
          this._togglePublishConfig({ event: e, anchor: this._publishBtn });
        }
      });
    } else {
      // Published Combo Button (Re-publish / Unpublish)
      this._publishBtn = DesignSystem.createComboButton({
        label: 'Re-publish',
        variant: 'subtitle', // Light variant even when published
        leadingIcon: 'globe',
        id: 'floating-publish-btn',
        tooltip: `Last published: ${new Date(info.updatedAt).toLocaleDateString()}`,
        mainAction: (e) => {
          this._togglePublishConfig({ event: e, anchor: this._publishBtn });
        },
        toggleTooltip: 'Publication Options',
        toggleAction: () => {
          DesignSystem.createMenu(this._publishBtn, [
            {
              label: 'View Live Page',
              icon: 'external-link',
              onClick: () => window.open(info.url, '_blank')
            },
            {
              label: 'Copy Public Link',
              icon: 'link',
              onClick: () => {
                navigator.clipboard.writeText(info.url);
                if (window.showToast) window.showToast('Public link copied');
              }
            },
            { divider: true },
            {
              label: 'Unpublish (Local state)',
              icon: 'trash-2',
              danger: true,
              onClick: () => {
                DesignSystem.showConfirm({
                  title: 'Clear Publish State?',
                  message: 'This only removes the state from MDpreview. The page on the Worker will remain active unless deleted manually.',
                  onConfirm: async () => {
                    await window.PublishService.unpublish(file);
                    this._updatePublishButtonState();
                  }
                });
              }
            }
          ], { align: 'right' });
        }
      });
    }

    if (this._floatingGroup) {
      this._floatingGroup.appendChild(this._publishBtn);
      // Ensure visibility
      this._publishBtn.style.display = 'flex';
    }
  }

  /**
   * Toggles the Publish Configuration popover (no backdrop)
   */
  _togglePublishConfig(options = {}) {
    const { event, anchor } = options;
    if (window.PublishConfigComponent) {
      window.PublishConfigComponent.toggle({
        event,
        anchor,
        file: this.state.file,
        onPublished: (_url) => {
          this._updatePublishButtonState();
        }
      });
    }
  }


  // ── Context Menu & Actions ───────────────────────────────

  _handleContextMenu(e) {
    if (this.state.mode === 'edit') return;

    const items = [];
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    const hasSelection = selectedText.length > 0;

    // IMPORTANT: Capture selection data NOW while it still exists.
    // Clicking on context menu items often clears the selection.
    let capturedData = null;
    if (hasSelection) {
      capturedData = window.SyncService ? window.SyncService.captureReadViewSyncData() : null;
    }

    // 1. Selection Actions
    if (hasSelection && capturedData) {

      items.push({
        label: 'Add Comment',
        icon: 'message-circle-plus',
        onClick: () => {

          if (window.CommentsModule) {

            this._switchToMode('comment');
            // Wait for DOM to switch and module to activate
            setTimeout(() => {

              window.CommentsModule.externalTrigger(capturedData);
            }, 150);
          }
        }
      });
      items.push({
        label: 'Add to Collect',
        icon: 'bookmark',
        onClick: () => {

          if (window.CollectModule) {

            this._switchToMode('collect');
            window.CollectModule.addIdea(
              capturedData.selectedText,
              capturedData.lineStart,
              capturedData.lineEnd,
              capturedData.selectedText
            );
          }
        }
      });
      items.push({
        label: 'Edit Selection',
        icon: 'pen-line',
        onClick: () => {
          this._switchToMode('edit', capturedData);
        }
      });
      items.push({ divider: true });
    } else if (hasSelection) {
      items.push({
        label: 'Edit Selection',
        icon: 'pen-line',
        onClick: () => {
          this._switchToMode('edit', capturedData);
        }
      });
      items.push({ divider: true });
    }

    // 2. Advanced Copy
    items.push({
      label: 'Copy as Markdown',
      icon: 'copy',
      onClick: () => {
        if (this.state.content) {
          navigator.clipboard.writeText(this.state.content);
          if (window.showToast) window.showToast('Markdown copied');
        }
      }
    });

    items.push({
      label: 'Copy for Google Docs',
      icon: 'file-text',
      onClick: () => this._handleGDocCopy()
    });

    items.push({
      label: 'Copy as File',
      icon: 'file-plus',
      onClick: () => this._handleCopyAsFile()
    });

    // 3. Mode Specific
    if (this.state.mode === 'comment') {
      items.push({ divider: true });
      items.push({
        label: 'Copy Comments Report',
        icon: 'clipboard-list',
        onClick: () => window.CommentsModule && window.CommentsModule.copyAll()
      });
      items.push({
        label: 'Clear All Comments',
        icon: 'trash',
        danger: true,
        onClick: () => window.CommentsModule && window.CommentsModule.clear()
      });
    }

    if (this.state.mode === 'collect') {
      items.push({ divider: true });
      items.push({
        label: 'Copy All Ideas',
        icon: 'clipboard-list',
        onClick: () => window.CollectModule && window.CollectModule.copyAll()
      });
      items.push({
        label: 'Clear All Ideas',
        icon: 'trash',
        danger: true,
        onClick: () => window.CollectModule && window.CollectModule.clearAll()
      });
    }

    DesignSystem.createContextMenu(e, items);
  }

  _switchToMode(mode, context = null) {
    if (context && window.AppState) {
      AppState.forceSyncContext = context;
    }
    const btn = document.querySelector(`.ds-segment-item[data-id="${mode}"]`);
    if (btn) {
      btn.click();
    } else if (window.AppState && window.AppState.onModeChange) {
      window.AppState.onModeChange(mode);
    }
  }

  async _handleCopyAsFile() {
    if (!window.electronAPI) return;

    try {
      let res;
      const isDraft = this.state.file && this.state.file.startsWith('__DRAFT_');

      if (this.state.file && !isDraft) {
        // Case 1: Physical file on disk
        res = await window.electronAPI.copyFileToClipboard(this.state.file);
      } else if (this.state.content) {
        // Case 2: Draft/Generated content -> Copy as temp file
        const fileName = isDraft
          ? (window.DraftModule?.getDisplayName(this.state.file) || 'Draft').replace(/\s+/g, '_') + '.md'
          : (window.AppState && window.AppState.activeTabName)
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
      console.error('Copy as File failed:', err);
      if (window.showToast) window.showToast(`Copy failed: ${err.message}`, 'error');
    }
  }

  async _handleGDocCopy() {
    if (!this.state.html) return;

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
        // Fallback to simple clipboard
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([this.state.content || ''], { type: "text/plain" })
          })
        ]);
        if (window.showToast) window.showToast('Smart copy ready! (Browser)', 'success', { id: 'gdoc-copy' });
      }
    } catch (err) {
      console.error('GDoc copy failed:', err);
      if (window.showToast) window.showToast('Failed to prepare smart copy', 'error', { id: 'gdoc-copy' });
    }
  }

  _renderEditFloatingActions() {
    if (!this._floatingGroup) return;

    // 1. Import (Replace) Button
    this._editImportBtn = DesignSystem.createButton({
      variant: 'subtitle',
      offLabel: true,
      leadingIcon: 'file-text',
      title: 'Import (Replace all)',
      className: 'floating-import-btn'
    });

    this._editImportBtn.onclick = async (e) => {
      e.stopPropagation();
      const paths = await window.FileService.openFiles({
        properties: ['openFile'],
        filters: [{ name: 'Markdown', extensions: ['md'] }]
      });

      if (paths && paths[0]) {
        try {
          const res = await window.electronAPI.readFile(paths[0]);
          if (!res.success) throw new Error(res.error || 'Failed to read file');

          if (res.content !== undefined) {
            const isDirty = EditorModule.isDirty();
            if (isDirty) {
              DesignSystem.showConfirm({
                title: 'Overwrite Content?',
                message: 'Your current changes will be replaced. Continue?',
                onConfirm: () => {
                  EditorModule.insertContent(res.content, 'replace');
                  if (window.showToast) window.showToast('Content imported');
                }
              });
            } else {
              EditorModule.insertContent(res.content, 'replace');
              if (window.showToast) window.showToast('Content imported');
            }
          }
        } catch (err) {
          if (window.showToast) window.showToast(`Import failed: ${err.message}`, 'error');
        }
      }
    };

    // 2. Append Button
    this._editAppendBtn = DesignSystem.createButton({
      variant: 'subtitle',
      offLabel: true,
      leadingIcon: 'file-plus',
      title: 'Import (Append to end)',
      className: 'floating-append-btn'
    });

    this._editAppendBtn.onclick = async (e) => {
      e.stopPropagation();
      const paths = await window.FileService.openFiles({
        properties: ['openFile'],
        filters: [{ name: 'Markdown', extensions: ['md'] }]
      });

      if (paths && paths[0]) {
        try {
          const res = await window.electronAPI.readFile(paths[0]);
          if (!res.success) throw new Error(res.error || 'Failed to read file');

          if (res.content !== undefined) {
            EditorModule.insertContent(res.content, 'append');
            if (window.showToast) window.showToast('Content appended to end');
          }
        } catch (err) {
          if (window.showToast) window.showToast(`Append failed: ${err.message}`, 'error');
        }
      }
    };

    this._floatingGroup.appendChild(this._editImportBtn);
    this._floatingGroup.appendChild(this._editAppendBtn);
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

  // ── Public API for Shortcuts ─────────────────────────────

  copyMarkdown() {
    if (this.state.content) {
      navigator.clipboard.writeText(this.state.content);
      if (window.showToast) window.showToast('Full Markdown copied');
    }
  }

  copyAsFile() {
    this._handleCopyAsFile();
  }

  copyForGDocs() {
    this._handleGDocCopy();
  }

  toggleTOC() {
    if (TOCComponent) TOCComponent.toggle(this.mount);
  }

  toggleProjectMap() {
    if (TOCComponent) {
      if (!TOCComponent.isVisible()) {
        TOCComponent.show(this.mount);
        TOCComponent.switchView('map');
      } else {
        if (TOCComponent.getActiveView() === 'map') {
          TOCComponent.hide();
        } else {
          TOCComponent.switchView('map');
        }
      }
    }
  }

  async _toggleTask(lineNum, checked) {
    if (!this.state.file) return;

    const content = this.state.content || '';
    if (!content) return;

    const lines = content.split('\n');
    const lineIndex = lineNum - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) return;

    const line = lines[lineIndex];

    // Pattern to match common GFM task list prefixes (handles nesting with \s*)
    const taskRegex = /^(\s*[-*+] )\[[ xX]\]/;
    const match = line.match(taskRegex);

    if (match) {
      const prefix = match[1];
      const newMark = checked ? '[x]' : '[ ]';
      const newLine = line.replace(taskRegex, `${prefix}${newMark}`);

      lines[lineIndex] = newLine;
      const newContent = lines.join('\n');

      // 1. Update component state immediately (Preview will skip re-render if html is same)
      this.setState({ content: newContent });

      // 2. Keep Editor in sync
      if (typeof EditorModule !== 'undefined') {
        EditorModule.setOriginalContent(newContent);
      }

      // 3. Save based on file type
      let success = false;
      if (this.state.file.startsWith('__DRAFT_')) {
        if (typeof DraftModule !== 'undefined') {
          DraftModule.setDraftContent(newContent);
          await DraftModule.renderPreview(newContent, this.state.file);
          success = true;
        }
      } else if (typeof FileService !== 'undefined' && FileService.saveFile) {
        success = await FileService.saveFile(this.state.file, newContent);

        if (success) {
          // Fetch fresh HTML from server to ensure full sync (async)
          fetch('/api/render-raw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: newContent })
          })
            .then(res => res.json())
            .then(data => {
              if (data && data.html) {
                this.setState({ html: data.html });
              }
            })
            .catch(_err => { /* Fallback ignored, content is already saved */ });
        }
      }

      if (success && window.showToast) {
        window.showToast(checked ? 'Task marked as done' : 'Task unmarked', 'success', { duration: 1500 });
      }
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
  constructor({ mount, html, file, options = {} }) {
    this.mount = mount;
    this.html = html;
    this.file = file;
    this.options = options;
    this.render();
  }

  render() {
    const container = DesignSystem.createElement('div', 'md-content md-render-body', { id: 'md-content' });
    const inner = DesignSystem.createElement('div', 'md-content-inner');
    inner.innerHTML = this.html;

    container.appendChild(inner);
    this.mount.appendChild(container);

    // Post-render integration (Small delay to ensure DOM is ready for calculations)
    if (ScrollModule && !this.options.skipScroll) {
      ScrollModule.setContainer(this.mount, this.file);
      ScrollModule.restore(this.file);
    }

    // Mermaid and CodeBlocks still benefit from a frame delay for layout
    (async () => {
      await new Promise(resolve => requestAnimationFrame(resolve));
      try {
        if (window.processMermaid) await window.processMermaid(inner);
      } catch (_e) { /* Mermaid error - gracefully skip */ }
      try {
        if (window.CodeBlockModule) window.CodeBlockModule.process(inner);
      } catch (_e) { /* CodeBlock error - gracefully skip */ }


      // Bind checkbox events for task lists
      this._bindCheckboxEvents(inner);

      // Bind link interception
      this._bindLinkEvents(inner);

      // Inject DS icons into summaries
      this._processSummaries(inner);
    })();
  }

  _bindLinkEvents(container) {
    if (!container) return;

    // Use event delegation on the container
    container.addEventListener('click', (e) => {
      const anchor = e.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      // Ignore empty or placeholder links
      if (!href || href === '#') return;

      const classification = (typeof WikiService !== 'undefined')
        ? WikiService.classifyLink(href, this.file)
        : { type: 'unknown' };

      switch (classification.type) {
        case 'external':
          e.preventDefault();
          if (window.electronAPI && window.electronAPI.openExternal) {
            window.electronAPI.openExternal(classification.url);
          } else {
            window.open(classification.url, '_blank');
          }
          break;

        case 'anchor':
          // Let standard browser behavior handle anchors (scroll to ID)
          break;

        case 'internal':
          e.preventDefault();
          // Phase 3 Navigation: Use loadFile directly (Phase 4 will introduce WikiDrawer)
          if (classification.resolvedPath) {
            if (this.options.onInternalLink) {
              this.options.onInternalLink(classification.resolvedPath, classification.anchor);
            } else if (window.loadFile) {
              window.loadFile(classification.resolvedPath);
            } else {
              console.warn('[WikiReader] Navigation failed: loadFile global not found');
            }
          }
          break;

        case 'unknown':
          // If it looks like a markdown file but unknown to index, try loading it anyway
          if (href.toLowerCase().endsWith('.md')) {
            e.preventDefault();
            if (window.loadFile) window.loadFile(href);
          }
          break;
      }
    });
  }

  _processSummaries(container) {
    const summaries = container.querySelectorAll('summary');
    summaries.forEach(summary => {
      // Avoid double-processing
      if (summary.querySelector('.ds-summary-icon')) return;

      const iconHtml = DesignSystem.getIcon('chevron-right');
      const iconWrap = DesignSystem.createElement('span', 'ds-summary-icon', { html: iconHtml });
      summary.prepend(iconWrap);
    });
  }

  _bindCheckboxEvents(container) {
    if (!container) return;
    const checkboxes = container.querySelectorAll('.task-list-item input[type="checkbox"]');
    checkboxes.forEach(cb => {
      cb.onchange = async (e) => {
        const checked = e.target.checked;
        const lineEl = e.target.closest('.md-line');
        if (!lineEl) return;

        const lineNum = parseInt(lineEl.dataset.line, 10);
        if (isNaN(lineNum)) return;

        const viewer = window.MarkdownViewer && window.MarkdownViewer.getInstance();
        if (viewer && viewer._toggleTask) {
          await viewer._toggleTask(lineNum, checked);
        }
      };
    });
  }

  update({ html }) {
    if (this.html === html) return;
    this.html = html;
    const inner = this.mount.querySelector('.md-content-inner');
    if (inner) {
      inner.innerHTML = html;

      // Re-process for live updates (e.g. Drafts)
      if (window.processMermaid) {
        window.processMermaid(inner).catch(_e => { /* Mermaid error - gracefully skip */ });
      }
      if (window.CodeBlockModule) window.CodeBlockModule.process(inner);

      // Re-bind checkbox events
      this._bindCheckboxEvents(inner);

      // Re-bind link events
      this._bindLinkEvents(inner);

      // Re-inject DS icons
      this._processSummaries(inner);

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
    const monacoEl = DesignSystem.createElement('div', '', { id: 'monaco-editor-container' });

    container.appendChild(monacoEl);
    this.mount.appendChild(container);

    // Initial mount to MonacoService
    this._mountPromise = MonacoService.mount(monacoEl, {
      value: this.content,
      language: 'markdown'
    });

    // Sync _originalContent after mount regardless of mode (edit or read).
    // Without this, opening a file in 'read' mode leaves _originalContent pointing
    // at the previous file/draft, causing isDirty() false-positives and modal loops.
    this._mountPromise.then(() => {
      if (!this._destroyed && typeof EditorModule !== 'undefined') {
        EditorModule.setOriginalContent(this.content || '');
      }
    });
  }

  activate() {
    // ── Async Activation Flow ──
    // We must wait for mount to finish before binding EditorModule or syncing cursor.
    const run = async () => {
      if (this._mountPromise) await this._mountPromise;

      // Guard: abort if this instance was destroyed while awaiting mount
      if (this._destroyed) return;

      // Initialize Editor Logic
      if (EditorModule) {
        EditorModule.bind();

        // Final catch-up: ensure the latest content is pushed after bind
        if (this.content !== undefined) {
          EditorModule.setOriginalContent(this.content);
        }
      }

      if (this._destroyed) return;

      MonacoService.layout();

      // Tell ScrollModule to watch the editor
      if (ScrollModule) {
        const scrollEl = MonacoService.getScrollContainer();
        ScrollModule.setContainer(scrollEl, this.file);
        ScrollModule.restore(this.file);
      }

      // Restore cursor if context exists in AppState
      const ctx = window.AppState && window.AppState.lastSyncContext;
      if (ctx && (ctx.line || ctx.scrollPct)) {
        if (typeof MonacoSyncService !== 'undefined') {
          MonacoSyncService.syncCursor(MonacoService, ctx);
        } else if (typeof MarkdownLogicService !== 'undefined') {
          MarkdownLogicService.syncCursor(MonacoService, ctx);
        }
        window.AppState.lastSyncContext = null;
      }

      // Ensure focus after all async mounting and binding is done.
      // Use rAF to give Monaco's global state 1 layout frame to settle after the
      // dispose→create cycle. Without this, empty drafts (no model.setValue() call
      // to warm up TextAreaHandler) end up with Monaco's internal _focused=true but
      // TextAreaState un-synced — onKeyDown fires but onDidChangeContent stays silent.
      if (!this._destroyed) {
        requestAnimationFrame(() => {
          if (!this._destroyed && MonacoService.isInitialized()) {
            // layout() forces Monaco to recalculate its full view (incl. TextAreaHandler sync)
            // before focus — fixes typing block on empty drafts after dispose→create cycle.
            MonacoService.layout();
            // Blur textarea first to force a real focus event on re-focus.
            // After dispose→create cycle Monaco may have auto-focused the new textarea,
            // making a plain focus() call a no-op (no event → TextAreaHandler never syncs).
            const _domNode = MonacoService.getInstance()?.getDomNode();
            const _textarea = _domNode?.querySelector('textarea');
            if (_textarea) _textarea.blur();
            MonacoService.focus();
          }
        });
      }
    };

    run();
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

    // Always sync target content to EditorModule even if not initialized yet.
    // EditorModule.setOriginalContent will handle the 'pending' state.
    if (EditorModule) {
      EditorModule.setOriginalContent(content);
    } else if (MonacoService.isInitialized()) {
      MonacoService.setValue(content);
    }
  }

  destroy() {
    this._destroyed = true;
    if (EditorModule) EditorModule.unbind();
    MonacoService.dispose();
  }
}

// Explicit exports for reuse
window.MarkdownEmptyState = MarkdownEmptyState;
window.MarkdownPreview = MarkdownPreview;

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
