/* global DesignSystem, ModalComponent, Checkbox */
/**
 * AssetReplacementDialog - Molecule for choosing a replacement for a broken asset.
 */
window.AssetReplacementDialog = (() => {
  'use strict';

  function show(brokenItem, options = {}) {
    const { onConfirm, mode = null, file = null, isBroken = false } = options;
    const registry = (window.AssetPanelState && window.AssetPanelState.registry) || { assets: [], orphans: [] };
    const assets = [...registry.assets, ...registry.orphans];
    
    let selectedExisting = null;
    let uploadedFile = file;
    let currentTab = mode || 'existing'; // 'existing' | 'upload'
    let restoreOriginalName = false;

    const content = DesignSystem.createElement('div', 'ds-asset-replace-dialog');
    
    // 1. Tabs (Only show if no specific mode)
    if (!mode) {
      const tabsContainer = DesignSystem.createElement('div', 'ds-asset-replace-tabs');
      const tabs = DesignSystem.createSegmentedControl({
        options: [
          { id: 'existing', label: 'Choose Existing', icon: 'image' },
          { id: 'upload', label: 'Upload New', icon: 'upload' }
        ],
        current: currentTab,
        onChange: (id) => {
          currentTab = id;
          tabs.updateActive(id);
          _renderBody();
        }
      });
      tabsContainer.appendChild(tabs.el);
      content.appendChild(tabsContainer);
    }

    // 2. Body
    const body = DesignSystem.createElement('div', 'ds-asset-replace-content');
    content.appendChild(body);

    function _renderBody() {
      body.innerHTML = '';
      
      if (currentTab === 'existing') {
        _renderExistingTab();
      } else {
        _renderUploadTab();
      }
      _updateFooter();
    }

    function _renderExistingTab() {
      const searchContainer = DesignSystem.createElement('div', 'ds-asset-picker-search-container');
      const searchBox = DesignSystem.createInput({
        placeholder: 'Search assets...',
        className: 'ds-asset-picker-search',
        icon: 'search'
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

        filtered.forEach(asset => {
          const item = DesignSystem.createElement('div', `ds-asset-picker-item ${selectedExisting === asset.name ? 'is-selected' : ''}`);
          
          const thumb = DesignSystem.createElement('div', 'ds-asset-picker-thumb');
          const img = document.createElement('img');
          img.src = `/assets/${encodeURIComponent(asset.name)}?thumbnail=true`;
          thumb.appendChild(img);
          
          const name = DesignSystem.createElement('div', 'ds-asset-picker-name', { text: asset.name });
          
          item.appendChild(thumb);
          item.appendChild(name);
          
          item.onclick = () => {
            selectedExisting = asset.name;
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

    function _renderUploadTab() {
      if (uploadedFile) {
        const container = DesignSystem.createElement('div', 'ds-asset-upload-preview-v2');
        
        const card = DesignSystem.createElement('div', 'ds-asset-upload-hero-card');
        
        const imgWrapper = DesignSystem.createElement('div', 'ds-asset-upload-img-wrapper');
        const img = document.createElement('img');
        img.className = 'ds-asset-upload-hero-img';
        img.src = uploadedFile.preview;
        imgWrapper.appendChild(img);

        const removeBtn = DesignSystem.createButton({ 
          icon: 'x', 
          variant: 'ghost',
          className: 'ds-asset-upload-remove-btn',
          title: 'Remove and choose another',
          onClick: () => {
            uploadedFile = null;
            _renderBody();
          }
        });
        removeBtn.style.position = 'absolute';
        removeBtn.style.top = 'var(--ds-space-sm)';
        removeBtn.style.right = 'var(--ds-space-sm)';
        imgWrapper.appendChild(removeBtn);

        const metaBar = DesignSystem.createElement('div', 'ds-asset-upload-meta-bar');
        const name = DesignSystem.createElement('div', 'ds-asset-upload-filename', { text: uploadedFile.name });
        const size = DesignSystem.createElement('div', 'ds-asset-upload-size', { 
          text: (uploadedFile.size / 1024).toFixed(1) + ' KB' 
        });
        
        metaBar.appendChild(name);
        metaBar.appendChild(size);
        
        card.appendChild(imgWrapper);
        card.appendChild(metaBar);
        container.appendChild(card);

        // Restore name option using standard Checkbox component
        const baseName = brokenItem.name.replace(/\.[^.]*$/, '');
        const newExt = uploadedFile.name.match(/\.[^.]*$/)?.[0] || '';
        const option = Checkbox.create({
          label: `Keep original filename (${baseName}${newExt})`,
          checked: restoreOriginalName,
          className: 'ds-asset-replace-option',
          onChange: (e, val) => {
            restoreOriginalName = val;
          }
        });
        
        container.appendChild(option);
        body.appendChild(container);

      } else {
        const zone = DesignSystem.createElement('div', 'ds-asset-upload-zone');
        zone.innerHTML = `
          <div class="ds-asset-upload-icon">${DesignSystem.getIcon('upload-cloud', { width: 48, height: 48 })}</div>
          <div class="ds-asset-upload-text">Click or drag image here to upload</div>
          <input type="file" accept="image/*" style="display: none;">
        `;
        
        const input = zone.querySelector('input');
        zone.onclick = () => input.click();
        
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          
          const reader = new FileReader();
          reader.onload = (event) => {
            uploadedFile = {
              name: file.name,
              size: file.size,
              data: event.target.result.split(',')[1],
              preview: event.target.result
            };
            _renderBody();
          };
          reader.readAsDataURL(file);
        };

        // Drag & Drop
        zone.ondragover = (e) => { e.preventDefault(); zone.style.borderColor = 'var(--ds-accent)'; };
        zone.ondragleave = () => { zone.style.borderColor = ''; };
        zone.ondrop = (e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
              uploadedFile = {
                name: file.name,
                size: file.size,
                data: event.target.result.split(',')[1],
                preview: event.target.result
              };
              _renderBody();
            };
            reader.readAsDataURL(file);
          }
        };

        body.appendChild(zone);
      }
    }

    // 3. Footer Actions
    const footer = DesignSystem.createElement('div', 'ds-confirm-footer');
    const cancelBtn = DesignSystem.createButton({ label: 'Cancel', variant: 'ghost' });
    const confirmBtn = DesignSystem.createButton({ label: 'Replace Asset', variant: 'primary' });
    
    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    const modalTitle = isBroken ? 'Fix Broken Asset' : 'Replace Asset';
    const modal = ModalComponent.create({
      title: modalTitle,
      subtitle: brokenItem.name,
      content,
      footer,
      width: '500px'
    });

    function _updateFooter() {
      const canConfirm = (currentTab === 'existing' && selectedExisting) || (currentTab === 'upload' && uploadedFile);
      confirmBtn.disabled = !canConfirm;
    }

    cancelBtn.onclick = () => modal.close();
    
    confirmBtn.onclick = async () => {
      confirmBtn.setLoading(true);
      try {
        let payload = {
          oldName: brokenItem.name,
          isUpload: currentTab === 'upload'
        };

        if (currentTab === 'existing') {
          payload.newName = selectedExisting;
        } else {
          if (restoreOriginalName) {
            const newExt = uploadedFile.name.match(/\.[^.]*$/)?.[0] || '';
            const baseName = brokenItem.name.replace(/\.[^.]*$/, '');
            payload.newName = baseName + newExt;
          } else {
            payload.newName = uploadedFile.name;
          }
          payload.fileData = uploadedFile.data;
        }

        if (onConfirm) await onConfirm(payload);
        modal.close();
      } catch (err) {
        console.error('Replacement failed:', err);
        if (typeof showToast === 'function') showToast('Failed to replace asset: ' + err.message, 'error');
      } finally {
        confirmBtn.setLoading(false);
      }
    };

    _renderBody();
  }

  return { show };
})();
