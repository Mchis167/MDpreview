/**
 * AssetPanelHeader - Organism for rendering header in AssetPanel.
 */
window.AssetPanelHeader = (() => {
  'use strict';

  const _state = window.AssetPanelState;

  function _showMoreMenu(e) {
    const items = [
      {
        label: 'Purge All Orphans',
        icon: 'trash-2',
        danger: true,
        onClick: () => {
          if (window.AssetPanelActions) window.AssetPanelActions.handlePurgeOrphans();
        }
      },
      {
        label: 'Clean All Broken Links',
        icon: 'ban',
        danger: true,
        onClick: () => {
          if (window.AssetPanelActions) window.AssetPanelActions.handlePurgeBroken();
        }
      }
    ];

    DesignSystem.createMenu(e.currentTarget, items);
  }

  return {
    render(options) {
      const { onClose, _onToggleView, onImport } = options;
      
      const header = DesignSystem.createElement('div', 'ds-asset-panel-header');
      const leftActions = DesignSystem.createElement('div', 'ds-asset-panel-left-actions');
      const title = DesignSystem.createElement('div', 'ds-asset-panel-title', { text: 'Assets' });
      leftActions.appendChild(title);

      const actions = DesignSystem.createElement('div', 'ds-asset-panel-actions');

      const importBtn = DesignSystem.createButton({
        variant: 'primary',
        leadingIcon: 'plus',
        label: 'Import',
        offLabel: true,
        onClick: onImport
      });

      const refreshBtn = DesignSystem.createButton({
        variant: 'subtitle',
        leadingIcon: 'refresh-cw',
        offLabel: true,
        onClick: () => {
          if (window.AssetManager) window.AssetManager.refresh();
        }
      });

      const moreBtn = DesignSystem.createButton({
        variant: 'subtitle',
        leadingIcon: 'more-vertical',
        label: 'More actions',
        offLabel: true,
        onClick: (e) => _showMoreMenu(e)
      });

      const closeBtn = DesignSystem.createButton({
        variant: 'subtitle',
        leadingIcon: 'x',
        offLabel: true,
        onClick: onClose
      });

      actions.appendChild(importBtn);
      actions.appendChild(refreshBtn);
      actions.appendChild(moreBtn);
      actions.appendChild(closeBtn);

      header.appendChild(leftActions);
      header.appendChild(actions);

      return header;
    }
  };
})();
