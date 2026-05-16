/* global DesignSystem, ModalComponent */
/**
 * AssetUploadPreviewComponent - Molecule for previewing a file before it is uploaded/inserted.
 */
window.AssetUploadPreviewComponent = (() => {
  'use strict';

  /**
   * Shows the Asset Upload Preview modal.
   * @param {Object} config - Configuration options
   * @param {Object} config.file - File metadata { name, size, preview, data }
   * @param {string} config.title - Modal title
   * @param {string} config.confirmLabel - Label for primary action
   * @param {Function} config.onConfirm - Callback with final payload
   * @param {HTMLElement|Function} config.extraActions - Extra UI elements (optional)
   */
  function show(config = {}) {
    const {
      file,
      title = 'Upload Preview',
      confirmLabel = 'Upload & Insert',
      onConfirm = null,
      extraActions = null
    } = config;

    if (!file) return;

    let finalPayload = {
      isUpload: true,
      newName: file.name,
      data: file.data
    };

    const content = DesignSystem.createElement('div', 'ds-asset-picker-dialog');
    const body = DesignSystem.createElement('div', 'ds-asset-picker-body');
    content.appendChild(body);

    function _render() {
      body.innerHTML = '';
      
      const previewV2 = DesignSystem.createElement('div', 'ds-asset-upload-preview-v2');
      
      const heroCard = DesignSystem.createElement('div', 'ds-asset-upload-hero-card');
      const imgWrapper = DesignSystem.createElement('div', 'ds-asset-upload-img-wrapper');
      const img = DesignSystem.createElement('img', 'ds-asset-upload-hero-img');
      img.src = file.preview;
      imgWrapper.appendChild(img);
      
      const metaBar = DesignSystem.createElement('div', 'ds-asset-upload-meta-bar');
      const nameEl = DesignSystem.createElement('div', 'ds-asset-upload-filename', { text: file.name });
      const sizeEl = DesignSystem.createElement('div', 'ds-asset-upload-size', { 
        text: (file.size / 1024).toFixed(1) + ' KB' 
      });
      
      metaBar.appendChild(nameEl);
      metaBar.appendChild(sizeEl);
      heroCard.appendChild(imgWrapper);
      heroCard.appendChild(metaBar);
      
      previewV2.appendChild(heroCard);
      body.appendChild(previewV2);

      // Render extra actions if provided
      if (extraActions) {
        const extraContainer = DesignSystem.createElement('div', 'ds-asset-picker-extra-container');
        const actionsEl = (typeof extraActions === 'function') 
          ? extraActions({ file }) 
          : extraActions;
          
        if (actionsEl) {
          if (actionsEl.el) extraContainer.appendChild(actionsEl.el);
          else extraContainer.appendChild(actionsEl);
          body.appendChild(extraContainer);
        }
      }
    }

    const footer = DesignSystem.createElement('div', 'ds-confirm-footer');
    const cancelBtn = DesignSystem.createButton({ label: 'Cancel', variant: 'ghost' });
    const confirmBtn = DesignSystem.createButton({ label: confirmLabel, variant: 'primary' });
    
    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    const modal = ModalComponent.create({
      title,
      content,
      footer,
      width: '450px'
    });

    cancelBtn.onclick = () => modal.close();
    
    confirmBtn.onclick = async () => {
      confirmBtn.setLoading(true);
      try {
        if (onConfirm) await onConfirm(finalPayload);
        modal.close();
      } catch (err) {
        console.error('Upload confirm failed:', err);
        if (typeof window.showToast === 'function') window.showToast('Upload failed: ' + err.message, 'error');
      } finally {
        confirmBtn.setLoading(false);
      }
    };

    _render();
  }

  return { show };
})();
