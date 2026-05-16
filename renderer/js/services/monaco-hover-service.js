/**
 * MonacoHoverService
 * Purpose: Provides image preview on hover for Markdown and HTML image links.
 * Position: Strictly BELOW the cursor/link.
 * Pattern: IIFE Singleton
 */

/* global monaco, MonacoImagePreviewComponent */

const MonacoHoverService = (() => {
  'use strict';

  let _editor = null;
  let _mouseMoveListener = null;

  /**
   * Resolves a potentially relative asset URL to a full server URL
   */
  function _resolveImageUrl(url) {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) {
      return url;
    }

    let cleanPath = url;
    if (url.startsWith('/assets/')) {
      cleanPath = url.substring(8);
    } else if (url.startsWith('assets/')) {
      cleanPath = url.substring(7);
    } else if (url.startsWith('/')) {
      cleanPath = url.substring(1);
    }

    cleanPath = cleanPath.split('?')[0].split('#')[0];
    return `/assets/${encodeURIComponent(decodeURIComponent(cleanPath))}`;
  }

  function _handleMouseMove(e) {
    if (!_editor || !window.MonacoImagePreviewComponent) return;
    
    // Use browser event for most reliable coordinates
    const browserEvent = e.event && e.event.browserEvent ? e.event.browserEvent : null;
    if (!browserEvent) return;

    const target = _editor.getTargetAtClientPoint(browserEvent.clientX, browserEvent.clientY);
    if (!target || !target.position) {
      MonacoImagePreviewComponent.hide();
      return;
    }

    // Only trigger on actual content areas
    // 3: CONTENT_TEXT, 4: CONTENT_WIDGET, 6: CONTENT_EMPTY, 7: CONTENT_VIEW_ZONE
    if (target.type !== 3 && target.type !== 6 && target.type !== 7) {
      MonacoImagePreviewComponent.hide();
      return;
    }

    const pos = target.position;
    const model = _editor.getModel();
    if (!model) return;

    const lineContent = model.getLineContent(pos.lineNumber);
    if (!lineContent || (!lineContent.includes('![') && !lineContent.toLowerCase().includes('<img'))) {
      MonacoImagePreviewComponent.hide();
      return;
    }
    
    // Regex
    const markdownRegex = /!\[(.*?)\]\s*\((.*?)\)/g;
    const htmlRegex = /<img\s+[^>]*src=["'](.*?)["'][^>]*>/gi;

    let match;
    let foundImage = null;

    // 1. Markdown detection
    while ((match = markdownRegex.exec(lineContent)) !== null) {
      const startCol = match.index + 1;
      const endCol = startCol + match[0].length;
      
      if (pos.column >= startCol && pos.column <= endCol) {
        foundImage = { url: match[2], range: new monaco.Range(pos.lineNumber, startCol, pos.lineNumber, endCol) };
        break;
      }
    }

    // 2. HTML detection
    if (!foundImage) {
      htmlRegex.lastIndex = 0;
      while ((match = htmlRegex.exec(lineContent)) !== null) {
        const startCol = match.index + 1;
        const endCol = startCol + match[0].length;
        if (pos.column >= startCol && pos.column <= endCol) {
          foundImage = { url: match[1], range: new monaco.Range(pos.lineNumber, startCol, pos.lineNumber, endCol) };
          break;
        }
      }
    }

    if (foundImage) {
      const resolvedUrl = _resolveImageUrl(foundImage.url);
      if (resolvedUrl) {
        console.warn('[DIAG] Image link detected!', { 
          line: pos.lineNumber, 
          col: pos.column, 
          url: resolvedUrl 
        });

        const editorNode = _editor.getDomNode();
        const editorRect = editorNode.getBoundingClientRect();
        
        // Get pixel position of the start of the match
        const pixelPos = _editor.getScrolledVisiblePosition(foundImage.range.getStartPosition());
        const lineHeight = _editor.getOption(monaco.editor.EditorOption.lineHeight);

        const rect = {
          left: editorRect.left + pixelPos.left,
          top: editorRect.top + pixelPos.top,
          right: editorRect.left + pixelPos.left + 20,
          bottom: editorRect.top + pixelPos.top + lineHeight
        };

        MonacoImagePreviewComponent.show(resolvedUrl, rect);
        return;
      }
    }

    MonacoImagePreviewComponent.hide();
  }

  return {
    /**
     * Activate the service for a specific editor instance
     * @param {Object} editor - Monaco Editor instance
     */
    activate(editor) {
      this.deactivate(); // Cleanup previous if any
      _editor = editor;
      
      if (_editor) {
        _mouseMoveListener = _editor.onMouseMove((e) => _handleMouseMove(e));
      }
      
      // Also hide on scroll or focus loss
      if (_editor) {
        _editor.onDidScrollChange(() => MonacoImagePreviewComponent.hide());
        _editor.onDidBlurEditorWidget(() => MonacoImagePreviewComponent.hide());
      }
    },

    /**
     * Disable the service
     */
    deactivate() {
      if (_mouseMoveListener) {
        _mouseMoveListener.dispose();
        _mouseMoveListener = null;
      }
      _editor = null;
      if (window.MonacoImagePreviewComponent) MonacoImagePreviewComponent.hide();
    },

    /**
     * Legacy Init (optional now, but kept for compatibility)
     */
    init() {
      // Logic moved to activate(editor)
    }
  };
})();

window.MonacoHoverService = MonacoHoverService;
