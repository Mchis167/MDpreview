/**
 * PreviewService
 * Manages the state and communication with the Live Preview Window.
 */
(function() {
  let isOpen = false;
  let updateTimer = null;
  const UPDATE_DEBOUNCE = 20; // Near-instant feedback (60fps is ~16ms)
  let lastRequestId = 0;
  let isUpdating = false; // Track if a content update is in flight

  const PreviewService = {
    init() {
      // Electron Listeners
      if (window.electronAPI?.isElectron) {
        window.electronAPI.onPreviewClosed(() => {
          isOpen = false;
        });

        window.electronAPI.onPreviewReady(() => {
          console.log('[PreviewService] Handshake RECEIVED: Window is ready (Electron)');
          isOpen = true;
          this.triggerUpdate(true);
          this.syncTheme();
        });
      }

      // Web Fallback Handshake (Always register)
      window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'preview-ready') {
          console.log('[PreviewService] Handshake RECEIVED: Window is ready (Web)');
          isOpen = true;
          this.webWindow = event.source; // Restore the window reference
          this.triggerUpdate(true);
          this.syncTheme();
        }
      });
    },

    async open() {
      console.log('[PreviewService] Opening preview window...');
      if (!window.electronAPI?.isElectron) {
        // Web Fallback: Open in new tab/window
        const url = 'preview.html';
        this.webWindow = window.open(url, 'MDPreviewLive', 'width=900,height=800');
        isOpen = true;
        
        // Wait for window to load before first update
        if (this.webWindow) {
          this.webWindow.onload = () => this.triggerUpdate(true);
        }
        this.triggerUpdate(true);
        return;
      }
      
      const port = window.location.port || (window.location.protocol === 'https:' ? 443 : 80);
      await window.electronAPI.openPreview({ port });
      isOpen = true;

      // Force an immediate update
      this.triggerUpdate(true);
      this.syncTheme();
    },

    close() {
      console.log('[PreviewService] Closing preview window...');
      if (!window.electronAPI?.isElectron) {
        if (this.webWindow) this.webWindow.close();
        isOpen = false;
        return;
      }
      window.electronAPI.closePreview();
      isOpen = false;
    },

    getIsOpen() {
      return isOpen || (this.webWindow && !this.webWindow.closed);
    },

    /**
     * Synchronizes the current theme settings with the preview window
     */
    syncTheme() {
      const activeIsOpen = this.getIsOpen();
      if (!activeIsOpen) return;

      const settings = window.AppState?.settings;
      if (!settings) return;

      console.log('[PreviewService] Syncing theme settings...');
      const themeData = {
        accentColor: settings.accentColor,
        bgEnabled: settings.bgEnabled,
        bgImage: settings.bgImage,
        fontText: settings.fontText,
        fontCode: settings.fontCode
      };

      if (window.electronAPI?.isElectron) {
        window.electronAPI.updateTheme(themeData);
      } else if (this.webWindow) {
        this.webWindow.postMessage({ type: 'theme-update', settings: themeData }, window.location.origin);
      }
    },

    /**
     * Triggers a preview update with the latest HTML content
     * @param {boolean} immediate - If true, bypasses debounce
     */
    triggerUpdate(immediate = false) {
      const activeIsOpen = this.getIsOpen();
      if (!activeIsOpen) return;

      if (updateTimer) clearTimeout(updateTimer);

      const doUpdate = async () => {
        isUpdating = true;
        try {
          // Source 1: EditorModule (for live typing)
          let content = window.EditorModule?.getContent?.();
          let file = window.EditorModule?.getCurrentFileName?.() || 'Untitled';
          let html = null;

          // Source 2: MarkdownViewer Instance (for Tab switching / Read mode)
          if (!content && window.MarkdownViewer) {
            const viewer = window.MarkdownViewer.getInstance();
            if (viewer && viewer.state) {
              content = viewer.state.content;
              html = viewer.state.html;
              file = viewer.state.file?.split(/[/\\]/).pop() || file;
            }
          }

          // Source 3: AppState fallback
          if (!file && window.AppState?.currentFile) {
             file = window.AppState.currentFile.split(/[/\\]/).pop();
          }

          if (content === undefined && !html) {
            console.warn('[PreviewService] No content found to update preview');
            return;
          }

          console.log('[PreviewService] Updating preview for:', file);
          const currentRequestId = ++lastRequestId;

          // If we already have HTML (from Tab switch), use it directly
          if (html && currentRequestId === lastRequestId) {
             this.updateContent(html, file);
             return;
          }

          // Otherwise, fetch fresh render from server
          const res = await fetch('/api/render-raw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
          });

          if (res.ok && currentRequestId === lastRequestId) {
            const data = await res.json();
            const payload = { type: 'preview-update', html: data.html, file };

            if (window.electronAPI?.isElectron) {
              window.electronAPI.updatePreview({ html: data.html, file });
            } else if (this.webWindow) {
              this.webWindow.postMessage(payload, window.location.origin);
            }
          }
        } catch (err) {
          console.error('[PreviewService] Render failed:', err);
        } finally {
          isUpdating = false;
        }
      };

      if (immediate) {
        doUpdate();
      } else {
        updateTimer = setTimeout(doUpdate, UPDATE_DEBOUNCE);
      }
    },

    /**
     * Directly updates the preview with provided HTML (no re-render needed)
     */
    updateContent(html, file) {
      const activeIsOpen = this.getIsOpen();
      if (!activeIsOpen || !html) return;

      const fileName = file ? file.split(/[/\\]/).pop() : 'Untitled';
      
      if (window.electronAPI?.isElectron) {
        window.electronAPI.updatePreview({ html, file: fileName });
      } else if (this.webWindow) {
        this.webWindow.postMessage({ type: 'preview-update', html, file: fileName }, window.location.origin);
      }
    },

    /**
     * Sends scroll position to the preview window
     * Defers sending if a content update is in flight to avoid scroll race conditions
     */
    sendScroll(scrollPct, line) {
      const activeIsOpen = this.getIsOpen();
      if (!activeIsOpen || isUpdating) {
        if (isUpdating) {
          console.log('[PreviewService] Deferring scroll (content update in flight)');
        }
        return;
      }

      console.log('[PreviewService] Sending scroll:', scrollPct);
      if (window.electronAPI?.isElectron) {
        window.electronAPI.scrollPreview({ scrollPct, line });
      } else if (this.webWindow) {
        this.webWindow.postMessage({ type: 'preview-scroll', scrollPct, line }, window.location.origin);
      }
    }
  };

  window.PreviewService = PreviewService;
})();
