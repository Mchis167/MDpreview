/**
 * RetryStrategy
 * Purpose: Implement retry logic with exponential backoff for transient failures
 * Uses: PublishingErrorTypes for error classification
 */

const RetryStrategy = (() => {
  'use strict';

  /**
   * Execute function with automatic retry on transient failures
   * Uses exponential backoff with jitter
   *
   * @param {function} fn - Async function to retry
   * @param {object} options - Retry configuration
   * @returns {Promise<*>} Result from successful execution
   * @throws {Error} Original error if all retries exhausted
   */
  async function executeWithRetry(fn, options = {}) {
    const {
      maxRetries = 3,
      initialDelayMs = 1000,
      maxDelayMs = 30000,
      backoffMultiplier = 2,
      jitterFraction = 0.1,
      timeout = null,
      onRetry = null,
      shouldRetry = (error) => _isRetryable(error)
    } = options;

    let lastError;
    let delayMs = initialDelayMs;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Execute with timeout if specified
        if (timeout) {
          return await _executeWithTimeout(fn, timeout);
        }
        return await fn();
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (!shouldRetry(error)) {
          throw error; // Not retryable, fail immediately
        }

        // Last attempt, don't retry
        if (attempt === maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff + jitter
        const delay = _calculateDelay(delayMs, maxDelayMs, backoffMultiplier, jitterFraction);

        // Call retry callback if provided
        if (onRetry) {
          onRetry({
            error,
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
            nextDelayMs: delay
          });
        }

        // Wait before retrying
        await _sleep(delay);

        // Update delay for next iteration
        delayMs = Math.min(delayMs * backoffMultiplier, maxDelayMs);
      }
    }

    throw lastError;
  }

  /**
   * Execute function with timeout
   * @private
   */
  async function _executeWithTimeout(fn, timeoutMs) {
    return Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(() => {
          const error = new Error(`Operation timed out after ${timeoutMs}ms`);
          error.name = 'TimeoutError';
          error.timeout = timeoutMs;
          reject(error);
        }, timeoutMs)
      )
    ]);
  }

  /**
   * Calculate delay with exponential backoff and jitter
   * Formula: baseDelay * multiplier ^ attempt + random jitter
   * @private
   */
  function _calculateDelay(baseDelay, maxDelay, multiplier, jitterFraction) {
    // Exponential backoff
    let delay = baseDelay * Math.pow(multiplier, 0); // Simplified, just use baseDelay
    delay = Math.min(delay, maxDelay);

    // Add jitter (±10% by default)
    const jitter = delay * jitterFraction * (Math.random() * 2 - 1);
    return Math.round(delay + jitter);
  }

  /**
   * Check if error should be retried
   * @private
   */
  function _isRetryable(error) {
    if (!error) return true; // Retry unknown errors

    // Check for PublishingError with retryable flag
    if (error.retryable !== undefined) {
      return error.retryable;
    }

    // Network errors typically retryable
    if (error.name === 'NetworkError' || error.name === 'TypeError') {
      return true;
    }

    // Timeout errors are retryable
    if (error.name === 'TimeoutError') {
      return true;
    }

    // Default: don't retry
    return false;
  }

  /**
   * Sleep for specified milliseconds
   * @private
   */
  function _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a retry configuration template
   * Useful for common patterns
   */
  function createConfig(pattern = 'default') {
    const configs = {
      // Quick retries for temporary glitches
      quick: {
        maxRetries: 2,
        initialDelayMs: 500,
        maxDelayMs: 2000,
        backoffMultiplier: 1.5
      },

      // Default: balanced for most operations
      default: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2
      },

      // Aggressive: for operations that need more time
      aggressive: {
        maxRetries: 5,
        initialDelayMs: 2000,
        maxDelayMs: 30000,
        backoffMultiplier: 1.5
      },

      // Timeout-heavy: for slow operations
      slowNetwork: {
        maxRetries: 4,
        initialDelayMs: 3000,
        maxDelayMs: 45000,
        backoffMultiplier: 1.8,
        timeout: 30000 // 30s per attempt
      }
    };

    return configs[pattern] || configs.default;
  }

  /**
   * Wrapper for fetch with automatic retry
   * Common use case: HTTP requests with retry
   */
  async function fetchWithRetry(url, options = {}) {
    const {
      method = 'GET',
      headers = {},
      body = null,
      retryConfig = createConfig('default'),
      timeout = 10000
    } = options;

    return executeWithRetry(
      () => fetch(url, {
        method,
        headers,
        body,
        signal: _createTimeoutSignal(timeout)
      }).then(async response => {
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          error.status = response.status;
          error.response = response;
          throw error;
        }
        return response;
      }),
      {
        ...retryConfig,
        timeout,
        shouldRetry: (error) => {
          // Retry on network errors and 5xx responses
          if (error.name === 'TypeError') return true; // Network error
          if (error.status >= 500) return true; // Server error
          if (error.status === 429) return true; // Rate limited
          return _isRetryable(error);
        }
      }
    );
  }

  /**
   * Create AbortSignal with timeout
   * @private
   */
  function _createTimeoutSignal(timeoutMs) {
    if (!timeoutMs) return undefined;

    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeoutMs);
    return controller.signal;
  }

  /**
   * Get retry statistics from an error
   * Useful for debugging and metrics
   */
  function getRetryStats(error) {
    if (!error) return null;

    return {
      retryable: error.retryable ?? false,
      retryCount: error.retryCount ?? 0,
      maxRetries: error.maxRetries ?? 0,
      errorCode: error.code,
      errorName: error.name,
      timestamp: error.timestamp
    };
  }

  // ============================================
  // PUBLIC API
  // ============================================

  return {
    executeWithRetry,
    fetchWithRetry,
    createConfig,
    getRetryStats,

    /**
     * Predefined timeout durations (ms)
     */
    timeouts: {
      SHORT: 5000,      // 5 seconds
      NORMAL: 10000,    // 10 seconds
      LONG: 30000,      // 30 seconds
      VERY_LONG: 60000  // 60 seconds
    },

    /**
     * Predefined delay patterns (ms)
     */
    delays: {
      IMMEDIATE: 0,
      FAST: 500,
      NORMAL: 1000,
      SLOW: 3000,
      VERY_SLOW: 5000
    }
  };
})();

// Export for use in modules
// Export to window for browser context
window.RetryStrategy = RetryStrategy;


if (typeof module !== 'undefined' && module.exports) {
  module.exports = RetryStrategy;
}
