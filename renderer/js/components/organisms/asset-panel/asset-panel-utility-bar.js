/**
 * AssetPanelUtilityBar - Molecule for rendering search and actions in AssetPanel.
 */
window.AssetPanelUtilityBar = (() => {
  'use strict';

  const _state = window.AssetPanelState;

  function _handleSearch(value, onUpdate) {
    _state.searchQuery = value.trim().toLowerCase();
    onUpdate();
  }

  function _showSortMenu(e, onUpdate) {
    const items = [
      {
        label: 'Name (A-Z)',
        icon: 'sort-alpha-asc',
        active: _state.sortOrder === 'name-asc',
        onClick: () => {
          _state.sortOrder = 'name-asc';
          onUpdate();
        }
      },
      {
        label: 'Name (Z-A)',
        icon: 'sort-alpha-desc',
        active: _state.sortOrder === 'name-desc',
        onClick: () => {
          _state.sortOrder = 'name-desc';
          onUpdate();
        }
      },
      { divider: true },
      {
        label: 'Size (Largest)',
        icon: 'arrow-down',
        active: _state.sortOrder === 'size-desc',
        onClick: () => {
          _state.sortOrder = 'size-desc';
          onUpdate();
        }
      },
      {
        label: 'Size (Smallest)',
        icon: 'arrow-up',
        active: _state.sortOrder === 'size-asc',
        onClick: () => {
          _state.sortOrder = 'size-asc';
          onUpdate();
        }
      },
      { divider: true },
      {
        label: 'References (Most)',
        icon: 'waypoints',
        active: _state.sortOrder === 'ref-desc',
        onClick: () => {
          _state.sortOrder = 'ref-desc';
          onUpdate();
        }
      },
      {
        label: 'References (Fewest)',
        icon: 'waypoints',
        active: _state.sortOrder === 'ref-asc',
        onClick: () => {
          _state.sortOrder = 'ref-asc';
          onUpdate();
        }
      }
    ];

    DesignSystem.createMenu(e.currentTarget, items);
  }

  return {
    render(options) {
      const { onUpdate, onToggleView } = options;

      const bar = DesignSystem.createElement('div', 'ds-asset-utility-bar');

      // 1. Search Bar (Uses InputComponent atom)
      const searchContainer = DesignSystem.createElement('div', 'ds-asset-search-container');
      
      const searchIconHtml = DesignSystem.getIcon('search');
      const searchIcon = DesignSystem.createElement('div', 'ds-asset-search-icon', { html: searchIconHtml });
      
      const searchInput = window.InputComponent.create({
        placeholder: 'Find asset...',
        className: 'ds-asset-search-input-atom',
        onInput: (_e, val) => {
          searchInput.classList.toggle('is-empty', !val);
          _handleSearch(val, onUpdate);
        },
        action: {
          icon: 'x',
          title: 'Clear search',
          onClick: () => {
            searchInput.value = '';
            searchInput.classList.add('is-empty');
            _handleSearch('', onUpdate);
            searchInput.focus();
          }
        }
      });

      // Init empty state
      searchInput.classList.toggle('is-empty', !_state.searchQuery);

      searchContainer.appendChild(searchIcon);
      searchContainer.appendChild(searchInput);
      
      // 2. Actions (View Toggle & Sort)
      const actions = DesignSystem.createElement('div', 'ds-asset-utility-actions');

      const sortBtn = DesignSystem.createButton({
        variant: 'subtitle',
        leadingIcon: 'arrow-down-up',
        offLabel: true,
        title: 'Sort assets',
        onClick: (e) => _showSortMenu(e, onUpdate)
      });

      const viewBtn = DesignSystem.createButton({
        variant: 'subtitle',
        leadingIcon: _state.viewMode === 'grid' ? 'table-properties' : 'layout-grid',
        offLabel: true,
        title: _state.viewMode === 'grid' ? 'Switch to List' : 'Switch to Grid',
        onClick: onToggleView
      });

      actions.appendChild(viewBtn);
      actions.appendChild(sortBtn);

      bar.appendChild(searchContainer);
      bar.appendChild(actions);

      return bar;
    }
  };
})();
