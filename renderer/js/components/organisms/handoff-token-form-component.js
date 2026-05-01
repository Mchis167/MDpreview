/* global DesignSystem, BaseFormModal */
/* ══════════════════════════════════════════════════
   HandoffTokenFormComponent.js — Configure Handoff API Token
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class HandoffTokenFormComponent {
  constructor(options = {}) {
    this.onConfirm = options.onConfirm || (() => { });
    this.onCancel = options.onCancel || (() => { });
    this.initialToken = window.AppState.settings.handoffToken || '';
  }

  render() {
    // 1. Prepare Body (Fields)
    const bodyContent = DesignSystem.createElement('div', 'handoff-form-body');
    
    const tokenLabel = DesignSystem.createElement('label', 'ds-form-field-label', { text: 'API TOKEN' });
    this.tokenInput = DesignSystem.createInput({
      type: 'password',
      placeholder: 'Enter your Bearer token...',
      id: 'handoff-token-input',
      value: this.initialToken
    });
    
    const helpText = DesignSystem.createInlineMessage({
      text: 'You can find your token in your Handoff dashboard settings.',
      variant: 'info'
    });
    
    bodyContent.appendChild(tokenLabel);
    bodyContent.appendChild(this.tokenInput);
    bodyContent.appendChild(helpText);

    // 2. Prepare Actions
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
      label: 'Save Token',
      onClick: () => {
        const token = this.tokenInput.value.trim();
        this.onConfirm(token);
        this.closeAction();
      }
    });

    // 3. Create Form using Template
    const form = BaseFormModal.create({
      iconHtml: `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
        </svg>
      `,
      title: 'Handoff API Configuration',
      subtitle: 'Enter your API token from handoff.host to enable document publishing.',
      bodyContent: bodyContent,
      actions: [cancelBtn, this.confirmBtn]
    });

    // Initial validation & focus
    setTimeout(() => this.tokenInput.focus(), 100);

    return form;
  }

  static open(options = {}) {
    const component = new HandoffTokenFormComponent(options);
    const content = component.render();

    const popover = DesignSystem.createPopoverShield({
      content: content,
      width: '480px',
      showHeader: false,
      className: 'aws-popover-shield'
    });

    component.closeAction = () => popover.close();
    return popover;
  }
}

window.HandoffTokenFormComponent = HandoffTokenFormComponent;
