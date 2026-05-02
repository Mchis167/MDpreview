/**
 * PublishService
 * Purpose: Central API for document publishing to external services
 * Architecture: Uses PublishOrchestrator + adapters (Worker, Legacy Handoff)
 * Dependencies: PublishOrchestrator, DesignTokenProvider, PublishUtils
 */
const PublishService = (() => {
  'use strict';

  const LOG_TAG = '[PublishService]';

  // ============================================
  // Private Functions
  // ============================================

  /**
   * Create standalone HTML bundle with design tokens injected
   * Replaces deprecated _bundleStyles() with token provider
   */
  function _createStandaloneBundle(html, title) {
    const fileName = PublishUtils.escapeHtml(title || 'MDpreview Document');
    const tokenStyles = DesignTokenProvider.generateInlineStyles();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileName}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
${tokenStyles}
        }

        body {
            margin: 0;
            padding: 0;
            background: var(--ds-bg-base);
            color: var(--ds-text-secondary);
            font-family: var(--ds-font-family-text);
            line-height: 1.8;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
        }

        .md-publish-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 60px 24px;
        }

        .md-render-body { font-size: var(--ds-font-lg); }

        /* ── Parity Overrides ── */
        .md-viewer-viewport { background: transparent !important; height: auto !important; }
        .md-content-inner { padding: 0 !important; }
        .md-block { margin-bottom: 0.5rem; }
        .md-line { width: 100%; }

        .md-render-body hr {
            border: none;
            border-bottom: 1px solid var(--ds-border-default);
            margin: 3rem 0;
        }

        .premium-code-block, .md-table-wrapper, .mermaid {
            background: transparent !important;
            backdrop-filter: blur(40px) !important;
            -webkit-backdrop-filter: blur(40px) !important;
            border: 1px solid var(--ds-white-a08) !important;
            border-radius: var(--ds-radius-panel) !important;
            margin: 2rem 0 !important;
            overflow: hidden !important;
        }

        .md-table-wrapper { background: transparent !important; }

        .mermaid path, .mermaid rect, .mermaid circle, .mermaid polygon {
            stroke: var(--ds-white-a20) !important;
        }

        .mermaid text, .mermaid span, .mermaid .label {
            fill: #fff !important;
            color: #fff !important;
        }

        .code-block-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 16px;
            background: var(--ds-black-a30);
            border-bottom: 1px solid var(--ds-white-a10);
        }

        .code-block-lang {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: var(--ds-text-secondary);
            font-family: var(--ds-font-family-code);
        }
    </style>
</head>
<body class="ds-theme-dark">
    <div class="md-publish-container">
        <div id="md-content" class="md-content md-render-body">
            <div class="md-content-inner">
                ${html}
            </div>
        </div>
    </div>
    <footer style="text-align: center; padding: 60px; color: #666; font-size: 12px; font-family: sans-serif;">
        Generated with <a href="https://github.com/Mchis167/MDpreview" style="color: #888; text-decoration: none;">MDpreview</a>
    </footer>
