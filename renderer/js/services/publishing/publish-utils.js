/**
 * PublishUtils
 * Purpose: Shared utilities for publishing operations
 * Exports: Asset gathering, validation, HTML sanitization helpers
 */

const PublishUtils = (() => {
  'use strict';

  const LOG_TAG = '[PublishService]';
  const MAX_ASSET_SIZE = 10 * 1024 * 1024; // 10MB hard limit
  const WARN_ASSET_SIZE = 5 * 1024 * 1024; // 5MB warning threshold

  // ============================================
  // ASSET GATHERING
  // ============================================

  /**
   * Extract and resolve all asset references from HTML
   * Supports: images, fonts, SVGs, inline resources
   *
   * @param {string} html - Rendered HTML content
   * @param {object} options - Configuration options
   * @returns {Promise<object>} Result with resolved/unresolved assets and errors
   */
  async function gatherAssets(html, options = {}) {
    const {
      electronAPI = window.electronAPI,
      maxSize = MAX_ASSET_SIZE,
      logLevel = 'warn' // 'debug' | 'warn' | 'error'
    } = options;

    const result = {
      resolved: {},      // Successfully resolved: { originalPath: {path, type, size} }
      unresolved: [],    // Failed resolution: [{path, reason}]
      total: 0,
      totalSize: 0,
      errors: [],
      warnings: []
    };

    if (!html || typeof html !== 'string') {
      return result;
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // ── Image Assets ──────────────────────────────
    const imgs = tempDiv.querySelectorAll('img');
    for (const img of imgs) {
      const src = img.getAttribute('src');
      if (!src) continue;

      // Skip external and data URLs
      if (src.startsWith('http') || src.startsWith('data:')) {
        _log('debug', `Skipping external image: ${src}`);
        continue;
      }

      await _resolveAsset(
        src,
        'image',
        result,
        electronAPI,
        maxSize,
        logLevel
      );
    }

    // ── SVG Symbols/Inline SVGs ──────────────────
    const svgs = tempDiv.querySelectorAll('svg use');
    for (const use of svgs) {
      const href = use.getAttribute('xlink:href') || use.getAttribute('href');
      if (!href || href.startsWith('#')) continue; // Skip internal references
      if (href.startsWith('http') || href.startsWith('data:')) continue;

      await _resolveAsset(
        href,
        'svg',
        result,
        electronAPI,
        maxSize,
        logLevel
      );
    }

    // ── Font References in Styles ────────────────
    const styles = tempDiv.querySelectorAll('style');
    for (const style of styles) {
      const fontUrls = _extractFontUrls(style.textContent);
      for (const fontUrl of fontUrls) {
        if (fontUrl.startsWith('http') || fontUrl.startsWith('data:')) {
          _log('debug', `Skipping external font: ${fontUrl}`);
          continue;
        }

        await _resolveAsset(
          fontUrl,
          'font',
          result,
          electronAPI,
          maxSize,
          logLevel
        );
      }
    }

    // ── Background Images ────────────────────────
    const elementsWithBg = tempDiv.querySelectorAll('[style*="background"]');
    for (const el of elementsWithBg) {
      const bgUrl = _extractBackgroundUrl(el.getAttribute('style'));
      if (!bgUrl) continue;
      if (bgUrl.startsWith('http') || bgUrl.startsWith('data:')) continue;

      await _resolveAsset(
        bgUrl,
        'image',
        result,
        electronAPI,
        maxSize,
        logLevel
      );
    }

    _log('info', `Asset gathering complete: ${result.total} total, ` +
      `${Object.keys(result.resolved).length} resolved, ` +
      `${result.unresolved.length} unresolved`);

    return result;
  }

  /**
   * Resolve a single asset path to absolute location
   * @private
   */
  async function _resolveAsset(path, type, result, electronAPI, _maxSize, _logLevel) {
    if (!path || result.resolved[path] || result.unresolved.some(u => u.path === path)) {
      return; // Already processed
    }

    result.total++;

    try {
      if (!electronAPI) {
        result.unresolved.push({
          path,
          reason: 'electronAPI not available'
        });
        _log('warn', `Cannot resolve asset (no electronAPI): ${path}`);
        return;
      }

      const absolutePath = await electronAPI.getAbsolutePath(path);
      if (!absolutePath) {
        result.unresolved.push({
          path,
          reason: 'path resolution failed'
        });
        _log('warn', `Failed to resolve asset path: ${path}`);
        return;
      }

      // Note: Size checking would require file system access in Electron
      // For now, we just resolve the path
      result.resolved[path] = {
        path: absolutePath,
        type,
        size: null // Would be set after file system check
      };

      _log('debug', `Resolved ${type} asset: ${path} → ${absolutePath}`);
    } catch (error) {
      result.errors.push({
        path,
        error: error.message
      });
      result.unresolved.push({
        path,
        reason: error.message
      });
      _log('error', `Error resolving asset ${path}: ${error.message}`);
    }
  }

  /**
   * Extract font URLs from CSS @font-face declarations
   * @private
   */
  function _extractFontUrls(css) {
    const urls = [];
    const fontFaceRegex = /@font-face\s*\{[^}]*url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/g;
    let match;

    while ((match = fontFaceRegex.exec(css)) !== null) {
      urls.push(match[1]);
    }

    return urls;
  }

  /**
   * Extract background URL from inline style attribute
   * @private
   */
  function _extractBackgroundUrl(style) {
    if (!style) return null;
    const match = style.match(/background(?:-image)?\s*:\s*url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/);
    return match ? match[1] : null;
  }

  /**
   * Log message with tag and optional level filtering
   * @private
   */
  function _log(level, message) {
    const timestamp = new Date().toISOString().substring(11, 19);
    const prefix = `[${timestamp}] ${LOG_TAG}`;

    switch (level) {
      case 'debug':
        console.debug(prefix, message); // eslint-disable-line no-console
        break;
      case 'info':
        console.log(prefix, message); // eslint-disable-line no-console
        break;
      case 'warn':
        console.warn(prefix, message);
        break;
      case 'error':
        console.error(prefix, message);
        break;
    }
  }

  // ============================================
  // SLUG VALIDATION
  // ============================================

  /**
   * Validate slug format (alphanumeric, hyphens, underscores)
   * @param {string} slug - Slug to validate
   * @returns {object} Validation result {valid, error}
   */
  function validateSlug(slug) {
    if (!slug || typeof slug !== 'string') {
      return {
        valid: false,
        error: 'Slug must be a non-empty string'
      };
    }

    const trimmed = slug.trim();

    // Check length
    if (trimmed.length < 3) {
      return {
        valid: false,
        error: 'Slug must be at least 3 characters'
      };
    }

    if (trimmed.length > 50) {
      return {
        valid: false,
        error: 'Slug must be less than 50 characters'
      };
    }

    // Check format: alphanumeric, hyphens, underscores only
    const slugRegex = /^[a-z0-9_-]+$/i;
    if (!slugRegex.test(trimmed)) {
      return {
        valid: false,
        error: 'Slug can only contain letters, numbers, hyphens, and underscores'
      };
    }

    // Cannot start or end with hyphen or underscore
    if (trimmed.startsWith('-') || trimmed.startsWith('_') ||
        trimmed.endsWith('-') || trimmed.endsWith('_')) {
      return {
        valid: false,
        error: 'Slug cannot start or end with hyphen or underscore'
      };
    }

    // Cannot have consecutive hyphens/underscores
    if (/[-_]{2,}/.test(trimmed)) {
      return {
        valid: false,
        error: 'Slug cannot have consecutive hyphens or underscores'
      };
    }

    return {
      valid: true,
      error: null,
      normalized: trimmed.toLowerCase()
    };
  }

  // ============================================
  // HTML ESCAPING
  // ============================================

  /**
   * Escape HTML special characters to prevent injection
   * @param {string} text - Text to escape
   * @returns {string} Escaped text safe for HTML
   */
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return String(text).replace(/[&<>"']/g, char => map[char]);
  }

  /**
   * Generate a clean, URL-friendly slug from a string
   * Handles: lowercase, non-alphanumeric removal, collapsing hyphens, trimming edges
   * @param {string} text - The source text (filename, title, etc.)
   * @returns {string} A valid slug ready to use
   */
  function slugify(text) {
    if (!text || typeof text !== 'string') return '';

    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^a-z0-9_-]/g, '-')   // Replace all non-alphanumeric (except - and _) with -
      .replace(/[-_]{2,}/g, '-')      // Replace multiple consecutive - or _ with a single -
      .replace(/^[-_]+/, '')          // Trim leading - or _
      .replace(/[-_]+$/, '')          // Trim trailing - or _
      .substring(0, 50);              // Limit length
  }

  // ============================================
  // PUBLIC API
  // ============================================

  return {
    gatherAssets,
    validateSlug,
    slugify,
    escapeHtml,

    /**
     * Get constant limits
     */
    getConstants() {
      return {
        MAX_ASSET_SIZE,
        WARN_ASSET_SIZE,
        LOG_TAG
      };
    }
  };
})();

// Export for use in modules
// Export to window for browser context
window.PublishUtils = PublishUtils;


if (typeof module !== 'undefined' && module.exports) {
  module.exports = PublishUtils;
}
