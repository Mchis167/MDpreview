/* ══════════════════════════════════════════════════
   WorkspaceFormComponent.js — Premium Create/Edit Workspace Form
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class WorkspaceFormComponent {
  constructor(options = {}) {
    this.editWs = options.editWs || null;
    this.onConfirm = options.onConfirm || (() => { });
    this.onBrowse = options.onBrowse || (async () => null);
    this.onCancel = options.onCancel || (() => { });

    this.pendingPath = this.editWs ? this.editWs.path : '';
  }

  render() {
    const container = DesignSystem.createElement('div', 'aws-form-content');

    // 1. Icon Wrapper
    const iconWrapper = DesignSystem.createElement('div', 'aws-icon-wrapper', {
      html: `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
          <line x1="12" y1="10" x2="12" y2="16" />
          <line x1="9" y1="13" x2="15" y2="13" />
        </svg>
      `
    });
    container.appendChild(iconWrapper);

    // 2. Title & Subtitle
    const title = DesignSystem.createElement('h3', 'aws-title', {
      text: this.editWs ? 'Rename Workspace' : 'New Workspace'
    });
    const subtitle = DesignSystem.createElement('p', 'aws-subtitle', {
      text: this.editWs ? 'Change the display name of your workspace.' : 'Connect a local folder to start previewing.'
    });
    container.appendChild(title);
    container.appendChild(subtitle);

    // Divider Top
    container.appendChild(DesignSystem.createElement('div', 'setting-divider', {}));

    // 3. Fields
    const fields = DesignSystem.createElement('div', 'aws-fields');
    fields.style.padding = '24px 0 0 0';

    // Name Field
    const nameLabel = DesignSystem.createElement('label', 'aws-field-label', { text: 'WORKSPACE NAME' });
    this.nameInput = DesignSystem.createElement('input', 'aws-input', {
      type: 'text',
      placeholder: 'Design Specs, API Docs...',
      id: 'workspace-name-input',
      value: this.editWs ? this.editWs.name : ''
    });
    fields.appendChild(nameLabel);
    fields.appendChild(this.nameInput);

    // Path Field (Only for new)
    if (!this.editWs) {
      const pathLabel = DesignSystem.createElement('label', 'aws-field-label', { text: 'FOLDER PATH' });
      const browseRow = DesignSystem.createElement('div', 'aws-browse-row');

      this.pathDisplay = DesignSystem.createElement('input', 'aws-input path', {
        type: 'text',
        placeholder: 'Select document folder...',
        value: this.pendingPath,
        readOnly: true
      });

      const browseBtn = DesignSystem.createElement('button', 'btn-secondary', {
        text: 'Browse',
        id: 'browse-btn'
      });
      browseBtn.style.height = '44px';
      browseBtn.style.borderRadius = '22px';
      browseBtn.style.padding = '0 20px';

      browseBtn.onclick = async () => {
        const path = await this.onBrowse();
        if (path) {
          this.pendingPath = path;
          this.pathDisplay.value = path;
          this._validate();
        }
      };

      browseRow.appendChild(this.pathDisplay);
      browseRow.appendChild(browseBtn);

      fields.appendChild(pathLabel);
      fields.appendChild(browseRow);
    }
    container.appendChild(fields);

    // Divider Bottom
    container.appendChild(DesignSystem.createElement('div', 'setting-divider', {}));

    // 4. Actions
    const actions = DesignSystem.createElement('div', 'aws-actions');
    actions.style.marginTop = '20px';

    const cancelBtn = DesignSystem.createElement('button', 'btn-ghost', {
      text: 'Cancel',
      id: 'cancel-workspace-btn'
    });
    cancelBtn.style.flex = '1';
    cancelBtn.style.height = '48px';
    cancelBtn.onclick = () => {
      this.closeAction();
      this.onCancel();
    };

    this.confirmBtn = DesignSystem.createElement('button', 'btn-primary', {
      text: this.editWs ? 'Update' : 'Create',
      id: 'confirm-workspace-btn'
    });
    this.confirmBtn.style.flex = '1';
    this.confirmBtn.style.height = '48px';
    this.confirmBtn.disabled = true;

    this.confirmBtn.onclick = () => {
      const name = this.nameInput.value.trim();
      if (this.editWs) {
        this.onConfirm(this.editWs.id, name);
      } else if (this.pendingPath) {
        this.onConfirm(name, this.pendingPath);
      }
      this.closeAction();
    };

    actions.appendChild(cancelBtn);
    actions.appendChild(this.confirmBtn);
    container.appendChild(actions);

    // Validation
    this.nameInput.oninput = () => this._validate();
    setTimeout(() => this.nameInput.focus(), 100);

    return container;
  }

  _validate() {
    const nameValid = this.nameInput.value.trim().length > 0;
    const pathValid = this.editWs ? true : this.pendingPath.length > 0;
    if (this.confirmBtn) {
      this.confirmBtn.disabled = !(nameValid && pathValid);
    }
  }

  static open(options) {
    const component = new WorkspaceFormComponent(options);
    const content = component.render();

    const popover = DesignSystem.createPopoverShield({
      content: content,
      width: '480px',
      showHeader: false, // Hide the generic header
      className: 'aws-popover-shield'
    });

    component.closeAction = () => popover.close();
    return popover;
  }
}

window.WorkspaceFormComponent = WorkspaceFormComponent;
