/* ══════════════════════════════════════════════════
   WorkspacePickerComponent.js — Workspace Selection Organism
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class WorkspacePickerComponent {
  constructor(options = {}) {
    this.workspaces = options.workspaces || [];
    this.activeId = options.activeId || null;
    this.onSelect = options.onSelect || (() => {});
    this.onAdd = options.onAdd || (() => {});
    this.onDelete = options.onDelete || (() => {});
    this.onRename = options.onRename || (() => {});
    
    this.editingId = null; // Track which workspace is being renamed inline
  }

  render() {
    const container = DesignSystem.createElement('div', 'workspace-picker-container');

    const listGroup = DesignSystem.createElement('div', 'ds-popover-group');

    if (this.workspaces.length === 0) {
      const empty = DesignSystem.createElement('div', 'ws-empty-state', {
        html: `
          <p>No workspaces found.</p>
        `
      });
      listGroup.appendChild(empty);
    } else {
      this.workspaces.forEach((ws, index) => {
        const isActive = ws.id === this.activeId;
        const isEditing = ws.id === this.editingId;
        const item = DesignSystem.createElement('div', ['ws-list-item', isActive ? 'active' : '']);
        
        // Column 1: Name & Icon
        const leftCol = DesignSystem.createElement('div', 'ws-list-item-left');
        const icon = DesignSystem.createElement('div', 'ws-list-item-icon', {
          html: (DesignSystem.ICONS && DesignSystem.ICONS['folder']) || '📁'
        });
        const nameWrap = DesignSystem.createElement('div', 'ws-list-item-name-wrap');
        
        if (isEditing) {
          // Inline Input for Renaming
          const input = DesignSystem.createElement('input', 'ws-inline-edit-input', {
            value: ws.name
          });
          
          const saveEdit = () => {
            const newName = input.value.trim();
            if (newName && newName !== ws.name) {
              this.onRename(ws.id, newName);
            }
            this.editingId = null;
            this.refreshPopover(item);
          };

          const cancelEdit = () => {
            this.editingId = null;
            this.refreshPopover(item);
          };

          input.onkeydown = (e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') cancelEdit();
          };
          
          input.onblur = saveEdit;
          nameWrap.appendChild(input);
          setTimeout(() => input.focus(), 50);
        } else {
          const name = DesignSystem.createElement('div', 'ws-list-item-name', { 
            text: ws.name,
            title: 'Double-click to rename'
          });
          
          // Trigger inline edit on double click
          name.ondblclick = (e) => {
            e.stopPropagation();
            this.editingId = ws.id;
            this.refreshPopover(item);
          };

          nameWrap.appendChild(name);
          
          if (isActive) {
            const badge = DesignSystem.createElement('span', 'ws-badge', { text: 'IN OPEN' });
            nameWrap.appendChild(badge);
          }
        }
        
        leftCol.appendChild(icon);
        leftCol.appendChild(nameWrap);

        // Column 2: Path
        const pathCol = DesignSystem.createElement('div', 'ws-list-item-path-col');
        const path = DesignSystem.createElement('div', 'ws-list-item-path', { text: ws.path.toUpperCase() });
        pathCol.appendChild(path);

        // Column 3: Actions
        const rightCol = DesignSystem.createElement('div', 'ws-list-item-right');
        const actions = DesignSystem.createElement('div', 'ws-list-item-actions');
        
        // Use global Design System delete button class
        const delBtn = DesignSystem.createElement('button', 'ds-item-delete-btn', {
          html: DesignSystem.getIcon ? DesignSystem.getIcon('x') : '✕',
          title: 'Remove Workspace'
        });
        delBtn.onclick = (e) => {
          e.stopPropagation();
          this.onDelete(ws);
        };

        actions.appendChild(delBtn);
        rightCol.appendChild(actions);

        item.appendChild(leftCol);
        item.appendChild(pathCol);
        item.appendChild(rightCol);

        if (!isEditing) {
          item.onclick = () => this.onSelect(ws.id);
        }

        listGroup.appendChild(item);
        
        // Divider
        if (index < this.workspaces.length - 1) {
          listGroup.appendChild(this._createDivider());
        }
      });
    }
    container.appendChild(listGroup);

    // 2. Add New Workspace Button (Direct)
    const addIcon = (DesignSystem.ICONS && DesignSystem.ICONS['plus']) || '+';
    const addBtn = DesignSystem.createElement('div', 'ws-add-action-btn', {
      html: `
        <span class="ws-add-icon">${addIcon}</span>
        <span class="ws-add-text">Create New Workspace</span>
      `
    });
    addBtn.onclick = () => this.onAdd();
    container.appendChild(addBtn);

    return container;
  }

  refreshPopover(element) {
    const shield = element.closest('.ds-popover-shield, .ds-popover-floating');
    if (shield && shield.__popover) {
      const body = shield.querySelector('.ds-popover-body');
      if (body) {
        body.innerHTML = '';
        body.appendChild(this.render());
      }
    }
  }

  _createDivider() {
    return DesignSystem.createElement('div', 'setting-divider');
  }

  static open(data) {
    const component = new WorkspacePickerComponent(data);
    const content = component.render();

    return DesignSystem.createPopoverShield({
      title: 'Select Workspace',
      content: content,
      width: '960px',
      className: 'workspace-picker-popover'
    });
  }
}

window.WorkspacePickerComponent = WorkspacePickerComponent;
