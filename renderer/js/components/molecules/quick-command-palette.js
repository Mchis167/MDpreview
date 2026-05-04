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
    { id: 'fn', label: 'Footnote', icon: 'file-text', hint: '/fn', tags: ['chuthich'] },
    { divider: true },
    { id: 'live-preview', label: 'Open Live Preview', icon: 'external-link', hint: '/lp', tags: ['xem', 'preview', 'live'] }
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
      _filteredCommands = COMMANDS.filter(cmd => {
        if (cmd.divider) return query === ''; // Only show dividers when not searching
        return (
          cmd.label.toLowerCase().includes(query) || 
          cmd.hint.toLowerCase().includes(query) ||
          cmd.tags.some(tag => tag.includes(query))
        );
      });
      
      _selectedIndex = -1;
      if (_filteredCommands.length > 0) {
        // Find first non-divider
        for (let i = 0; i < _filteredCommands.length; i++) {
          if (!_filteredCommands[i].divider) {
            _selectedIndex = i;
            break;
          }
        }
      }
    }

    _resultsContainer.innerHTML = '';

    if (_filteredCommands.length === 0) {
      _resultsContainer.innerHTML = `
        <div class="palette-empty">No matching commands</div>
      `;
      return;
    }

    _filteredCommands.forEach((cmd, index) => {
      if (cmd.divider) {
        const div = window.DesignSystem.createElement('div', 'palette-divider');
        _resultsContainer.appendChild(div);
        return;
      }

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
      setTimeout(() => _input.focus(), 50);
    }
    
    // Position palette
    const rect = _el.getBoundingClientRect();
    let top = y + 20;
    let left = x;

    // Boundary check
    if (left + rect.width > window.innerWidth) left = window.innerWidth - rect.width - 20;
    if (top + rect.height > window.innerHeight) top = y - rect.height - 10;

    _el.style.top = `${top}px`;
    _el.style.left = `${left}px`;

    _renderResults();
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

    let newIndex = _selectedIndex;
    const step = direction === 'down' ? 1 : -1;

    do {
      newIndex += step;
      // Wrap around or clamp? Clamp is usually better for palettes
      if (newIndex < 0 || newIndex >= _filteredCommands.length) {
        return; // Stop at boundaries
      }
    } while (_filteredCommands[newIndex] && _filteredCommands[newIndex].divider);

    _selectedIndex = newIndex;
    _renderResults(false);
  }

  function hide() {
    if (!_el) return;
    _el.style.display = 'none';
    _isOpen = false;
    _selectedIndex = -1;
    if (_callback) {
      // Optional: signal close without action
    }
  }

  return {
    show,
    hide,
    updateQuery,
    getSelectedCommandId,
    navigate,
    isOpen: () => _isOpen
  };
})();

window.QuickCommandPalette = QuickCommandPalette;
