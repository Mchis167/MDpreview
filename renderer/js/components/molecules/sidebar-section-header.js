/**
 * SidebarSectionHeader.js — Atomic Design (Molecule)
 * Unified header for sidebar sections (Recently Viewed, All Files, etc.)
 */

class SidebarSectionHeader {
    constructor(options = {}) {
        this.title = options.title || '';
        this.actions = options.actions || []; // Array of IconActionButton instances
        this.className = options.className || '';
    }

    render() {
        const header = document.createElement('div');
        header.className = `sidebar-section-header ${this.className}`.trim();

        // Title/Label
        const label = document.createElement('div');
        label.className = 'section-label';
        label.textContent = this.title;
        header.appendChild(label);

        // Actions Group
        if (this.actions.length > 0) {
            const actionsGroup = document.createElement('div');
            actionsGroup.className = 'header-actions-group';
            
            this.actions.forEach(action => {
                if (action instanceof IconActionButton) {
                    actionsGroup.appendChild(action.render());
                } else if (action instanceof HTMLElement) {
                    actionsGroup.appendChild(action);
                }
            });
            
            header.appendChild(actionsGroup);
        }

        return header;
    }
}

window.SidebarSectionHeader = SidebarSectionHeader;
