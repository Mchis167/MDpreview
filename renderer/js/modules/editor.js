/* global AppState, TabsModule, FileService, showToast, loadFile, DraftModule, MarkdownLogicService, MonacoService, monaco, MonacoActionService, MonacoSyncService, BugLogger */

const EditorModule = (() => {
  let _originalContent = '';

  let _isSlashMode = false;
  let _slashStartPos = -1;
  let _changeListener = null;
  let _cursorListener = null;
  let _keyListener = null;
  let _boundFileId = null; // ID locking to prevent saving to wrong file during transitions
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

    // ── Slash Command Logic (Hybrid with Monaco) ──
    if (!MonacoService.isInitialized()) return;
    
    const pos = MonacoService.getCursorPosition();
    const model = MonacoService.getInstance().getModel();
    if (!model || pos.lineNumber > model.getLineCount()) return;
    
    const lineContent = model.getLineContent(pos.lineNumber);

    if (_isSlashMode) {
      // Validate session: Is the cursor still on the same line and after _slashStartPos?
      const textAfterSlash = lineContent.substring(_slashStartPos + 1, pos.column - 1);
      
      // If user typed space (handled in KeyDown now) or moved cursor before/at slash, or character at start is no longer /
      if (lineContent.charAt(_slashStartPos) !== '/' || pos.column <= _slashStartPos + 1) {
        _isSlashMode = false;
        if (window.QuickCommandPalette) window.QuickCommandPalette.hide();
      } else {
        // Update the live filter with what's after the slash
        if (window.QuickCommandPalette) window.QuickCommandPalette.updateQuery(textAfterSlash);
      }
    } else {
      // Detect start of slash command
      const charAtCursor = lineContent.charAt(pos.column - 1);
      const charBeforeCursor = lineContent.charAt(pos.column - 2);
      
      let slashIdx = -1;
      if (charBeforeCursor === '/') {
        slashIdx = pos.column - 2;
      } else if (charAtCursor === '/') {
        slashIdx = pos.column - 1;
      }

      if (slashIdx !== -1) {
        const charAfterSlash = lineContent.charAt(slashIdx + 1);
        const beforeSlash = lineContent.substring(0, slashIdx);
        
        // Trigger ONLY if not followed by space (allows `/` alone or `/cmd`)
        // Trigger ONLY if not followed by space (allows `/` alone or `/cmd`)
        if ((slashIdx === 0 || /[\s\n]$/.test(beforeSlash)) && charAfterSlash !== ' ') {
          _isSlashMode = true;
          _slashStartPos = slashIdx; 
          _showQuickCommand(true, true);
          
          // Calculate query immediately from current cursor position
          const currentQuery = lineContent.substring(slashIdx + 1, pos.column - 1);
          if (window.QuickCommandPalette) window.QuickCommandPalette.updateQuery(currentQuery);
        }
      }
    }
  }

  function _handleKeyDown(e) {
    try {
      const K_ENTER = 3;
      const K_TAB = 2;
      const K_S = 49;
      const K_B = 32;
      const K_I = 39;
      const K_K = 41;
      const K_Z = 56;
      const K_PERIOD = 46; // "." key

      if (_isSlashMode && window.QuickCommandPalette) {
        if (e.keyCode === monaco.KeyCode.Enter || e.keyCode === monaco.KeyCode.Space) {
          const query = _getCurrentSlashQuery();
          const cmdId = window.QuickCommandPalette.getSelectedCommandId();
          
          if (e.keyCode === monaco.KeyCode.Space) {
            if (query.length > 0 && cmdId) {
              e.preventDefault();
              e.stopPropagation();
              _applySlashCommand(cmdId);
              return;
            } else {
              // If empty slash or no match, just dismiss and let space be typed
              _isSlashMode = false;
              window.QuickCommandPalette.hide();
            }
          } else if (e.keyCode === monaco.KeyCode.Enter && cmdId) {
            e.preventDefault();
            e.stopPropagation();
            _applySlashCommand(cmdId);
            return;
          }
        } else if (e.keyCode === monaco.KeyCode.DownArrow) {
          e.preventDefault();
          e.stopPropagation();
          window.QuickCommandPalette.navigate('down');
          return;
        } else if (e.keyCode === monaco.KeyCode.UpArrow) {
          e.preventDefault();
          e.stopPropagation();
          window.QuickCommandPalette.navigate('up');
          return;
        } else if (e.keyCode === monaco.KeyCode.Escape) {
          e.preventDefault();
          e.stopPropagation();
          _isSlashMode = false;
          window.QuickCommandPalette.hide();
          return;
        }
      }

      if (e.ctrlKey || e.metaKey) {
        const comboStr = `${isMac ? 'Cmd' : 'Ctrl'}${e.shiftKey ? '+Shift' : ''}+${e.browserEvent.key}`;
        
        if (e.keyCode === K_PERIOD && e.shiftKey) {
          e.preventDefault();
          applyAction('q');
          return;
        }
        if (e.keyCode === K_S) {
          e.preventDefault();
          const returnToRead = e.shiftKey;
          save(returnToRead);
          return;
        }
        if (e.keyCode === K_B) {
          e.preventDefault();
          applyAction('b');
          return;
        }
        if (e.keyCode === K_I) {
          e.preventDefault();
          applyAction('i');
          return;
        }
        if (e.keyCode === K_K) {
          e.preventDefault();
          applyAction('l');
          return;
        }
        if (e.keyCode === monaco.KeyCode.Slash && (e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          _showQuickCommand();
          return;
        }

        // Trigger on plain '/' key (immediate)
        if (e.keyCode === monaco.KeyCode.Slash && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
          // We let the character be typed (no preventDefault)
          // but we trigger the content change logic immediately after this event loop
          setTimeout(() => _handleContentChange(), 0);
        }
        if (e.keyCode === K_Z) {
          e.preventDefault();
          const action = e.shiftKey ? 'redo' : 'undo';
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
   * Helper to get current slash query text
   */
  function _getCurrentSlashQuery() {
    if (!_isSlashMode || !MonacoService.isInitialized()) return '';
    const pos = MonacoService.getCursorPosition();
    const model = MonacoService.getInstance().getModel();
    if (!model || pos.lineNumber > model.getLineCount()) return '';
    const lineContent = model.getLineContent(pos.lineNumber);
    return lineContent.substring(_slashStartPos + 1, pos.column - 1);
  }

  /**
   * Binds the editor logic to Monaco Editor.
   */
  async function bind() {
    const fileId = AppState.currentFile;
    const isNewFile = fileId !== _boundFileId;

    // Unbind previous if exists
    unbind();
    
    _boundFileId = fileId;

    // Reset state ONLY if we actually switched to a different file.
    // If it's a reload or same-file transition, keep the _originalContent 
    // that might have been set by setOriginalContent() just before bind().
    if (isNewFile) {
      _originalContent = '';
    }

    // Ensure Monaco is ready
    if (!MonacoService.isInitialized()) {
      await MonacoService.init();
      // Note: MarkdownEditor.activate awaits the mount promise, 
      // so by the time we continue here, Monaco should be truly ready.
      await new Promise(r => setTimeout(r, 50)); 
    }

    // Sync state with editor
    if (MonacoService.isInitialized()) {
      const editorValue = MonacoService.getValue();
      
      if (_originalContent && editorValue !== _originalContent) {
        // We have pending content (e.g. from loadFile), push it to Monaco
        MonacoService.setValue(_originalContent);
      } else if (!_originalContent) {
        // No pending content, take from Monaco
        _originalContent = editorValue;
      }
    }

    // Listen to content changes
    _changeListener = MonacoService.onContentChange(() => {
      _handleContentChange();
    });

    _cursorListener = MonacoService.onCursorChange(() => {
      if (_isSlashMode) _handleContentChange();
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
    if (_cursorListener) {
      _cursorListener.dispose();
      _cursorListener = null;
    }
    if (_keyListener) {
      _keyListener.dispose();
      _keyListener = null;
    }
    _isSlashMode = false;
    _boundFileId = null;
  }

  async function save(returnToRead = true) {
    const targetFile = _boundFileId || AppState.currentFile;
    if (!targetFile || !MonacoService.isInitialized()) return false;
    
    const content = MonacoService.getValue();
    
    // SAFE GUARD: If content is empty but original was not, it's likely a race condition during mount.
    // This prevents "white-out" bugs where a draft is cleared accidentally.
    if (content.length === 0 && _originalContent.length > 0) {
      return false;
    }

    if (targetFile && targetFile.startsWith('__DRAFT_')) {
        if (typeof DraftModule !== 'undefined') {
            DraftModule.setDraftContent(content, targetFile);
            await DraftModule.renderPreview(content, targetFile);
            _originalContent = content;
            if (typeof showToast === 'function') showToast('Draft updated');
            return true;
        }
        return false;
    }

    if (typeof FileService === 'undefined' || !FileService.saveFile) return false;
    const success = await FileService.saveFile(targetFile, content);
    
    if (success) {
      if (typeof showToast === 'function') showToast('File saved successfully');
      _originalContent = content; 
      
      if (typeof TabsModule !== 'undefined' && targetFile) {
        TabsModule.setDirty(targetFile, false);
      }
      
      // Return to read mode if requested
      if (returnToRead) {
        if (window.AppState && AppState.updateToolbarUI) {
          AppState.updateToolbarUI('read');
        } else if (typeof loadFile === 'function') {
          loadFile(targetFile);
        }
      }
      return true;
    } else {
      if (typeof showToast === 'function') showToast('Failed to save file', 'error');
      return false;
    }
  }

  function setOriginalContent(text) {
    // Always update the internal buffer so that bind() can pick it up
    _originalContent = text;

    if (MonacoService.isInitialized()) {
      if (MonacoService.getValue() !== text) {
        // Monaco handles value sync and its own stack
        MonacoService.setValue(text);
      }
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
