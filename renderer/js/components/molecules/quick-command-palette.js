/**
 * QuickCommandPalette (Molecule)
 * Purpose: Provide a context-aware style and command palette in the editor.
 * Dependencies: DesignSystem, EditorModule, EditorUtil
 */
/* global DesignSystem, monaco */
const QuickCommandPalette = (() => {
  'use strict';

  let _el = null;
  let _input = null;
  let _resultsContainer = null;
  let _isOpen = false;
  let _selectedIndex = -1;
  let _filteredCommands = [];
  let _callback = null;
  let _usageCounts = {};
  const USAGE_KEY = 'mdpreview_slash_usage';

  const COMMANDS = [
    // ── Headings ──
    { id: 'h1', label: 'Heading 1', icon: 'heading-1', hint: '/h1', tags: ['tieude1', 'h1'] },
    { id: 'h2', label: 'Heading 2', icon: 'heading-2', hint: '/h2', tags: ['tieude2', 'h2'] },
    { id: 'h3', label: 'Heading 3', icon: 'heading-3', hint: '/h3', tags: ['tieude3', 'h3'] },
    { id: 'h4', label: 'Heading 4', icon: 'heading-4', hint: '/h4', tags: ['tieude4', 'h4'] },
    { id: 'h5', label: 'Heading 5', icon: 'heading-5', hint: '/h5', tags: ['tieude5', 'h5'] },
    { id: 'h6', label: 'Heading 6', icon: 'heading-6', hint: '/h6', tags: ['tieude6', 'h6'] },

    // ── Typography ──
    { id: 'b', label: 'Bold', icon: 'bold', hint: '/bold', tags: ['dam', 'indam'] },
    { id: 'i', label: 'Italic', icon: 'italic', hint: '/italic', tags: ['nghieng', 'innghieng'] },
    { id: 'bi', label: 'Bold Italic', icon: 'edit', hint: '/bi', tags: ['damnghieng'] },
    { id: 's', label: 'Strikethrough', icon: 'strikethrough', hint: '/s', tags: ['gach', 'gachngang'] },
    { id: 'c', label: 'Inline Code', icon: 'code', hint: '/code', tags: ['ma', 'inline'] },

    // ── Blocks ──
    { id: 'cb', label: 'Code Block', icon: 'terminal', hint: '/cb', tags: ['khoima', 'codeblock'] },
    { id: 'q', label: 'Quote', icon: 'quote', hint: '/quote', tags: ['trichdan', 'blockquote'] },
    { id: 'ul', label: 'Bullet List', icon: 'list', hint: '/ul', tags: ['danhsach', 'bullet'] },
    { id: 'ol', label: 'Numbered List', icon: 'list-ordered', hint: '/ol', tags: ['danhsachso', 'numbered'] },
    { id: 'tl', label: 'Task List', icon: 'check-square', hint: '/tl', tags: ['congviec', 'checkbox', 'todo'] },
    { id: 'tl-checked', label: 'Task Done', icon: 'check-circle', hint: '/tldone', tags: ['xong', 'checked'] },

    // ── Insert ──
    { id: 'l', label: 'Link', icon: 'link', hint: '/link', tags: ['lienket'] },
    { id: 'img', label: 'Image Link', icon: 'image', hint: '/img', tags: ['anh', 'hinh', 'image', 'img'] },
    { id: 'img-asset', label: 'Pick from Assets', icon: 'images', hint: '/asset', tags: ['anh', 'hinh', 'vault', 'asset', 'image', 'img'] },
    { id: 'img-upload', label: 'Upload Image', icon: 'upload', hint: '/upload', tags: ['anh', 'hinh', 'upload', 'image', 'img'] },
    { id: 'tb', label: 'Table', icon: 'table', hint: '/table', tags: ['bang'] },
    { id: 'hr', label: 'Divider', icon: 'minus', hint: '/hr', tags: ['phancach', 'duongke'] },
    { id: 'fn', label: 'Footnote', icon: 'file-text', hint: '/fn', tags: ['chuthich'] },
    { id: 'open-asset-panel', label: 'Open Asset Panel', icon: 'images', hint: '/panel', tags: ['asset', 'panel', 'management', 'quan ly', 'img', 'image'] },
    { id: 'global-shortcuts-search', label: 'Search App Shortcuts', icon: 'square-chevron-right', hint: '/shortcuts', tags: ['help', 'phim tat'] }
  ];

  function _init() {
    if (_el) return;

    _el = DesignSystem.createElement('div', 'ds-quick-command-palette');
    _el.style.display = 'none';

    const header = DesignSystem.createElement('div', 'palette-header');
    _input = DesignSystem.createElement('input', 'palette-input', {
      type: 'text',
      placeholder: 'Type a command...',
      spellcheck: 'false',
      autocomplete: 'off'
    });
    header.appendChild(_input);

    _resultsContainer = DesignSystem.createElement('div', 'palette-results');

    const footer = DesignSystem.createElement('div', 'palette-footer');
    footer.innerHTML = `
      <span>↑↓ Navigate</span>
      <span>↵ Select</span>
    `;

    _el.append(header, _resultsContainer, footer);
    document.body.appendChild(_el);

    _bindEvents();
    _loadUsage();
  }

  function _loadUsage() {
    try {
      const data = localStorage.getItem(USAGE_KEY);
      _usageCounts = data ? JSON.parse(data) : {};
    } catch (_e) {
      _usageCounts = {};
    }
  }

  function _incrementUsage(id) {
    if (!id) return;
    _usageCounts[id] = (_usageCounts[id] || 0) + 1;
    localStorage.setItem(USAGE_KEY, JSON.stringify(_usageCounts));

    // Unified Sync: Push to server if AppState is available
    if (window.AppState && window.AppState.savePersistentState) {
      window.AppState.savePersistentState();
    }
  }

  function _bindEvents() {
    // Prevent scroll propagation to Monaco
    _el.addEventListener('wheel', (e) => {
      e.stopPropagation();
    }, { passive: false });

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
      const query = _input.value.toLowerCase().trim().replace(/^\/+/, '');

      if (!query) {
        _filteredCommands = [...COMMANDS];
      } else {
        _filteredCommands = COMMANDS.map(cmd => {
          let score = 0;
          const label = cmd.label.toLowerCase();
          const hint = cmd.hint.toLowerCase().replace(/^\/+/, '');
          const id = cmd.id.toLowerCase();
          const tags = (cmd.tags || []).map(t => t.toLowerCase());

          // 1. Exact matches (Highest priority)
          if (id === query || hint === query) {
            score += 100;
          }
          // 2. Exact Tag match
          else if (tags.includes(query)) {
            score += 80;
          }
          // 3. Starts with matches (Label or ID or Hint)
          else if (label.startsWith(query) || id.startsWith(query) || hint.startsWith(query)) {
            score += 50;
          }
          // 4. Includes matches
          else if (label.includes(query)) {
            score += 10;
          }
          // 5. Tag partial matches (Only if query is long enough)
          else if (query.length > 1 && tags.some(t => t.includes(query))) {
            score += 5;
          }

          // 6. Usage-based boost (Max 30 points)
          const usageCount = _usageCounts[cmd.id] || 0;
          if (score > 0 || !query) {
            score += Math.min(usageCount * 1.5, 30);
          }

          return { ...cmd, score };
        })
          .filter(cmd => cmd.score > 0)
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            // Tie-break: Shorter labels first
            return a.label.length - b.label.length;
          });
      }

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
      const item = DesignSystem.createElement('div', 'palette-item' + (index === _selectedIndex ? ' is-selected' : ''));
      item.innerHTML = `
        <div class="palette-item-icon">${DesignSystem.getIcon(cmd.icon)}</div>
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
      _incrementUsage(cmd.id);
      _callback(cmd.id);
    }
    hide();
  }

  function show(x, y, callback, options = {}) {
    _init();
    _callback = callback;
    _isOpen = true;

    // Header & Input visibility
    const header = _el.querySelector('.palette-header');
    _input.value = ''; // Always clear query on show

    if (options.hideInput) {
      header.style.display = 'none';
    } else {
      header.style.display = 'block';
      setTimeout(() => _input.focus(), 50);
    }

    _renderResults();

    if (window.MonacoService && window.MonacoService.isInitialized()) {
      // Use Monaco's ContentWidget system
      _el.style.display = 'flex';
      _el.style.position = 'absolute'; // Monaco handles positioning relative to lines
      _el.style.top = '0';
      _el.style.left = '0';
      _el.style.visibility = 'visible';
      window.MonacoService.addContentWidget(QuickCommandPalette);
    } else {
      // Fallback for legacy (if any)
      _el.style.display = 'flex';
      _el.style.visibility = 'hidden';

      const rect = _el.getBoundingClientRect();
      let top = y + 20;
      let left = x;

      if (left + rect.width > window.innerWidth) {
        left = window.innerWidth - rect.width - 20;
      }
      if (left < 10) left = 10;

      const spaceBelow = window.innerHeight - top;
      if (spaceBelow < rect.height + 20) {
        top = y - rect.height - 40;
      }
      if (top < 10) top = 10;

      _el.style.top = `${top}px`;
      _el.style.left = `${left}px`;
      _el.style.visibility = 'visible';
    }
  }

  function updateQuery(query) {
    if (!_isOpen) return;
    _input.value = query.replace('/', ''); // Remove slash for filtering
    _renderResults();

    // Notify Monaco to reposition if height changed
    if (window.MonacoService) {
      window.MonacoService.layoutContentWidget(QuickCommandPalette);
    }
  }

  // --- Monaco ContentWidget Interface ---
  function getId() { return 'editor.contrib.quickCommandPalette'; }
  function getDomNode() {
    _init();
    return _el;
  }
  function getPosition() {
    if (!_isOpen || !window.MonacoService) return null;
    return {
      position: window.MonacoService.getCursorPosition(),
      preference: [
        monaco.editor.ContentWidgetPositionPreference.BELOW,
        monaco.editor.ContentWidgetPositionPreference.ABOVE
      ]
    };
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
    if (!_el || !_isOpen) return;

    if (window.MonacoService && window.MonacoService.isInitialized()) {
      window.MonacoService.removeContentWidget(QuickCommandPalette);
    }

    _el.style.display = 'none';
    _isOpen = false;
    _selectedIndex = -1;
  }

  return {
    show,
    hide,
    updateQuery,
    getSelectedCommandId,
    navigate,
    isOpen: () => _isOpen,

    // Monaco IContentWidget exports
    getId,
    getDomNode,
    getPosition
  };
})();

window.QuickCommandPalette = QuickCommandPalette;
