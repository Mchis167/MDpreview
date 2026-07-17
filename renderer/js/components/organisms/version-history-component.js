/* global DesignSystem */
/**
 * VersionHistoryComponent — modal listing snapshots of the current file.
 * Data: /api/history/list, /api/history/get. Restore = save old content back.
 */
const VersionHistoryComponent = (() => {
  'use strict';

  let _overlay = null;
  let _listEl = null;
  let _file = null;

  function _init() {
    if (_overlay) return;
    _overlay = DesignSystem.createElement('div', 'ds-version-history-overlay');
    const box = DesignSystem.createElement('div', 'ds-version-history-box');

    const header = DesignSystem.createElement('div', 'ds-version-history-header');
    const title = DesignSystem.createElement('div', 'ds-version-history-title', { text: 'Version History' });
    const closeBtn = DesignSystem.createButton({ label: '', icon: 'x', variant: 'subtitle' });
    closeBtn.addEventListener('click', hide);
    header.append(title, closeBtn);

    _listEl = DesignSystem.createElement('div', 'ds-version-history-list');

    box.append(header, _listEl);
    _overlay.appendChild(box);
    document.body.appendChild(_overlay);

    _overlay.addEventListener('mousedown', (e) => {
      if (e.target === _overlay) hide();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) hide();
    });
  }

  function _formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function _formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  async function _load() {
    _listEl.innerHTML = '';
    let versions = [];
    try {
      const resp = await fetch(`/api/history/list?path=${encodeURIComponent(_file)}`);
      versions = resp.ok ? (await resp.json()).versions : [];
    } catch (_err) { /* treated as empty below */ }

    if (versions.length === 0) {
      const empty = DesignSystem.createElement('div', 'ds-version-history-empty', {
        text: 'No snapshots yet. Versions are captured automatically when you save.',
      });
      _listEl.appendChild(empty);
      return;
    }

    versions.forEach((v) => {
      const item = DesignSystem.createElement('div', 'ds-version-history-item');
      const info = DesignSystem.createElement('div', 'ds-version-history-item-info');
      const time = DesignSystem.createElement('div', 'ds-version-history-item-time', { text: _formatTime(v.ts) });
      const size = DesignSystem.createElement('div', 'ds-version-history-item-size', { text: _formatSize(v.size) });
      info.append(time, size);

      const restoreBtn = DesignSystem.createButton({ label: 'Restore', variant: 'subtitle' });
      restoreBtn.addEventListener('click', () => _restore(v.ts));

      item.append(info, restoreBtn);
      _listEl.appendChild(item);
    });
  }

  async function _restore(ts) {
    try {
      const resp = await fetch(`/api/history/get?path=${encodeURIComponent(_file)}&ts=${ts}`);
      if (!resp.ok) throw new Error('Snapshot not found');
      const { content } = await resp.json();
      const save = await fetch('/api/file/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: _file, content }),
      });
      if (!save.ok) throw new Error('Save failed');
      hide();
      if (window.showToast) window.showToast(`Restored version from ${_formatTime(ts)}`, 'success');
      if (typeof window.loadFile === 'function') window.loadFile(_file);
    } catch (err) {
      if (window.showToast) window.showToast(`Restore failed: ${err.message}`, 'error');
    }
  }

  function show(file) {
    if (!file) return;
    _init();
    _file = file;
    _overlay.classList.add('open');
    _load();
  }

  function hide() {
    if (_overlay) _overlay.classList.remove('open');
  }

  function isOpen() {
    return !!(_overlay && _overlay.classList.contains('open'));
  }

  return { show, hide, isOpen };
})();

window.VersionHistoryComponent = VersionHistoryComponent;
