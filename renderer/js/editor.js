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
    // Avoid duplicate snapshots
    const last = _undoStack[_undoStack.length - 1];
    if (last && last.value === snap.value) return;
    _undoStack.push(snap);
    if (_undoStack.length > 200) _undoStack.shift(); // cap at 200 levels
    _redoStack = []; // any new edit clears redo
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
    if (_undoStack.length <= 1) return; // keep at least the base state
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

    // ── Undo/Redo wiring ──────────────────────────────────
    // Snapshot on every keystroke (debounced 300ms) 
    _textarea.addEventListener('input', () => {
      if (_ignoreNextInput) { _ignoreNextInput = false; return; }
      _scheduleSnapshot();
    });

    // Intercept Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z before browser handles them
    _textarea.addEventListener('keydown', (e) => {
      const isMac = navigator.platform.includes('Mac');
      const ctrl = isMac ? e.metaKey : e.ctrlKey;
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
    });

    // Formatting Actions — snapshot after each tool action so undo restores pre-action state
    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        _snapshot(); // save state before applying
        const action = btn.dataset.action;
        applyAction(_textarea, action);
        _snapshot(); // save state after applying
      });
    });

    // Help Toggle logic
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

    // Save Action
    if (saveBtn) {
      saveBtn.onclick = async () => {
        const success = await save();
        if (success) {
          const readSeg = document.querySelector('.ds-segment-item[data-mode="read"]');
          if (readSeg) readSeg.click();
        }
      };
    }

    // Cancel Action
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        // Toggle back to read mode
        const readSeg = document.querySelector('.ds-segment-item[data-mode="read"]');
        if (readSeg) readSeg.click();
      };
    }
  }

  async function save() {
    if (!AppState.currentFile || !_textarea) return false;
    const content = _textarea.value;

    // Special Case: Draft Response
    if (AppState.currentFile === '__DRAFT_MODE__') {
        if (typeof DraftModule !== 'undefined') {
            DraftModule.setDraftContent(content);
            DraftModule.renderPreview(content);
            _originalContent = content; // Update original to new state
            if (typeof showToast === 'function') showToast('Draft updated');
            return true;
        }
        return false;
    }

    // Regular Case: Save File via API
    const res = await fetch('/api/file/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: AppState.currentFile, content })
    });
    
    if (res.ok) {
      if (typeof showToast === 'function') showToast('File saved successfully');
      _originalContent = content; // Update original point
      // Reload preview
      if (typeof loadFile === 'function') loadFile(AppState.currentFile);
      return true;
    } else {
      alert('Failed to save file');
      return false;
    }
  }

  function setOriginalContent(text) {
    _originalContent = text;
    if (_textarea) {
      _textarea.value = text;
      // Reset undo/redo history — seed with the loaded state as base
      _undoStack = [{ value: text, ss: 0, se: 0 }];
      _redoStack = [];
    }
  }

  function isDirty() {
    if (!_textarea) return false;
    return _textarea.value !== _originalContent;
  }

  function applyAction(textarea, action) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    // Helper: Wrap text with symbols or remove them if already there (Toggle)
    const wrapToggle = (symbol, placeholder) => {
      const isWrapped = selected.startsWith(symbol) && selected.endsWith(symbol);
      if (isWrapped) {
        // Remove wrap
        textarea.setRangeText(selected.substring(symbol.length, selected.length - symbol.length), start, end, 'select');
      } else {
        // Add wrap
        const newText = selected || placeholder;
        textarea.setRangeText(`${symbol}${newText}${symbol}`, start, end, 'select');
        // If it was a placeholder, select the placeholder text
        if (!selected) {
          textarea.setSelectionRange(start + symbol.length, start + symbol.length + placeholder.length);
        }
      }
    };

    // Helper: Toggle prefix for the current line or selection
    const lineToggle = (prefix, placeholder) => {
      // Find start of current line
      let lineStart = text.lastIndexOf('\n', start - 1) + 1;
      let lineEnd = text.indexOf('\n', end);
      if (lineEnd === -1) lineEnd = text.length;

      const lineText = text.substring(lineStart, lineEnd);
      const hasPrefix = lineText.startsWith(prefix);

      if (hasPrefix) {
        // Remove prefix
        textarea.setSelectionRange(lineStart, lineEnd);
        textarea.setRangeText(lineText.substring(prefix.length), lineStart, lineEnd, 'select');
      } else {
        // Add prefix
        textarea.setSelectionRange(lineStart, lineEnd);
        const newText = lineText || (selected || placeholder);
        textarea.setRangeText(`${prefix}${newText}`, lineStart, lineEnd, 'select');
      }
    };

    // Helper: Toggle Header levels (cycling or toggle specific)
    const headerToggle = (level) => {
      const prefix = '#'.repeat(level) + ' ';
      let lineStart = text.lastIndexOf('\n', start - 1) + 1;
      let lineEnd = text.indexOf('\n', end);
      if (lineEnd === -1) lineEnd = text.length;

      const lineText = text.substring(lineStart, lineEnd);
      
      // Check if line already has ANY header prefix
      const match = lineText.match(/^(#{1,6})\s/);
      if (match) {
        const existingLevel = match[1].length;
        textarea.setSelectionRange(lineStart, lineEnd);
        if (existingLevel === level) {
          // Same level, remove it
          textarea.setRangeText(lineText.substring(match[0].length), lineStart, lineEnd, 'select');
        } else {
          // Different level, replace it
          textarea.setRangeText(`${prefix}${lineText.substring(match[0].length)}`, lineStart, lineEnd, 'select');
        }
      } else {
        // No header, add it
        textarea.setSelectionRange(lineStart, lineEnd);
        textarea.setRangeText(`${prefix}${lineText || (selected || 'Heading')}`, lineStart, lineEnd, 'select');
      }
    };

    switch (action) {
      case 'h1': headerToggle(1); break;
      case 'h2': headerToggle(2); break;
      case 'h3': headerToggle(3); break;
      case 'h':  headerToggle(4); break; // Default H button in toolbar is H4
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

      case 'hr':
        textarea.setRangeText(`\n---\n`, start, end, 'select');
        break;

      case 'cb':
        textarea.setRangeText(`\`\`\`\n${selected || 'code block'}\n\`\`\``, start, end, 'select');
        break;

      case 'tb':
        const table = `\n| col1 | col2 |\n|------|------|\n| cell | cell |\n`;
        textarea.setRangeText(table, start, end, 'select');
        break;

      case 'fn':
        textarea.setRangeText(`${selected || 'text'}[^1]`, start, end, 'select');
        break;
    }

    textarea.focus();
  }

  return { init, save, isDirty, setOriginalContent, undo, redo, applyAction: (action) => applyAction(_textarea, action) };
})();

document.addEventListener('DOMContentLoaded', () => {
    EditorModule.init();
});
