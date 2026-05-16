/**
 * AssetPanelContent - Organism for rendering main content area in AssetPanel.
 */
window.AssetPanelContent = (() => {
  'use strict';

  const _state = window.AssetPanelState;

  function _isEmpty() {
    const { assets, orphans, broken } = _state.registry;
    return assets.length === 0 && orphans.length === 0 && broken.length === 0;
  }

  function _getFilteredItems() {
    const { assets, orphans, broken } = _state.registry;
    let items = [];

    if (_state.filter === 'active') items = assets.map(i => ({ ...i, type: 'active' }));
    else if (_state.filter === 'orphan') items = orphans.map(i => ({ ...i, type: 'orphan' }));
    else if (_state.filter === 'broken') items = broken.map(i => ({ ...i, type: 'broken' }));
    else {
      items = [
        ...broken.map(i => ({ ...i, type: 'broken' })),
        ...assets.map(i => ({ ...i, type: 'active' })),
        ...orphans.map(i => ({ ...i, type: 'orphan' }))
      ];
    }

    // 1. Apply Search Query
    if (_state.searchQuery) {
      items = items.filter(item => item.name.toLowerCase().includes(_state.searchQuery));
    }

    // 2. Apply Sort Order
    items.sort((a, b) => {
      switch (_state.sortOrder) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'size-desc': return (b.size || 0) - (a.size || 0);
        case 'size-asc': return (a.size || 0) - (b.size || 0);
        case 'ref-desc': return (b.refCount || 0) - (a.refCount || 0);
        case 'ref-asc': return (a.refCount || 0) - (b.refCount || 0);
        default: return 0;
      }
    });

    return items;
  }

  let _itemsContainer = null;
  let _contentArea = null;
  let _lastOnToggleSelection = null;

  function _renderEmptyState() {
    return window.EmptyStateComponent.create({
      icon: 'images',
      title: 'No images found',
      description: 'Images and SVGs in your workspace will appear here.',
      className: 'ds-asset-empty'
    });
  }

  function _renderNoResultsState(query) {
    return window.EmptyStateComponent.create({
      icon: 'search-x',
      title: 'No results found',
      description: `We couldn't find anything matching "${query}"`,
      className: 'ds-asset-empty'
    });
  }

  function _renderSkeletonGrid() {
    const grid = DesignSystem.createElement('div', 'ds-asset-grid');
    for (let i = 0; i < 9; i++) {
      const card = DesignSystem.createElement('div', 'ds-asset-skeleton-card');
      const preview = DesignSystem.createElement('div', 'ds-asset-skeleton-preview');
      const meta = DesignSystem.createElement('div', 'ds-asset-skeleton-meta');
      const line1 = DesignSystem.createElement('div', 'ds-asset-skeleton-text');
      const line2 = DesignSystem.createElement('div', 'ds-asset-skeleton-text short');
      meta.appendChild(line1);
      meta.appendChild(line2);
      card.appendChild(preview);
      card.appendChild(meta);
      grid.appendChild(card);
    }
    return grid;
  }

  function _renderListHead() {
    const head = DesignSystem.createElement('div', 'ds-asset-list-head');
    head.innerHTML = `
      <div class="ds-asset-list-col ds-asset-list-col-thumb"></div>
      <div class="ds-asset-list-col ds-asset-list-col-name">File Name</div>
      <div class="ds-asset-list-col ds-asset-list-col-ref">Ref Count</div>
      <div class="ds-asset-list-col ds-asset-list-col-size">Size</div>
      <div class="ds-asset-list-col ds-asset-list-col-type">Type</div>
    `;
    return head;
  }

  function _renderItems() {
    if (!_contentArea) return;
    _contentArea.innerHTML = '';

    if (_state.isOpening) {
      _contentArea.appendChild(_renderSkeletonGrid());
    } else if (_isEmpty()) {
      _contentArea.appendChild(_renderEmptyState());
    } else {
      const itemsToShow = _getFilteredItems();
      
      if (itemsToShow.length === 0 && _state.searchQuery) {
        _contentArea.appendChild(_renderNoResultsState(_state.searchQuery));
        return;
      }

      if (_state.viewMode === 'grid') {
        const grid = DesignSystem.createElement('div', 'ds-asset-grid');
        itemsToShow.forEach(item => {
          if (window.AssetPanelItem) {
            grid.appendChild(window.AssetPanelItem.renderCard(item, item.type, _contentArea, _lastOnToggleSelection));
          }
        });
        _contentArea.appendChild(grid);
      } else {
        // Render List Head
        _contentArea.appendChild(_renderListHead());
        const list = DesignSystem.createElement('div', 'ds-asset-list');
        itemsToShow.forEach(item => {
          if (window.AssetPanelItem) {
            list.appendChild(window.AssetPanelItem.renderListRow(item, _contentArea, _lastOnToggleSelection));
          }
        });
        _contentArea.appendChild(list);
      }
    }
  }

  function _updateTabs(tabsWrapper) {
    if (!window.AssetPanelTabs) return;
    if (!tabsWrapper) return;

    tabsWrapper.innerHTML = '';
    tabsWrapper.appendChild(window.AssetPanelTabs.render(() => {
      _updateTabs(tabsWrapper);
      _renderItems();
    }));
  }

  return {
    render(options) {
      const { container, onToggleSelection } = options;
      _lastOnToggleSelection = onToggleSelection;
      
      // 1. Check if structure already exists (Smart Render)
      let tabsWrapper = container.querySelector('.ds-asset-tabs-container');
      let utilityBar = container.querySelector('.ds-asset-utility-bar');
      _itemsContainer = container.querySelector('.ds-asset-items-wrapper');
      _contentArea = container.querySelector('.ds-asset-content');

      if (!tabsWrapper || !utilityBar || !_itemsContainer || !_contentArea) {
        // Full Render: structure is missing
        container.innerHTML = '';
        
        // 1a. Filter Tabs
        tabsWrapper = DesignSystem.createElement('div', 'ds-asset-tabs-container');
        _updateTabs(tabsWrapper);
        container.appendChild(tabsWrapper);

        // 1b. Utility Bar
        if (window.AssetPanelUtilityBar) {
          container.appendChild(window.AssetPanelUtilityBar.render({
            onUpdate: () => _renderItems(),
            onToggleView: () => {
              _state.viewMode = _state.viewMode === 'grid' ? 'list' : 'grid';
              localStorage.setItem('mdpreview_asset_view_mode', _state.viewMode);
              if (window.AssetPanel) {
                window.AssetPanel.render(); // Full render for layout change
                window.AssetPanel._updateUIState();
              }
            }
          }));
        }

        // 1c. Items Container & Scrollable Content Area
        _itemsContainer = DesignSystem.createElement('div', 'ds-asset-items-wrapper', {
          style: 'flex: 1; display: flex; flex-direction: column; overflow: hidden;'
        });
        _contentArea = DesignSystem.createElement('div', 'ds-asset-content');
        _itemsContainer.appendChild(_contentArea);
        container.appendChild(_itemsContainer);
      } else {
        // Update existing tabs when registry changes
        _updateTabs(tabsWrapper);
      }

      // 2. Initial/Update render of items
      _renderItems();
      
      // 3. Selection Bar (Always re-render or update)
      const oldSelectionBar = container.querySelector('.ds-asset-selection-bar');
      if (oldSelectionBar) oldSelectionBar.remove();
      
      if (_state.selected.size > 0 && window.AssetPanelSelection) {
        container.appendChild(window.AssetPanelSelection.renderSelectionBar());
      }
    },

    getVisibleItems() {
      return _getFilteredItems();
    },

    updateList() {
      _renderItems();
    }
  };
})();
