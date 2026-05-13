/**
 * SyncService.js
 * 
 * Handles position synchronization between different application modes 
 * (Read, Edit, Comment, Collect).
 */
const SyncService = (() => {
  'use strict';

  /**
   * Captures a sync context snapshot from the Read View.
   * Logic migrated from ChangeActionViewBar to centralize syncing responsibility.
   */
  function captureReadViewSyncData() {
    const sel = window.getSelection();
    const mdContent = document.getElementById('md-content');
    const viewer = document.getElementById('md-viewer-mount');

    if (!mdContent || !viewer) return { scrollPct: 0 };

    // 1. Check for Selection first
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      if (mdContent.contains(range.commonAncestorContainer)) {
        const node = range.startContainer;
        let el = node.nodeType === 1 ? node : node.parentElement;
        
        // ── Character Offset Anchoring (New) ──
        let srcEl = el;
        while (srcEl && srcEl !== mdContent && !srcEl.hasAttribute('data-src-start')) {
          srcEl = srcEl.parentElement;
        }

        if (srcEl && srcEl !== mdContent) {
          const srcStart = parseInt(srcEl.getAttribute('data-src-start'), 10);
          const selectionText = sel.toString();
          // For block-level anchors, we don't add relativeOffset because:
          // 1. HTML-rendered text nodes don't map 1:1 to source chars (escaping, syntax stripping)
          // 2. The inline <span> children have their own data-src-start which is more precise
          // So we use srcEl's own data-src-start as the anchor for scroll-to,
          // and let Monaco use the closest offset to find the actual selection.
          const finalSrcStart = srcStart;
          const finalSrcEnd = finalSrcStart + selectionText.length;

          return { 
            srcStart: finalSrcStart, 
            srcEnd: finalSrcEnd, 
            selectionText, 
            isRealSelection: true,
            line: parseInt(srcEl.getAttribute('data-line'), 10) || 1
          };
        }

        // ── Legacy Line-based Fallback ──
        while (el && el !== mdContent && !el.hasAttribute('data-line') && !el.hasAttribute('data-source-line')) {
          el = el.parentElement;
        }

        if (el) {
          const line = parseInt(el.getAttribute('data-line') || el.getAttribute('data-source-line'), 10);
          const selectionText = sel.toString();
          
          let offset = 0;
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
          let n;
          while (n = walker.nextNode()) {
            if (n === range.startContainer) {
              offset += range.startOffset;
              break;
            }
            offset += n.textContent.length;
          }

          return { line, offset, length: selectionText.length, selectionText, isRealSelection: true };
        }
      }
    }

    // 2. Fallback: Center Visible Line
    const viewerRect = viewer.getBoundingClientRect();
    const centerX = viewerRect.left + (viewerRect.width / 2);
    const centerY = viewerRect.top + (viewerRect.height / 2);
    
    let centerEl = document.elementFromPoint(centerX, centerY);
    while (centerEl && centerEl !== mdContent && !centerEl.hasAttribute('data-line') && !centerEl.hasAttribute('data-source-line')) {
      centerEl = centerEl.parentElement;
    }
    
    if (centerEl) {
      // ── Character Offset Anchoring (New) ──
      let srcEl = centerEl;
      while (srcEl && srcEl !== mdContent && !srcEl.hasAttribute('data-src-start')) {
        srcEl = srcEl.parentElement;
      }
      
      if (srcEl) {
        const srcStart = parseInt(srcEl.getAttribute('data-src-start'), 10);
        return { 
          srcStart, 
          srcEnd: srcStart, 
          isRealSelection: false,
          line: parseInt(srcEl.getAttribute('data-line'), 10) || 1
        };
      }
    }

    const scrollPct = viewer.scrollTop / (viewer.scrollHeight - viewer.clientHeight || 1);
    return { scrollPct, isRealSelection: false };
  }

  /**
   * Captures a sync context snapshot from the Monaco Editor.
   */
  function captureEditorSyncData() {
    if (!window.MonacoService || !window.MonacoService.isInitialized()) return {};
    const editor = window.MonacoService.getInstance();
    const model = editor.getModel();
    const selection = editor.getSelection();
    
    const srcStart = model.getOffsetAt(selection.getStartPosition());
    const srcEnd = model.getOffsetAt(selection.getEndPosition());
    const selectionText = model.getValueInRange(selection);
    
    return {
      srcStart,
      srcEnd,
      selectionText,
      isRealSelection: !selection.isEmpty(),
      line: selection.startLineNumber
    };
  }

  /**
   * Scrolls the Edit View to match a given context.
   */
  function scrollEditorToLine(context) {
    if (window.MonacoSyncService && window.MonacoService) {
      window.MonacoSyncService.syncCursor(window.MonacoService, context);
    }
  }

  /**
   * Synchronizes the Read View to match a given context (Offset-based).
   */
  function syncReadView(context = {}) {
    const viewer = document.getElementById('md-viewer-mount');
    const mdContent = document.getElementById('md-content');
    if (!viewer || !mdContent) return;

    const { srcStart, isRealSelection, selectionText } = context;

    let attempts = 0;
    const maxAttempts = 10;
    let lastTop = -1;
    let stableCount = 0;

    const trySync = () => {
      let target = null;

      // 1. Precise Offset Matching
      if (srcStart !== undefined) {
        const allElements = Array.from(mdContent.querySelectorAll('[data-src-start]'));
        let bestMatch = null;
        let minRange = Infinity;

        allElements.forEach(el => {
          const start = parseInt(el.getAttribute('data-src-start'), 10);
          const end = parseInt(el.getAttribute('data-src-end'), 10);
          
          if (srcStart >= start && srcStart <= end) {
            const range = end - start;
            if (range < minRange) {
              minRange = range;
              bestMatch = el;
            }
          }
        });
        target = bestMatch;
      }

      // 2. Legacy Line Fallback (Only if offset fails)
      if (!target && context.line) {
        target = mdContent.querySelector(`[data-line="${context.line}"], [data-source-line="${context.line}"]`);
      }
      
      if (target) {
        // ── SMART OPEN: Expand parent <details> if target is hidden ──
        let current = target;
        while (current && current !== mdContent) {
          if (current.tagName === 'DETAILS' && !current.open) {
            current.open = true;
          }
          current = current.parentElement;
        }

        const currentTop = target.getBoundingClientRect().top + window.scrollY;
        if (Math.abs(currentTop - lastTop) < 0.5) stableCount++;
        else stableCount = 0;
        lastTop = currentTop;

          // Ensure we wait for layout stability (especially for Mermaid/Images)
        if (stableCount >= 2 || attempts >= maxAttempts - 1) {
          window._suppressScrollSync = true;
          
          // Proportional Scroll within block for large elements
          const start = parseInt(target.getAttribute('data-src-start'), 10);
          const end = parseInt(target.getAttribute('data-src-end'), 10);
          const blockRect = target.getBoundingClientRect();
          
          if (srcStart !== undefined && !isNaN(start) && !isNaN(end) && end > start && blockRect.height > viewer.clientHeight) {
            const pct = (srcStart - start) / (end - start);
            const scrollOffset = (blockRect.height * pct) - (viewer.clientHeight / 2);
            viewer.scrollTop = (viewer.scrollTop + blockRect.top + scrollOffset) - viewer.getBoundingClientRect().top;
          } else {
            target.scrollIntoView({ behavior: 'auto', block: 'center' });
          }

          requestAnimationFrame(() => { window._suppressScrollSync = false; });

          if (viewer._scrollObserver) {
            viewer._scrollObserver.disconnect();
            viewer._scrollObserver = null;
          }

          // Handle Selection Highlighting in Read View
          if (isRealSelection && selectionText) {
            try {
              const selection = window.getSelection();
              selection.removeAllRanges();
              const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null, false);
              let found = false;
              let node;
              while ((node = walker.nextNode()) && !found) {
                const idx = node.textContent.indexOf(selectionText);
                if (idx !== -1) {
                  const range = document.createRange();
                  range.setStart(node, idx);
                  range.setEnd(node, idx + selectionText.length);
                  selection.addRange(range);
                  found = true;
                }
              }
            } catch(_e) {}
          }
          return;
        }
      }

      attempts++;
      if (attempts < maxAttempts) {
        requestAnimationFrame(trySync);
      }
    };

    requestAnimationFrame(trySync);
  }

  return {
    captureReadViewSyncData,
    captureEditorSyncData,
    scrollEditorToLine,
    syncReadView,
    // Keep legacy name for backward compatibility during transition if needed
    scrollReadViewToLine: (line, text, sel) => syncReadView({ line, selectionText: text, isRealSelection: sel })
  };
})();

window.SyncService = SyncService;
