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
        this.defaultCollapsed = options.defaultCollapsed || false;
    }

    render() {
        const header = document.createElement('div');
        header.className = `sidebar-section-header ${this.className}`.trim();

        // ── Handle Collapsible logic ──
        if (this.collapsible) {
            const { sectionId, storageKey, appStateKey } = this.collapsible;
            
            // Determine initial state
            const isCollapsed = (appStateKey && AppState.settings && AppState.settings[appStateKey]) || 
                                (storageKey && localStorage.getItem(storageKey) === 'true') ||
                                (this.defaultCollapsed && (!storageKey || localStorage.getItem(storageKey) === null));
            
            const toggleBtn = new IconActionButton({
                className: 'section-toggle-btn',
                iconName: 'chevron-down',
                onClick: null // We'll handle it on the header level
            });
            header.appendChild(toggleBtn.render());

            // Make entire header clickable
            header.style.cursor = 'pointer';
            header.onclick = (e) => {
                // BUG FIX: Bỏ qua nếu người dùng click vào các nút Action hoặc bên trong Action
                if (e.target.closest('.header-actions-group') || e.target.closest('.ds-btn')) {
                    return;
                }

                const section = document.getElementById(sectionId);
                if (!section) return;

                // BLOCK: If user is currently renaming a file, don't allow toggling layout
                if (window.TreeModule && window.TreeModule.getState) {
                    const treeState = window.TreeModule.getState();
                    if (treeState.renamingPath) {
                        console.warn('SidebarSectionHeader: Toggle blocked while renaming.');
                        return;
                    }
                }

                // Enable transitions only on user interaction
                section.classList.add('allow-transition');

                const collapsed = section.classList.toggle('collapsed');
                localStorage.setItem(storageKey, collapsed);
                if (appStateKey && typeof AppState !== 'undefined') {
                    AppState.settings[appStateKey] = collapsed;
                    if (AppState.savePersistentState) AppState.savePersistentState();
                }
            };

            // Set initial class on mount (using a small timeout to ensure DOM presence)
            setTimeout(() => {
                const section = document.getElementById(sectionId);
                if (section && isCollapsed) section.classList.add('collapsed');
            }, 0);
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
