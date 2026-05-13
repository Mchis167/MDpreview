/**
 * MarkdownLogicService
 * ─────────────────────────────────────────────────────────────────
 * Headless service for Markdown transformations.
 * Contains pure algorithms for smart editing and list management.
 *
 * Public API:
 *   computeSmartEnter(value, selStart, selEnd)
 *   computeListIndent(value, selStart, selEnd, direction)
 *
 * Design principle: No direct dependencies on Monaco API or DOM.
 * Returns transformation instructions (newValue, range, text) for consumers.
 */
const MarkdownLogicService = (() => {
  'use strict';

  /**
   * Computes the new value and cursor position after pressing Enter.
   * Handles auto-continuing and exiting lists.
   *
   * @param {string} value - Textarea value
   * @param {number} selStart - Selection start index
   * @param {number} selEnd - Selection end index
   * @returns {Object|null} { newValue, newCursorPos } or null if no action
   */
  function computeSmartEnter(value, selStart, selEnd) {
    if (selStart !== selEnd) return null;

    // Use original value for indices to avoid shift issues with CRLF
    const lineStart = value.lastIndexOf('\n', selStart - 1) + 1;
    let lineEnd = value.indexOf('\n', selStart);
    if (lineEnd === -1) lineEnd = value.length;

    // Get current line and remove trailing \r if any
    let currentLine = value.substring(lineStart, selStart).replace(/\r$/, '');
    const isAtEndOfLine = lineEnd === -1 || selStart === lineEnd || (selStart === lineEnd - 1 && value[lineEnd - 1] === '\r');

    const patterns = [
      { type: 'task', regex: /^(\s*)-\s\[([ xX])\](\s|$)/ },
      { type: 'unordered', regex: /^(\s*)([-*+])(\s|$)/ },
      { type: 'ordered', regex: /^(\s*)(\d+(?:\.\d+)*\.)(\s|$)/ }
    ];








    let match = null;
    let listType = null;
    for (const p of patterns) {
      match = currentLine.match(p.regex);
      if (match) {
        listType = p.type;
        break;
      }
    }

    if (!match) {
      // console.log('[MarkdownLogicService] computeSmartEnter: No list match found.');
      return null;
    }
    
    const prefix = match[0];
    const indent = match[1];
    const content = currentLine.substring(prefix.length);

    if (content.trim() === '') {
      // Exit list

      const newValue = value.substring(0, lineStart) + value.substring(selStart);
      return { newValue, newCursorPos: lineStart };
    }

    if (!isAtEndOfLine) return null;

    let newPrefix = '';
    let nextNum = null;
    let parentPrefix = '';
    if (listType === 'task') {
      newPrefix = `${indent}- [ ] `;
    } else if (listType === 'unordered') {
      newPrefix = `${indent}${match[2]} `;
    } else if (listType === 'ordered') {
      const parts = match[2].slice(0, -1).split('.');
      const last = parseInt(parts.pop(), 10);
      nextNum = last + 1;
      parentPrefix = parts.length > 0 ? parts.join('.') + '.' : '';
      newPrefix = `${indent}${parentPrefix}${nextNum}. `;
    }


    let newValue = value.substring(0, selStart) + '\n' + newPrefix + value.substring(selStart);
    const newCursorPos = selStart + 1 + newPrefix.length;

    // Bug 4: Re-numbering logic for Ordered List
    if (listType === 'ordered' && nextNum !== null) {
      const lines = newValue.split('\n');
      const insertLineIdx = newValue.substring(0, newCursorPos).split('\n').length - 1;
      let changed = false;

      for (let i = insertLineIdx + 1; i < lines.length; i++) {
        const line = lines[i];
        const lineMatch = line.match(/^(\s*)(\d+(?:\.\d+)*\.)(\s|$)/);

        if (lineMatch && lineMatch[1] === indent) {
          const lParts = lineMatch[2].slice(0, -1).split('.');
          const lLast = parseInt(lParts.pop(), 10);
          const lPrefix = lParts.length > 0 ? lParts.join('.') + '.' : '';

          
          if (lPrefix === parentPrefix) {
             const updatedNum = lLast + 1;
             const content = line.substring(lineMatch[0].length).trim();
             lines[i] = `${indent}${lPrefix}${updatedNum}. ${content}`.trimEnd();
             if (!content) lines[i] += ' ';
             changed = true;
          } else {

            break; 
          }
        } else if (line.trim() === '') {
          continue;
        } else {
          break;
        }
      }
      if (changed) {
        newValue = lines.join('\n');
      }
    }

    const currentLineCountBefore = value.substring(0, lineStart).split('\n').length;

    // Calculate the range of the entire affected block
    let affectedLineEnd = lineEnd;
    if (listType === 'ordered' && newValue.length !== value.length + newPrefix.length + 1) {
      // If re-numbering happened, we need to find how many lines were affected
      const lines = value.split('\n');
      const startIdx = currentLineCountBefore - 1;
      let endIdx = startIdx + 1;
      const indent = match[1];
      const parts = match[2].slice(0, -1).split('.');
      const parentPrefix = parts.length > 1 ? parts.slice(0, -1).join('.') + '.' : '';


      
      while (endIdx < lines.length) {
        const line = lines[endIdx];
        const lineMatch = line.match(/^(\s*)(\d+(?:\.\d+)*\.)(\s|$)/);
        if (lineMatch && lineMatch[1] === indent) {
          const lParts = lineMatch[2].slice(0, -1).split('.');


          const lPrefix = lParts.length > 1 ? lParts.slice(0, -1).join('.') + '.' : '';
          if (lPrefix !== parentPrefix) break;
          endIdx++;
        } else if (line.trim() === '') {
          endIdx++;
          continue;
        } else {
          break;
        }
      }
      // Calculate pixel offset for the end of the block
      let offset = 0;
      for (let i = 0; i < endIdx; i++) offset += lines[i].length + 1;
      affectedLineEnd = Math.min(value.length, offset - 1);
    }

    const lineCountBeforeResult = value.substring(0, lineStart).split('\n').length;
    const lineCountAfterResult = value.substring(0, affectedLineEnd).split('\n').length;

    return {
      newValue,
      range: {
        startLineNumber: lineCountBeforeResult,
        startColumn: 1,
        endLineNumber: lineCountAfterResult,
        endColumn: value.substring(value.lastIndexOf('\n', affectedLineEnd - 1) + 1, affectedLineEnd).length + 1
      },
      text: newValue.substring(lineStart, newValue.length - (value.length - affectedLineEnd)),
      newCursorPos
    };



  }

  /**
   * Computes the new value and cursor position for Tab/Shift+Tab.
   * Handles indenting and dedenting lists.
   *
   * @param {string} value - Textarea value
   * @param {number} selStart - Selection start
   * @param {number} selEnd - Selection end
   * @param {'in'|'out'} direction - Indent in or out
   * @returns {Object|null}
   */
  function computeListIndent(value, selStart, selEnd, direction) {
    const textBefore = value.substring(0, selStart);
    const codeBlockCount = (textBefore.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) return null;

    const lineStart = value.lastIndexOf('\n', selStart - 1) + 1;
    let lineEnd = value.indexOf('\n', selEnd);
    if (lineEnd === -1) lineEnd = value.length;

    const linesInSelection = value.substring(lineStart, lineEnd).split('\n');
    const listRegex = /^(\s*)([-*+]|(\d+(?:\.\d+)*\.))(\s|$)/;

    if (!linesInSelection.some(l => listRegex.test(l))) {
      return null;
    }

    // 1. Apply Indentation Change
    const modifiedSelectedLines = linesInSelection.map(line => {
      if (direction === 'in') {
        const currentIndent = (line.match(/^(\s*)/)[0] || '').length;
        if (currentIndent < 12) return '  ' + line;
      } else {
        const match = line.match(/^(\s{1,2})/);
        if (match) return line.substring(match[0].length);
      }
      return line;
    });

    // 2. Full Normalization
    const allLines = value.split('\n');
    const startLineIdx = value.substring(0, lineStart).split('\n').length - 1;
    
    // Replace original lines with modified ones in the full document array
    for (let i = 0; i < modifiedSelectedLines.length; i++) {
      allLines[startLineIdx + i] = modifiedSelectedLines[i];
    }
    
    // Normalize markers for the whole list block
    const originalLines = value.split('\n');
    const originalFirstLine = originalLines[startLineIdx];
    const normalizedLines = _normalizeOrderedListMarkers(allLines, startLineIdx);
    
    // Find the true start of the list block for range calculation
    let blockStart = startLineIdx;
    while (blockStart > 0) {
      if (!listRegex.test(allLines[blockStart - 1]) && allLines[blockStart - 1].trim() !== '') break;
      blockStart--;
    }

    // 3. Calculate Deltas for cursor/selection

    // We need to compare before and after to get precise character offsets
    const newSelectedBlock = normalizedLines.slice(startLineIdx, startLineIdx + modifiedSelectedLines.length).join('\n');
    const firstLineDelta = normalizedLines[startLineIdx].length - originalFirstLine.length;
    const totalDelta = newSelectedBlock.length - value.substring(lineStart, lineEnd).length;

    const newValue = normalizedLines.join('\n');
    
    // Find where the list block actually ends in normalizedLines
    let blockEnd = startLineIdx + modifiedSelectedLines.length;
    while (blockEnd < normalizedLines.length) {
      if (!listRegex.test(normalizedLines[blockEnd]) && normalizedLines[blockEnd].trim() !== '') break;
      blockEnd++;
    }

    // CRITICAL FIX: The endColumn must be the length of the ORIGINAL line 
    // to ensure Monaco replaces the whole line, including any trailing characters 
    // from the previous (longer) marker.
    const originalEndLineContent = originalLines[blockEnd - 1] || '';
    
    const finalRange = {
      startLineNumber: blockStart + 1,
      startColumn: 1,
      endLineNumber: blockEnd, 
      endColumn: originalEndLineContent.length + 1
    };

    const replacementText = normalizedLines.slice(blockStart, blockEnd).join('\n');

    return {
      newValue,
      range: finalRange,
      text: replacementText,
      newCursorPos: selStart + firstLineDelta,
      newSelectionEnd: selEnd + totalDelta
    };
  }


  /**
   * Internal helper to normalize all ordered list markers in a block.
   * Scans up to find the start of the list, then scans down and fixes all markers.
   * 
   * @param {string[]} lines - Array of lines
   * @param {number} startIdx - Index of the line that changed
   * @returns {string[]} - The updated lines array
   */
  function _normalizeOrderedListMarkers(lines, startIdx) {
    const listRegex = /^(\s*)([-*+]|(\d+(?:\.\d+)*\.))(\s|$)/;
    const orderedRegex = /^(\s*)(\d+(?:\.\d+)*\.)(\s|$)/;
    const decompositionRegex = /^(\s*)(\d+(?:\.\d+)*\.)\s*(.*)$/;









    // 1. Find the true start of the list block
    let blockStart = startIdx;
    while (blockStart > 0) {
      if (!listRegex.test(lines[blockStart - 1]) && lines[blockStart - 1].trim() !== '') break;
      blockStart--;
    }

    // 2. Normalize from blockStart downwards
    const counters = {}; // { "indent-parentPrefix": count }
    const parentMarkers = {}; // { indent: marker }

    for (let i = blockStart; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(listRegex);
      
      if (!match) {
        if (line.trim() === '') continue; 
        break; 
      }

      const indent = match[1].length;
      const isOrdered = orderedRegex.test(line);

      if (isOrdered) {
        // Reset counters for all deeper indentation levels
        Object.keys(counters).forEach(k => {
          const kIndent = parseInt(k.split('-')[0], 10);
          if (kIndent > indent) delete counters[k];
        });

        // Determine parent prefix by looking at the closest higher indentation level
        let parentPrefix = '';
        const sortedParentIndents = Object.keys(parentMarkers)
          .map(Number)
          .filter(n => n < indent)
          .sort((a, b) => b - a); // Get the nearest smaller indent
          
        if (sortedParentIndents.length > 0) {
          const nearestIndent = sortedParentIndents[0];
          parentPrefix = parentMarkers[nearestIndent];
        }


        const counterKey = `${indent}-${parentPrefix}`;
        if (counters[counterKey] === undefined && i === blockStart) {
          const oMatch = line.match(orderedRegex);
          if (oMatch) {
            const parts = oMatch[2].slice(0, -1).split('.');
            const lastNum = parseInt(parts.pop(), 10);
            if (!isNaN(lastNum)) counters[counterKey] = lastNum - 1;
          }
        }
        counters[counterKey] = (counters[counterKey] || 0) + 1;
        
        const newMarker = `${parentPrefix}${counters[counterKey]}.`;
        
        // Use the robust decompositionRegex to extract content
        const markerMatch = line.match(decompositionRegex);
        const content = (markerMatch ? markerMatch[3] : '').trim();




        lines[i] = `${match[1]}${newMarker} ${content}`.trimEnd();

        if (!content) lines[i] += ' ';






        
        parentMarkers[indent] = newMarker;
      } else {
        // Unordered/Task - clear sequence for this indent level
        Object.keys(counters).forEach(k => {
          const kIndent = parseInt(k.split('-')[0], 10);
          if (kIndent >= indent) delete counters[k];
        });
        parentMarkers[indent] = ''; 
      }
    }
    return lines;
  }

  return {
    computeSmartEnter,
    computeListIndent
  };

})();
window.MarkdownLogicService = MarkdownLogicService;
