/**
 * PublishOrchestrator
 * Purpose: Orchestrate publishing operations using strategy pattern
 * Selects appropriate adapter (Worker vs Legacy) based on configuration
 */

const PublishOrchestrator = (() => {
  'use strict';

  const LOG_TAG = '[PublishOrchestrator]';

  /**
   * Determine which publishing strategy to use based on available credentials
   * Priority: Worker > Legacy Handoff
   */
  function _selectAdapter(settings) {
    if (!settings) {
      throw new PublishingErrorTypes.AuthenticationError(
        'No publishing configuration found',
        'settings'
      );
    }

    // Worker has priority
    if (settings.publishWorkerUrl && settings.publishAdminSecret) {
      _log('debug', 'Selected Worker adapter');
      return {
        adapter: WorkerPublishAdapter,
        type: 'worker',
        config: {
          workerUrl: settings.publishWorkerUrl,
          adminSecret: settings.publishAdminSecret
        }
      };
    }

    // Fall back to legacy Handoff
    if (settings.publishHandoffToken) {
      _log('warn', 'Using legacy Handoff adapter (deprecated)');
      return {
        adapter: LegacyHandoffAdapter,
        type: 'legacy',
        config: {
          handoffToken: settings.publishHandoffToken
        }
      };
    }

    // No valid configuration
    throw new PublishingErrorTypes.AuthenticationError(
      'No publishing service configured. Set up Worker or Handoff credentials.',
      'missing'
    );
  }

  /**
   * Publish a document using appropriate adapter
   */
  async function publish(options = {}) {
    const {
      filePath,
      slug,
      html,
      title,
      password,
      settings = window.AppState?.settings,
      retryConfig
    } = options;

    _log('info', `Publishing: ${filePath} → ${slug}`);

    const { adapter, type, config } = _selectAdapter(settings);

    // Merge configs
    const publishConfig = {
      filePath,
      slug,
      html,
      title,
      password,
      ...config
    };

    try {
      const result = await adapter.publish(publishConfig, { retryConfig });
      _log('info', `Published via ${type}: ${result.url}`);
      return result;
    } catch (error) {
      _log('error', `Publishing failed (${type}): ${error.message}`);
      throw error;
    }
  }

  /**
   * Check slug availability using appropriate adapter
   */
  async function checkSlugAvailability(slug, settings = window.AppState?.settings) {
    const { adapter, config } = _selectAdapter(settings);

    // Only Worker adapter supports slug checking (legacy doesn't)
    if (adapter === LegacyHandoffAdapter) {
      _log('debug', 'Skipping slug check (not supported by Handoff adapter)');
      return true; // Assume available for legacy
    }

    return adapter.checkSlugAvailability(slug, config.workerUrl);
  }

  /**
   * Rename a published slug
   */
  async function renameSlug(oldSlug, newSlug, settings = window.AppState?.settings) {
    const { adapter, type: _type, config } = _selectAdapter(settings);

    // Legacy adapter doesn't support rename
    if (adapter === LegacyHandoffAdapter) {
      throw new PublishingErrorTypes.WorkerError(
        'Slug renaming not supported by Handoff adapter',
        'NOT_SUPPORTED'
      );
    }

    _log('info', `Renaming slug: ${oldSlug} → ${newSlug}`);
    return adapter.renameSlug({
      oldSlug,
      newSlug,
      ...config
    });
  }

  /**
   * Unpublish a document
   */
  async function unpublish(slug, filePath, settings = window.AppState?.settings) {
    const { adapter, type: _type, config } = _selectAdapter(settings);

    _log('info', `Unpublishing: ${slug} (${filePath})`);

    return adapter.unpublish({
      slug,
      filePath,
      ...config
    });
  }

  /**
   * List all published documents
   */
  async function listPublished(settings = window.AppState?.settings) {
    const { adapter, type: _type, config } = _selectAdapter(settings);

    // Legacy adapter doesn't support list
    if (adapter === LegacyHandoffAdapter) {
      _log('info', 'List not supported by Handoff adapter, returning empty');
      return [];
    }

    _log('info', 'Fetching published documents list');
    return adapter.listPublished(config.workerUrl, config.adminSecret);
  }

  /**
   * Get information about the currently configured publishing service
   */
  function getServiceInfo(settings = window.AppState?.settings) {
    if (!settings) {
      return {
        configured: false,
        type: null,
        message: 'No publishing service configured'
      };
    }

    if (settings.publishWorkerUrl && settings.publishAdminSecret) {
      return {
        configured: true,
        type: 'worker',
        workerUrl: settings.publishWorkerUrl,
        message: `Worker: ${settings.publishWorkerUrl}`
      };
    }

    if (settings.publishHandoffToken) {
      return {
        configured: true,
        type: 'legacy',
        message: 'Handoff.host (deprecated, migrate to Worker)',
        deprecated: true
      };
    }

    return {
      configured: false,
      type: null,
      message: 'No valid publishing credentials'
    };
  }

  /**
   * Log message with tag
   * @private
   */
  function _log(level, message) {
    const timestamp = new Date().toISOString().substring(11, 19);
    const prefix = `[${timestamp}] ${LOG_TAG}`;
    const method = { debug: 'debug', info: 'log', warn: 'warn', error: 'error' }[level];
    console[method](prefix, message); // eslint-disable-line no-console
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
    getServiceInfo,

    /**
     * Check if a publishing service is configured
     */
    isConfigured(settings = window.AppState?.settings) {
      const info = getServiceInfo(settings);
      return info.configured;
    },

    /**
     * Get active service type
     */
    getActiveService(settings = window.AppState?.settings) {
      const info = getServiceInfo(settings);
      return info.type;
    }
  };
})();

// Export for use in modules
// Export to window for browser context
window.PublishOrchestrator = PublishOrchestrator;


if (typeof module !== 'undefined' && module.exports) {
  module.exports = PublishOrchestrator;
}
