/**
 * EditorUtil — Helper functions for advanced editor interactions.
 * Purpose: Provide coordinate calculation and text manipulation utilities.
 */
const EditorUtil = (() => {
  'use strict';

  /**
   * Calculates the (x, y) coordinates of the cursor in a textarea.
   * @param {HTMLTextAreaElement} textarea 
   * @returns {{ top: number, left: number, lineHeight: number }}
   */
  function getCursorCoordinates(textarea) {
    const { selectionStart, value } = textarea;
    
    // Create a ghost element to mirror the textarea
    const ghost = document.createElement('div');
    const style = window.getComputedStyle(textarea);
    
    // Mirror all relevant styles
    const properties = [
      'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderStyle',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust',
      'lineHeight', 'fontFamily', 'textAlign', 'textTransform', 'textIndent', 'textDecoration',
      'letterSpacing', 'wordSpacing', 'tabSize', 'MozTabSize'
    ];

    properties.forEach(prop => {
      ghost.style[prop] = style[prop];
    });

    ghost.style.position = 'absolute';
    ghost.style.visibility = 'hidden';
    ghost.style.whiteSpace = 'pre-wrap';
    ghost.style.wordWrap = 'break-word';
    ghost.style.top = '0';
    ghost.style.left = '-9999px';

    // The content before the cursor
    const contentBefore = value.substring(0, selectionStart);
    ghost.textContent = contentBefore;

    // Add a marker span
    const marker = document.createElement('span');
    marker.textContent = value.substring(selectionStart, selectionStart + 1) || '.';
    ghost.appendChild(marker);

    document.body.appendChild(ghost);
    
    const rect = marker.getBoundingClientRect();
    const textareaRect = textarea.getBoundingClientRect();
    
    // Calculate final position relative to the textarea and viewport
    const coordinates = {
      top: textareaRect.top + rect.top - ghost.getBoundingClientRect().top - textarea.scrollTop,
      left: textareaRect.left + rect.left - ghost.getBoundingClientRect().left - textarea.scrollLeft,
      lineHeight: parseInt(style.lineHeight)
    };

    document.body.removeChild(ghost);
    
    return coordinates;
  }

  return {
    getCursorCoordinates
  };
})();

window.EditorUtil = EditorUtil;
