/**
 * AssetPanelTabs - Organism for rendering filter tabs in AssetPanel.
 */
window.AssetPanelTabs = (() => {
  'use strict';

  const _state = window.AssetPanelState;

  return {
    render(onFilterChange) {
      const { assets, orphans, broken } = _state.registry;
      const total = assets.length + orphans.length;
      
      const tabs = DesignSystem.createElement('div', 'ds-asset-filter-tabs');
      
      const config = [
        { id: 'all', label: 'All Asset', count: total, color: null },
        { id: 'active', label: 'Active', count: assets.length, color: 'var(--ds-status-success)' },
        { id: 'orphan', label: 'Orphan', count: orphans.length, color: 'var(--ds-status-warning)' },
        { id: 'broken', label: 'Broken', count: broken.length, color: 'var(--ds-status-danger)' }
      ];

      config.forEach(item => {
        const tab = DesignSystem.createElement('div', `ds-asset-tab-item ${_state.filter === item.id ? 'is-active' : ''}`);
        tab.onclick = () => {
          _state.filter = item.id;
          onFilterChange();
        };

        const stack = DesignSystem.createElement('div', 'ds-asset-tab-stack');
        const label = DesignSystem.createElement('div', 'ds-asset-tab-label', { text: item.label });
        const countNum = DesignSystem.createElement('div', 'ds-asset-tab-count', { text: item.count });
        
        stack.appendChild(label);
        stack.appendChild(countNum);
        tab.appendChild(stack);

        if (item.color) {
          const dot = DesignSystem.createElement('div', 'ds-asset-tab-dot', { 
            style: `background: ${item.color}` 
          });
          tab.appendChild(dot);
        }
        tabs.appendChild(tab);
      });

      return tabs;
    }
  };
})();
