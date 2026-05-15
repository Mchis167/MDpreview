/**
 * MonacoSyncService
 * ─────────────────────────────────────────────────────────────────
 * Service for synchronizing the Monaco Editor cursor and scroll 
 * position with the Preview view.
 *
 * Public API:
 *   syncCursor(monacoService, context)
 */
const MonacoSyncService = (() => {
  'use strict';

  // Per-file line offset cache to improve exact match success on subsequent calls
  const _deltaCache = {};

  /**
   * Synchronizes the Monaco cursor and scroll position.
   *
   * @param {Object} monacoService - The MonacoService singleton
   * @param {Object} context
   */
  function syncCursor(monacoService, context = {}) {
    if (!monacoService || !monacoService.isInitialized()) return;

    monacoService.focus();
    const text = monacoService.getValue();
    let targetChar = -1;
    let targetCharMatchLen = 0;

    // ── Stage 0: Absolute Character Offset Sync (Premium) ─────────────
    if (context.srcStart !== undefined) {
      requestAnimationFrame(() => {
        const model = monacoService.getInstance().getModel();
        const startPos = model.getPositionAt(context.srcStart);

        if (context.isRealSelection && context.srcEnd !== undefined) {
          const endPos = model.getPositionAt(context.srcEnd);
          monacoService.setSelection({
            startLineNumber: startPos.lineNumber,
            startColumn: startPos.column,
            endLineNumber: endPos.lineNumber,
            endColumn: endPos.column
          });
        } else {
          monacoService.setCursorPosition(startPos);
        }
        // Monaco revealPosition handles centering logic
        monacoService.getInstance().revealPositionInCenterIfOutsideViewport(startPos);
      });
      return;
    }
    if (context.line && context.selectionText && context.selectionText.length > 2) {
      const lines = text.split('\n');

      const fileKey = context._fileKey || 'default';
      const knownDelta = _deltaCache[fileKey] || 0;
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
        const normalizedSelection = context.selectionText.replace(/[""''«»]/g, ' ');
        const allWords = normalizedSelection.trim()
          .split(/[\s,\-()""''«»\[\]{}:;!?\/\\]+/)
          .filter(w => w.length > 1 || /^\d+$/.test(w));

        if (allWords.length > 0) {
          const headWords = allWords.slice(0, 5);
          const tailWords = allWords.length > 10 ? allWords.slice(-5) : [];

          const buildPattern = (words) => words
            .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('[^\\n]{0,100}?');

          let fuzzyPattern = buildPattern(headWords);
          if (tailWords.length > 0) {
            fuzzyPattern += '.*?' + buildPattern(tailWords);
          }

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

          let matchResult = findBestMatch(fuzzyPattern);

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

          if (!matchResult && allWords.length > 0) {
            const bestWord = allWords.sort((a, b) => b.length - a.length)[0];
            if (bestWord.length >= 4) {
              matchResult = findBestMatch(bestWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), true);
            }
          }

          if (matchResult) {
            if (matchResult.distance > 150) {
              targetChar = -1;
            } else {
              targetChar = matchResult.index;
              targetCharMatchLen = matchResult.length;

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
            const foundLine = text.substring(0, targetChar).split('\n').length;
            if (foundLine !== context.line) {
              const delta = context.line - foundLine;
              _deltaCache[fileKey] = delta;
              context.line = foundLine;
            }
          }
        }
      }
    }

    // ── Stage 2: Simple Line Fallback ─────────────────────────────
    if (targetChar === -1 && context.line) {
      const lines = text.split('\n');
      let absPos = 0;
      const targetLineIdx = Math.min(context.line - 1, lines.length - 1);
      for (let i = 0; i < targetLineIdx; i++) {
        absPos += (lines[i] ? lines[i].length : 0) + 1;
      }
      targetChar = absPos + (context.offset || 0);
    }

    // ── Stage 3: Scroll & Selection ───────────────────────────────
    requestAnimationFrame(() => {
      if (targetChar !== -1) {
        const pos = monacoService.getInstance().getModel().getPositionAt(targetChar);
        monacoService.revealLine(pos.lineNumber);

        if (context.isRealSelection) {
          const selectionLength = (context._matchLen !== undefined)
            ? context._matchLen
            : (context.selectionText ? context.selectionText.length : (context.length || 0));
          monacoService.setSelectionByOffsets(targetChar, targetChar + selectionLength);
        } else {
          monacoService.setSelectionByOffsets(targetChar, targetChar);
        }
      } else if (context.scrollPct) {
        const lineCount = monacoService.getLineCount();
        const targetLine = Math.floor(context.scrollPct * lineCount);
        monacoService.revealLine(targetLine);
      }
    });
  }

  return {
    syncCursor
  };

})();

window.MonacoSyncService = MonacoSyncService;
