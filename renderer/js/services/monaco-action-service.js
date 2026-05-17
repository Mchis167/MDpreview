/**
 * MonacoActionService
 * ─────────────────────────────────────────────────────────────────
 * Service for applying Markdown formatting actions directly to 
 * a Monaco Editor instance.
 *
 * Public API:
 *   applyAction(monacoService, action)
 */
/* global monaco */
const MonacoActionService = (() => {
  'use strict';

  /**
   * Applies a Markdown formatting action to a Monaco editor instance.
   *
   * @param {Object} monacoService - The MonacoService singleton
   * @param {string} action - One of: 'h1'...'h6', 'b', 'i', 'bi', 's', 'c', 'q', 'ul', 'ol', 'tl', 'tl-checked', 'l', 'img', 'hr', 'cb', 'tb', 'fn'
   */
  function applyAction(monacoService, action) {
    if (!monacoService || !monacoService.isInitialized()) return;

    const editor = monacoService.getInstance();
    const model = editor.getModel();
    const selection = editor.getSelection();

    // ── Helper: Wrap Toggle (Bold, Italic, Code, etc.) ──
    const wrapToggle = (symbol, placeholder) => {
      const selectedText = model.getValueInRange(selection);
      const symLen = symbol.length;

      // 1. Check if the selection itself is wrapped: **text**
      const isWrappedInner = selectedText.startsWith(symbol) && selectedText.endsWith(symbol);

      // 2. Count surrounding identical symbols: ***|text|***
      const getSurroundingCount = (symChar) => {
        let countBefore = 0;
        let countAfter = 0;
        
        for (let i = 1; i <= 3; i++) {
          const range = new monaco.Range(selection.startLineNumber, selection.startColumn - i, selection.startLineNumber, selection.startColumn - i + 1);
          if (model.getValueInRange(range) === symChar) countBefore++;
          else break;
        }
        for (let i = 0; i < 3; i++) {
          const range = new monaco.Range(selection.endLineNumber, selection.endColumn + i, selection.endLineNumber, selection.endColumn + i + 1);
          if (model.getValueInRange(range) === symChar) countAfter++;
          else break;
        }
        return Math.min(countBefore, countAfter);
      };

      const symChar = symbol[0];
      const surroundingCount = getSurroundingCount(symChar);

      let shouldUnwrap = isWrappedInner;
      let unwrapRange = selection;
      let unwrapLen = symLen;

      if (!shouldUnwrap && (symChar === '*' || symChar === '_')) {
        if (symLen === 1) { // Italic toggle
          if (surroundingCount === 1 || surroundingCount === 3) {
            shouldUnwrap = true;
            unwrapLen = 1;
          }
        } else if (symLen === 2) { // Bold toggle
          if (surroundingCount === 2 || surroundingCount === 3) {
            shouldUnwrap = true;
            unwrapLen = 2;
          }
        }
        
        if (shouldUnwrap) {
          unwrapRange = new monaco.Range(
            selection.startLineNumber, selection.startColumn - unwrapLen,
            selection.endLineNumber, selection.endColumn + unwrapLen
          );
        }
      }

      if (shouldUnwrap) {
        const textToKeep = model.getValueInRange(unwrapRange).slice(unwrapLen, -unwrapLen);
        monacoService.executeEdit(unwrapRange, textToKeep);
        
        monacoService.setSelection({
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn - (unwrapRange === selection ? 0 : unwrapLen),
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn - (unwrapRange === selection ? unwrapLen * 2 : unwrapLen)
        });
      } else {
        const content = selectedText || placeholder;
        monacoService.executeEdit(selection, `${symbol}${content}${symbol}`);
        
        const startShift = symLen;
        if (!selectedText) {
          monacoService.setSelection({
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn + startShift,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.startColumn + startShift + placeholder.length
          });
        } else {
          monacoService.setSelection({
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn + startShift,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.endColumn + startShift
          });
        }
      }
    };

    // ── Helper: Line Toggle (Multi-line support) ──
    const lineToggle = (prefix, placeholder) => {
      const edits = [];
      let allHavePrefix = true;

      for (let i = selection.startLineNumber; i <= selection.endLineNumber; i++) {
        const line = model.getLineContent(i);
        if (!line.startsWith(prefix)) {
          allHavePrefix = false;
          break;
        }
      }

      for (let i = selection.startLineNumber; i <= selection.endLineNumber; i++) {
        const line = model.getLineContent(i);
        const range = new monaco.Range(i, 1, i, line.length + 1);

        if (allHavePrefix) {
          edits.push({ range, text: line.substring(prefix.length) });
        } else {
          const content = line || placeholder;
          edits.push({ range, text: `${prefix}${content}` });
        }
      }

      monacoService.applyEdits(edits);
      
      const startColumn = allHavePrefix ? 1 : prefix.length + 1;
      monacoService.setSelection({
        startLineNumber: selection.startLineNumber,
        startColumn: startColumn,
        endLineNumber: selection.endLineNumber,
        endColumn: model.getLineMaxColumn(selection.endLineNumber)
      });
    };

    // ── Helper: Header Toggle ──
    const headerToggle = (level) => {
      const prefix = '#'.repeat(level) + ' ';
      const edits = [];
      
      let newStartColumn = 1;
      let newEndColumn = 1;

      for (let i = selection.startLineNumber; i <= selection.endLineNumber; i++) {
        const line = model.getLineContent(i);
        const match = line.match(/^(#{1,6})\s/);
        const range = new monaco.Range(i, 1, i, line.length + 1);
        let content = '';
        let insertedPrefix = '';

        if (match) {
          const existingLevel = match[1].length;
          content = line.substring(match[0].length);
          if (existingLevel === level) {
            edits.push({ range, text: content });
            insertedPrefix = '';
          } else {
            edits.push({ range, text: `${prefix}${content}` });
            insertedPrefix = prefix;
          }
        } else {
          content = line || 'Heading';
          edits.push({ range, text: `${prefix}${content}` });
          insertedPrefix = prefix;
        }

        if (i === selection.startLineNumber) {
          newStartColumn = insertedPrefix.length + 1;
        }
        if (i === selection.endLineNumber) {
          newEndColumn = (selection.startLineNumber === selection.endLineNumber) 
            ? newStartColumn + content.length 
            : insertedPrefix.length + content.length + 1;
        }
      }

      monacoService.applyEdits(edits);

      monacoService.setSelection({
        startLineNumber: selection.startLineNumber,
        startColumn: newStartColumn,
        endLineNumber: selection.endLineNumber,
        endColumn: newEndColumn
      });
    };

    switch (action) {
      case 'h1': headerToggle(1); break;
      case 'h2': headerToggle(2); break;
      case 'h3': headerToggle(3); break;
      case 'h4':
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
        const selectedText = model.getValueInRange(selection).trim();
        const urlRegex = /^(https?:\/\/|www\.)[^\s]+$/i;
        
        if (urlRegex.test(selectedText)) {
          const label = 'link text';
          monacoService.executeEdit(selection, `[${label}](${selectedText})`);
          monacoService.setSelection({
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn + 1,
            endLineNumber: selection.startLineNumber,
            endColumn: selection.startColumn + 1 + label.length
          });
        } else {
          const label = selectedText || 'link text';
          const urlPlaceholder = 'url';
          monacoService.executeEdit(selection, `[${label}](${urlPlaceholder})`);
          const offsetToUrl = label.length + 3;
          monacoService.setSelection({
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn + offsetToUrl,
            endLineNumber: selection.startLineNumber,
            endColumn: selection.startColumn + offsetToUrl + urlPlaceholder.length
          });
        }
        break;
      }
      case 'img': {
        const selectedText = model.getValueInRange(selection).trim();
        const urlRegex = /^(https?:\/\/|www\.)[^\s]+$/i;
        
        if (urlRegex.test(selectedText)) {
          const alt = 'alt text';
          monacoService.executeEdit(selection, `![${alt}](${selectedText})`);
          monacoService.setSelection({
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn + 2,
            endLineNumber: selection.startLineNumber,
            endColumn: selection.startColumn + 2 + alt.length
          });
        } else {
          const alt = selectedText || 'alt text';
          const urlPlaceholder = 'image-url';
          monacoService.executeEdit(selection, `![${alt}](${urlPlaceholder})`);
          const offsetToUrl = alt.length + 4; 
          monacoService.setSelection({
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn + offsetToUrl,
            endLineNumber: selection.startLineNumber,
            endColumn: selection.startColumn + offsetToUrl + urlPlaceholder.length
          });
        }
        break;
      }
      case 'hr': monacoService.executeEdit(selection, '\n---\n'); break;
      case 'carousel': {
        const selectedText = model.getValueInRange(selection);
        const inner = selectedText.trim() || '![Image 1]()\n![Image 2]()';
        monacoService.executeEdit(selection, `:::carousel\n${inner}\n:::`);
        break;
      }
      case 'cb': {
        const selectedText = model.getValueInRange(selection);
        const content = selectedText || 'code block';
        const textToInsert = `\`\`\`\n${content}\n\`\`\``;
        monacoService.executeEdit(selection, textToInsert);
        
        const contentLines = content.split('\n');
        monacoService.setSelection({
          startLineNumber: selection.startLineNumber + 1,
          startColumn: 1,
          endLineNumber: selection.startLineNumber + contentLines.length,
          endColumn: contentLines[contentLines.length - 1].length + 1
        });
        break;
      }
      case 'tb': {
        const content = '| Col 1 | Col 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |';
        monacoService.executeEdit(selection, `\n${content}\n`);
        break;
      }
      case 'fn': {
        const selectedText = model.getValueInRange(selection);
        const content = selectedText || 'text';
        monacoService.executeEdit(selection, `${content}[^1]`);
        break;
      }
    }

    monacoService.focus();
  }

  return {
    applyAction
  };

})();

window.MonacoActionService = MonacoActionService;
