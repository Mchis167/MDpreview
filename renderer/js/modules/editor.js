/* global AppState, TabsModule, FileService, showToast, loadFile, DraftModule, MarkdownLogicService, MonacoService, monaco, MonacoActionService, MonacoSyncService */

const EditorModule = (() => {
  let _originalContent = '';

  let _isSlashMode = false;
  let _slashStartPos = -1;
  let _changeListener = null;
  let _keyListener = null;
  const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform);

  function undo() {
    if (MonacoService) MonacoService.undo();
  }

  function redo() {
    if (MonacoService) MonacoService.redo();
  }

  function _handleContentChange() {
    if (typeof TabsModule !== 'undefined' && AppState.currentFile) {
      TabsModule.setDirty(AppState.currentFile, isDirty());
    }

    // ── Slash Command Logic (Simplified for Monaco) ──
    if (!MonacoService.isInitialized()) return;
    
    const pos = MonacoService.getCursorPosition(); // { lineNumber, column }
    const content = MonacoService.getValue();
    const lines = content.split('\n');
    const currentLineText = lines[pos.lineNumber - 1] || '';
    const lastChar = currentLineText.charAt(pos.column - 2);

    if (lastChar === '/') {
      // Check if it's the start of line or preceded by space
      const beforeSlash = currentLineText.substring(0, pos.column - 2);
      if (pos.column === 2 || /[\s\n]$/.test(beforeSlash)) {
        _isSlashMode = true;
        _slashStartPos = pos.column - 2; 
        _showQuickCommand(true, true);
      } else {
        _isSlashMode = false;
        if (window.QuickCommandPalette) window.QuickCommandPalette.hide();
      }
    } else {
      _isSlashMode = false;
      if (window.QuickCommandPalette) window.QuickCommandPalette.hide();
    }
  }

  function _handleKeyDown(e) {
    try {
      const K_ENTER = 3;
      const K_TAB = 2;
      const K_DOWN = 18;
      const K_UP = 16;
      const K_ESC = 9;
      const K_S = 49;
      const K_B = 32;
      const K_I = 39;
      const K_K = 41;
      const K_SLASH = 47;
      const K_Z = 56;
      const K_PERIOD = 46; // "." key

      if (_isSlashMode) {
        if (e.keyCode === K_ENTER) {
          const cmdId = window.QuickCommandPalette.getSelectedCommandId();
          if (cmdId) {
            e.preventDefault();
            _applySlashCommand(cmdId);
            return;
          }
        } else if (e.keyCode === K_DOWN) {
          e.preventDefault();
          window.QuickCommandPalette.navigate('down');
          return;
        } else if (e.keyCode === K_UP) {
          e.preventDefault();
          window.QuickCommandPalette.navigate('up');
          return;
        } else if (e.keyCode === K_ESC) {
          _isSlashMode = false;
          window.QuickCommandPalette.hide();
          return;
        }
      }

      if (e.ctrlKey || e.metaKey) {
        const comboStr = `${isMac ? 'Cmd' : 'Ctrl'}${e.shiftKey ? '+Shift' : ''}+${e.browserEvent.key}`;
        
        if (e.keyCode === K_PERIOD && e.shiftKey) {
          e.preventDefault();
          console.warn(`[DEBUG-SHORTCUT] Action: blockquote, Combo: ${comboStr}`);
          applyAction('q');
          return;
        }
        if (e.keyCode === K_S) {
          e.preventDefault();
          console.warn(`[DEBUG-SHORTCUT] Action: save, Combo: ${comboStr}`);
          save();
          return;
        }
        if (e.keyCode === K_B) {
          e.preventDefault();
          console.warn(`[DEBUG-SHORTCUT] Action: bold, Combo: ${comboStr}`);
          applyAction('b');
          return;
        }
        if (e.keyCode === K_I) {
          e.preventDefault();
          console.warn(`[DEBUG-SHORTCUT] Action: italic, Combo: ${comboStr}`);
          applyAction('i');
          return;
        }
        if (e.keyCode === K_K) {
          e.preventDefault();
          console.warn(`[DEBUG-SHORTCUT] Action: link, Combo: ${comboStr}`);
          applyAction('l');
          return;
        }
        if (e.keyCode === K_SLASH) {
          e.preventDefault();
          console.warn(`[DEBUG-SHORTCUT] Action: quick-command, Combo: ${comboStr}`);
          _showQuickCommand();
          return;
        }
        if (e.keyCode === K_Z) {
          e.preventDefault();
          const action = e.shiftKey ? 'redo' : 'undo';
          console.warn(`[DEBUG-SHORTCUT] Action: ${action}, Combo: ${comboStr}`);
          if (e.shiftKey) redo(); else undo();
          return;
        }
      }

      if (typeof MarkdownLogicService !== 'undefined' && !AppState.settings.smartTypingDisabled && !e.isComposing && !_isSlashMode) {
        if (e.keyCode === K_ENTER && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const model = MonacoService.getInstance().getModel();
          const pos = MonacoService.getCursorPosition();
          const offset = model.getOffsetAt(pos);
          
          const res = MarkdownLogicService.computeSmartEnter(MonacoService.getValue(), offset, offset);
          if (res) {
            e.preventDefault();
            if (res.range && res.text) {
              MonacoService.executeEdit(res.range, res.text);
            } else {
              MonacoService.setValue(res.newValue);
            }

            const newPos = model.getPositionAt(res.newCursorPos);
            MonacoService.setCursorPosition(newPos);
            return;
          }
        }
        if (e.keyCode === K_TAB && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const direction = e.shiftKey ? 'out' : 'in';
          const model = MonacoService.getInstance().getModel();
          const sel = MonacoService.getSelection();
          const startOffset = model.getOffsetAt(sel.getStartPosition());
          const endOffset = model.getOffsetAt(sel.getEndPosition());

          const res = MarkdownLogicService.computeListIndent(MonacoService.getValue(), startOffset, endOffset, direction);
          if (res) {
            e.preventDefault();
            e.stopPropagation();

            if (res.range && res.text) {
              MonacoService.executeEdit(res.range, res.text);
            } else {
              MonacoService.setValue(res.newValue);
            }

            const newStartPos = model.getPositionAt(res.newCursorPos);
            const newEndPos = model.getPositionAt(res.newSelectionEnd || res.newCursorPos);
            MonacoService.setSelection({
              startLineNumber: newStartPos.lineNumber,
              startColumn: newStartPos.column,
              endLineNumber: newEndPos.lineNumber,
              endColumn: newEndPos.column
            });
            return;
          }
        }
      }
    } catch (err) {
      console.error('[EditorModule] KeyDown Error:', err);
    }
  }

  /**
   * Binds the editor logic to Monaco Editor.
   */
  async function bind() {
    // Unbind previous if exists
    unbind();

    // Ensure Monaco is ready
    if (!MonacoService.isInitialized()) {
      await MonacoService.init();
      // Wait a tiny bit more for the instance to be created after init
      await new Promise(r => setTimeout(r, 100));
    }

    // Listen to content changes
    _changeListener = MonacoService.onContentChange(() => {
      _handleContentChange();
    });

    // Listen to keydown
    const editor = MonacoService.getInstance();
    if (editor) {
      _keyListener = editor.onKeyDown((e) => {
        _handleKeyDown(e);
      });
    } else {
      console.warn('[EditorModule] Failed to bind listeners: Monaco instance not found');
    }
  }

  /**
   * Applies the command and removes the slash + query text
   */
  function _applySlashCommand(cmdId) {
    if (!MonacoService.isInitialized()) return;
    
    const pos = MonacoService.getCursorPosition();

    // Calculate the range to remove: from _slashStartPos (column on current line) to current column
    const range = new monaco.Range(pos.lineNumber, _slashStartPos + 1, pos.lineNumber, pos.column);
    
    MonacoService.executeEdit(range, '');
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
    if (!window.QuickCommandPalette || !MonacoService.isInitialized()) return;

    const coords = MonacoService.getCursorPixelPosition();
    
    window.QuickCommandPalette.show(coords.left, coords.top + 20, (actionId) => {
      if (isSlashTrigger) {
        _applySlashCommand(actionId);
      } else {
        applyAction(actionId);
      }
    }, { hideInput });
  }

  /**
   * Clears listeners to prevent leaks
   */
  function unbind() {
    if (_changeListener) {
      _changeListener.dispose();
      _changeListener = null;
    }
    if (_keyListener) {
      _keyListener.dispose();
      _keyListener = null;
    }
    _isSlashMode = false;
  }

  async function save() {
    if (!AppState.currentFile || !MonacoService.isInitialized()) return false;
    const content = MonacoService.getValue();

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
      if (MonacoService.isInitialized() && MonacoService.getValue() !== text) {
        // Monaco handles value sync and its own stack
        MonacoService.setValue(text);
      }
  }

  function isDirty() {
    if (!MonacoService.isInitialized()) return false;
    return MonacoService.getValue() !== _originalContent;
  }

  function applyAction(action) {
    if (!MonacoService.isInitialized()) return;
    
      // Use the dedicated action service for formatting
      if (typeof MonacoActionService !== 'undefined') {
        MonacoActionService.applyAction(MonacoService, action);
      } else if (typeof MarkdownLogicService !== 'undefined') {
        // Fallback for safety (though it shouldn't be needed)
        MarkdownLogicService.applyAction(MonacoService, action);
      }
  }

  function focusWithContext(context = {}) {
    if (!MonacoService.isInitialized()) return;
    
    MonacoService.focus();

    // Use the dedicated sync service for cursor & scroll synchronization
    if (typeof MonacoSyncService !== 'undefined') {
      MonacoSyncService.syncCursor(MonacoService, context);
    } else if (typeof MarkdownLogicService !== 'undefined') {
      MarkdownLogicService.syncCursor(MonacoService, context);
    }
  }

  function revert() {
    if (MonacoService.isInitialized()) {
      MonacoService.setValue(_originalContent);

      if (typeof TabsModule !== 'undefined' && AppState.currentFile) {
        TabsModule.setDirty(AppState.currentFile, false);
      }
    }
  }

  function insertContent(text, mode = 'insert') {
    if (!MonacoService.isInitialized()) return;

    if (mode === 'replace') {
      MonacoService.setValue(text);
    } else if (mode === 'append') {
      const current = MonacoService.getValue();
      const newVal = current + (current && !current.endsWith('\n') ? '\n\n' : (current ? '\n' : '')) + text;
      MonacoService.setValue(newVal);
    } else {
      const sel = MonacoService.getSelection();
      MonacoService.executeEdit(sel, text);
    }

    MonacoService.focus();
  }

  return { 
      bind, unbind, save, isDirty, setOriginalContent, undo, redo, 
      applyAction,
      setDirty: (isDirty) => {
        if (isDirty) {
          _originalContent = _originalContent + ' '; // Force dirty
        } else {
          if (MonacoService.isInitialized()) {
            _originalContent = MonacoService.getValue();
          }
        }
      },
      focusWithContext,
      getOriginalContent: () => _originalContent,
      insertContent,
      triggerQuickCommand: () => _showQuickCommand(),
      takeSnapshot: () => {}, // No-op now
      revert
  };
})();

// Explicitly export to window
window.EditorModule = EditorModule;
