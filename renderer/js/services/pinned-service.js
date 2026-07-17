/**
 * PinnedService.js — Logic for managing pinned documents and folders per workspace.
 *
 * Target: Home screen "Pinned Document" / "Pinned Folder" sections.
 * Standard: Atomic Design V2 (Service).
 */
const PinnedService = (() => {
  'use strict';
  
  const STORAGE_KEY_PREFIX = 'mdpreview_pinned_';

  function _getStorageKey() {
    const ws = window.AppState ? window.AppState.currentWorkspace : null;
    if (!ws) return null;
    return STORAGE_KEY_PREFIX + ws.id;
  }

  // Normalizes stored entries to { path, type }. Older versions stored a flat
  // array of path strings (always documents), so plain strings are migrated on read.
  function _getPinnedArray() {
    const key = _getStorageKey();
    if (!key) return [];
    try {
      const data = localStorage.getItem(key);
      const raw = data ? JSON.parse(data) : [];
      return raw.map(entry => (typeof entry === 'string' ? { path: entry, type: 'file' } : entry));
    } catch (_e) {
      return [];
    }
  }

  function getPinnedFiles() {
    return _getPinnedArray();
  }

  function isPinned(path) {
    if (!path) return false;
    const pinned = _getPinnedArray();
    return pinned.some(entry => entry.path === path);
  }

  function togglePin(path, type = 'file') {
    if (!path) return;
    const key = _getStorageKey();
    if (!key) return;

    let pinned = _getPinnedArray();
    const index = pinned.findIndex(entry => entry.path === path);

    if (index > -1) {
      pinned.splice(index, 1);
    } else {
      pinned.unshift({ path, type }); // Newest pins at the top
    }

    localStorage.setItem(key, JSON.stringify(pinned));

    // Notify AppState to save persistent state (server sync)
    if (window.AppState && window.AppState.savePersistentState) {
      window.AppState.savePersistentState();
    }

    // Trigger UI update event
    window.dispatchEvent(new CustomEvent('pinned-changed', { detail: { path, isPinned: index === -1 } }));
  }

  function remove(path) {
    if (!path) return;
    const key = _getStorageKey();
    if (!key) return;

    let pinned = _getPinnedArray();
    const index = pinned.findIndex(entry => entry.path === path);
    if (index > -1) {
      pinned.splice(index, 1);
      localStorage.setItem(key, JSON.stringify(pinned));
      if (window.AppState && window.AppState.savePersistentState) {
        window.AppState.savePersistentState();
      }
      window.dispatchEvent(new CustomEvent('pinned-changed', { detail: { path, isPinned: false } }));
    }
  }

  return {
    getPinnedFiles,
    isPinned,
    togglePin,
    remove
  };
})();

window.PinnedService = PinnedService;
