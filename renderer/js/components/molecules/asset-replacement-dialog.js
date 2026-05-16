/* global AssetPickerComponent, AssetUploadPreviewComponent, Checkbox */
/**
 * AssetReplacementDialog - Molecule for choosing a replacement for a broken asset.
 * Independent workflow that can trigger picker or uploader.
 */
window.AssetReplacementDialog = (() => {
  'use strict';

  /**
   * Shows the Asset Replacement dialog.
   * @param {Object} brokenItem - The item to be replaced
   * @param {Object} options - Callback options
   */
  function show(brokenItem, options = {}) {
    const { 
      onConfirm, 
      mode = null, 
      isBroken = false, 
      file = null,
      title = isBroken ? 'Fix Broken Asset' : 'Replace Asset',
      confirmLabel = mode === 'upload' ? 'Upload & Replace' : 'Replace with Selected',
      subtitle = `Replacing: ${brokenItem.name}`
    } = options;
    
    if (mode === 'upload') {
      if (file) {
        _showUploadPreview(brokenItem, file, onConfirm, { title, confirmLabel });
      } else {
        _triggerFileUpload(brokenItem, onConfirm, { title, confirmLabel });
      }
      return;
    }

    if (mode === 'existing') {
      _triggerExistingPicker(brokenItem, onConfirm, { title, subtitle, confirmLabel });
      return;
    }

    // Default flow: Show a choice modal or just open picker
    _triggerExistingPicker(brokenItem, onConfirm, { title, subtitle, confirmLabel });
  }

  function _triggerExistingPicker(brokenItem, onConfirm, config) {
    AssetPickerComponent.show({
      title: config.title,
      subtitle: config.subtitle,
      confirmLabel: config.confirmLabel,
      onConfirm: async (selectedName) => {
        if (onConfirm) {
          await onConfirm({
            isUpload: false,
            newName: selectedName,
            oldName: brokenItem.name
          });
        }
      }
    });
  }

  function _triggerFileUpload(brokenItem, onConfirm, config) {
    // 1. Trigger system file picker
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const fileData = {
          name: file.name,
          size: file.size,
          data: event.target.result.split(',')[1],
          preview: event.target.result
        };

        _showUploadPreview(brokenItem, fileData, onConfirm, config);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  function _showUploadPreview(brokenItem, fileData, onConfirm, config) {
    let restoreOriginalName = false;

    AssetUploadPreviewComponent.show({
      title: config.title,
      file: fileData,
      confirmLabel: config.confirmLabel,
      onConfirm: async (payload) => {
        if (restoreOriginalName) {
          const newExt = payload.newName.match(/\.[^.]*$/)?.[0] || '';
          const baseName = brokenItem.name.replace(/\.[^.]*$/, '');
          payload.newName = baseName + newExt;
        }
        
        if (onConfirm) {
          await onConfirm({
            ...payload,
            oldName: brokenItem.name
          });
        }
      },
      extraActions: () => {
        const baseName = brokenItem.name.replace(/\.[^.]*$/, '');
        const newExt = fileData.name.match(/\.[^.]*$/)?.[0] || '';
        
        return Checkbox.create({
          label: `Keep original filename (${baseName}${newExt})`,
          checked: restoreOriginalName,
          onChange: (_e, val) => {
            restoreOriginalName = val;
          }
        });
      }
    });
  }

  return { show };
})();
