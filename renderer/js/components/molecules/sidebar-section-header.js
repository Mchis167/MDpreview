/**
 * SidebarSectionHeader.js — Atomic Design (Molecule)
 * Unified header for sidebar sections (Recently Viewed, All Files, etc.)
 */

class SidebarSectionHeader {
    constructor(options = {}) {
        this.title = options.title || '';
        this.actions = options.actions || []; // Array or nested array of IconActionButton
        this.className = options.className || '';
        this.collapsible = options.collapsible || null; // { sectionId, storageKey, appStateKey }
    }

    render() {
        const header = document.createElement('div');
        header.className = `sidebar-section-header ${this.className}`.trim();

        // ── Handle Collapsible logic ──
        if (this.collapsible) {
            const { sectionId, storageKey, appStateKey } = this.collapsible;
            const section = document.getElementById(sectionId);
            
            if (section) {
                // Determine initial state
                const isCollapsed = (appStateKey && AppState.settings[appStateKey]) || 
                                    localStorage.getItem(storageKey) === 'true';
                
                if (isCollapsed) section.classList.add('collapsed');

                const toggleBtn = new IconActionButton({
                    className: 'section-toggle-btn',
                    iconName: 'chevron-down',
                    onClick: null // We'll handle it on the header level
                });
                header.appendChild(toggleBtn.render());

                // Make entire header clickable
                header.style.cursor = 'pointer';
                header.onclick = (e) => {
                    // BLOCK: If user is currently renaming a file, don't allow toggling layout
                    if (window.TreeModule && window.TreeModule.getState) {
                        const treeState = window.TreeModule.getState();
                        if (treeState.renamingPath) {
                            console.warn('SidebarSectionHeader: Toggle blocked while renaming.');
                            return;
                        }
                    }

                    section.classList.add('is-animating');
                    const collapsed = section.classList.toggle('collapsed');
                    localStorage.setItem(storageKey, collapsed);
                    if (appStateKey && typeof AppState !== 'undefined') {
                        AppState.settings[appStateKey] = collapsed;
                        if (AppState.savePersistentState) AppState.savePersistentState();
                    }

                    // Clean up animation class after transition
                    section.addEventListener('transitionend', () => {
                        section.classList.remove('is-animating');
                    }, { once: true });
                };
            }
        }

        // Title/Label
        const label = document.createElement('div');
        label.className = 'section-label';
        label.textContent = this.title;
        header.appendChild(label);

        // Actions Group
        if (this.actions.length > 0) {
            const actionsGroup = document.createElement('div');
            actionsGroup.className = 'header-actions-group';
            
            // Normalize to grouped structure: [[a, b], [c]]
            const groups = Array.isArray(this.actions[0]) ? this.actions : [this.actions];

            groups.forEach((group, groupIdx) => {
                // Add divider between groups
                if (groupIdx > 0) {
                    const divider = document.createElement('div');
                    divider.className = 'header-action-divider';
                    actionsGroup.appendChild(divider);
                }

                group.forEach(action => {
                    if (action instanceof IconActionButton) {
                        actionsGroup.appendChild(action.render());
                    }
                });
            });
            
            header.appendChild(actionsGroup);
        }

        return header;
    }
}

window.SidebarSectionHeader = SidebarSectionHeader;
