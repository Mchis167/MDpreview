/**
 * MarkdownLogicService
 * ─────────────────────────────────────────────────────────────────
 * Headless service for Markdown transformations and cursor synchronization.
 * Contains pure algorithms extracted from the legacy EditorModule.
 *
 * Public API:
 *   applyAction(textarea, action)  — Apply a formatting action to a textarea
 *   syncCursor(textarea, context)  — Sync cursor/scroll position in a textarea
 *
 * Design principle: No DOM side-effects outside the textarea passed in,
 * no global state except syncCursor._deltaCache (per-file line offset cache).
 */
const MarkdownLogicService = (() => {

  // ══════════════════════════════════════════════════════════════════
  //  applyAction
  // ══════════════════════════════════════════════════════════════════

  /**
   * Applies a Markdown formatting action to a textarea element.
   *
   * Actions are either "wrap" (surrounds selection with symbols) or
   * "line" (prepends/removes a prefix on the current line).
   * All actions are toggle — running the same action twice reverts.
   *
   * @param {HTMLTextAreaElement} textarea - Target textarea element
   * @param {string} action - One of:
   *   Headings : 'h1' 'h2' 'h3' 'h' (h4) 'h5' 'h6'
   *   Inline   : 'b' (bold) 'i' (italic) 'bi' (bold-italic) 's' (strikethrough) 'c' (inline code)
   *   Block    : 'q' (blockquote) 'ul' 'ol' 'tl' (task) 'tl-checked'
   *   Insert   : 'l' (link) 'img' 'hr' 'cb' (code block) 'tb' (table) 'fn' (footnote)
   */
  function applyAction(textarea, action) {
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    // ── Helper: Wrap Toggle (Bold, Italic, Code, etc.) ──
    // If selection already wrapped with symbol → unwrap; otherwise wrap.
    const wrapToggle = (symbol, placeholder) => {
      const isWrapped = selected.startsWith(symbol) && selected.endsWith(symbol);
      if (isWrapped) {
        textarea.setRangeText(selected.substring(symbol.length, selected.length - symbol.length), start, end, 'select');
      } else {
        const newText = selected || placeholder;
        textarea.setRangeText(`${symbol}${newText}${symbol}`, start, end, 'select');
        if (!selected) {
          // Smart Selection: Select only the content part
          const newStart = start + symbol.length;
          textarea.setSelectionRange(newStart, newStart + placeholder.length);
        }
      }
    };

    // ── Helper: Line Toggle (Quote, List, Task) ──
    // If line already starts with prefix → remove; otherwise prepend.
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
        const content = lineText || (selected || placeholder);
        textarea.setRangeText(`${prefix}${content}`, lineStart, lineEnd, 'select');
        if (!lineText && !selected) {
          // Smart Selection: Select only the content part
          const newStart = lineStart + prefix.length;
          textarea.setSelectionRange(newStart, newStart + content.length);
        }
      }
    };

    // ── Helper: Header Toggle (H1-H6) ──
    // Cycles to the new level; applying the same level again removes the heading.
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
          // Same level → remove heading
          textarea.setRangeText(lineText.substring(match[0].length), lineStart, lineEnd, 'select');
        } else {
          // Different level → change to new level
          textarea.setRangeText(`${prefix}${lineText.substring(match[0].length)}`, lineStart, lineEnd, 'select');
          // Preserve selection of the text part
          const newStart = lineStart + prefix.length;
          textarea.setSelectionRange(newStart, lineEnd + (prefix.length - match[0].length));
        }
      } else {
        textarea.setSelectionRange(lineStart, lineEnd);
        const content = lineText || (selected || 'Heading');
        textarea.setRangeText(`${prefix}${content}`, lineStart, lineEnd, 'select');
        // Smart Selection: Select only the heading text
        const newStart = lineStart + prefix.length;
        textarea.setSelectionRange(newStart, newStart + content.length);
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
      case 'l': {
        const content = selected || 'link text';
        textarea.setRangeText(`[${content}](url)`, start, end, 'select');
        textarea.setSelectionRange(start + 1, start + 1 + content.length);
        break;
      }
      case 'img': {
        const content = selected || 'alt text';
        textarea.setRangeText(`![${content}](image-url)`, start, end, 'select');
        textarea.setSelectionRange(start + 2, start + 2 + content.length);
        break;
      }
      case 'hr': textarea.setRangeText(`\n---\n`, start, end, 'select'); break;
      case 'cb': {
        const content = selected || 'code block';
        textarea.setRangeText(`\`\`\`\n${content}\n\`\`\``, start, end, 'select');
        textarea.setSelectionRange(start + 4, start + 4 + content.length);
        break;
      }
      case 'tb': {
        const content = '| Col 1 | Col 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |';
        textarea.setRangeText(`\n${content}\n`, start, end, 'select');
        textarea.setSelectionRange(start + 1, start + 1 + content.length);
        break;
      }
      case 'fn': {
        const content = selected || 'text';
        textarea.setRangeText(`${content}[^1]`, start, end, 'select');
        textarea.setSelectionRange(start, start + content.length);
        break;
      }
    }

    textarea.focus();
  }

  // ══════════════════════════════════════════════════════════════════
  //  _calculatePixelYWithMirror (internal)
  // ══════════════════════════════════════════════════════════════════

  /**
   * Measures the pixel Y position of a character index inside a textarea
   * using a hidden "mirror DIV" that replicates the textarea's layout styles.
   *
   * Why a mirror? Textarea does not expose per-character Y positions natively.
   * By cloning all layout styles into a plain DIV we can leverage the browser's
   * layout engine to give us an accurate offsetTop for any character.
   *
   * @param {HTMLTextAreaElement} textarea
   * @param {number} charIndex - Character index to measure
   * @returns {number} Pixel Y offset from the top of the textarea content
   */
  function _calculatePixelYWithMirror(textarea, charIndex) {
    if (!textarea) return 0;

    const style = getComputedStyle(textarea);
    const mirror = document.createElement('div');

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

    // Use clientWidth (not offsetWidth) to account for scrollbar width
    mirror.style.width = textarea.clientWidth + 'px';

    // Text before charIndex fills the mirror; a zero-width span marks the target position
    mirror.textContent = textarea.value.substring(0, charIndex);

    const span = document.createElement('span');
    span.textContent = '​'; // zero-width space
    mirror.appendChild(span);

    document.body.appendChild(mirror);
    const y = span.offsetTop;
    document.body.removeChild(mirror);

    return y;
  }

  // ══════════════════════════════════════════════════════════════════
  //  syncCursor
  // ══════════════════════════════════════════════════════════════════

  /**
   * Synchronizes the textarea cursor and scroll position to a target location
   * described by `context`. Used when switching from Read view → Edit mode so
   * the editor opens at the same content the user was reading.
   *
   * ── Algorithm Overview (3 stages) ──────────────────────────────
   *
   * Stage 1 — Precise Selection Match
   *   Tries to find the exact character position for context.selectionText.
   *
   *   1a. Exact Match
   *       Jumps to (line, offset) and compares the text there directly.
   *       If it matches → done. O(1).
   *
   *   1b. Fuzzy Match — "Sandwich Strategy"
   *       Runs when exact match fails (e.g. the rendered HTML line numbers
   *       differ from raw markdown line numbers by a variable offset).
   *
   *       Steps:
   *       i.  Tokenize selectionText into significant words.
   *           - Strips punctuation delimiters but KEEPS digits (even single-char)
   *             so "SESSION 3" is never confused with "SESSION 2".
   *           - Keeps decimal numbers intact ("$0.001279" stays whole).
   *       ii. Build a regex pattern from the first 5 words (head anchor)
   *           and optionally the last 5 words (tail anchor for long selections).
   *           Pattern allows up to 100 non-newline chars between each word.
   *       iii.Among all regex matches, pick the one NEAREST to context.line
   *           (minimum line-distance). This ensures the correct instance wins
   *           when the same phrase appears multiple times in the document.
   *       iv. Fallback 1 — Triple-Word Anchor: if step ii found nothing,
   *           try every consecutive triple of words.
   *       v.  Fallback 2 — Best Single Word (≥4 chars): last resort literal search.
   *       vi. Prefix Recovery: after a fuzzy match, scan backward from the
   *           match start to include any short leading words the tokenizer
   *           skipped (e.g. a single-char emoji prefix stripped by filters).
   *       vii.End Extension: extend the match end to cover the last significant
   *           word, preventing right-truncation on long selections.
   *       viii.Sanity check: reject any match more than 150 lines from the hint.
   *
   *   Self-Correction (Delta Cache):
   *       After a fuzzy match, if the found line differs from context.line,
   *       the delta is stored in syncCursor._deltaCache[fileKey]. On the next
   *       call for the same file, this delta pre-adjusts the predicted position
   *       so exact match succeeds more often.
   *
   * Stage 2 — Simple Line Fallback
   *   If stage 1 found nothing (selectionText too short, or sanity check failed),
   *   falls back to placing the cursor at the start of context.line.
   *
   * Stage 3 — Scroll & Selection
   *   Uses _calculatePixelYWithMirror to compute the pixel Y of targetChar,
   *   then scrolls the textarea to center that position in the viewport.
   *   - If context.isRealSelection=true  → highlights [targetChar, targetChar+matchLen]
   *   - If context.isRealSelection=false → positions cursor only, no highlight
   *   - If no targetChar and context.scrollPct exists → proportional scroll fallback
   *
   * ── IMPORTANT: Known Line Offset ───────────────────────────────
   *   The rendered HTML assigns data-line numbers based on the markdown token
   *   stream, which can differ from raw line numbers in the textarea (e.g. YAML
   *   frontmatter, collapsed blank lines). This causes a systematic offset of
   *   ~10–20 lines that grows toward the end of long files.
   *   The Fuzzy Match handles this correctly because it ignores line numbers
   *   and relies on text content. The Delta Cache compensates for repeat calls.
   *
   * ── IMPORTANT: First-Call Timing ───────────────────────────────
   *   syncCursor is called twice on mode switch: once immediately (textarea may
   *   still be empty → 1 line) and once after content loads (full line count).
   *   The first call fails gracefully; the second call is authoritative.
   *
   * @param {HTMLTextAreaElement} textarea - The editor textarea
   * @param {Object}  context
   * @param {number}  context.line           - 1-based hint line number
   * @param {number}  [context.offset=0]     - Char offset within the line
   * @param {string}  [context.selectionText]- Text to search for (drives fuzzy match)
   * @param {boolean} [context.isRealSelection=false] - If true, highlight the match
   * @param {number}  [context.scrollPct]    - 0–1 fallback scroll ratio
   * @param {string}  [context._fileKey]     - Key for delta cache (use file path)
   */
  function syncCursor(textarea, context = {}) {
    if (!textarea) return;

    textarea.focus();
    const text = textarea.value;
    let targetChar = -1;
    let targetCharMatchLen = 0;

    // ── Stage 1: Precise Selection Match ──────────────────────────
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

      if (sample === context.selectionText) {
        // ── 1a. Exact Match ──
        targetChar = predictedPos;
        targetCharMatchLen = context.selectionText.length;
        context._matchLen = targetCharMatchLen;

      } else {
        // ── 1b. Fuzzy Match (Sandwich Strategy) ──

        // Normalize smart/curly quotes so they don't attach to adjacent words
        const normalizedSelection = context.selectionText.replace(/[""''«»]/g, ' ');

        // Tokenize: keep single-char tokens only if they are digits
        // (e.g. "SESSION 3" → ["SESSION","3"], NOT ["SESSION"])
        // Do NOT split on "." to preserve decimal numbers like "$0.001279"
        const allWords = normalizedSelection.trim()
          .split(/[\s,\-()""''«»\[\]{}:;!?\/\\]+/)
          .filter(w => w.length > 1 || /^\d+$/.test(w));

        if (allWords.length > 0) {
          const headWords = allWords.slice(0, 5);
          const tailWords = allWords.length > 10 ? allWords.slice(-5) : [];

          // Pattern allows up to 100 non-newline chars between each anchor word
          const buildPattern = (words) => words
            .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('[^\\n]{0,100}?');

          let fuzzyPattern = buildPattern(headWords);
          if (tailWords.length > 0) {
            fuzzyPattern += '.*?' + buildPattern(tailWords);
          }

          // Among all regex matches, pick the closest to context.line
          const findBestMatch = (pattern, isLiteral = false) => {
            try {
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
            } catch (_e) { return null; }
          };

          // Try 1: Sequence Fuzzy Match (primary path)
          let matchResult = findBestMatch(fuzzyPattern);

          // Try 2: Triple-Word Anchor (when sequence match fails)
          if (!matchResult && allWords.length >= 3) {
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

          // Try 3: Best Single Word (last resort — word must be ≥4 chars)
          if (!matchResult && allWords.length > 0) {
            const bestWord = allWords.sort((a, b) => b.length - a.length)[0];
            if (bestWord.length >= 4) {
              matchResult = findBestMatch(bestWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), true);
            }
          }

          if (matchResult) {
            // Sanity check: reject matches more than 150 lines from the hint
            if (matchResult.distance > 150) {
              targetChar = -1;
            } else {
              targetChar = matchResult.index;
              targetCharMatchLen = matchResult.length;

              // Prefix Recovery: the first token in allWords may not be the true
              // start of the selection (e.g. a short leading word was filtered out).
              // Scan backward on the same line to recover leading chars.
              const trimmedNorm = normalizedSelection.trim();
              const firstWord = allWords[0];
              const prefixLen = trimmedNorm.indexOf(firstWord);
              if (prefixLen > 0 && targetChar >= prefixLen) {
                const candidateStart = targetChar - prefixLen;
                const lineAtCandidate = text.substring(0, candidateStart).split('\n').length;
                const lineAtMatch = text.substring(0, targetChar).split('\n').length;
                if (lineAtCandidate === lineAtMatch) {
                  targetChar = candidateStart;
                  targetCharMatchLen += prefixLen;
                }
              }

              // End Extension: extend rightward to include the last significant word,
              // preventing the match from being right-truncated on long selections.
              const endAnchorWord = allWords.filter(w => w.length > 3).slice(-1)[0];
              if (endAnchorWord) {
                const searchFrom = targetChar + Math.max(1, targetCharMatchLen - endAnchorWord.length - 5);
                const searchCap  = targetChar + trimmedNorm.length + 100;
                const endWordPos = text.indexOf(endAnchorWord, searchFrom);
                if (endWordPos !== -1 && endWordPos < searchCap) {
                  const trueEnd = endWordPos + endAnchorWord.length;
                  if (trueEnd > targetChar + targetCharMatchLen) {
                    targetCharMatchLen = trueEnd - targetChar;
                  }
                }
              }
            }
          }

          if (targetChar !== -1) {
            context._matchLen = targetCharMatchLen;

            // Self-Correction: record the delta between hint line and found line
            // so the next call pre-adjusts and hits the exact match path.
            const foundLine = text.substring(0, targetChar).split('\n').length;
            if (foundLine !== context.line) {
              const delta = context.line - foundLine;
              const fileKey2 = context._fileKey || 'default';
              if (!syncCursor._deltaCache) syncCursor._deltaCache = {};
              syncCursor._deltaCache[fileKey2] = delta;
              context.line = foundLine;
            }
          }
        }
      }
    }

    // ── Stage 2: Simple Line Fallback ─────────────────────────────
    // Activates when selectionText is absent/too short or the sanity check failed.
    if (targetChar === -1 && context.line) {
      const lines = text.split('\n');
      let absPos = 0;
      const targetLineIdx = Math.min(context.line - 1, lines.length - 1);
      for (let i = 0; i < targetLineIdx; i++) {
        absPos += lines[i].length + 1;
      }
      targetChar = absPos + (context.offset || 0);
    }

    // ── Stage 3: Scroll & Selection ───────────────────────────────
    requestAnimationFrame(() => {
      if (targetChar !== -1) {
        const pixelY = _calculatePixelYWithMirror(textarea, targetChar);
        const viewportHeight = textarea.clientHeight;
        const finalScroll = pixelY - (viewportHeight / 2);

        // Suppress scroll listener to avoid polluting saved scroll position
        window._suppressScrollSync = true;
        textarea.scrollTop = finalScroll;
        requestAnimationFrame(() => { window._suppressScrollSync = false; });

        if (context.isRealSelection) {
          // Highlight the matched text (only when user actively selected in Read view)
          const selectionLength = (context._matchLen !== undefined)
            ? context._matchLen
            : (context.selectionText ? context.selectionText.length : (context.length || 0));
          textarea.setSelectionRange(targetChar, targetChar + selectionLength);
        } else {
          // Position cursor only — no visual selection highlight
          textarea.setSelectionRange(targetChar, targetChar);
        }
      } else if (context.scrollPct) {
        // Last resort: proportional scroll
        textarea.scrollTop = context.scrollPct * (textarea.scrollHeight - textarea.clientHeight);
      }
    });
  }

  /**
   * Smart Enter Handler: Continues list prefixes or clears empty list lines.
   * @param {HTMLTextAreaElement} textarea 
   * @returns {boolean} True if handled, false to let browser continue
   */
  function handleEnter(textarea) {
    if (!textarea) return false;
    const text = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Get the current line
    const lastNewline = text.lastIndexOf('\n', start - 1);
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
    const nextNewline = text.indexOf('\n', start);
    const lineEnd = nextNewline === -1 ? text.length : nextNewline;
    const currentLine = text.substring(lineStart, lineEnd);

    // Match patterns: 
    // 1. Bullet/Checkbox: (indent)(bullet)(checkbox?)(space)(content)
    // 2. Numbered: (indent)(digits)(dot)(space)(content)
    const listRegex = /^(\s*)([*+-] (?:\[[ xX]\] )?|(\d+)\. )(.*)/;
    const match = currentLine.match(listRegex);

    if (match) {
      const indent = match[1];
      const prefix = match[2];
      const number = match[3];
      const content = match[4];

      // If the line is empty (just prefix), clear the prefix and end list
      if (content.trim() === '') {
        textarea.setSelectionRange(lineStart, start);
        textarea.setRangeText('', lineStart, start, 'end');
        return false; // Still need a newline, but we cleared the prefix
      }

      // Calculate next prefix
      let nextPrefix = prefix;
      if (number) {
        const nextNum = parseInt(number, 10) + 1;
        nextPrefix = nextNum + '. ';
      }

      const insertText = '\n' + indent + nextPrefix;
      textarea.setRangeText(insertText, start, end, 'end');
      return true;
    }

    return false;
  }

  /**
   * Smart Tab Handler: Handles multi-line indentation or single-line list indentation.
   * @param {HTMLTextAreaElement} textarea 
   * @param {boolean} isShift - True if Shift+Tab (outdent)
   * @returns {boolean} True if handled
   */
  function handleTab(textarea, isShift) {
    if (!textarea) return false;
    const text = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Find the range of lines involved
    const firstNewline = text.lastIndexOf('\n', start - 1);
    const lastNewline = text.indexOf('\n', end);
    const selectionStart = firstNewline === -1 ? 0 : firstNewline + 1;
    const selectionEnd = lastNewline === -1 ? text.length : lastNewline;

    const selectedLines = text.substring(selectionStart, selectionEnd).split('\n');
    
    // Regex to detect if a line is a list item (optional indent + bullet/number)
    const listRegex = /^(\s*)([*+-] (?:\[[ xX]\] )?|\d+\. )/;
    const isListLine = listRegex.test(selectedLines[0]);

    // If multi-line selection OR it's a list line, perform smart indent
    if (selectedLines.length > 1 || isListLine) {
      const tabSize = 2;
      const space = ' '.repeat(tabSize);

      const processedLines = selectedLines.map(line => {
        if (isShift) {
          // Outdent: remove up to tabSize spaces
          if (line.startsWith(space)) return line.substring(tabSize);
          return line.replace(/^\s{1,2}/, '');
        } else {
          // Indent: add tabSize spaces
          return space + line;
        }
      });

      const newText = processedLines.join('\n');
      textarea.setSelectionRange(selectionStart, selectionEnd);
      textarea.setRangeText(newText, selectionStart, selectionEnd, 'select');
      return true;
    }

    // Default: Insert spaces at cursor if it's just a normal line
    if (!isShift) {
      textarea.setRangeText('  ', start, end, 'end');
      return true;
    }

    return false;
  }

  return {
    applyAction,
    syncCursor,
    handleEnter,
    handleTab
  };
})();
window.MarkdownLogicService = MarkdownLogicService;
