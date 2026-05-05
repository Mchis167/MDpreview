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
  let _isSlashMode = false;
  let _slashStartPos = -1;

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

  function _handleInput(e) {
    if (!_textarea) return;
    if (_ignoreNextInput) { _ignoreNextInput = false; return; }
    _scheduleSnapshot();
    
    if (typeof TabsModule !== 'undefined' && AppState.currentFile) {
      TabsModule.setDirty(AppState.currentFile, isDirty());
    }

    // ── Universal Auto-scroll ──
    requestAnimationFrame(() => {
      if (!_textarea) return;
      const lineHeight = parseFloat(getComputedStyle(_textarea).lineHeight);
      const cursorLine = _textarea.value.substring(0, _textarea.selectionStart).split('\n').length;
      const cursorTop = (cursorLine - 1) * lineHeight;
      const scrollTop = _textarea.scrollTop;
      const visibleHeight = _textarea.clientHeight;
      const cursorYInViewport = cursorTop - scrollTop;
      if (cursorYInViewport > visibleHeight * 0.8) {
        const targetScroll = cursorTop - (visibleHeight * 0.6);
        _textarea.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    });

    // ── Slash Command Logic ──
    const pos = _textarea.selectionStart;
    const text = _textarea.value;
    if (e.data === '/') {
      if (pos === 1 || /[\s\n]/.test(text.charAt(pos - 2))) {
        _isSlashMode = true;
        _slashStartPos = pos - 1;
        _showQuickCommand(true, true);
      }
    } else if (_isSlashMode) {
      if (text.charAt(_slashStartPos) !== '/' || pos <= _slashStartPos) {
        _isSlashMode = false;
        window.QuickCommandPalette.hide();
        return;
      }
      const query = text.substring(_slashStartPos + 1, pos);
      if (/[\n\r]/.test(query)) {
        _isSlashMode = false;
        window.QuickCommandPalette.hide();
        return;
      }
      window.QuickCommandPalette.updateQuery(query);
    }
  }

  function _handleKeyDown(e) {
    if (!_textarea) return;

    if (_isSlashMode) {
      if (e.key === ' ') {
        const cmdId = window.QuickCommandPalette.getSelectedCommandId();
        if (cmdId) {
          e.preventDefault();
          _applySlashCommand(cmdId);
          return;
        } else {
          _isSlashMode = false;
          window.QuickCommandPalette.hide();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        window.QuickCommandPalette.navigate('down');
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        window.QuickCommandPalette.navigate('up');
        return;
      } else if (e.key === 'Escape') {
        _isSlashMode = false;
        window.QuickCommandPalette.hide();
      } else if (e.key === 'Enter') {
        const cmdId = window.QuickCommandPalette.getSelectedCommandId();
        if (cmdId) {
          e.preventDefault();
          _applySlashCommand(cmdId);
          return;
        }
      }
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      save();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault();
      _showQuickCommand();
      return;
    }

    if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
      return;
    }

    if (typeof MarkdownLogicService !== 'undefined' && !AppState.settings.smartTypingDisabled && !e.isComposing && !_isSlashMode) {
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const res = MarkdownLogicService.computeSmartEnter(_textarea.value, _textarea.selectionStart, _textarea.selectionEnd);
        if (res) {
          e.preventDefault();
          _snapshot();
          const st = _textarea.scrollTop;
          _textarea.value = res.newValue;
          _textarea.setSelectionRange(res.newCursorPos, res.newCursorPos);
          _textarea.scrollTop = st;
          _snapshot();
          _textarea.dispatchEvent(new Event('input'));
          return;
        }
      }
      if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const direction = e.shiftKey ? 'out' : 'in';
        const res = MarkdownLogicService.computeListIndent(_textarea.value, _textarea.selectionStart, _textarea.selectionEnd, direction);
        if (res) {
          e.preventDefault();
          _snapshot();
          const st = _textarea.scrollTop;
          _textarea.value = res.newValue;
          _textarea.setSelectionRange(res.newCursorPos, res.newSelectionEnd || res.newCursorPos);
          _textarea.scrollTop = st;
          _snapshot();
          _textarea.dispatchEvent(new Event('input'));
          return;
        }
      }
    }
  }

  /**
   * Binds the editor logic to a specific textarea element.
   * This is called by the MarkdownEditor component.
   */
  function bindToElement(el) {
    if (!el) return;

    // Unbind previous if exists to avoid duplicate listeners on same element
    if (_textarea) unbind();

    _textarea = el;

    // Reset stacks for new file/session
    _undoStack = [{ value: _textarea.value, ss: _textarea.selectionStart, se: _textarea.selectionEnd }];
    _redoStack = [];

    _textarea.addEventListener('input', _handleInput);
    _textarea.addEventListener('keydown', _handleKeyDown);
  }

  /**
   * Applies the command and removes the slash + query text
   */
  function _applySlashCommand(cmdId) {
    const pos = _textarea.selectionStart;
    // Remove the "/query" part
    _textarea.setRangeText('', _slashStartPos, pos, 'end');
    _isSlashMode = false;
    window.QuickCommandPalette.hide();
    applyAction(cmdId);
  }

  /**
   * Shows the QuickCommandPalette at the current cursor position.
   * @param {boolean} isSlashTrigger 
   * @param {boolean} hideInput
   */
  function _showQuickCommand(isSlashTrigger = false, hideInput = false) {
    if (!window.QuickCommandPalette || !window.EditorUtil) return;

    const coords = window.EditorUtil.getCursorCoordinates(_textarea);
    
    window.QuickCommandPalette.show(coords.left, coords.top + coords.lineHeight, (actionId) => {
      if (isSlashTrigger) {
        const pos = _textarea.selectionStart;
        _textarea.setRangeText('', _slashStartPos, pos, 'end');
        _isSlashMode = false;
      }
      applyAction(actionId);
    }, { hideInput });
  }

  /**
   * Clears the textarea reference and removes event listeners to prevent leaks and duplicate bindings
   */
  function unbind() {
    if (_textarea) {
      _textarea.removeEventListener('input', _handleInput);
      _textarea.removeEventListener('keydown', _handleKeyDown);
    }
    _textarea = null;
    _undoStack = [];
    _redoStack = [];
    _isSlashMode = false;
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

    if (typeof FileService === 'undefined' || !FileService.saveFile) return false;
    const success = await FileService.saveFile(AppState.currentFile, content);
    
    if (success) {
      if (typeof showToast === 'function') showToast('File saved successfully');
      _originalContent = content; 
      
      if (typeof TabsModule !== 'undefined' && AppState.currentFile) {
        TabsModule.setDirty(AppState.currentFile, false);
      }
      
      // Return to read mode after successful save
      if (window.AppState && AppState.updateToolbarUI) {
        AppState.updateToolbarUI('read');
      } else if (typeof loadFile === 'function') {
        loadFile(AppState.currentFile);
      }
      return true;
    } else {
      if (typeof showToast === 'function') showToast('Failed to save file', 'error');
      return false;
    }
  }

  function setOriginalContent(text) {
    _originalContent = text;
    if (_textarea && _textarea.value !== text) {
      const ss = _textarea.selectionStart;
      const se = _textarea.selectionEnd;
      _textarea.value = text;
      // Try to preserve selection if possible
      try { _textarea.setSelectionRange(ss, se); } catch(_e) {}
      _undoStack = [{ value: text, ss: 0, se: 0 }];
      _redoStack = [];
    }
  }

  function isDirty() {
    if (!_textarea) return false;
    return _textarea.value !== _originalContent;
  }

  function applyAction(action) {
    if (!_textarea) return;
    
    _snapshot(); // Save state before
    
    // Use the central logic service for transformations
    if (typeof MarkdownLogicService !== 'undefined') {
      MarkdownLogicService.applyAction(_textarea, action);
    }

    _snapshot(); // Save state after
  }

  function focusWithContext(context = {}) {
    if (!_textarea) return;
    
    _textarea.focus();

    // Use the central logic service for cursor & scroll synchronization
    if (typeof MarkdownLogicService !== 'undefined') {
      MarkdownLogicService.syncCursor(_textarea, context);
    }
  }

  function revert() {
    if (_textarea) {
      _textarea.value = _originalContent;
      // Reset undo/redo stacks to sync with the reverted state
      _undoStack = [{ value: _textarea.value, ss: 0, se: 0 }];
      _redoStack = [];

      if (typeof TabsModule !== 'undefined' && AppState.currentFile) {
        TabsModule.setDirty(AppState.currentFile, false);
      }
    }
  }

  function insertContent(text, mode = 'insert') {
    if (!_textarea) return;

    _snapshot();

    if (mode === 'replace') {
      _textarea.value = text;
    } else if (mode === 'append') {
      const current = _textarea.value;
      _textarea.value = current + (current && !current.endsWith('\n') ? '\n\n' : (current ? '\n' : '')) + text;
    } else {
      const start = _textarea.selectionStart;
      const end = _textarea.selectionEnd;
      _textarea.setRangeText(text, start, end, 'select');
    }

    _snapshot();
    _textarea.focus();

    // Trigger input event to update dirty state
    _textarea.dispatchEvent(new Event('input'));
  }

  return { 
      bindToElement, unbind, save, isDirty, setOriginalContent, undo, redo, 
      applyAction,
      setDirty: (isDirty) => {
        if (isDirty) {
          _originalContent = _originalContent + ' '; // Force dirty
        } else {
          if (_textarea) {
            _originalContent = _textarea.value;
          }
        }
      },
      focusWithContext,
      getOriginalContent: () => _originalContent,
      insertContent,
      triggerQuickCommand: () => _showQuickCommand(),
      takeSnapshot: _snapshot,
      revert
  };
})();

// Explicitly export to window
window.EditorModule = EditorModule;
