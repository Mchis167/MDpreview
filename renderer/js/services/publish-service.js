/**
 * PublishService
 * Purpose: Coordinate document publishing to external hosts like Handoff.host
 * Dependencies: AppState, SettingsService, electronAPI
 */
const PublishService = (() => {
  'use strict';

  // ============================================
  // Private Functions
  // ============================================

  /**
   * Scans HTML for local image references and resolves them to absolute paths
   */
  async function _gatherAssets(html) {
    const assets = {};
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const imgs = tempDiv.querySelectorAll('img');
    for (const img of imgs) {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        // Resolve path via electronAPI (which handles relative to watch dir)
        const absolutePath = await window.electronAPI.getAbsolutePath(src);
        if (absolutePath) {
          assets[src] = {
            path: absolutePath,
            type: 'inline'
          };
        }
      }
    }
    
    return assets;
  }

  /**
   * Bundles all active design system CSS into a single style block
   * @deprecated Used for Handoff.host legacy bundling
   */
  function _bundleStyles() {
    let bundledCss = '';
    
    // We iterate through all stylesheets that are from our local domain
    for (const sheet of document.styleSheets) {
      try {
        // Only include our own design-system or component styles
        if (!sheet.href || sheet.href.includes('renderer/css/')) {
          for (const rule of sheet.cssRules) {
            bundledCss += rule.cssText + '\n';
          }
        }
      } catch (_e) {
        // Cross-origin sheets might throw security errors, ignore them
      }
    }
    
    return bundledCss;
  }

  /**
   * Wraps the rendered content in a standalone HTML template with styles
   */
  function _createStandaloneBundle(html, title) {
    const styles = _bundleStyles();
    const fileName = title || 'MDpreview Document';

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
            --ds-bg-main: #131313;
            --ds-accent: #ffbf48;
            --ds-accent-rgb: 255, 191, 72;
            --ds-text-primary: rgba(255, 255, 255, 0.90);
            --ds-text-secondary: rgba(255, 255, 255, 0.60);
            --ds-text-inverse: #ffffff;
            --ds-white-a02: rgba(255, 255, 255, 0.02);
            --ds-white-a04: rgba(255, 255, 255, 0.04);
            --ds-white-a05: rgba(255, 255, 255, 0.05);
            --ds-white-a08: rgba(255, 255, 255, 0.08);
            --ds-white-a10: rgba(255, 255, 255, 0.10);
            --ds-white-a20: rgba(255, 255, 255, 0.20);
            --ds-black-a30: rgba(0, 0, 0, 0.30);
            --ds-border-default: rgba(255, 255, 255, 0.10);
            --ds-radius-panel: 12px;
            --ds-radius-sm: 6px;
            --ds-transition-smooth: 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        body {
            margin: 0;
            padding: 0;
            background: var(--ds-bg-main);
            color: var(--ds-text-secondary);
            font-family: 'Inter', sans-serif;
            line-height: 1.8;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
        }

        .md-publish-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 60px 24px;
        }

        .md-render-body { font-size: 15px; }

        ${styles}

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
            font-family: 'Roboto Mono', monospace;
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

  // ============================================
  // Public API
  // ============================================
  return {
    /**
     * Returns publication info for a specific file
     */
    getPublishInfo: function(filePath) {
      if (!filePath || !window.AppState.settings.publishData) return null;
      return window.AppState.settings.publishData[filePath] || null;
    },

    /**
     * Check if a slug is already taken on the worker
     * @param {string} slug 
     * @returns {Promise<boolean>} true if available
     */
    async checkSlugAvailability(slug) {
      const workerUrl = window.AppState.settings.publishWorkerUrl;
      if (!workerUrl) return true;

      try {
        // Clean the base URL (remove /publish if present)
        const baseUrl = workerUrl.replace(/\/publish\/?$/, '');
        const res = await fetch(`${baseUrl}/check-slug?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) return true;
        const data = await res.json();
        return !data.exists;
      } catch (_e) {
        return true; 
      }
    },

    /**
     * Saves publication info for a specific file
     */
    savePublishInfo: function(filePath, info) {
      if (!filePath) return;
      const data = window.AppState.settings.publishData || {};
      data[filePath] = {
        ...info,
        updatedAt: new Date().toISOString()
      };
      window.SettingsService.update('publishData', data);
    },

    /**
     * List all slugs currently on the worker
     */
    async listAllPublished() {
      const workerUrl = window.AppState.settings.publishWorkerUrl;
      const adminSecret = window.AppState.settings.publishAdminSecret;
      if (!workerUrl || !adminSecret) return [];

      try {
        const baseUrl = workerUrl.replace(/\/publish\/?$/, '');
        const res = await fetch(`${baseUrl}/list`, {
          headers: { 'X-Admin-Secret': adminSecret }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.slugs || [];
      } catch (_e) {
        return [];
      }
    },

    /**
     * Rename a slug on the worker and update local state
     */
    async renameSlug(oldSlug, newSlug) {
      const workerUrl = window.AppState.settings.publishWorkerUrl;
      const adminSecret = window.AppState.settings.publishAdminSecret;
      if (!workerUrl || !adminSecret || !oldSlug || !newSlug) return false;

      try {
        const baseUrl = workerUrl.replace(/\/publish\/?$/, '');
        const res = await fetch(`${baseUrl}/rename`, {
          method: 'POST',
          headers: { 
            'X-Admin-Secret': adminSecret,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ oldSlug, newSlug })
        });
        
        if (res.ok) {
          // Update local state if any file is linked to this slug
          const data = window.AppState.settings.publishData || {};
          let changed = false;
          Object.keys(data).forEach(filePath => {
            if (data[filePath].slug === oldSlug) {
              data[filePath].slug = newSlug;
              changed = true;
            }
          });
          if (changed) {
            window.SettingsService.update('publishData', data);
          }
          return true;
        }
        return false;
      } catch (_e) {
        return false;
      }
    },

    /**
     * Force delete a slug from the worker (without local state management)
     */
    async deleteSlug(slug) {
      const workerUrl = window.AppState.settings.publishWorkerUrl;
      const adminSecret = window.AppState.settings.publishAdminSecret;
      if (!workerUrl || !adminSecret || !slug) return false;

      try {
        const baseUrl = workerUrl.replace(/\/publish\/?$/, '');
        const res = await fetch(`${baseUrl}/publish/${slug}`, {
          method: 'DELETE',
          headers: { 'X-Admin-Secret': adminSecret }
        });
        return res.ok;
      } catch (_e) {
        return false;
      }
    },

    /**
     * Removes publication info for a specific file and deletes from Worker if applicable
     */
    unpublish: async function(filePath) {
      if (!filePath) return;
      
      const info = this.getPublishInfo(filePath);
      const workerUrl = window.AppState.settings.publishWorkerUrl;
      const adminSecret = window.AppState.settings.publishAdminSecret;

      if (info && info.slug && workerUrl && adminSecret) {
        try {
          // Clean the base URL (remove /publish if present)
          const baseUrl = workerUrl.replace(/\/publish\/?$/, '');
          const res = await fetch(`${baseUrl}/publish/${info.slug}`, {
            method: 'DELETE',
            headers: {
              'X-Admin-Secret': adminSecret
            }
          });
          
          if (!res.ok) {
            const err = await res.json();
            console.warn('Worker unpublish failed:', err.error);
          }
        } catch (e) {
          console.error('Failed to call worker unpublish:', e);
        }
      }

      const data = window.AppState.settings.publishData || {};
      delete data[filePath];
      window.SettingsService.update('publishData', data);
      
      if (window.showToast) window.showToast('Document unpublished and removed from edge', 'info');
    },

    /**
     * Publishes the current document
     * Supports both Legacy Handoff and New Worker Flow
     * @param {Object} options - { slug, password }
     */
    publish: async function(options = {}) {
      const { currentFile, settings } = window.AppState;
      if (!currentFile) return null;
      
      const workerUrl = settings.publishWorkerUrl;
      const adminSecret = settings.publishAdminSecret;
      const handoffToken = settings.handoffToken;

      // Determine mode: Worker has priority if configured
      const useWorker = !!(workerUrl && adminSecret);
      
      if (!useWorker && !handoffToken) {
        if (window.showToast) {
          window.showToast('Please configure Publish settings first', 'error');
        }
        return null;
      }

      // Get content from viewer
      const viewer = window.MarkdownViewer.getInstance();
      if (!viewer) return null;
      
      const fileName = currentFile.split('/').pop().replace(/\.[^/.]+$/, "");
      const slug = options.slug || fileName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
      const password = options.password || '';

      if (window.showToast) {
        window.showToast(useWorker ? 'Publishing to Worker...' : 'Preparing Handoff bundle...', 'info', { sticky: true, id: 'publish' });
      }

      try {
        if (useWorker) {
          // --- NEW WORKER FLOW ---
          // 1. Get current content
          let content = '';
          if (currentFile.startsWith('__DRAFT_')) {
            if (typeof window.DraftModule !== 'undefined') {
              content = window.DraftModule.getDraftContent(currentFile);
            }
          } else {
            const res = await window.electronAPI.readFile(currentFile);
            if (res.success) {
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
          
          const payload = {
            slug,
            content: content,
            password,
            title: fileName,
            filePath: currentFile,
            assets: await _gatherAssets(viewer.state.html)
          };

          const result = await window.electronAPI.publishToWorker({
            payload,
            workerUrl,
            secret: adminSecret
          });

          if (result.success) {
            const baseUrl = workerUrl.replace(/\/$/, '').replace('/publish', '');
            const fullUrl = `${baseUrl}/${result.slug}`;
            
            this.savePublishInfo(currentFile, {
              url: fullUrl,
              slug: result.slug,
              type: 'worker'
            });

            if (window.showToast) window.showToast('Published to Worker successfully!', 'success', { id: 'publish' });
            return fullUrl;
          } else {
            throw new Error(result.error);
          }
        } else {
          // --- LEGACY HANDOFF FLOW ---
          const { html } = viewer.state;
          const assets = await _gatherAssets(html);
          const assetPaths = Object.values(assets).map(a => a.path);
          const bundle = _createStandaloneBundle(html, fileName);
          
          const result = await window.electronAPI.publishToHandoff({
            html: bundle,
            slug,
            assets: assetPaths,
            token: handoffToken,
            password,
            note: `Published from MDpreview v${window.AppState.version || '1.0.0'}`
          });

          if (result.success) {
            const fullUrl = `https://handoff.host${result.url}`;
            this.savePublishInfo(currentFile, {
              url: fullUrl,
              slug: slug,
              version: result.version,
              type: 'handoff'
            });
            if (window.showToast) window.showToast('Published to Handoff successfully!', 'success', { id: 'publish' });
            return fullUrl;
          } else {
            throw new Error(result.error);
          }
        }
      } catch (error) {
        if (window.showToast) {
          window.showToast(`Publish failed: ${error.message}`, 'error', { id: 'publish' });
        }
        return null;
      }
    }
  };
})();

// Explicit export
window.PublishService = PublishService;
