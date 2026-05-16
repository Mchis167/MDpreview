/* global DesignSystem, ModalComponent */
/**
 * AssetPickerComponent - Molecule for picking an existing asset from the library.
 * Pure selection tool without upload capabilities.
 */
window.AssetPickerComponent = (() => {
  'use strict';

  /**
   * Shows the Asset Picker modal.
   * @param {Object} config - Configuration options
   * @param {string} config.title - Modal title
   * @param {string} config.subtitle - Modal subtitle
   * @param {string} config.confirmLabel - Label for the primary action button
   * @param {Function} config.onConfirm - Callback when user confirms selection: (assetName) => void
   */
  function show(config = {}) {
    const {
      title = 'Pick Asset',
      subtitle = '',
      confirmLabel = 'Select',
      onConfirm = null,
      multiSelect = false
    } = config;

    const registry = (window.AssetPanelState && window.AssetPanelState.registry) || { assets: [], orphans: [] };
    const assets = [...(registry.assets || []), ...(registry.orphans || [])];
    
    const selectedNames = new Set();
    let lastSelectedIndex = -1;

    const content = DesignSystem.createElement('div', 'ds-asset-picker-dialog');
    
    const body = DesignSystem.createElement('div', 'ds-asset-picker-body');
    content.appendChild(body);

    function _renderBody() {
      body.innerHTML = '';
      _renderExistingList();
      _updateFooter();
    }

    function _renderExistingList() {
      const searchContainer = DesignSystem.createElement('div', 'ds-asset-picker-search-container');
      const searchBox = DesignSystem.createInput({
        placeholder: 'Search assets...',
        className: 'ds-asset-picker-search',
        leadingIcon: 'search'
      });
      searchContainer.appendChild(searchBox);
      
      const list = DesignSystem.createElement('div', 'ds-asset-picker-list');
      
      const renderItems = (filterText = '') => {
        list.innerHTML = '';
        const filtered = assets.filter(a => a.name.toLowerCase().includes(filterText.toLowerCase()));
        
        if (filtered.length === 0) {
          list.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--ds-text-secondary);">No assets found</div>';
          return;
        }

        filtered.forEach((asset, index) => {
          const isSelected = selectedNames.has(asset.name);
          const item = DesignSystem.createElement('div', `ds-asset-picker-item ${isSelected ? 'is-selected' : ''}`);
          
          const thumb = DesignSystem.createElement('div', 'ds-asset-picker-thumb');
          const img = document.createElement('img');
          img.src = `/assets/${encodeURIComponent(asset.name)}?thumbnail=true`;
          thumb.appendChild(img);
          
          const name = DesignSystem.createElement('div', 'ds-asset-picker-name', { text: asset.name });
          
          item.appendChild(thumb);
          item.appendChild(name);
          
          item.onclick = (e) => {
            if (multiSelect && e.shiftKey && lastSelectedIndex !== -1) {
              const start = Math.min(lastSelectedIndex, index);
              const end = Math.max(lastSelectedIndex, index);
              for (let i = start; i <= end; i++) {
                selectedNames.add(filtered[i].name);
              }
            } else if (multiSelect) {
              if (selectedNames.has(asset.name)) selectedNames.delete(asset.name);
              else selectedNames.add(asset.name);
            } else {
              selectedNames.clear();
              selectedNames.add(asset.name);
            }

            lastSelectedIndex = index;
            renderItems(filterText);
            _updateFooter();
          };
          
          list.appendChild(item);
        });
      };

      searchBox.querySelector('input').oninput = (e) => renderItems(e.target.value);
      
      body.appendChild(searchContainer);
      body.appendChild(list);
      renderItems();
    }

    // Footer Actions
    const footer = DesignSystem.createElement('div', 'ds-confirm-footer');
    const cancelBtn = DesignSystem.createButton({ label: 'Cancel', variant: 'ghost' });
    const confirmBtn = DesignSystem.createButton({ label: confirmLabel, variant: 'primary' });
    
    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    const modal = ModalComponent.create({
      title,
      subtitle,
      content,
      footer,
      width: '500px'
    });

    function _updateFooter() {
      const count = selectedNames.size;
      confirmBtn.disabled = count === 0;
      if (multiSelect && count > 0) {
        confirmBtn.setLabel(`${confirmLabel} (${count})`);
      } else {
        confirmBtn.setLabel(confirmLabel);
      }
    }

    cancelBtn.onclick = () => modal.close();
    
    confirmBtn.onclick = async () => {
      confirmBtn.setLoading(true);
      try {
        if (onConfirm) {
          const result = multiSelect ? Array.from(selectedNames) : Array.from(selectedNames)[0];
          await onConfirm(result);
        }
        modal.close();
      } catch (err) {
        console.error('Picker confirm failed:', err);
        if (typeof window.showToast === 'function') window.showToast('Failed: ' + err.message, 'error');
      } finally {
        confirmBtn.setLoading(false);
      }
    };

    _renderBody();
  }

  return { show };
})();
