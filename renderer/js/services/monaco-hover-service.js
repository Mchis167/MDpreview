/**
 * MonacoHoverService
 * Purpose: Image preview on hover for Markdown/HTML image links in Monaco Editor.
 * Pattern: IIFE Singleton
 */

/* global monaco, MonacoImagePreviewComponent */

const MonacoHoverService = (() => {
  'use strict';

  let _editor = null;
  const _listeners = [];
  let _domMouseLeaveListener = null;

  // Regex compiled once
  const MD_IMG_RE = /!\[(?:[^\]]*)\]\(([^)]+)\)/g;
  const HTML_IMG_RE = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;

  /**
   * Resolve relative asset path → absolute server URL.
   * Encodes each path segment individually to preserve slashes.
   */
  function _resolveUrl(raw) {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (trimmed.startsWith('http') || trimmed.startsWith('//') || trimmed.startsWith('data:')) {
      return trimmed;
    }

    // Strip leading /assets/, assets/, or /
    let path = trimmed;
    if (path.startsWith('/assets/')) path = path.slice(8);
    else if (path.startsWith('assets/')) path = path.slice(7);
    else if (path.startsWith('/')) path = path.slice(1);

    // Remove query / fragment
    path = path.split('?')[0].split('#')[0];

    // Encode each segment individually
    const encoded = path.split('/').map(seg => encodeURIComponent(decodeURIComponent(seg))).join('/');
    return `/assets/${encoded}`;
  }

  /**
   * Check if any UI overlay is open (menu shield, search palette, modals)
   */
  function _isOverlayOpen() {
    // Menu shield (context menu, popovers, etc.)
    if (window.MenuShield?.active) return true;

    // Search palette
    if (window.SearchPalette?.isOpen?.()) return true;

    // Modals/dialogs with 'show' class
    if (document.querySelector('.modal.show, .base-form-modal.show')) return true;

    return false;
  }

  /**
   * Find an image URL on a line at a given column (1-based).
   * Returns { url, startCol, endCol } or null.
   */
  function _detectImage(line, col) {
    MD_IMG_RE.lastIndex = 0;
    HTML_IMG_RE.lastIndex = 0;

    let m;
    while ((m = MD_IMG_RE.exec(line)) !== null) {
      const start = m.index + 1;        // 1-based
      const end = start + m[0].length - 1;
      if (col >= start && col <= end) return { url: m[1], startCol: start };
    }

    HTML_IMG_RE.lastIndex = 0;
    while ((m = HTML_IMG_RE.exec(line)) !== null) {
      const start = m.index + 1;
      const end = start + m[0].length - 1;
      if (col >= start && col <= end) return { url: m[1], startCol: start };
    }

    return null;
  }

  function _onMouseMove(e) {
    const preview = window.MonacoImagePreviewComponent;
    if (!_editor || !preview) return;

    const be = e.event && e.event.browserEvent;
    if (!be) return;

    const target = _editor.getTargetAtClientPoint(be.clientX, be.clientY);

    if (!target || !target.position) {
      preview.hide();
      return;
    }

    // Hide preview if any UI overlay is open
    if (_isOverlayOpen()) {
      preview.hide();
      return;
    }

    const { lineNumber, column } = target.position;
    const model = _editor.getModel();
    if (!model) { preview.hide(); return; }

    const line = model.getLineContent(lineNumber);

    // Quick bail-out before regex
    if (!line.includes('![') && !line.toLowerCase().includes('<img')) {
      preview.hide();
      return;
    }

    const found = _detectImage(line, column);
    if (!found) { preview.hide(); return; }

    const resolved = _resolveUrl(found.url);
    if (!resolved) { preview.hide(); return; }

    // Use cursor column for live-tracking position, fallback to link start for top/bottom
    const pixelPos = _editor.getScrolledVisiblePosition({ lineNumber, column });
    if (!pixelPos) { preview.hide(); return; }

    const editorRect = _editor.getDomNode().getBoundingClientRect();
    const lineHeight = _editor.getOption(monaco.editor.EditorOption.lineHeight);

    const anchorX = editorRect.left + pixelPos.left;
    const anchorTop = editorRect.top + pixelPos.top;
    const anchorBottom = anchorTop + lineHeight;

    preview.show(resolved, anchorX, anchorBottom, anchorTop);
  }

  function _addListener(disposable) {
    _listeners.push(disposable);
  }

  return {
    activate(editor) {
      this.deactivate();
      if (!editor) return;

      _editor = editor;
      _addListener(_editor.onMouseMove(_onMouseMove));
      _addListener(_editor.onDidScrollChange(() => MonacoImagePreviewComponent && MonacoImagePreviewComponent.hide()));
      _addListener(_editor.onDidBlurEditorWidget(() => MonacoImagePreviewComponent && MonacoImagePreviewComponent.hide()));

      // Hide preview when mouse leaves editor
      const editorNode = _editor.getDomNode();
      if (editorNode) {
        _domMouseLeaveListener = () => {
          if (window.MonacoImagePreviewComponent) MonacoImagePreviewComponent.hide();
        };
        editorNode.addEventListener('mouseleave', _domMouseLeaveListener);
      }
    },

    deactivate() {
      _listeners.forEach(l => l.dispose());
      _listeners.length = 0;

      if (_domMouseLeaveListener && _editor) {
        const editorNode = _editor.getDomNode();
        if (editorNode) editorNode.removeEventListener('mouseleave', _domMouseLeaveListener);
      }
      _domMouseLeaveListener = null;

      _editor = null;
      if (window.MonacoImagePreviewComponent) MonacoImagePreviewComponent.hide();
    },

    // kept for app.js compatibility
    init() {},
  };
})();

window.MonacoHoverService = MonacoHoverService;
