/* ── Editor Toolbar Logic ─────────────────────────────── */

const EditorModule = (() => {
  let _originalContent = '';
  let _textarea = null;

  // ── Undo / Redo Stack ──────────────────────────────────
  /** @type {{ value: string, ss: number, se: number }[]} */
  let _undoStack = [];
  /** @type {{ value: string, ss: number, se: number }[]} */
  let _redoStack = [];
  let _debounceTimer = null;
  let _ignoreNextInput = false; // set to true when we're restoring a snapshot

  function _snapshot() {
    if (!_textarea) return;
    const snap = { value: _textarea.value, ss: _textarea.selectionStart, se: _textarea.selectionEnd };
    const last = _undoStack[_undoStack.length - 1];
    if (last && last.value === snap.value) return;
    _undoStack.push(snap);
    if (_undoStack.length > 200) _undoStack.shift(); 
    _redoStack = []; 
  }

  function _scheduleSnapshot() {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(_snapshot, 300);
  }

  function _restoreSnapshot(snap) {
    if (!_textarea || !snap) return;
    _ignoreNextInput = true;
    _textarea.value = snap.value;
    _textarea.setSelectionRange(snap.ss, snap.se);
    _textarea.focus();
  }

  function undo() {
    if (_undoStack.length <= 1) return; 
    _redoStack.push(_undoStack.pop());
    _restoreSnapshot(_undoStack[_undoStack.length - 1]);
  }

  function redo() {
    if (_redoStack.length === 0) return;
    const snap = _redoStack.pop();
    _undoStack.push(snap);
    _restoreSnapshot(snap);
  }

  function init() {
    _textarea = document.getElementById('edit-textarea');
    const toolBtns = document.querySelectorAll('.edit-tool-btn');
    const saveBtn = document.getElementById('edit-save-btn');
    const cancelBtn = document.getElementById('edit-cancel-btn');

    if (!_textarea) return;

    _textarea.addEventListener('input', () => {
      if (_ignoreNextInput) { _ignoreNextInput = false; return; }
      _scheduleSnapshot();
    });

    _textarea.addEventListener('keydown', (e) => {
      // Global Shortcut Interception (TC-10)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        save();
        return;
      }

      // Sync undo/redo stack
      if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
    });

    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        applyAction(_textarea, action);
      });
    });

    const helpBtn = document.getElementById('edit-help-btn');
    if (helpBtn) {
        helpBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (window.MarkdownHelperComponent) {
              window.MarkdownHelperComponent.open();
            }
        };
    }

    if (saveBtn) {
      saveBtn.onclick = async () => {
        const success = await save();
        if (success) {
          const readSeg = document.querySelector('.ds-segment-item[data-mode="read"]');
          if (readSeg) readSeg.click();
        }
      };
    }

    if (cancelBtn) {
      cancelBtn.onclick = () => {
        const readSeg = document.querySelector('.ds-segment-item[data-mode="read"]');
        if (readSeg) readSeg.click();
      };
    }
  }

  async function save() {
    if (!AppState.currentFile || !_textarea) return false;
    const content = _textarea.value;

    if (AppState.currentFile && AppState.currentFile.startsWith('__DRAFT_')) {
        if (typeof DraftModule !== 'undefined') {
            DraftModule.setDraftContent(content);
            await DraftModule.renderPreview(content, AppState.currentFile);
            _originalContent = content;
            if (typeof showToast === 'function') showToast('Draft updated');
            return true;
        }
        return false;
    }

    const res = await fetch('/api/file/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: AppState.currentFile, content })
    });
    
    if (res.ok) {
      if (typeof showToast === 'function') showToast('File saved successfully');
      _originalContent = content; 
      if (typeof loadFile === 'function') loadFile(AppState.currentFile);
      return true;
    } else {
      if (typeof showToast === 'function') showToast('Failed to save file', 'error');
      return false;
    }
  }

  function setOriginalContent(text) {
    _originalContent = text;
    if (_textarea) {
      _textarea.value = text;
      _undoStack = [{ value: text, ss: 0, se: 0 }];
      _redoStack = [];
    }
  }

  function isDirty() {
    if (!_textarea) return false;
    return _textarea.value !== _originalContent;
  }

  function applyAction(textarea, action) {
    if (!textarea) return;
    
    _snapshot(); // Save state before
    textarea.focus();

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

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
    _snapshot(); // Save state after
  }

  function focusWithContext(context = {}) {
    if (!_textarea) return;
    
    _textarea.focus();

    const text = _textarea.value;
    let targetChar = -1;

    // 1. Precise Selection Match within Line
    // 1. Precise Selection Match (Multi-line aware)
    if (context.line && context.selectionText) {
      const lines = text.split('\n');
      let startOfLine = 0;
      for (let i = 0; i < context.line - 1; i++) {
        startOfLine += lines[i].length + 1;
      }
      
      // Search for the selection text starting from the predicted line
      // We look slightly before and after in case line numbers are slightly off
      const searchRange = 500; // Look within 500 chars
      const searchStart = Math.max(0, startOfLine - searchRange);
      const searchEnd = Math.min(text.length, startOfLine + context.selectionText.length + searchRange);
      const searchText = text.substring(searchStart, searchEnd);
      
      const offsetInSearch = searchText.indexOf(context.selectionText);
      
      if (offsetInSearch !== -1) {
        targetChar = searchStart + offsetInSearch;
        _textarea.setSelectionRange(targetChar, targetChar + context.selectionText.length);
      }
    }

    // 2. Line fallback
    if (targetChar === -1 && context.line) {
      const lines = text.split('\n');
      let absPos = 0;
      const targetLineIdx = Math.min(context.line - 1, lines.length - 1);
      for (let i = 0; i < targetLineIdx; i++) {
        absPos += lines[i].length + 1;
      }
      targetChar = absPos;
      _textarea.setSelectionRange(absPos, absPos);
    }

    // 3. String Search fallback
    if (targetChar === -1 && context.selection && !context.selectionText) {
      const index = text.indexOf(context.selection);
      if (index !== -1) {
        targetChar = index;
        _textarea.setSelectionRange(index, index + context.selection.length);
      }
    }

    // ── Scrolling Logic ──────────────────────────────────
    requestAnimationFrame(() => {
      if (targetChar !== -1) {
          const lines = text.split('\n');
          let currentLine = 0;
          let currentPos = 0;
          for(let i=0; i<lines.length; i++) {
              if (currentPos + lines[i].length >= targetChar) {
                  currentLine = i;
                  break;
              }
              currentPos += lines[i].length + 1;
          }
          
          const style = getComputedStyle(_textarea);
          let lh = parseInt(style.lineHeight);
          if (isNaN(lh)) lh = 24; 
          
          const targetScroll = currentLine * lh;
          
          _textarea.scrollTop = targetScroll;
          
          // Preserving selection:
          const selectionLength = context.selectionText ? context.selectionText.length : 0;
          _textarea.setSelectionRange(targetChar, targetChar + selectionLength);
      } else if (context.scrollPct) {
        const targetScroll = context.scrollPct * (_textarea.scrollHeight - _textarea.clientHeight);
        _textarea.scrollTop = targetScroll;
      }
    });
  }

  return { 
      init, save, isDirty, setOriginalContent, undo, redo, 
      applyAction: (action) => applyAction(_textarea, action),
      setDirty: (isDirty) => {
        if (isDirty) {
          _originalContent = _originalContent + ' '; // Force dirty
        } else {
          if (_textarea) {
            _originalContent = _textarea.value;
          }
        }
      },
      insertText: (prefix, suffix = '') => {
        const textarea = document.getElementById('edit-textarea');
        if (!textarea) return;

        _snapshot();
        textarea.focus();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const fullText = textarea.value;
        const selected = fullText.substring(start, end);

        let newText = '';
        let newStart = start;
        let newEnd = end;

        // Smart Toggle & Replacement Logic
        const isWrapped = selected.startsWith(prefix) && selected.endsWith(suffix) && (prefix !== '' || suffix !== '');
        
        if (isWrapped && prefix && suffix) {
          // Toggle OFF: Remove prefix and suffix
          newText = selected.substring(prefix.length, selected.length - suffix.length);
          textarea.setRangeText(newText, start, end, 'select');
        } else if (prefix.endsWith(' ') && !suffix) {
          // Block-level logic (H1-H6, Quote, Lists)
          const lineStart = fullText.lastIndexOf('\n', start - 1) + 1;
          const lineEnd = fullText.indexOf('\n', start) === -1 ? fullText.length : fullText.indexOf('\n', start);
          const lineText = fullText.substring(lineStart, lineEnd);
          
          // List of known block prefixes to detect for replacement
          const blockPrefixes = [
            '###### ', '##### ', '#### ', '### ', '## ', '# ', 
            '> ', '- [ ] ', '- [x] ', '- ', '1. '
          ];
          
          // 1. Find if the line already has a known prefix
          const existingPrefix = blockPrefixes.find(p => lineText.startsWith(p));
          
          if (existingPrefix) {
            if (existingPrefix === prefix) {
              // Toggle OFF: same prefix, just remove it
              textarea.setRangeText('', lineStart, lineStart + existingPrefix.length, 'end');
            } else {
              // Replace: different prefix, swap it
              textarea.setRangeText(prefix, lineStart, lineStart + existingPrefix.length, 'end');
            }
          } else {
            // Toggle ON: No prefix, add new one
            textarea.setRangeText(prefix, lineStart, lineStart, 'end');
          }
        } else {
          // Toggle ON: Wrap selection
          newText = `${prefix}${selected}${suffix}`;
          textarea.setRangeText(newText, start, end, 'select');
        }
        
        textarea.focus();
        _snapshot();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      },
      focusWithContext,
      getOriginalContent: () => _originalContent,
      setOriginalContent: (val) => { 
        _originalContent = val; 
        if (_textarea) {
          _textarea.value = val;
          _undoStack = [{ value: val, ss: 0, se: 0 }];
          _redoStack = [];
        }
      }
  };
})();

// Explicitly export to window
window.EditorModule = EditorModule;

document.addEventListener('DOMContentLoaded', () => { EditorModule.init(); });
