/**
 * QuickCommandPalette (Molecule)
 * Purpose: Provide a context-aware style and command palette in the editor.
 * Dependencies: DesignSystem, EditorModule, EditorUtil
 */
const QuickCommandPalette = (() => {
  'use strict';

  let _el = null;
  let _input = null;
  let _resultsContainer = null;
  let _isOpen = false;
  let _selectedIndex = -1;
  let _filteredCommands = [];
  let _callback = null;

  const COMMANDS = [
    // ── Headings ──
    { id: 'h1', label: 'Heading 1', icon: 'heading-1', hint: '/h1', tags: ['tieude1', 'h1'] },
    { id: 'h2', label: 'Heading 2', icon: 'heading-2', hint: '/h2', tags: ['tieude2', 'h2'] },
    { id: 'h3', label: 'Heading 3', icon: 'heading-3', hint: '/h3', tags: ['tieude3', 'h3'] },
    { id: 'h',  label: 'Heading 4', icon: 'heading-4', hint: '/h4', tags: ['tieude4', 'h4'] },
    { id: 'h5', label: 'Heading 5', icon: 'heading-5', hint: '/h5', tags: ['tieude5', 'h5'] },
    { id: 'h6', label: 'Heading 6', icon: 'heading-6', hint: '/h6', tags: ['tieude6', 'h6'] },

    // ── Typography ──
    { id: 'b',  label: 'Bold', icon: 'bold', hint: '/bold', tags: ['dam', 'indam'] },
    { id: 'i',  label: 'Italic', icon: 'italic', hint: '/italic', tags: ['nghieng', 'innghieng'] },
    { id: 'bi', label: 'Bold Italic', icon: 'edit', hint: '/bi', tags: ['damnghieng'] },
    { id: 's',  label: 'Strikethrough', icon: 'strikethrough', hint: '/s', tags: ['gach', 'gachngang'] },
    { id: 'c',  label: 'Inline Code', icon: 'code', hint: '/code', tags: ['ma', 'inline'] },

    // ── Blocks ──
    { id: 'cb', label: 'Code Block', icon: 'terminal', hint: '/cb', tags: ['khoima', 'codeblock'] },
    { id: 'q',  label: 'Quote', icon: 'quote', hint: '/quote', tags: ['trichdan', 'blockquote'] },
    { id: 'ul', label: 'Bullet List', icon: 'list', hint: '/ul', tags: ['danhsach', 'bullet'] },
    { id: 'ol', label: 'Numbered List', icon: 'list-ordered', hint: '/ol', tags: ['danhsachso', 'numbered'] },
    { id: 'tl', label: 'Task List', icon: 'check-square', hint: '/tl', tags: ['congviec', 'checkbox', 'todo'] },
    { id: 'tl-checked', label: 'Task Done', icon: 'check-circle', hint: '/tldone', tags: ['xong', 'checked'] },

    // ── Insert ──
    { id: 'l',  label: 'Link', icon: 'link', hint: '/link', tags: ['lienket'] },
    { id: 'img',label: 'Image', icon: 'image', hint: '/img', tags: ['anh', 'hinh'] },
    { id: 'tb', label: 'Table', icon: 'table', hint: '/table', tags: ['bang'] },
    { id: 'hr', label: 'Divider', icon: 'minus', hint: '/hr', tags: ['phancach', 'duongke'] },
    { id: 'fn', label: 'Footnote', icon: 'file-text', hint: '/fn', tags: ['chuthich'] }
  ];

  function _init() {
    if (_el) return;

    _el = window.DesignSystem.createElement('div', 'ds-quick-command-palette');
    _el.style.display = 'none';

    const header = window.DesignSystem.createElement('div', 'palette-header');
    _input = window.DesignSystem.createElement('input', 'palette-input', {
      type: 'text',
      placeholder: 'Type a command...',
      spellcheck: 'false',
      autocomplete: 'off'
    });
    header.appendChild(_input);

    _resultsContainer = window.DesignSystem.createElement('div', 'palette-results');

    const footer = window.DesignSystem.createElement('div', 'palette-footer');
    footer.innerHTML = `
      <span>↑↓ Navigate</span>
      <span>↵ Select</span>
    `;

    _el.append(header, _resultsContainer, footer);
    document.body.appendChild(_el);

    _bindEvents();
  }

  function _bindEvents() {
    _input.addEventListener('input', () => {
      _renderResults();
    });

    _input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        _selectedIndex = Math.min(_selectedIndex + 1, _filteredCommands.length - 1);
        _renderResults(false);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        _selectedIndex = Math.max(_selectedIndex - 1, 0);
        _renderResults(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        _selectItem();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        hide();
      }
    });

    // Close when clicking outside
    document.addEventListener('mousedown', (e) => {
      if (_isOpen && _el && !_el.contains(e.target)) {
        hide();
      }
    });
  }

  function _renderResults(rebuild = true) {
    if (rebuild) {
      const query = _input.value.toLowerCase().replace('/', '');
      _filteredCommands = COMMANDS.filter(cmd => 
        cmd.label.toLowerCase().includes(query) || 
        cmd.hint.toLowerCase().includes(query) ||
        cmd.tags.some(tag => tag.includes(query))
      );
      _selectedIndex = _filteredCommands.length > 0 ? 0 : -1;
    }

    _resultsContainer.innerHTML = '';

    if (_filteredCommands.length === 0) {
      _resultsContainer.innerHTML = `
        <div class="palette-empty">No matching commands</div>
      `;
      return;
    }

    _filteredCommands.forEach((cmd, index) => {
      const item = window.DesignSystem.createElement('div', 'palette-item' + (index === _selectedIndex ? ' is-selected' : ''));
      item.innerHTML = `
        <div class="palette-item-icon">${window.DesignSystem.getIcon(cmd.icon)}</div>
        <div class="palette-item-label">${cmd.label}</div>
        <div class="palette-item-hint">${cmd.hint}</div>
      `;
      item.addEventListener('click', () => {
        _selectedIndex = index;
        _selectItem();
      });
      _resultsContainer.appendChild(item);
    });

    if (_selectedIndex !== -1) {
      const selected = _resultsContainer.children[_selectedIndex];
      if (selected) selected.scrollIntoView({ block: 'nearest' });
    }
  }

  function _selectItem() {
    const cmd = _filteredCommands[_selectedIndex];
    if (cmd && _callback) {
      _callback(cmd.id);
    }
    hide();
  }

  function show(x, y, callback, options = {}) {
    _init();
    _callback = callback;
    _isOpen = true;
    _el.style.display = 'flex';
    
    // Header & Input visibility
    const header = _el.querySelector('.palette-header');
    _input.value = ''; // Always clear query on show
    
    if (options.hideInput) {
      header.style.display = 'none';
    } else {
      header.style.display = 'block';
      // Optimization: Don't steal focus immediately if we want to keep editor selection visible
      // The EditorModule will proxy key events to us.
    }
    
    // Position palette logic
    _el.style.visibility = 'hidden';
    _el.style.display = 'flex';
    _renderResults(); // Render first to get the actual height based on content
    
    const rect = _el.getBoundingClientRect();
    
    let top = y + 20; // Default: below cursor
    let left = x;

    // Horizontal boundary check
    if (left + rect.width > window.innerWidth) {
      left = window.innerWidth - rect.width - 20;
    }
    if (left < 10) left = 10;

    // Vertical boundary check: Flip to top if bottom space is insufficient
    const spaceBelow = window.innerHeight - top;
    if (spaceBelow < rect.height + 20) {
      // Flip to top of cursor (y is bottom of line, so we go up by rect.height + line offset)
      top = y - rect.height - 40; 
    }

    // Final safety check for top boundary
    if (top < 10) top = 10;

    _el.style.top = `${top}px`;
    _el.style.left = `${left}px`;
    _el.style.visibility = 'visible';
  }

  function updateQuery(query) {
    if (!_isOpen) return;
    _input.value = query;
    _renderResults();
  }

  function getSelectedCommandId() {
    if (!_isOpen || _selectedIndex === -1) return null;
    return _filteredCommands[_selectedIndex] ? _filteredCommands[_selectedIndex].id : null;
  }

  function navigate(direction) {
    if (!_isOpen || _filteredCommands.length === 0) return;

    if (direction === 'down') {
      _selectedIndex = Math.min(_selectedIndex + 1, _filteredCommands.length - 1);
    } else if (direction === 'up') {
      _selectedIndex = Math.max(_selectedIndex - 1, 0);
    }
    _renderResults(false);
  }

  function hide() {
    if (!_el) return;
    _el.style.display = 'none';
    _isOpen = false;
    _selectedIndex = -1;
  }

  /**
   * Proxied key handler to allow the palette to function while focus remains on the editor.
   * @param {KeyboardEvent} e 
   * @returns {boolean} True if handled
   */
  function handleKey(e) {
    if (!_isOpen) return false;

    if (e.key === 'ArrowDown') {
      navigate('down');
      return true;
    }
    if (e.key === 'ArrowUp') {
      navigate('up');
      return true;
    }
    if (e.key === 'Enter') {
      _selectItem();
      return true;
    }
    if (e.key === 'Escape') {
      hide();
      return true;
    }
    if (e.key === 'Backspace') {
      _input.value = _input.value.slice(0, -1);
      _renderResults();
      return true;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      _input.value += e.key;
      _renderResults();
      return true;
    }

    return false;
  }

  return {
    show,
    hide,
    updateQuery,
    getSelectedCommandId,
    navigate,
    handleKey,
    isOpen: () => _isOpen
  };
})();

window.QuickCommandPalette = QuickCommandPalette;