</body>
</html>`;
  }

  /**
   * Log message with tag
   */
  function _log(level, message) {
    const timestamp = new Date().toISOString().substring(11, 19);
    const prefix = `[${timestamp}] ${LOG_TAG}`;
    const method = { debug: 'debug', info: 'log', warn: 'warn', error: 'error' }[level] || 'log';
    console[method](prefix, message);
  }

  // ============================================
  // Public API (with backwards compatibility)
  // ============================================
  return {
    /**
     * Returns publication info for a specific file
     */
    getPublishInfo(filePath) {
      if (!filePath || !window.AppState?.settings?.publishData) return null;
      return window.AppState.settings.publishData[filePath] || null;
    },

    /**
     * Check if a slug is available
     * Delegates to PublishOrchestrator with fallback
     */
    async checkSlugAvailability(slug) {
      try {
        return await PublishOrchestrator.checkSlugAvailability(slug, window.AppState?.settings);
      } catch (error) {
        _log('warn', `Slug check failed: ${error.message}. Assuming available.`);
        return true;
      }
    },

    /**
     * Save publication info for a file
     */
    savePublishInfo(filePath, info) {
      if (!filePath) return;
      const data = window.AppState.settings?.publishData || {};
      data[filePath] = {
        ...info,
        updatedAt: new Date().toISOString()
      };
      window.SettingsService?.update('publishData', data);
    },

    /**
     * List all published documents
     */
    async listAllPublished() {
      try {
        return await PublishOrchestrator.listPublished(window.AppState?.settings);
      } catch (error) {
        _log('warn', `List published failed: ${error.message}`);
        return [];
      }
    },

    /**
     * Rename a published slug and update local state
     */
    async renameSlug(oldSlug, newSlug) {
      try {
        const result = await PublishOrchestrator.renameSlug(oldSlug, newSlug, window.AppState?.settings);

        // Update local publish info
        const data = window.AppState.settings?.publishData || {};
        let changed = false;
        Object.keys(data).forEach(filePath => {
          if (data[filePath].slug === oldSlug) {
            data[filePath].slug = newSlug;
            changed = true;
          }
        });
        if (changed) {
          window.SettingsService?.update('publishData', data);
        }

        return result;
      } catch (error) {
        _log('error', `Rename failed: ${error.message}`);
        return false;
      }
    },

    /**
     * Delete a published slug
     */
    async deleteSlug(slug) {
      try {
        await PublishOrchestrator.unpublish(slug, null, window.AppState?.settings);
        return true;
      } catch (error) {
        _log('error', `Delete failed: ${error.message}`);
        return false;
      }
    },

    /**
     * Unpublish a document (remove from service and local state)
     */
    async unpublish(filePath) {
      if (!filePath) return;

      const info = this.getPublishInfo(filePath);
      if (!info?.slug) {
        _log('warn', `No publication info for: ${filePath}`);
      } else {
        try {
          await PublishOrchestrator.unpublish(info.slug, filePath, window.AppState?.settings);
          _log('info', `Unpublished: ${filePath}`);
        } catch (error) {
          _log('error', `Unpublish failed: ${error.message}`);
          if (window.showToast) {
            window.showToast(
              `Error unpublishing: ${PublishingErrorTypes.formatErrorMessage(error)}`,
              'error'
            );
          }
        }
      }

      // Remove local publication info
      const data = window.AppState.settings?.publishData || {};
      delete data[filePath];
      window.SettingsService?.update('publishData', data);

      if (window.showToast) {
        window.showToast('Document unpublished', 'info');
      }
    },

    /**
     * Publish the current document
     * @param {Object} options - {slug, password}
     */
    async publish(options = {}) {
      const { currentFile, settings } = window.AppState;
      if (!currentFile) {
        _log('error', 'No current file to publish');
        return null;
      }

      // Check if publishing is configured
      if (!PublishOrchestrator.isConfigured(settings)) {
        if (window.showToast) {
          window.showToast('Please configure Publishing settings first', 'error');
        }
        return null;
      }

      // Get viewer and content
      const viewer = window.MarkdownViewer?.getInstance();
      if (!viewer) {
        _log('error', 'Markdown viewer not available');
        return null;
      }

      let content = '';
      try {
        if (currentFile.startsWith('__DRAFT_')) {
          if (typeof window.DraftModule !== 'undefined') {
            content = window.DraftModule.getDraftContent(currentFile);
          }
        } else {
          const res = await window.electronAPI.readFile(currentFile);
          if (res?.success) {
            content = res.content;
          } else {
            if (window.showToast) window.showToast('Failed to read file content', 'error');
            return null;
          }
        }

        if (!content) {
          if (window.showToast) window.showToast('Document is empty', 'error');
          return null;
        }
      } catch (error) {
        _log('error', `Failed to read content: ${error.message}`);
        if (window.showToast) window.showToast('Error reading file', 'error');
        return null;
      }

      // Prepare publishing parameters
      const fileName = currentFile.split('/').pop().replace(/\.[^/.]+$/, '');
      const slug = options.slug || fileName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
      const password = options.password || '';

      if (window.showToast) {
        window.showToast('Publishing document...', 'info', { sticky: true, id: 'publish' });
      }

      try {
        _log('info', `Publishing: ${currentFile} → ${slug}`);

        const result = await PublishOrchestrator.publish({
          filePath: currentFile,
          slug,
          html: viewer.state.html || content,
          title: fileName,
          password,
          settings
        });

        // Save publication info
        this.savePublishInfo(currentFile, {
          url: result.url,
          slug: result.slug,
          type: result.type,
          publishedAt: result.publishedAt
        });

        if (window.showToast) {
          window.showToast(`Published successfully! → ${result.url}`, 'success', { id: 'publish' });
        }

        _log('info', `Published: ${result.url}`);
        return result.url;
      } catch (error) {
        _log('error', `Publish failed: ${error.message}`);
        if (window.showToast) {
          const userMsg = PublishingErrorTypes.formatErrorMessage(error);
          window.showToast(`Publish failed: ${userMsg}`, 'error', { id: 'publish' });
        }
        return null;
      }
    },

    /**
     * Get design tokens for programmatic use
     */
    getDesignTokens() {
      return DesignTokenProvider.getAllTokens();
    },

    /**
     * Get service configuration info
     */
    getServiceInfo() {
      return PublishOrchestrator.getServiceInfo(window.AppState?.settings);
    }
  };
})();

// Explicit export
window.PublishService = PublishService;
