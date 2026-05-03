/**
 * WorkerPublishAdapter
 * Purpose: Handle Cloudflare Worker publishing strategy
 * Dependencies: RetryStrategy, PublishingErrorTypes, PublishUtils
 */

const WorkerPublishAdapter = (() => {
  'use strict';

  const LOG_TAG = '[WorkerPublishAdapter]';

  /**
   * Publish document to Cloudflare Worker via server proxy
   *
   * @param {object} config - Publishing configuration
   * @param {string} config.filePath - Local file path
   * @param {string} config.slug - Published slug
   * @param {string} config.html - Rendered HTML content
   * @param {string} config.title - Document title
   * @param {string} config.password - Optional password protection
   * @param {string} config.workerUrl - Worker endpoint URL
   * @param {string} config.adminSecret - Worker admin secret
   * @param {object} options - Additional options
   * @returns {Promise<object>} Publication result {success, url, slug, ...}
   */
  async function publish(config, options = {}) {
    const {
      filePath,
      slug,
      html,
      title,
      password,
      workerUrl,
      adminSecret
    } = config;

    const {
      retryConfig = RetryStrategy.createConfig('default'),
      timeout = RetryStrategy.timeouts.NORMAL,
      electronAPI = window.electronAPI
    } = options;

    // ── Validation ──────────────────────────────

    if (!filePath || !slug || !html) {
      throw new PublishingErrorTypes.ValidationError(
        'Missing required publishing configuration',
        'config',
        { filePath: !!filePath, slug: !!slug, html: !!html }
      );
    }

    const slugValidation = PublishUtils.validateSlug(slug);
    if (!slugValidation.valid) {
      throw new PublishingErrorTypes.ValidationError(
        slugValidation.error,
        'slug',
        slug
      );
    }

    if (!workerUrl || !adminSecret) {
      throw new PublishingErrorTypes.AuthenticationError(
        'Worker URL and admin secret required',
        'worker'
      );
    }

    _log('info', `Publishing document: ${filePath} → ${slug}`);

    // ── Gather Assets ───────────────────────────

    const assetResult = await PublishUtils.gatherAssets(html, { electronAPI });

    if (assetResult.errors && assetResult.errors.length > 0) {
      _log('warn', `Asset gathering encountered errors: ${assetResult.errors.length} issues`);
      assetResult.errors.forEach(err => {
        _log('warn', `  - ${err.path}: ${err.error}`);
      });
    }

    if (assetResult.unresolved && assetResult.unresolved.length > 0) {
      _log('warn', `${assetResult.unresolved.length} assets could not be resolved`);
    }

    // ── Build Payload ───────────────────────────

    const payload = {
      slug: slugValidation.normalized,
      title: PublishUtils.escapeHtml(title || 'Untitled'),
      html,
      password: password || null,
      filePath,
      // Assets for future implementation
      assets: assetResult.resolved,
      assetWarnings: assetResult.unresolved.length > 0 ? assetResult.unresolved : null,
      metadata: {
        source: 'mdpreview',
        version: '1.2.0',
        timestamp: new Date().toISOString()
      }
    };

    // ── Send to Server Proxy ────────────────────

    let response;
    try {
      response = await RetryStrategy.executeWithRetry(
        () => _sendPublishRequest(payload, workerUrl, adminSecret),
        {
          ...retryConfig,
          timeout,
          onRetry: ({ error, attempt, nextDelayMs }) => {
            _log('warn', `Publish attempt ${attempt} failed, retrying in ${nextDelayMs}ms: ${error.message}`);
          }
        }
      );
    } catch (error) {
      _log('error', `Publishing failed after retries: ${error.message}`);
      throw PublishingErrorTypes.createErrorFromResponse(error, 'Failed to publish document');
    }

    // ── Process Response ────────────────────────

    if (!response || !response.success) {
      const errorMsg = response?.error || 'Unknown publishing error';
      const workerError = new PublishingErrorTypes.WorkerError(errorMsg, response?.code);
      _log('error', `Worker rejected publish: ${errorMsg}`);
      throw workerError;
    }

    const result = {
      success: true,
      slug: response.slug || slugValidation.normalized,
      url: response.url || `${workerUrl}/${slugValidation.normalized}`,
      publishedAt: new Date().toISOString(),
      type: 'worker',
      metadata: {
        filePath,
        workerUrl,
        assetCount: Object.keys(assetResult.resolved).length,
        htmlSize: html.length
      }
    };

    _log('info', `Publishing successful: ${result.url}`);
    return result;
  }

  /**
   * Check if a slug is available on the worker
   *
   * @param {string} slug - Slug to check
   * @param {string} workerUrl - Worker endpoint URL
   * @returns {Promise<boolean>} True if slug is available
   */
  async function checkSlugAvailability(slug, workerUrl) {
    const slugValidation = PublishUtils.validateSlug(slug);
    if (!slugValidation.valid) {
      _log('warn', `Invalid slug format: ${slug}`);
      return false;
    }

    try {
      const response = await RetryStrategy.fetchWithRetry(
        `${workerUrl}/check-slug?slug=${encodeURIComponent(slugValidation.normalized)}`,
        {
          method: 'GET',
          retryConfig: RetryStrategy.createConfig('quick'),
          timeout: RetryStrategy.timeouts.SHORT
        }
      );

      const data = await response.json();
      return data.available !== false;
    } catch (error) {
      _log('error', `Slug availability check failed: ${error.message}`);
      // On error, assume slug might be taken (fail safe)
      return false;
    }
  }

  /**
   * Rename a published slug
   *
   * @param {object} config - Rename configuration
   * @returns {Promise<object>} Rename result
   */
  async function renameSlug(config) {
    const {
      oldSlug,
      newSlug,
      workerUrl,
      adminSecret
    } = config;

    const oldValidation = PublishUtils.validateSlug(oldSlug);
    const newValidation = PublishUtils.validateSlug(newSlug);

    if (!oldValidation.valid || !newValidation.valid) {
      throw new PublishingErrorTypes.ValidationError(
        'Invalid slug format',
        'slug',
        { oldSlug, newSlug }
      );
    }

    _log('info', `Renaming slug: ${oldSlug} → ${newSlug}`);

    try {
      const response = await RetryStrategy.fetchWithRetry(
        `${workerUrl}/rename`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Secret': adminSecret
          },
          body: JSON.stringify({
            oldSlug: oldValidation.normalized,
            newSlug: newValidation.normalized
          }),
          retryConfig: RetryStrategy.createConfig('default'),
          timeout: RetryStrategy.timeouts.NORMAL
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        if (data.code === 'SLUG_CONFLICT') {
          throw new PublishingErrorTypes.SlugConflictError(newSlug);
        }
        throw new PublishingErrorTypes.WorkerError(data.error || 'Rename failed', data.code);
      }

      _log('info', `Slug renamed successfully: ${newSlug}`);
      return {
        success: true,
        oldSlug: oldValidation.normalized,
        newSlug: newValidation.normalized
      };
    } catch (error) {
      _log('error', `Rename failed: ${error.message}`);
      throw PublishingErrorTypes.createErrorFromResponse(error, 'Failed to rename slug');
    }
  }

  /**
   * Unpublish (delete) a document
   *
   * @param {object} config - Unpublish configuration
   * @returns {Promise<object>} Unpublish result
   */
  async function unpublish(config) {
    const {
      slug,
      workerUrl,
      adminSecret
    } = config;

    const slugValidation = PublishUtils.validateSlug(slug);
    if (!slugValidation.valid) {
      throw new PublishingErrorTypes.ValidationError(
        'Invalid slug format',
        'slug',
        slug
      );
    }

    _log('info', `Unpublishing document: ${slug}`);

    try {
      const response = await RetryStrategy.fetchWithRetry(
        `${workerUrl}/publish/${encodeURIComponent(slugValidation.normalized)}`,
        {
          method: 'DELETE',
          headers: {
            'X-Admin-Secret': adminSecret
          },
          retryConfig: RetryStrategy.createConfig('quick'),
          timeout: RetryStrategy.timeouts.NORMAL
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      _log('info', `Document unpublished: ${slug}`);
      return {
        success: true,
        slug: slugValidation.normalized
      };
    } catch (error) {
      _log('error', `Unpublish failed: ${error.message}`);
      throw PublishingErrorTypes.createErrorFromResponse(error, 'Failed to unpublish document');
    }
  }

  /**
   * List all published slugs for this worker
   *
   * @param {string} workerUrl - Worker endpoint URL
   * @param {string} adminSecret - Worker admin secret
   * @returns {Promise<array>} Array of published slug metadata
   */
  async function listPublished(workerUrl, adminSecret) {
    _log('info', 'Fetching published documents list');

    try {
      const response = await RetryStrategy.fetchWithRetry(
        `${workerUrl}/list`,
        {
          method: 'GET',
          headers: {
            'X-Admin-Secret': adminSecret
          },
          retryConfig: RetryStrategy.createConfig('quick'),
          timeout: RetryStrategy.timeouts.NORMAL
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.slugs || [];
    } catch (error) {
      _log('error', `Failed to list published documents: ${error.message}`);
      throw PublishingErrorTypes.createErrorFromResponse(error, 'Failed to fetch published documents');
    }
  }

  // ============================================
  // PRIVATE FUNCTIONS
  // ============================================

  /**
   * Send publish request to server proxy
   * @private
   */
  async function _sendPublishRequest(payload, workerUrl, adminSecret) {
    const response = await fetch('/api/worker-publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payload,
        workerUrl,
        secret: adminSecret
      })
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    let result = null;
    
    try {
      if (isJson) result = await response.json();
    } catch (_err) {
      // Fallback if JSON parsing fails
    }

    if (!response.ok) {
      const errorMsg = result?.error || `HTTP ${response.status}: ${response.statusText}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.code = result?.code;
      error.details = result;
      throw error;
    }

    return result;
  }

  /**
   * Log message with tag and timestamp
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
  // PUBLIC API
  // ============================================

  return {
    publish,
    checkSlugAvailability,
    renameSlug,
    unpublish,
    listPublished,
    type: 'worker'
  };
})();

// Export for use in modules
// Export to window for browser context
window.WorkerPublishAdapter = WorkerPublishAdapter;


if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorkerPublishAdapter;
}
