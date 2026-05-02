/**
 * PublishingErrorTypes
 * Purpose: Define custom error classes for publishing operations
 * Enables structured error handling and specific error recovery strategies
 */

const PublishingErrorTypes = (() => {
  'use strict';

  /**
   * Base class for all publishing errors
   */
  class PublishingError extends Error {
    constructor(message, code = 'PUBLISH_ERROR', details = {}) {
      super(message);
      this.name = this.constructor.name;
      this.code = code;
      this.details = details;
      this.timestamp = new Date().toISOString();
      this.retryable = false;
      this.retryCount = 0;
      this.maxRetries = 0;

      // Maintain proper stack trace
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }

    /**
     * Get user-friendly error message
     */
    getUserMessage() {
      return this.message;
    }

    /**
     * Get detailed error info for logging
     */
    toJSON() {
      return {
        name: this.name,
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
        retryable: this.retryable,
        retryCount: this.retryCount,
        maxRetries: this.maxRetries
      };
    }
  }

  /**
   * Validation error — Input validation failed
   * Usually NOT retryable (user must fix input)
   */
  class ValidationError extends PublishingError {
    constructor(message, field, value, details = {}) {
      const code = `VALIDATION_ERROR_${field.toUpperCase()}`;
      super(message, code, { field, value, ...details });
      this.field = field;
      this.value = value;
      this.retryable = false;
    }

    getUserMessage() {
      const fieldName = this.field.charAt(0).toUpperCase() + this.field.slice(1);
      return `${fieldName}: ${this.message}`;
    }
  }

  /**
   * Network error — Connection or I/O failure
   * Usually retryable with exponential backoff
   */
  class NetworkError extends PublishingError {
    constructor(message, statusCode = null, details = {}) {
      const code = statusCode ? `NETWORK_ERROR_${statusCode}` : 'NETWORK_ERROR';
      super(message, code, { statusCode, ...details });
      this.statusCode = statusCode;
      this.retryable = true;
      this.maxRetries = 3;

      // Some status codes are not retryable
      if (statusCode && (statusCode === 401 || statusCode === 403 || statusCode === 404)) {
        this.retryable = false;
        this.maxRetries = 0;
      }
    }

    getUserMessage() {
      const status = this.statusCode ? ` (${this.statusCode})` : '';
      return `Network error${status}: ${this.message}. Please check your connection.`;
    }
  }

  /**
   * Timeout error — Request exceeded time limit
   * Retryable with increasing timeouts
   */
  class TimeoutError extends PublishingError {
    constructor(message, timeout = null, details = {}) {
      const code = 'TIMEOUT_ERROR';
      super(message, code, { timeout, ...details });
      this.timeout = timeout;
      this.retryable = true;
      this.maxRetries = 2;
    }

    getUserMessage() {
      const timeoutSec = this.timeout ? Math.round(this.timeout / 1000) : 'unknown';
      return `Request timed out after ${timeoutSec}s. Please try again.`;
    }
  }

  /**
   * Worker error — Error from Cloudflare Worker
   * May or may not be retryable depending on error type
   */
  class WorkerError extends PublishingError {
    constructor(message, workerCode = null, details = {}) {
      const code = workerCode ? `WORKER_ERROR_${workerCode}` : 'WORKER_ERROR';
      super(message, code, { workerCode, ...details });
      this.workerCode = workerCode;
      this.retryable = false; // Default: not retryable

      // Specific worker codes that ARE retryable
      const retryableWorkerCodes = [
        'WORKER_TIMEOUT',
        'KV_TIMEOUT',
        'RATE_LIMITED',
        'TEMPORARILY_UNAVAILABLE'
      ];

      if (workerCode && retryableWorkerCodes.includes(workerCode)) {
        this.retryable = true;
        this.maxRetries = 3;
      }
    }

    getUserMessage() {
      const codeMsg = this.workerCode ? ` (${this.workerCode})` : '';
      return `Publishing service error${codeMsg}: ${this.message}`;
    }
  }

  /**
   * Slug conflict error — Slug already exists
   * Not retryable; user must choose different slug
   */
  class SlugConflictError extends PublishingError {
    constructor(slug, suggestions = [], details = {}) {
      const message = `Slug "${slug}" is already in use`;
      super(message, 'SLUG_CONFLICT', { slug, suggestions, ...details });
      this.slug = slug;
      this.suggestions = suggestions;
      this.retryable = false;
    }

    getUserMessage() {
      let msg = `The slug "${this.slug}" is already taken.`;
      if (this.suggestions && this.suggestions.length > 0) {
        msg += ` Try: ${this.suggestions.join(', ')}`;
      }
      return msg;
    }
  }

  /**
   * Asset error — Problem with asset bundling/gathering
   * Usually not retryable; asset issue must be fixed
   */
  class AssetError extends PublishingError {
    constructor(message, assetPath = null, details = {}) {
      const code = 'ASSET_ERROR';
      super(message, code, { assetPath, ...details });
      this.assetPath = assetPath;
      this.retryable = false;
    }

    getUserMessage() {
      if (this.assetPath) {
        return `Asset error (${this.assetPath}): ${this.message}`;
      }
      return `Asset bundling error: ${this.message}`;
    }
  }

  /**
   * Authentication error — Invalid or missing credentials
   * Not retryable; user must fix credentials
   */
  class AuthenticationError extends PublishingError {
    constructor(message, credentialType = null, details = {}) {
      const code = credentialType ? `AUTH_ERROR_${credentialType.toUpperCase()}` : 'AUTH_ERROR';
      super(message, code, { credentialType, ...details });
      this.credentialType = credentialType;
      this.retryable = false;
    }

    getUserMessage() {
      const type = this.credentialType ? ` (${this.credentialType})` : '';
      return `Authentication failed${type}. Please check your credentials.`;
    }
  }

  /**
   * Create appropriate error from response or exception
   * Intelligently maps errors to correct type
   */
  function createErrorFromResponse(response, defaultMessage = 'Unknown error') {
    if (!response) {
      return new PublishingError(defaultMessage);
    }

    // Handle fetch Response objects
    if (response.status) {
      const { status, statusText } = response;

      if (status === 0) {
        return new NetworkError('Network request failed', status);
      }

      if (status === 401) {
        return new AuthenticationError('Invalid credentials', 'token');
      }

      if (status === 403) {
        return new AuthenticationError('Access denied', 'permission');
      }

      if (status === 404) {
        return new NetworkError('Resource not found', status);
      }

      if (status === 409) {
        return new SlugConflictError(response.slug || 'unknown');
      }

      if (status >= 500) {
        return new WorkerError('Server error', `HTTP_${status}`);
      }

      if (status >= 400) {
        return new NetworkError(statusText || defaultMessage, status);
      }

      if (status >= 300) {
        return new NetworkError('Unexpected redirect', status);
      }

      return new NetworkError('Unknown HTTP error', status);
    }

    // Handle error objects
    if (response instanceof Error) {
      if (response.name === 'TimeoutError') {
        return new TimeoutError(response.message);
      }

      if (response.name === 'ValidationError') {
        return new ValidationError(response.message, 'unknown');
      }

      if (response.message.includes('network')) {
        return new NetworkError(response.message);
      }

      return new PublishingError(response.message);
    }

    // Handle plain objects with error info
    if (typeof response === 'object') {
      if (response.code === 'SLUG_CONFLICT') {
        return new SlugConflictError(response.slug, response.suggestions);
      }

      if (response.code && response.code.startsWith('WORKER_')) {
        return new WorkerError(response.message || defaultMessage, response.code);
      }

      if (response.error) {
        return new PublishingError(response.error, response.code);
      }

      return new PublishingError(
        response.message || defaultMessage,
        response.code
      );
    }

    // Fallback
    return new PublishingError(String(response) || defaultMessage);
  }

  // ============================================
  // PUBLIC API
  // ============================================

  return {
    // Error classes
    PublishingError,
    ValidationError,
    NetworkError,
    TimeoutError,
    WorkerError,
    SlugConflictError,
    AssetError,
    AuthenticationError,

    // Error creation helper
    createErrorFromResponse,

    /**
     * Determine if error is retryable
     */
    isRetryable(error) {
      if (error instanceof PublishingError) {
        return error.retryable;
      }
      return false;
    },

    /**
     * Format error for user display
     */
    formatErrorMessage(error) {
      if (error instanceof PublishingError) {
        return error.getUserMessage();
      }
      if (error instanceof Error) {
        return error.message;
      }
      return String(error);
    }
  };
})();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PublishingErrorTypes;
}
