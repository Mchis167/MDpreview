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
    if (_state.filter === 'active') return assets.map(i => ({ ...i, type: 'active' }));
    if (_state.filter === 'orphan') return orphans.map(i => ({ ...i, type: 'orphan' }));
    if (_state.filter === 'broken') return broken.map(i => ({ ...i, type: 'broken' }));
    
    return [
      ...broken.map(i => ({ ...i, type: 'broken' })),
      ...assets.map(i => ({ ...i, type: 'active' })),
      ...orphans.map(i => ({ ...i, type: 'orphan' }))
    ];
  }

  function _renderEmptyState() {
    const empty = DesignSystem.createElement('div', 'ds-asset-empty');
    empty.innerHTML = `
      <div class="ds-asset-empty-icon">${DesignSystem.getIcon('images', { width: 48, height: 48 })}</div>
      <div class="ds-asset-empty-text">No images found in this workspace</div>
    `;
    return empty;
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

  return {
    render(options) {
      const { container, onToggleSelection } = options;
      
      // 1. Filter Tabs
      if (window.AssetPanelTabs) {
        container.appendChild(window.AssetPanelTabs.render(() => {
          if (window.AssetPanel) window.AssetPanel.render();
        }));
      }

      // 2. Optional List Header
      if (!_state.isOpening && _state.viewMode === 'list' && !_isEmpty()) {
        container.appendChild(_renderListHead());
      }

      // 3. Content Area
      const contentArea = DesignSystem.createElement('div', 'ds-asset-content');
      
      if (_state.isOpening) {
        contentArea.appendChild(_renderSkeletonGrid());
      } else if (_isEmpty()) {
        contentArea.appendChild(_renderEmptyState());
      } else {
        const itemsToShow = _getFilteredItems();
        if (_state.viewMode === 'grid') {
          const grid = DesignSystem.createElement('div', 'ds-asset-grid');
          itemsToShow.forEach(item => {
            if (window.AssetPanelItem) {
              grid.appendChild(window.AssetPanelItem.renderCard(item, item.type, contentArea, onToggleSelection));
            }
          });
          contentArea.appendChild(grid);
        } else {
          const list = DesignSystem.createElement('div', 'ds-asset-list');
          itemsToShow.forEach(item => {
            if (window.AssetPanelItem) {
              list.appendChild(window.AssetPanelItem.renderListRow(item, contentArea, onToggleSelection));
            }
          });
          contentArea.appendChild(list);
        }
      }
      container.appendChild(contentArea);
      
      // 4. Selection Bar
      if (_state.selected.size > 0 && window.AssetPanelSelection) {
        container.appendChild(window.AssetPanelSelection.renderSelectionBar());
      }
    }
  };
})();
