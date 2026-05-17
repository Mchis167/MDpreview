/* global RetryStrategy, PublishingErrorTypes, PublishUtils, ImageProcessorUtil, PublishImageCache */
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
    _log('info', 'Gathering and optimizing assets...');
    const assetResult = await PublishUtils.gatherAssets(html, { electronAPI });
    let finalHtml = html;
    const assetMapping = {};

    if (assetResult.resolved && Object.keys(assetResult.resolved).length > 0) {
      const totalAssets = Object.keys(assetResult.resolved).length;
      let uploadedCount = 0;
      let cachedCount = 0;
      let savedBytes = 0;

      // Load image cache trước khi bắt đầu vòng lặp
      await PublishImageCache.load();

      for (const [originalSrc, _assetInfo] of Object.entries(assetResult.resolved)) {
        try {
          // 1. Fetch asset từ local server
          // Đảm bảo không bị lặp lại /assets/assets/
          let assetFetchUrl = originalSrc;
          if (!assetFetchUrl.startsWith('/')) {
            if (assetFetchUrl.startsWith('assets/')) {
              assetFetchUrl = '/' + assetFetchUrl;
            } else {
              assetFetchUrl = '/assets/' + assetFetchUrl;
            }
          }

          _log('debug', `Fetching local asset: ${assetFetchUrl}`);

          const assetBlobRes = await fetch(assetFetchUrl);
          if (!assetBlobRes.ok) throw new Error(`Could not fetch asset: ${assetFetchUrl} (HTTP ${assetBlobRes.status})`);
          const originalBlob = await assetBlobRes.blob();

          // 2. Cache check (chỉ cho ảnh)
          if (originalBlob.type.startsWith('image/')) {
            const hash = await PublishImageCache.computeHash(originalBlob);
            const cached = PublishImageCache.get(hash);

            if (cached) {
              cachedCount++;
              savedBytes += cached.originalSize || 0;
              assetMapping[originalSrc] = cached.r2Url;
              if (window.showToast) {
                window.showToast(`Processing assets (${uploadedCount + cachedCount}/${totalAssets})...`, 'info', { id: 'publish' });
              }
              continue;
            }

            // Cache miss — compress + upload
            uploadedCount++;
            if (window.showToast) {
              window.showToast(`Uploading assets (${uploadedCount + cachedCount}/${totalAssets})...`, 'info', { id: 'publish' });
            }

            let compressedBlob = originalBlob;
            let compressedMime = originalBlob.type;
            try {
              const processed = await ImageProcessorUtil.processForPublish(originalBlob);
              compressedBlob = processed.blob;
              compressedMime = processed.mime;
            } catch (pErr) {
              _log('warn', `Compression failed for ${originalSrc}, using original: ${pErr.message}`);
            }

            const uploadPayload = {
              assetName: `img-${hash.slice(0, 12)}.${compressedMime.split('/')[1].replace('jpeg', 'jpg')}`,
              contentHash: hash,
              slug: slugValidation.normalized,
              workerUrl,
              secret: adminSecret,
              base64Data: await _blobToBase64(compressedBlob),
              mimeType: compressedMime
            };

            const assetRes = await fetch('/api/worker-publish-asset', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(uploadPayload)
            });

            if (!assetRes.ok) {
              const err = await assetRes.json();
              throw new Error(err.error || 'Asset upload failed');
            }

            const uploadResult = await assetRes.json();
            const safeWorkerUrl = workerUrl.replace(/\/$/, '');
            const remoteUrl = `${safeWorkerUrl}/${slugValidation.normalized}/assets/${uploadResult.remoteName}`;

            // Lưu vào cache
            PublishImageCache.set(hash, {
              r2Url: remoteUrl,
              slug: slugValidation.normalized,
              originalSize: originalBlob.size,
              compressedSize: compressedBlob.size
            });

            assetMapping[originalSrc] = remoteUrl;
            _log('debug', `Asset uploaded: ${originalSrc} → ${remoteUrl}`);

          } else {
            // Non-image assets: upload trực tiếp, không cache
            uploadedCount++;
            if (window.showToast) {
              window.showToast(`Uploading assets (${uploadedCount + cachedCount}/${totalAssets})...`, 'info', { id: 'publish' });
            }

            const uploadPayload = {
              assetName: originalSrc.split('/').pop(),
              slug: slugValidation.normalized,
              workerUrl,
              secret: adminSecret
            };

            const assetRes = await fetch('/api/worker-publish-asset', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(uploadPayload)
            });

            if (!assetRes.ok) {
              const err = await assetRes.json();
              throw new Error(err.error || 'Asset upload failed');
            }

            const uploadResult = await assetRes.json();
            const safeWorkerUrl = workerUrl.replace(/\/$/, '');
            assetMapping[originalSrc] = `${safeWorkerUrl}/${slugValidation.normalized}/assets/${uploadResult.remoteName}`;
            _log('debug', `Asset uploaded: ${originalSrc}`);
          }

        } catch (err) {
          _log('error', `Failed to process asset ${originalSrc}: ${err.message}`);
        }
      }

      // Lưu cache sau khi hoàn thành vòng lặp
      await PublishImageCache.save();

      // Toast tổng kết với stats
      if (window.showToast) {
        const savedKB = Math.round(savedBytes / 1024);
        const parts = [];
        if (uploadedCount > 0) parts.push(`${uploadedCount} uploaded`);
        if (cachedCount > 0) parts.push(`${cachedCount} from cache${savedKB > 0 ? ` (saved ~${savedKB}KB)` : ''}`);
        if (parts.length > 0) {
          window.showToast(`Assets: ${parts.join(', ')}`, 'success', { id: 'publish' });
        }
      }

      // ── Replace Links (DOM-based - Much more robust) ────────────────
      _log('info', `Replacing ${Object.keys(assetMapping).length} local asset links using DOM...`);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = finalHtml;

      // Update <img> tags
      const imgs = tempDiv.querySelectorAll('img');
      for (const img of imgs) {
        const src = img.getAttribute('src');
        if (assetMapping[src]) {
          // Re-append hash fragment (e.g. #phone, #browser) so MockupImageModule
          // can read the mockup type on the published page.
          const hashIdx = src.indexOf('#');
          const hash = hashIdx !== -1 ? src.slice(hashIdx) : '';
          img.setAttribute('src', assetMapping[src] + hash);
        }
      }

      // Update <svg> <use> tags
      const uses = tempDiv.querySelectorAll('svg use');
      for (const use of uses) {
        const href = use.getAttribute('xlink:href') || use.getAttribute('href');
        if (assetMapping[href]) {
          if (use.hasAttribute('xlink:href')) {
            use.setAttribute('xlink:href', assetMapping[href]);
          } else {
            use.setAttribute('href', assetMapping[href]);
          }
        }
      }

      finalHtml = tempDiv.innerHTML;
    }

    if (assetResult.errors && assetResult.errors.length > 0) {
      _log('warn', `Asset gathering encountered errors: ${assetResult.errors.length} issues`);
    }

    // ── Build Payload ───────────────────────────

    const payload = {
      slug: slugValidation.normalized,
      title: PublishUtils.escapeHtml(title || 'Untitled'),
      html: finalHtml,
      password: password || null,
      filePath,
      assets: assetMapping,
      metadata: {
        source: 'mdpreview',
        version: '1.2.1', // Bump version for new asset pipeline
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
   * Convert Blob to Base64 string
   * @private
   */
  async function _blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

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
