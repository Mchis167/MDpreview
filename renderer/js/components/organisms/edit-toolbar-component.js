/**
 * EditToolbarComponent (Organism)
 * Purpose: Provides a standardized toolbar for Markdown editing tools.
 * Dependencies: IconActionButton (Atom), DesignSystem (Core)
 */
const EditToolbarComponent = (() => {
  'use strict';

  class EditToolbarComponent {
    constructor(mount) {
      this.mount = mount || document.getElementById('edit-toolbar-mount');

      this.onAction = null;
      this.onSave = null;
      this.onCancel = null;
      this.onHelp = null;

      this.el = null;
      this.config = [
        {
          id: 'headings',
          items: [
            { action: 'h1', icon: 'heading-1', title: 'Heading 1' },
            { action: 'h2', icon: 'heading-2', title: 'Heading 2' },
            { action: 'h3', icon: 'heading-3', title: 'Heading 3' },
            { action: 'h4', icon: 'heading-4', title: 'Heading 4' },
            { action: 'h5', icon: 'heading-5', title: 'Heading 5' },
            { action: 'h6', icon: 'heading-6', title: 'Heading 6' }
          ]
        },
        {
          id: 'typography',
          items: [
            { action: 'b', icon: 'bold', title: 'Bold' },
            { action: 'i', icon: 'italic', title: 'Italic' },
            { action: 's', icon: 'strikethrough', title: 'Strikethrough' }
          ]
        },
        {
          id: 'content',
          items: [
            { action: 'q', icon: 'quote', title: 'Quote' },
            { action: 'l', icon: 'link', title: 'Link' },
            { action: 'img', icon: 'image', title: 'Image' },
            { action: 'hr', icon: 'minus', title: 'Divider' }
          ]
        },
        {
          id: 'lists',
          items: [
            { action: 'ul', icon: 'list', title: 'Unordered List' },
            { action: 'ol', icon: 'list-ordered', title: 'Numbered List' },
            { action: 'tl', icon: 'check-square', title: 'Task List' }
          ]
        },
        {
          id: 'advanced',
          items: [
            { action: 'c', icon: 'code', title: 'Inline Code' },
            { action: 'cb', icon: 'terminal', title: 'Code Block' },
            { action: 'tb', icon: 'table', title: 'Table' }
          ]
        },
        {
          id: 'help',
          items: [
            { id: 'edit-help-btn', icon: 'help-circle', title: 'Markdown Help', onClick: () => this.onHelp?.() }
          ]
        }
      ];

      this.init();
    }

    init() {
      if (!this.mount) return;
      this.render();
    }

    show(options = {}) {
      this.onAction = options.onAction;
      this.onSave = options.onSave;
      this.onCancel = options.onCancel;
      this.onHelp = options.onHelp;

      if (this.el) {
        this.el.style.display = 'block';
      }
    }

    hide() {
      if (this.el) {
        this.el.style.display = 'none';
      }
      this.onAction = null;
      this.onSave = null;
      this.onCancel = null;
      this.onHelp = null;
    }

    render() {
      const wrap = DesignSystem.createElement('div', 'ds-edit-toolbar-container');
      wrap.style.display = 'none'; // Hidden by default

      const toolbar = DesignSystem.createElement('div', 'ds-edit-toolbar');

      // 1. Tool Groups
      this.config.forEach((group, idx) => {
        const groupEl = this._createGroup(group.items);
        toolbar.appendChild(groupEl);

        // Add divider between tool groups
        if (idx < this.config.length - 1) {
          toolbar.appendChild(DesignSystem.createElement('div', 'ds-edit-toolbar-divider'));
        }
      });

      // 2. Spacer to push action group to the right
      toolbar.appendChild(DesignSystem.createElement('div', 'ds-edit-toolbar-spacer'));

      // 2. Action Group (Cancel/Save)
      const actionGroup = DesignSystem.createElement('div', 'ds-edit-button-group');
      const cancelBtn = DesignSystem.createButton({
        label: 'Discard',
        variant: 'ghost',
        onClick: () => this.onCancel?.()
      });
      const saveBtn = DesignSystem.createButton({
        label: 'Save Changes',
        variant: 'primary',
        onClick: () => this.onSave?.()
      });

      actionGroup.appendChild(cancelBtn);
      actionGroup.appendChild(saveBtn);
      toolbar.appendChild(actionGroup);

      wrap.appendChild(toolbar);
      this.mount.appendChild(wrap);
      this.el = wrap;
    }

    _createGroup(items) {
      const group = DesignSystem.createElement('div', 'ds-edit-action-group');
      items.forEach(item => {
        const btn = new window.IconActionButton({
          id: item.id,
          title: item.title,
          iconName: item.icon,
          isLarge: false,
          onClick: item.onClick || (() => this.onAction?.(item.action))
        }).render();

        // UX: Prevent focus theft from editor
        btn.onmousedown = (e) => e.preventDefault();

        group.appendChild(btn);
      });
      return group;
    }
  }

  // Singleton Bridge
  let instance = null;
  return {
    init: (mount) => {
      if (!instance) instance = new EditToolbarComponent(mount);
      return instance;
    },
    getInstance: () => instance
  };
})();

window.EditToolbarComponent = EditToolbarComponent;
