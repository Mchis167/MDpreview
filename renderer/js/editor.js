/* ── Editor Toolbar Logic ─────────────────────────────── */

const EditorModule = (() => {
  let _originalContent = '';
  let _textarea = null;

  function init() {
    _textarea = document.getElementById('edit-textarea');
    const toolBtns = document.querySelectorAll('.edit-tool-btn');
    const saveBtn = document.getElementById('edit-save-btn');
    const cancelBtn = document.getElementById('edit-cancel-btn');

    if (!_textarea) return;

    // Formatting Actions
    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        applyAction(_textarea, action);
      });
    });

    // Help Toggle logic
    const helpBtn = document.getElementById('edit-help-btn');
    const helpPopover = document.getElementById('edit-help-popover');
    if (helpBtn && helpPopover) {
        helpBtn.onclick = (e) => {
            e.preventDefault(); // Prevent unexpected scrolling
            e.stopPropagation();
            helpPopover.classList.toggle('open');
        };

        const closeBtn = document.getElementById('help-close-btn');
        if (closeBtn) {
            closeBtn.onclick = () => helpPopover.classList.remove('open');
        }

        // Attach listeners to help items
        const helpItems = helpPopover.querySelectorAll('.help-item-btn');
        helpItems.forEach(item => {
            item.onclick = (e) => {
                e.preventDefault(); // Prevent losing textarea focus/selection
                const action = item.dataset.action;
                applyAction(_textarea, action);
            };
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') helpPopover.classList.remove('open');
        });
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!helpPopover.contains(e.target) && e.target !== helpBtn) {
                helpPopover.classList.remove('open');
            }
        });
    }

    // Save Action
    if (saveBtn) {
      saveBtn.onclick = async () => {
        const success = await save();
        if (success) {
          const readSeg = document.querySelector('.mode-segment[data-mode="read"]');
          if (readSeg) readSeg.click();
        }
      };
    }

    // Cancel Action
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        // Toggle back to read mode
        const readSeg = document.querySelector('.mode-segment[data-mode="read"]');
        if (readSeg) readSeg.click();
      };
    }
  }

  async function save() {
    if (!AppState.currentFile || !_textarea) return false;
    const content = _textarea.value;

    // Special Case: AI Response
    if (AppState.currentFile === '__AI_RESPONSE__') {
        const aiInput = document.getElementById('ai-chat-input');
        if (aiInput) {
            aiInput.value = content;
            _originalContent = content; // Update original to new state
            if (typeof showToast === 'function') showToast('AI response updated');
            // Re-render preview automatically
            if (typeof AIResponseModule !== 'undefined' && typeof AIResponseModule.renderPreview === 'function') {
                AIResponseModule.renderPreview();
            }
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
    if (_textarea) _textarea.value = text;
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

  return { init, save, isDirty, setOriginalContent };
})();

document.addEventListener('DOMContentLoaded', () => {
    EditorModule.init();
});
