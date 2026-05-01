/* global DesignSystem, BaseFormModal */
/**
 * PublishSettingsFormComponent
 * Purpose: Configure Cloudflare Worker and Handoff API settings
 * Atomic Design System (Organism)
 */

class PublishSettingsFormComponent {
  constructor(options = {}) {
    this.onConfirm = options.onConfirm || (() => { });
    this.onCancel = options.onCancel || (() => { });
    
    const s = window.AppState.settings;
    this.initialWorkerUrl = s.publishWorkerUrl || '';
    this.initialAdminSecret = s.publishAdminSecret || '';
    this.initialHandoffToken = s.handoffToken || '';
  }

  render() {
    const bodyContent = DesignSystem.createElement('div', 'ds-publish-settings-form');
    bodyContent.style.display = 'flex';
    bodyContent.style.flexDirection = 'column';
    bodyContent.style.gap = 'var(--ds-space-md)';

    // --- Section 1: Worker (Primary) ---
    const workerSection = DesignSystem.createElement('div', 'ds-form-section');
    workerSection.innerHTML = '<h3 style="margin: 0 0 12px 0; font-size: 14px; color: var(--ds-accent);">Self-Hosted Worker (Recommended)</h3>';
    
    const urlLabel = DesignSystem.createElement('label', 'ds-form-field-label', { text: 'WORKER URL' });
    this.urlInput = DesignSystem.createInput({
      placeholder: 'https://your-worker.yourdomain.workers.dev',
      value: this.initialWorkerUrl
    });

    const secretLabel = DesignSystem.createElement('label', 'ds-form-field-label', { text: 'ADMIN SECRET' });
    this.secretInput = DesignSystem.createInput({
      type: 'password',
      placeholder: 'Enter your worker admin secret...',
      value: this.initialAdminSecret
    });

    workerSection.appendChild(urlLabel);
    workerSection.appendChild(this.urlInput);
    workerSection.appendChild(secretLabel);
    workerSection.appendChild(this.secretInput);

    // Divider
    const divider = DesignSystem.createElement('div', 'ds-form-divider');
    divider.style.margin = '8px 0';

    // --- Section 2: Handoff (Legacy) ---
    const handoffSection = DesignSystem.createElement('div', 'ds-form-section');
    handoffSection.innerHTML = '<h3 style="margin: 0 0 12px 0; font-size: 14px; color: var(--ds-text-dim);">Legacy: Handoff.host</h3>';
    
    const tokenLabel = DesignSystem.createElement('label', 'ds-form-field-label', { text: 'HANDOFF API TOKEN' });
    this.tokenInput = DesignSystem.createInput({
      type: 'password',
      placeholder: 'Enter your Handoff Bearer token...',
      value: this.initialHandoffToken
    });

    handoffSection.appendChild(tokenLabel);
    handoffSection.appendChild(this.tokenInput);

    bodyContent.appendChild(workerSection);
    bodyContent.appendChild(divider);
    bodyContent.appendChild(handoffSection);

    // Actions
    const cancelBtn = DesignSystem.createButton({
      variant: 'ghost',
      label: 'Cancel',
      onClick: () => {
        this.closeAction();
        this.onCancel();
      }
    });

    this.confirmBtn = DesignSystem.createButton({
      variant: 'primary',
      label: 'Save Configuration',
      onClick: () => {
        const workerUrl = this.urlInput.value.trim();
        const adminSecret = this.secretInput.value.trim();
        const handoffToken = this.tokenInput.value.trim();
        
        window.SettingsService.update('publishWorkerUrl', workerUrl);
        window.SettingsService.update('publishAdminSecret', adminSecret);
        window.SettingsService.update('handoffToken', handoffToken);
        
        if (window.showToast) window.showToast('Publish settings updated');
        
        this.onConfirm();
        this.closeAction();
      }
    });

    const form = BaseFormModal.create({
      iconHtml: `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
        </svg>
      `,
      title: 'Publish Configuration',
      subtitle: 'Configure your self-hosted Cloudflare Worker or use legacy Handoff.host.',
      bodyContent: bodyContent,
      actions: [cancelBtn, this.confirmBtn]
    });

    setTimeout(() => this.urlInput.focus(), 100);

    return form;
  }

  static open(options = {}) {
    const component = new PublishSettingsFormComponent(options);
    const content = component.render();

    const popover = DesignSystem.createPopoverShield({
      content: content,
      width: '520px',
      showHeader: false,
      className: 'aws-popover-shield'
    });

    component.closeAction = () => popover.close();
    return popover;
  }
}

window.PublishSettingsFormComponent = PublishSettingsFormComponent;
