/**
 * LegacyHandoffAdapter
 * Purpose: Handle legacy Handoff.host publishing (deprecated)
 * Note: This adapter maintains backwards compatibility only
 * New implementations should use WorkerPublishAdapter
 */

const LegacyHandoffAdapter = (() => {
  'use strict';

  const LOG_TAG = '[LegacyHandoffAdapter]';

  /**
   * Publish to legacy Handoff.host service
   * @deprecated Use WorkerPublishAdapter instead
   */
  async function publish(config, options = {}) {
    const { filePath, slug, html, title, handoffToken } = config;
    const { retryConfig = RetryStrategy.createConfig('default') } = options;

    _log('warn', 'Using deprecated Handoff.host adapter. Migrate to Worker publishing.');

    // Validation
    if (!filePath || !slug || !html || !handoffToken) {
      throw new PublishingErrorTypes.ValidationError(
        'Missing Handoff configuration',
        'config',
        { filePath: !!filePath, slug: !!slug, html: !!html, token: !!handoffToken }
      );
    }

    const slugValidation = PublishUtils.validateSlug(slug);
    if (!slugValidation.valid) {
      throw new PublishingErrorTypes.ValidationError(slugValidation.error, 'slug', slug);
    }

    _log('info', `Publishing to Handoff: ${slug}`);

    try {
      const response = await RetryStrategy.executeWithRetry(
        () => _sendHandoffRequest(slug, html, title, handoffToken),
        {
          ...retryConfig,
          onRetry: ({ attempt, nextDelayMs }) => {
            _log('warn', `Handoff publish attempt ${attempt} failed, retrying in ${nextDelayMs}ms`);
          }
        }
      );

      if (!response.success) {
        throw new PublishingErrorTypes.WorkerError(
          response.error || 'Handoff publish failed',
          'HANDOFF_ERROR'
        );
      }

      return {
        success: true,
        slug: slugValidation.normalized,
        url: response.url || `https://handoff.host/${slug}`,
        publishedAt: new Date().toISOString(),
        type: 'legacy',
        metadata: { filePath, htmlSize: html.length }
      };
    } catch (error) {
      _log('error', `Handoff publish failed: ${error.message}`);
      throw PublishingErrorTypes.createErrorFromResponse(error, 'Failed to publish to Handoff');
    }
  }

  /**
   * Unpublish from Handoff
   * @deprecated Use WorkerPublishAdapter instead
   */
  async function unpublish(config) {
    const { slug, handoffToken } = config;

    const slugValidation = PublishUtils.validateSlug(slug);
    if (!slugValidation.valid) {
      throw new PublishingErrorTypes.ValidationError(slugValidation.error, 'slug', slug);
    }

    _log('info', `Unpublishing from Handoff: ${slug}`);

    try {
      const response = await RetryStrategy.fetchWithRetry(
        `https://handoff.host/api/delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${handoffToken}`
          },
          body: JSON.stringify({ slug: slugValidation.normalized }),
          retryConfig: RetryStrategy.createConfig('quick')
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      return { success: true, slug: slugValidation.normalized };
    } catch (error) {
      _log('error', `Handoff unpublish failed: ${error.message}`);
      throw PublishingErrorTypes.createErrorFromResponse(error, 'Failed to unpublish from Handoff');
    }
  }

  // ============================================
  // PRIVATE
  // ============================================

  async function _sendHandoffRequest(slug, html, title, token) {
    const response = await fetch('https://handoff.host/api/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        slug,
        content: html,
        title: PublishUtils.escapeHtml(title || 'Untitled')
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }

  function _log(level, message) {
    const timestamp = new Date().toISOString().substring(11, 19);
    const prefix = `[${timestamp}] ${LOG_TAG}`;
    const method = { debug: 'debug', info: 'log', warn: 'warn', error: 'error' }[level];
    console[method](prefix, message);
  }

  return {
    publish,
    unpublish,
    type: 'legacy',
    deprecated: true,
    deprecationMessage: 'Handoff.host publishing is deprecated. Migrate to Cloudflare Workers.'
  };
})();

// Export to window for browser context
window.LegacyHandoffAdapter = LegacyHandoffAdapter;


if (typeof module !== 'undefined' && module.exports) {
  module.exports = LegacyHandoffAdapter;
}
