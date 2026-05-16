/**
 * PublishImageCache
 * Content-hash based cache for published images.
 * Prevents re-compressing and re-uploading unchanged images on subsequent publishes.
 *
 * Manifest stored at: {workspace}/.mdpreview/publish-cache.json
 */
const PublishImageCache = (() => {
  'use strict';

  const CACHE_API = '/api/publish-cache';

  let _cache = null; // { version, images: { sha256hex: { r2Url, slug, uploadedAt, originalSize, compressedSize } } }

  /**
   * Load cache from workspace via server API.
   * Returns empty cache if file doesn't exist or is corrupt.
   */
  async function load() {
    try {
      const res = await fetch(CACHE_API);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      _cache = await res.json();
    } catch {
      _cache = { version: 1, images: {} };
    }
    return _cache;
  }

  /**
   * Persist current in-memory cache to disk.
   */
  async function save() {
    if (!_cache) return;
    try {
      await fetch(CACHE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(_cache)
      });
    } catch (err) {
      console.warn('[PublishImageCache] Failed to save cache:', err.message);
    }
  }

  /**
   * Get cached entry by hash. Returns null if not found.
   * @param {string} hash - hex SHA-256 of original blob
   */
  function get(hash) {
    if (!_cache) return null;
    return _cache.images[hash] || null;
  }

  /**
   * Store a new cache entry.
   * @param {string} hash
   * @param {{ r2Url: string, slug: string, originalSize: number, compressedSize: number }} entry
   */
  function set(hash, entry) {
    if (!_cache) _cache = { version: 1, images: {} };
    _cache.images[hash] = {
      ...entry,
      uploadedAt: new Date().toISOString()
    };
  }

  /**
   * Compute SHA-256 hex string from a Blob.
   * @param {Blob} blob
   * @returns {Promise<string>} hex string (64 chars)
   */
  async function computeHash(blob) {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  return { load, save, get, set, computeHash };
})();

window.PublishImageCache = PublishImageCache;
