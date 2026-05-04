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
    // Trigger preview update after undo
    if (window.PreviewService) {
      window.PreviewService.triggerUpdate(true);
    }
  }

  function redo() {
    if (_redoStack.length === 0) return;
    const snap = _redoStack.pop();
    _undoStack.push(snap);
    _restoreSnapshot(snap);
    // Trigger preview update after redo
    if (window.PreviewService) {
      window.PreviewService.triggerUpdate(true);
    }
  }

  /**
   * Binds the editor logic to a specific textarea element.
   * This is called by the MarkdownEditor component.
   */
  function bindToElement(el) {
    _textarea = el;
    if (!_textarea) return;

    // Reset stacks for new file/session
    _undoStack = [{ value: _textarea.value, ss: _textarea.selectionStart, se: _textarea.selectionEnd }];
    _redoStack = [];

    _textarea.addEventListener('input', (e) => {
      if (_ignoreNextInput) { _ignoreNextInput = false; return; }
      _scheduleSnapshot();

      if (typeof TabsModule !== 'undefined' && AppState.currentFile) {
        TabsModule.setDirty(AppState.currentFile, isDirty());
      }

      if (window.PreviewService) {
        window.PreviewService.triggerUpdate();
      }

      // ── Auto-scroll to keep last lines visible ──
      requestAnimationFrame(() => {
        const scrollableHeight = _textarea.scrollHeight - _textarea.clientHeight;
        const cursorLine = _textarea.value.substring(0, _textarea.selectionStart).split('\n').length;
        const totalLines = _textarea.value.split('\n').length;

        // Only auto-scroll if on last 3 lines and not already at bottom
        if (cursorLine >= totalLines - 3 && _textarea.scrollTop < scrollableHeight - 50) {
          _textarea.scrollTop = scrollableHeight;
        }
      });

      // ── Debug: Track current line ──
      if (window.DebugService) {
        const pos = _textarea.selectionStart;
        const textBefore = _textarea.value.substring(0, pos);
        const lineNum = textBefore.split('\n').length;
        window.DebugService.updateEditLine(lineNum);
      }

      // ── Slash Command Logic ──
      const pos = _textarea.selectionStart;
      const text = _textarea.value;

      if (e.data === '/') {
        // Trigger if it's the start of a line or preceded by a space/newline
        if (pos === 1 || /[\s\n]/.test(text.charAt(pos - 2))) {
          _isSlashMode = true;
          _slashStartPos = pos - 1;
          _showQuickCommand(true, true);
        }
      } else if (_isSlashMode) {
        // If the slash is gone or we moved before it, stop
        if (text.charAt(_slashStartPos) !== '/' || pos <= _slashStartPos) {
          _isSlashMode = false;
          window.QuickCommandPalette.hide();
          return;
        }

        const query = text.substring(_slashStartPos + 1, pos);
        
        // Stop ONLY on hard line breaks in input event
        if (/[\n\r]/.test(query)) {
          _isSlashMode = false;
          window.QuickCommandPalette.hide();
          return;
        }
        
        // Update palette (it handles empty matches internally with a friendly UI)
        window.QuickCommandPalette.updateQuery(query);
      }
    });

    _textarea.addEventListener('keydown', (e) => {
      // If in Slash Mode, intercept Space and Arrows
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
        // Removed Backspace intercept here to let 'input' handle it
      }

      // Global Shortcut Interception (TC-10)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        save();
        return;
      }

      // Quick Command Action (Cmd + /)
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        _showQuickCommand();
        return;
      }

      // Sync undo/redo stack
      if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
    });

    // ── Live Preview Scroll Sync ──
    _textarea.addEventListener('scroll', () => {
      if (window.SyncService && window.PreviewService) {
        const data = window.SyncService.captureEditorSyncData();
        window.PreviewService.sendScroll(data.scrollPct, data.line);

        // ── Debug: Track scroll ──
        if (window.DebugService) {
          window.DebugService.updateScroll(data.scrollPct);
        }
      }
    });

    // ── Live Preview Typing Highlight Sync ──
    _textarea.addEventListener('keyup', () => {
       if (window.SyncService && window.PreviewService) {
         const data = window.SyncService.captureEditorSyncData();
         window.PreviewService.sendScroll(data.scrollPct, data.line);
       }
    });
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
   * Clears the textarea reference to prevent memory leaks
   */
  function unbind() {
    _textarea = null;
    _undoStack = [];
    _redoStack = [];
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
      if (action === 'live-preview') {
        if (window.PreviewService) window.PreviewService.open();
      } else {
        MarkdownLogicService.applyAction(_textarea, action);
      }
    }

    _snapshot(); // Save state after
    
    if (window.PreviewService) {
      window.PreviewService.triggerUpdate(true); // Immediate update after action
    }
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
      getContent: () => _textarea ? _textarea.value : undefined,
      getCurrentFileName: () => AppState.currentFile ? AppState.currentFile.split('/').pop() : 'Untitled',
      insertContent,
      triggerQuickCommand: () => _showQuickCommand(),
      revert
  };
})();

// Explicitly export to window
window.EditorModule = EditorModule;
