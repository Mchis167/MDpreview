/**
 * MarkdownLogicService — Headless service for Markdown transformations and cursor synchronization.
 * This service contains pure algorithms and logic extracted from the legacy EditorModule.
 */
const MarkdownLogicService = (() => {

  /**
   * Applies a markdown transformation (Bold, Italic, Header, etc.) to a textarea.
   * @param {HTMLTextAreaElement} textarea - The target textarea element
   * @param {string} action - The action to perform (e.g., 'h1', 'b', 'ul')
   */
  function applyAction(textarea, action) {
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    // ── Helper: Wrap Toggle (Bold, Italic, Code, etc.) ──
    const wrapToggle = (symbol, placeholder) => {
      const isWrapped = selected.startsWith(symbol) && selected.endsWith(symbol);
      if (isWrapped) {
        textarea.setRangeText(selected.substring(symbol.length, selected.length - symbol.length), start, end, 'select');
      } else {
        const newText = selected || placeholder;
        textarea.setRangeText(`${symbol}${newText}${symbol}`, start, end, 'select');
        if (!selected) {
          textarea.setSelectionRange(start + symbol.length, start + symbol.length + placeholder.length);
        }
      }
    };

    // ── Helper: Line Toggle (Quote, List, Task) ──
    const lineToggle = (prefix, placeholder) => {
      let lineStart = text.lastIndexOf('\n', start - 1) + 1;
      let lineEnd = text.indexOf('\n', end);
      if (lineEnd === -1) lineEnd = text.length;
      const lineText = text.substring(lineStart, lineEnd);
      const hasPrefix = lineText.startsWith(prefix);

      if (hasPrefix) {
        textarea.setSelectionRange(lineStart, lineEnd);
        textarea.setRangeText(lineText.substring(prefix.length), lineStart, lineEnd, 'select');
      } else {
        textarea.setSelectionRange(lineStart, lineEnd);
        const newText = lineText || (selected || placeholder);
        textarea.setRangeText(`${prefix}${newText}`, lineStart, lineEnd, 'select');
      }
    };

    // ── Helper: Header Toggle (H1-H6) ──
    const headerToggle = (level) => {
      const prefix = '#'.repeat(level) + ' ';
      let lineStart = text.lastIndexOf('\n', start - 1) + 1;
      let lineEnd = text.indexOf('\n', end);
      if (lineEnd === -1) lineEnd = text.length;
      const lineText = text.substring(lineStart, lineEnd);
      const match = lineText.match(/^(#{1,6})\s/);
      
      if (match) {
        const existingLevel = match[1].length;
        textarea.setSelectionRange(lineStart, lineEnd);
        if (existingLevel === level) {
          textarea.setRangeText(lineText.substring(match[0].length), lineStart, lineEnd, 'select');
        } else {
          textarea.setRangeText(`${prefix}${lineText.substring(match[0].length)}`, lineStart, lineEnd, 'select');
        }
      } else {
        textarea.setSelectionRange(lineStart, lineEnd);
        textarea.setRangeText(`${prefix}${lineText || (selected || 'Heading')}`, lineStart, lineEnd, 'select');
      }
    };

    switch (action) {
      case 'h1': headerToggle(1); break;
      case 'h2': headerToggle(2); break;
      case 'h3': headerToggle(3); break;
      case 'h':  headerToggle(4); break;
      case 'h5': headerToggle(5); break;
      case 'h6': headerToggle(6); break;
      case 'b': wrapToggle('**', 'bold text'); break;
      case 'i': wrapToggle('*', 'italic text'); break;
      case 'bi': wrapToggle('***', 'bold italic'); break;
      case 's': wrapToggle('~~', 'strikethrough'); break;
      case 'c': wrapToggle('`', 'code'); break;
      case 'q': lineToggle('> ', 'Quote'); break;
      case 'ul': lineToggle('* ', 'List item'); break;
      case 'ol': lineToggle('1. ', 'List item'); break;
      case 'tl': lineToggle('- [ ] ', 'Task'); break;
      case 'tl-checked': lineToggle('- [x] ', 'Task done'); break;
      case 'l': 
        textarea.setRangeText(`[${selected || 'link text'}](url)`, start, end, 'select');
        textarea.setSelectionRange(start + (selected ? selected.length : 9) + 2, start + (selected ? selected.length : 9) + 5);
        break;
      case 'img':
        textarea.setRangeText(`![${selected || 'alt text'}](image-url)`, start, end, 'select');
        textarea.setSelectionRange(start + (selected ? selected.length : 8) + 3, start + (selected ? selected.length : 8) + 12);
        break;
      case 'hr': textarea.setRangeText(`\n---\n`, start, end, 'select'); break;
      case 'cb': textarea.setRangeText(`\`\`\`\n${selected || 'code block'}\n\`\`\``, start, end, 'select'); break;
      case 'tb': textarea.setRangeText(`\n| col1 | col2 |\n|------|------|\n| cell | cell |\n`, start, end, 'select'); break;
      case 'fn': textarea.setRangeText(`${selected || 'text'}[^1]`, start, end, 'select'); break;
    }
    
    textarea.focus();
  }

  /**
   * Internal helper: Measures the pixel Y position of a character index using a mirror DIV.
   * Accounts for word-wrap, padding, and font styles.
   */
  function _calculatePixelYWithMirror(textarea, charIndex) {
    if (!textarea) return 0;
    
    const style = getComputedStyle(textarea);
    const mirror = document.createElement('div');
    
    // Copy essential layout styles
    const stylesToCopy = [
      'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 
      'paddingTop', 'paddingLeft', 'paddingRight', 'paddingBottom',
      'width', 'boxSizing', 'whiteSpace', 'wordWrap', 'wordBreak',
      'letterSpacing', 'textTransform'
    ];
    
    stylesToCopy.forEach(prop => mirror.style[prop] = style[prop]);
    
    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.height = 'auto';
    mirror.style.left = '-9999px';
    mirror.style.top = '0';
    
    // Important: Use clientWidth to account for scrollbar
    mirror.style.width = textarea.clientWidth + 'px';
    
    // Get text before the index
    const textBefore = textarea.value.substring(0, charIndex);
    mirror.textContent = textBefore;
    
    const span = document.createElement('span');
    span.textContent = '\u200b'; 
    mirror.appendChild(span);
    
    document.body.appendChild(mirror);
    const y = span.offsetTop;
    document.body.removeChild(mirror);
    
    return y;
  }

  /**
   * Synchronizes cursor and scroll position using the "Sandwich Strategy" (Fuzzy Matching).
   */
  function syncCursor(textarea, context = {}) {
    if (!textarea) return;
    
    textarea.focus();
    const text = textarea.value;
    let targetChar = -1;
    let targetCharMatchLen = 0;

    // ── 1. Precise Selection Match ──
    if (context.line && context.selectionText && context.selectionText.length > 2) {
      const lines = text.split('\n');

      // Apply accumulated delta from previous Self-Correction to pre-adjust prediction
      const fileKey = context._fileKey || 'default';
      const knownDelta = (syncCursor._deltaCache && syncCursor._deltaCache[fileKey]) || 0;
      const adjustedLine = Math.max(1, context.line - knownDelta);

      let startOfLine = 0;
      const maxLine = Math.min(adjustedLine - 1, lines.length);
      for (let i = 0; i < maxLine; i++) {
        startOfLine += (lines[i] ? lines[i].length : 0) + 1;
      }

      const predictedPos = startOfLine + (context.offset || 0);
      const sample = text.substring(predictedPos, predictedPos + context.selectionText.length);
      
      //
      if (sample === context.selectionText) {
        targetChar = predictedPos;
        //      } else {
        // Smart Fuzzy Regex Match (Sandwich Strategy)
        //        // Normalize smart/curly quotes before splitting so they don't attach to words
        const normalizedSelection = context.selectionText
          .replace(/[\u201c\u201d\u2018\u2019\u00ab\u00bb]/g, ' ');
        const allWords = normalizedSelection.trim().split(/[\s,.\-()""''«»\[\]{}:;!?\/\\]+/).filter(w => w.length > 1);
        if (allWords.length > 0) {
          // console.log('🔍 Starting Fuzzy Match (Sandwich Strategy)...');
          const headWords = allWords.slice(0, 5);
          const tailWords = allWords.length > 10 ? allWords.slice(-5) : [];
          
          // Build a pattern that allows other words/chars in between (up to 100 chars)
          const buildPattern = (words) => words
            .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('[^\\n]{0,100}?');
          
          let fuzzyPattern = buildPattern(headWords);
          if (tailWords.length > 0) {
            fuzzyPattern += '.*?' + buildPattern(tailWords);
          }
          
          const findBestMatch = (pattern, isLiteral = false) => {
            try {
              // 'u' for unicode, 's' to allow dot to match newlines if needed, 'i' for case-insensitive
              const regex = new RegExp(pattern, (isLiteral ? 'g' : 'gi') + 'u');
              let match;
              let best = null;
              let minDistance = Infinity;

              while ((match = regex.exec(text)) !== null) {
                const matchIdx = match.index;
                const matchLine = text.substring(0, matchIdx).split('\n').length;
                const distance = Math.abs(matchLine - context.line);
                if (distance < minDistance) {
                  minDistance = distance;
                  best = { index: matchIdx, length: match[0].length, line: matchLine, distance };
                }
              }
              return best;
            } catch(e) { return null; }
          };

          // Try 1: Sequence Fuzzy Match (High Precision)
          let matchResult = findBestMatch(fuzzyPattern);
          
          // Try 2: Triple-Word Anchor (Extreme Precision Fallback)
          if (!matchResult && allWords.length >= 3) {
            //            // Find a sequence of 3 words that is most likely to be unique
            for (let i = 0; i <= allWords.length - 3; i++) {
              const triple = allWords.slice(i, i + 3);
              const anchorPattern = buildPattern(triple);
              const result = findBestMatch(anchorPattern);
              if (result && result.distance < 100) {
                matchResult = result;
                break;
              }
            }
          }

          // Try 3: Best Single Word (Last Resort)
          if (!matchResult && allWords.length > 0) {
            const bestWord = allWords.sort((a, b) => b.length - a.length)[0];
            if (bestWord.length >= 4) {
              matchResult = findBestMatch(bestWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), true);
            }
          }

          if (matchResult) {
            // ── Sanity Check ──
            if (matchResult.distance > 150) {
              targetChar = -1;
            } else {
              targetChar = matchResult.index;
              targetCharMatchLen = matchResult.length;

              // ── Prefix Recovery: scan backward to recover stripped short words ──
              const trimmedNorm = normalizedSelection.trim(); // strip phantom \n from sel.toString()
              const firstWord = allWords[0];
              const prefixLen = trimmedNorm.indexOf(firstWord);
              if (prefixLen > 0 && targetChar >= prefixLen) {
                const candidateStart = targetChar - prefixLen;
                const lineAtCandidate = text.substring(0, candidateStart).split('\n').length;
                const lineAtMatch = text.substring(0, targetChar).split('\n').length;
                if (lineAtCandidate === lineAtMatch) {                  targetChar = candidateStart;
                  targetCharMatchLen += prefixLen;
                }
              }

              // ── End Extension: extend to last significant word to avoid tail truncation ──
              const endAnchorWord = allWords.filter(w => w.length > 3).slice(-1)[0];
              if (endAnchorWord) {
                const searchFrom = targetChar + Math.max(1, targetCharMatchLen - endAnchorWord.length - 5);
                const searchCap  = targetChar + trimmedNorm.length + 100;
                const endWordPos = text.indexOf(endAnchorWord, searchFrom);
                if (endWordPos !== -1 && endWordPos < searchCap) {
                  const trueEnd = endWordPos + endAnchorWord.length;
                  if (trueEnd > targetChar + targetCharMatchLen) {                    targetCharMatchLen = trueEnd - targetChar;
                  }
                }
              }
            }
          }

          if (targetChar !== -1) {
            textarea.setSelectionRange(targetChar, targetChar + targetCharMatchLen);
            context._matchLen = targetCharMatchLen;
            
            // ── Self-Correction + Delta Cache Update ──
            const foundLine = text.substring(0, targetChar).split('\n').length;
            if (foundLine !== context.line) {
              const delta = context.line - foundLine;
              const fileKey = context._fileKey || 'default';
              if (!syncCursor._deltaCache) syncCursor._deltaCache = {};
              syncCursor._deltaCache[fileKey] = delta;
              context.line = foundLine;
            }
          }
        }
      }
    }

    // ── 2. Simple Line Fallback ──
    if (targetChar === -1 && context.line) {      const lines = text.split('\n');
      let absPos = 0;
      const targetLineIdx = Math.min(context.line - 1, lines.length - 1);
      for (let i = 0; i < targetLineIdx; i++) {
        absPos += lines[i].length + 1;
      }
      targetChar = absPos + (context.offset || 0);
    }

    // ── 4. Scrolling Logic (Pixel Perfect Mirroring) ──
    requestAnimationFrame(() => {
      if (targetChar !== -1) {
        const pixelY = _calculatePixelYWithMirror(textarea, targetChar);
        const viewportHeight = textarea.clientHeight;
        const finalScroll = pixelY - (viewportHeight / 2);

        window._suppressScrollSync = true;
        textarea.scrollTop = finalScroll;
        requestAnimationFrame(() => { window._suppressScrollSync = false; });

        if (context.isRealSelection) {
          const selectionLength = (context._matchLen !== undefined) ? context._matchLen : (context.selectionText ? context.selectionText.length : (context.length || 0));
          textarea.setSelectionRange(targetChar, targetChar + selectionLength);
        } else {
          textarea.setSelectionRange(targetChar, targetChar);
        }
      } else if (context.scrollPct) {        textarea.scrollTop = context.scrollPct * (textarea.scrollHeight - textarea.clientHeight);
      }    });
  }

  return {
    applyAction,
    syncCursor
  };
})();
