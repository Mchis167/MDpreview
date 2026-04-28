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
      const line = parseInt(centerEl.getAttribute('data-line') || centerEl.getAttribute('data-source-line'), 10);
      
      const extractCleanText = (node) => {
        let text = "";
        node.childNodes.forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            text += child.textContent;
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const tagName = child.tagName.toUpperCase();
            const style = window.getComputedStyle(child);
            const isTechnicalTag = ['STYLE', 'DEFS', 'SCRIPT', 'METADATA', 'BUTTON', 'SVG'].includes(tagName);
            const isUI = isTechnicalTag || 
                         style.userSelect === 'none' ||
                         child.classList.contains('code-block-header') ||
                         child.hasAttribute('aria-hidden');
            
            if (!isUI) {
              text += extractCleanText(child);
            }
          }
        });
        return text;
      };

      const selectionText = extractCleanText(centerEl).trim().substring(0, 200);
      return { line, selectionText, isRealSelection: false };
    }

    // 3. Final Fallback: Proportional Scroll
    const scrollPct = viewer.scrollTop / (viewer.scrollHeight - viewer.clientHeight || 1);
    return { scrollPct, isRealSelection: false };
  }

  /**
   * Captures a sync context snapshot from the Edit View (textarea).
   */
  function captureEditorSyncData() {
    const textarea = document.getElementById('edit-textarea');
    if (!textarea) return {};

    const posStart = textarea.selectionStart;
    const posEnd = textarea.selectionEnd;
    const text = textarea.value;
    const lines = text.split('\n');

    const textBefore = text.substring(0, posStart);
    const lineIndex = textBefore.split('\n').length - 1;
    const line = lineIndex + 1;

    let selectionText = text.substring(posStart, posEnd);
    let isRealSelection = selectionText.trim().length > 0;

    if (!isRealSelection) {
      const currentLineText = lines[lineIndex] || '';
      const prevLineText = lines[lineIndex - 1] || '';
      const nextLineText = lines[lineIndex + 1] || '';
      const isNoisy = (str) => !str.trim() || str.trim().match(/^[#*`_\-+=~> ]+$/);

      if (isNoisy(currentLineText)) {
        selectionText = (!isNoisy(prevLineText) ? prevLineText : nextLineText).replace(/[#*`_~\[\]()>\-+]/g, ' ').trim();
      } else {
        selectionText = currentLineText.replace(/[#*`_~\[\]()>\-+]/g, ' ').trim();
      }
    }

    const scrollPct = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight || 1);
    return { line, selectionText, scrollPct, isRealSelection, offset: 0 };
  }

  /**
   * Scrolls the Edit View to match a given line/offset.
   */
  function scrollEditorToLine(lineNum, offset = 0, length = 0) {
    const textarea = document.getElementById('edit-textarea');
    if (!textarea || !lineNum) return;

    if (window.MarkdownLogicService) {
        const fileKey = window.AppState?.currentFile || 'default';
        window.MarkdownLogicService.syncCursor(textarea, { line: lineNum, offset, length, _fileKey: fileKey });
    }
  }

  /**
   * Scrolls the Read View to the element that best matches (line, selectionText).
   */
  function scrollReadViewToLine(line, selectionText = '', isRealSelection = false) {
    const viewer = document.getElementById('md-viewer-mount');
    const mdContent = document.getElementById('md-content');
    if (!viewer || !mdContent) return;

    let attempts = 0;
    const maxAttempts = 5;
    let lastTop = -1;
    let stableCount = 0;

    const tryScroll = () => {
      let target = null;

      if (selectionText && selectionText.trim().length > 3) {
        const cleanSearchText = selectionText.replace(/[#*`_~\[\]()>\-+]/g, ' ').trim();
        const words = cleanSearchText.split(/\s+/).filter(w => w.length > 2);

        if (words.length > 0) {
          const allElements = Array.from(mdContent.querySelectorAll('[data-line], [data-source-line]'));
          let bestMatch = null;
          let maxScore = 0;
          let bestDistance = Infinity;
          const searchRange = 60;

          allElements.forEach(el => {
            const elLine = parseInt(el.getAttribute('data-line') || el.getAttribute('data-source-line'), 10);
            if (Math.abs(elLine - line) > searchRange) return;

            const content = el.textContent;
            let score = 0;
            words.forEach(word => {
              if (content.includes(word)) score++;
            });

            const distance = Math.abs(elLine - line);
            if (score > maxScore || (score === maxScore && score > 0 && distance < bestDistance)) {
              maxScore = score;
              bestMatch = el;
              bestDistance = distance;
            }
          });

          if (bestMatch && maxScore >= Math.min(words.length, 1)) {
            target = bestMatch;
          }
        }
      }

      if (!target) {
        target = mdContent.querySelector(`[data-line="${line}"], [data-source-line="${line}"]`);
      }
      
      if (target) {
        const currentTop = target.getBoundingClientRect().top + window.scrollY;
        if (Math.abs(currentTop - lastTop) < 1) stableCount++;
        else stableCount = 0;
        lastTop = currentTop;

        if (stableCount >= 3 || attempts >= maxAttempts - 1) {
          window._suppressScrollSync = true;
          target.scrollIntoView({ behavior: 'auto', block: 'center' });
          requestAnimationFrame(() => { window._suppressScrollSync = false; });

          if (viewer._scrollObserver) {
            viewer._scrollObserver.disconnect();
            viewer._scrollObserver = null;
          }

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
              if (!found) {
                const range = document.createRange();
                range.selectNodeContents(target);
                selection.addRange(range);
              }
            } catch(_e) {}
          }
          return;
        }
      }

      attempts++;
      if (attempts < maxAttempts) {
        requestAnimationFrame(tryScroll);
      }
    };

    requestAnimationFrame(tryScroll);
  }

  return {
    captureReadViewSyncData,
    captureEditorSyncData,
    scrollEditorToLine,
    scrollReadViewToLine
  };
})();

window.SyncService = SyncService;
