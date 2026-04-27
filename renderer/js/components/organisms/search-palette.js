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
  let _searchMode = 'all'; // all, file, directory, shortcut

  /**
   * Initialize DOM structure
   */
  function _init() {
    if (_overlay) return;

    // Create Overlay and Box using DesignSystem
    _overlay = DesignSystem.createElement('div', 'ds-search-palette-overlay');
    const box = DesignSystem.createElement('div', 'ds-search-palette-box');

    // ── Header ──
    const header = DesignSystem.createElement('div', 'palette-header');
    const icon = DesignSystem.createElement('div', 'palette-icon', {
      html: DesignSystem.getIcon('search')
    });
    const badgeContainer = DesignSystem.createElement('div', 'palette-badge-container');

    _input = DesignSystem.createElement('input', 'palette-input', {
      type: 'text',
      placeholder: 'Search files and folders...',
      spellcheck: 'false',
      autocomplete: 'off'
    });

    header.append(icon, badgeContainer, _input);

    // ── Options Bar ──
    const options = DesignSystem.createElement('div', 'palette-options');

    const btnAll = DesignSystem.createButton({ label: '/1  Files & Folders', variant: 'subtitle', className: 'is-active' });
    btnAll.dataset.mode = 'all';

    const btnFiles = DesignSystem.createButton({ label: '/2  Files', variant: 'subtitle' });
    btnFiles.dataset.mode = 'file';

    const btnFolders = DesignSystem.createButton({ label: '/3  Folders', variant: 'subtitle' });
    btnFolders.dataset.mode = 'directory';

    const btnShortcuts = DesignSystem.createButton({ label: '/4  Shortcuts', variant: 'subtitle' });
    btnShortcuts.dataset.mode = 'shortcut';

    options.append(btnAll, btnFiles, btnFolders, btnShortcuts);

    // ── Results & Footer ──
    _resultsContainer = DesignSystem.createElement('div', 'palette-results');

    const footer = DesignSystem.createElement('div', 'palette-footer');
    footer.innerHTML = `
      <span><kbd class="ds-kbd ds-kbd--raised">↑</kbd><kbd class="ds-kbd ds-kbd--raised">↓</kbd> Navigate</span>
      <span><kbd class="ds-kbd ds-kbd--raised">↵</kbd> Open</span>
      <span><kbd class="ds-kbd ds-kbd--raised">esc</kbd> Close</span>
    `;

    // Assembly
    box.append(header, options, _resultsContainer, footer);
    _overlay.appendChild(box);
    document.body.appendChild(_overlay);

    // Apply smart scroll mask
    if (window.UIUtils) {
      window.UIUtils.applySmartScrollMask(_resultsContainer);
    }

    _attachListeners();
  }

  function _attachListeners() {
    // Close on backdrop click
    _overlay.addEventListener('mousedown', (e) => {
      if (e.target === _overlay) hide();
    });

    _input.addEventListener('input', (e) => {
      const value = e.target.value;

      // Slash Command Check
      const commands = { '/1 ': 'all', '/2 ': 'file', '/3 ': 'directory', '/4 ': 'shortcut' };
      for (const cmd in commands) {
        if (value.startsWith(cmd)) {
          _setSearchMode(commands[cmd]);
          _input.value = value.slice(cmd.length);
          _onSearch(_input.value);
          return;
        }
      }

      clearTimeout(_searchTimeout);
      _searchTimeout = setTimeout(() => {
        _onSearch(_input.value);
      }, 150);
    });

    _input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        hide();
      }

      // Backspace at the start to reset mode
      if (e.key === 'Backspace' && _input.selectionStart === 0 && _input.selectionEnd === 0 && _searchMode !== 'all') {
        e.preventDefault();
        _setSearchMode('all');
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

    // Option button clicks
    _overlay.querySelectorAll('.ds-btn[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        _setSearchMode(btn.dataset.mode);
        _input.focus();
      });
    });
  }

  function _setSearchMode(mode) {
    if (_searchMode === mode) return;
    _searchMode = mode;

    // Update Badge UI
    const badgeContainer = _overlay.querySelector('.palette-badge-container');
    if (mode === 'all') {
      badgeContainer.innerHTML = '';
    } else {
      const labels = { 'file': 'Files', 'directory': 'Folders', 'shortcut': 'Shortcuts' };
      badgeContainer.innerHTML = `<div class="palette-badge">${labels[mode] || mode}</div>`;
    }

    // Toggle wide mode for shortcuts
    const box = _overlay.querySelector('.ds-search-palette-box');
    if (box) {
      box.classList.toggle('is-shortcut-mode', mode === 'shortcut');
    }

    // Update Options UI
    _overlay.querySelectorAll('.ds-btn[data-mode]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.mode === mode);
    });

    // Update Placeholder
    const placeholders = {
      'all': 'Search files and folders...',
      'file': 'Search files by name...',
      'directory': 'Search folders by name...',
      'shortcut': 'Search keyboard shortcuts...'
    };
    _input.placeholder = placeholders[mode] || 'Search...';

    _onSearch(_input.value);
  }

  /**
   * Handle searching logic
   */
  function _onSearch(query) {
    if (!query) {
      if (_searchMode === 'shortcut') {
        _results = SearchService.searchShortcuts('');
        _selectedIndex = -1;
        _renderResults('');
        return;
      }

      const recentPaths = window.RecentlyViewedModule ? window.RecentlyViewedModule.getRecentFiles() : [];
      const mapped = recentPaths.map(path => {
        const isFile = path.includes('.') || path.includes('README');
        return {
          path,
          name: path.split(/[/\\]/).pop(),
          isRecent: true,
          type: isFile ? 'file' : 'directory'
        };
      });

      if (_searchMode === 'file') {
        _results = mapped.filter(r => r.type === 'file');
      } else if (_searchMode === 'directory') {
        _results = mapped.filter(r => r.type === 'directory');
      } else {
        _results = mapped;
      }
      _selectedIndex = -1;
      _renderResults('');
      return;
    }

    const treeData = window.TreeModule ? window.TreeModule.getTreeData() : [];
    _results = _searchMode === 'shortcut' ? SearchService.searchShortcuts(query) : SearchService.search(query, treeData, _searchMode);
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
      const item = _results[_selectedIndex];

      // Handle Shortcut Execution
      if (item.type === 'shortcut') {
        if (window.ShortcutsComponent && window.ShortcutsComponent.executeAction) {
          window.ShortcutsComponent.executeAction(item.id);
        }
        hide();
        return;
      }

      if (window.TreeModule) {
        // Reveal and Highlight behavior for both files and folders
        window.TreeModule.setActiveFile(item.path);
      }
      hide();
    }
  }

  /**
   * Render results with highlighting
   */
  function _renderResults(query) {
    _resultsContainer.innerHTML = '';
    _resultsContainer.classList.toggle('is-empty', _results.length === 0);

    if (_results.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'palette-empty-state';

      const labels = {
        'all': { item: 'items', recent: 'items' },
        'file': { item: 'files', recent: 'files' },
        'directory': { item: 'folders', recent: 'folders' },
        'shortcut': { item: 'shortcuts', recent: 'shortcuts' }
      };
      const ctx = labels[_searchMode] || { item: 'items', recent: 'items' };

      const icon = DesignSystem.getIcon('search-x');
      const title = query ? `No ${ctx.item} found` : `No recent ${ctx.recent}`;
      const desc = query
        ? `We couldn't find any ${ctx.item} matching "${query}"`
        : `Your recently accessed ${ctx.recent} will appear here.`;

      emptyState.innerHTML = `
        <div class="empty-state-icon">${icon}</div>
        <div class="empty-state-title">${title}</div>
        <div class="empty-state-desc">${desc}</div>
      `;
      _resultsContainer.appendChild(emptyState);
      _updateMorphHeight();
      return;
    }

    // ── Grouped Shortcuts Mode (No Query) ──
    if (_searchMode === 'shortcut' && !query) {
      const grouped = {};
      _results.forEach(item => {
        if (!grouped[item.group]) grouped[item.group] = [];
        grouped[item.group].push(item);
      });

      let itemIndex = 0;
      let sectionIndex = 0;
      for (const groupTitle in grouped) {
        if (sectionIndex > 0) {
          const divider = document.createElement('div');
          divider.className = 'palette-divider';
          _resultsContainer.appendChild(divider);
        }

        const header = document.createElement('div');
        header.className = 'palette-section-header';
        header.textContent = groupTitle;
        _resultsContainer.appendChild(header);

        grouped[groupTitle].forEach(itemData => {
          const itemEl = _createShortcutItem(itemData, itemIndex, query);
          _resultsContainer.appendChild(itemEl);
          itemIndex++;
        });
        sectionIndex++;
      }
      _updateMorphHeight();
      return;
    }

    // ── Flat List Render (Files or Searched Shortcuts) ──
    if (!query && _results.some(r => r.isRecent)) {
      const header = document.createElement('div');
      header.className = 'palette-section-header';
      const labels = { 'file': 'Recent Files', 'directory': 'Recent Folders', 'all': 'Recent Items' };
      header.textContent = labels[_searchMode] || 'Recent Items';
      _resultsContainer.appendChild(header);
    } else if (query) {
      const header = document.createElement('div');
      header.className = 'palette-section-header';
      header.textContent = `${_results.length} ${_results.length === 1 ? 'result' : 'results'}`;
      _resultsContainer.appendChild(header);
    }

    _results.forEach((itemData, idx) => {
      if (itemData.type === 'shortcut') {
        _resultsContainer.appendChild(_createShortcutItem(itemData, idx, query));
        return;
      }

      const item = document.createElement('div');
      item.className = 'palette-item';
      if (idx === _selectedIndex) item.classList.add('selected');

      const highlightedName = query ? _getHighlightedText(itemData.name, itemData.matchedIndices) : itemData.name;
      const icon = DesignSystem.getIcon(itemData.type === 'directory' ? 'folder' : 'file');
      const smartPath = _formatSmartPath(itemData.path);

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

    _updateMorphHeight();
  }

  /**
   * Updates the palette box height based on actual scroll content
   */
  function _updateMorphHeight() {
    requestAnimationFrame(() => {
      const box = _overlay.querySelector('.ds-search-palette-box');
      if (box) {
        const header = box.querySelector('.palette-header');
        const options = box.querySelector('.palette-options');
        const footer = box.querySelector('.palette-footer');
        const results = box.querySelector('.palette-results');
        
        // Sum of children is more reliable than box.scrollHeight (which shrinks due to borders)
        const headerH = header ? header.offsetHeight : 0;
        const optionsH = options ? options.offsetHeight : 0;
        const footerH = footer ? footer.offsetHeight : 0;
        const resultsH = results ? results.scrollHeight : 0;
        
        // Total = children + 2px border
        const contentHeight = headerH + optionsH + footerH + resultsH + 2;
        const maxLimit = _searchMode === 'shortcut' ? 800 : 600;
        const targetH = Math.min(contentHeight, maxLimit);
        
        box.style.setProperty('--_target-h', `${targetH}px`);
      }
    });
  }

  /**
   * Helper to create a shortcut result item
   */
  function _createShortcutItem(itemData, idx, query) {
    const item = document.createElement('div');
    item.className = 'palette-item shortcut-item';
    if (idx === _selectedIndex) item.classList.add('selected');

    const highlightedLabel = query ? _getHighlightedText(itemData.label, itemData.matchedIndices) : itemData.label;
    const icon = DesignSystem.getIcon(itemData.icon || 'keyboard');

    const keysHtml = itemData.keys.map(key => {
      let keyText = key;
      const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform) || (navigator.userAgentData && navigator.userAgentData.platform === 'macOS');
      if (isMac && key === 'Ctrl') keyText = '⌘';
      if (isMac && key === 'Shift') keyText = '⇧';
      if (isMac && key === 'Option') keyText = '⌥';
      if (isMac && key === 'Backspace') keyText = '⌫';
      return `<kbd class="ds-kbd">${keyText}</kbd>`;
    }).join('');

    item.innerHTML = `
      <div class="palette-icon">${icon}</div>
      <div class="palette-item-info">
        <div class="palette-item-name">${highlightedLabel}</div>
        <div class="palette-item-keys">${keysHtml}</div>
      </div>
    `;

    item.onclick = () => {
      _selectedIndex = idx;
      _openSelected();
    };

    return item;
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
  function show(mode = 'all') {
    _init();
    _isOpen = true;
    _overlay.classList.add('open');
    document.body.classList.add('is-searching');
    _input.value = '';
    _results = [];
    _selectedIndex = -1;
    _setSearchMode(mode);
    _onSearch('');

    // Smooth focus
    setTimeout(() => _input.focus(), 50);
  }

  function hide() {
    _isOpen = false;
    if (_overlay) {
      _overlay.classList.remove('open');
      const box = _overlay.querySelector('.ds-search-palette-box');
      if (box) box.style.setProperty('--_target-h', '58px');
    }
    document.body.classList.remove('is-searching');
    if (_resultsContainer) _resultsContainer.scrollTop = 0;
    if (_input) _input.blur();
  }

  return {
    init: _init,
    show,
    hide,
    toggle: () => _isOpen ? hide() : show(),
    isOpen: () => _isOpen
  };
})();

// Explicit export to global scope
window.SearchPalette = SearchPalette;
