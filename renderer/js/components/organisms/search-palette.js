/* global SearchService, DesignSystem */
/**
 * SearchPaletteComponent — Global Quick Open Palette (Organism)
 * Purpose: Provide a floating search interface for fast file navigation.
 * Dependencies: DesignSystem, SearchService, TreeModule
 */
const SearchPalette = (() => {
  'use strict';

  let _overlay = null;
  let _input = null;
  let _resultsContainer = null;
  let _isOpen = false;
  let _results = [];
  let _selectedIndex = -1;
  let _searchTimeout = null;

  /**
   * Initialize DOM structure
   */
  function _init() {
    if (_overlay) return;

    _overlay = document.createElement('div');
    _overlay.className = 'ds-search-palette-overlay';
    
    _overlay.innerHTML = `
      <div class="ds-search-palette-box">
        <div class="palette-header">
          <div class="palette-icon">
            ${DesignSystem.getIcon('search')}
          </div>
          <input type="text" class="palette-input" placeholder="Search files by name or path..." spellcheck="false" autocomplete="off">
        </div>
        <div class="palette-results"></div>
        <div class="palette-footer">
          <span><kbd class="ds-kbd ds-kbd--raised">↑</kbd><kbd class="ds-kbd ds-kbd--raised">↓</kbd> Navigate</span>
          <span><kbd class="ds-kbd ds-kbd--raised">↵</kbd> Open</span>
          <span><kbd class="ds-kbd ds-kbd--raised">esc</kbd> Close</span>
        </div>
      </div>
    `;

    document.body.appendChild(_overlay);

    _input = _overlay.querySelector('.palette-input');
    _resultsContainer = _overlay.querySelector('.palette-results');

    _attachListeners();
  }

  function _attachListeners() {
    // Close on backdrop click
    _overlay.addEventListener('mousedown', (e) => {
      if (e.target === _overlay) hide();
    });

    _input.addEventListener('input', (e) => {
      const query = e.target.value;
      clearTimeout(_searchTimeout);
      _searchTimeout = setTimeout(() => {
        _onSearch(query);
      }, 150);
    });

    _input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        hide();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        _moveSelection(1);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        _moveSelection(-1);
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        _openSelected();
      }
    });
  }

  /**
   * Handle searching logic
   */
  function _onSearch(query) {
    if (!query) {
      const recentPaths = window.RecentlyViewedModule ? window.RecentlyViewedModule.getRecentFiles() : [];
      _results = recentPaths.map(path => ({
        path,
        name: path.split('/').pop(),
        isRecent: true
      }));
      _selectedIndex = -1;
      _renderResults('');
      return;
    }

    const treeData = window.TreeModule ? window.TreeModule.getTreeData() : [];
    _results = SearchService.search(query, treeData);
    _selectedIndex = _results.length > 0 ? 0 : -1;
    _renderResults(query);
  }

  function _moveSelection(dir) {
    if (_results.length === 0) return;
    _selectedIndex = (_selectedIndex + dir + _results.length) % _results.length;
    _updateSelectionUI();
  }

  function _updateSelectionUI() {
    const items = _resultsContainer.querySelectorAll('.palette-item');
    items.forEach((item, idx) => {
      item.classList.toggle('selected', idx === _selectedIndex);
      if (idx === _selectedIndex) {
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  function _openSelected() {
    if (_selectedIndex >= 0 && _results[_selectedIndex]) {
      const file = _results[_selectedIndex];
      if (window.TreeModule) {
        window.TreeModule.openFile(file.path);
      }
      hide();
    }
  }

  /**
   * Render results with highlighting
   */
  function _renderResults(query) {
    _resultsContainer.innerHTML = '';
    
    if (_results.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'palette-empty-state';
      
      const icon = DesignSystem.getIcon('file-search-corner');
      const title = query ? 'No results found' : 'No recent files';
      const desc = query ? `We couldn't find any files matching "${query}"` : 'Open some files to see them here later.';
      
      emptyState.innerHTML = `
        <div class="empty-state-icon">${icon}</div>
        <div class="empty-state-title">${title}</div>
        <div class="empty-state-desc">${desc}</div>
      `;
      _resultsContainer.appendChild(emptyState);
      return;
    }

    // Add "Recent" header if showing history
    if (!query && _results.some(r => r.isRecent)) {
      const header = document.createElement('div');
      header.className = 'palette-section-header';
      header.textContent = 'Recent Files';
      _resultsContainer.appendChild(header);
    }

    _results.forEach((file, idx) => {
      const item = document.createElement('div');
      item.className = 'palette-item';
      if (idx === _selectedIndex) item.classList.add('selected');
      
      const highlightedName = query ? _getHighlightedText(file.name, file.matchedIndices) : file.name;
      const icon = DesignSystem.getIcon('file');
      const smartPath = _formatSmartPath(file.path);

      item.innerHTML = `
        <div class="palette-icon">${icon}</div>
        <div class="palette-item-info">
          <div class="palette-item-name">${highlightedName}</div>
          <div class="palette-item-path">${smartPath}</div>
        </div>
      `;

      item.onclick = () => {
        _selectedIndex = idx;
        _openSelected();
      };

      _resultsContainer.appendChild(item);
    });
  }

  /**
   * Format path to show only the last few parts if it's too long
   */
  function _formatSmartPath(path) {
    const parts = path.split('/');
    if (parts.length <= 3) return path;
    return `.../${parts.slice(-3).join('/')}`;
  }

  /**
   * Apply bold highlighting to matched characters
   */
  function _getHighlightedText(text, indices) {
    if (!indices || indices.length === 0) return text;
    
    const chars = text.split('');
    const indexSet = new Set(indices);
    
    return chars.map((c, i) => indexSet.has(i) ? `<b>${c}</b>` : c).join('');
  }

  // ============================================
  // Public API
  // ============================================
  function show() {
    _init();
    _isOpen = true;
    _overlay.classList.add('open');
    document.body.classList.add('is-searching');
    _input.value = '';
    _results = [];
    _selectedIndex = -1;
    _onSearch('');
    
    // Smooth focus
    setTimeout(() => _input.focus(), 50);
  }

  function hide() {
    _isOpen = false;
    if (_overlay) _overlay.classList.remove('open');
    document.body.classList.remove('is-searching');
    if (_resultsContainer) _resultsContainer.scrollTop = 0;
    if (_input) _input.blur();
  }

  return {
    init: _init,
    show,
    hide,
    toggle: () => _isOpen ? hide() : show()
  };
})();

// Explicit export to global scope
window.SearchPalette = SearchPalette;
