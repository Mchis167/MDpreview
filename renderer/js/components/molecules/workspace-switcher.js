/* ══════════════════════════════════════════════════
   WorkspaceSwitcherComponent.js — Workspace Switcher Molecule
   Atomic Design System (Molecule)
   ════════════════════════════════════════════════════ */

const WorkspaceSwitcherComponent = (() => {
  'use strict';

  class WorkspaceSwitcher {
    /**
     * @param {Object} options
     * @param {Function} options.onClick - Callback when switcher is clicked
     */
    constructor(options = {}) {
      this.onClick = options.onClick || (() => {});
      this.element = null;
      this.nameLabel = null;
    }

    /**
     * Render the component
     * @returns {HTMLElement}
     */
    render() {
      // 1. Create Container
      const container = DesignSystem.createElement('div', 'ds-workspace-switcher-outer');
      
      // 2. Create Button
      const button = DesignSystem.createElement('button', 'ds-workspace-switcher');
      button.id = 'workspace-switcher'; // Keep ID for legacy logic if needed, but we prefer instance
      
      const info = DesignSystem.createElement('div', 'ws-info');
      const label = DesignSystem.createElement('span', 'ws-label', { text: 'WORKSPACE' });
      
      this.nameLabel = DesignSystem.createElement('div', ['ds-workspace-name', 'skeleton', 'skeleton-text'], {
        id: 'workspace-name' // Keep ID for legacy logic
      });
      
      info.appendChild(label);
      info.appendChild(this.nameLabel);
      
      const chevron = DesignSystem.createElement('div', 'ws-chevron', {
        html: DesignSystem.getIcon('chevron-right')
      });
      
      button.appendChild(info);
      button.appendChild(chevron);
      
      button.addEventListener('click', (e) => {
        this.onClick(e);
      });
      
      container.appendChild(button);
      this.element = container;
      return container;
    }

    /**
     * Update the workspace name
     * @param {string} name 
     */
    update(name) {
      if (!this.nameLabel) return;
      this.nameLabel.textContent = name || 'Add Workspace';
      this.nameLabel.classList.remove('skeleton', 'skeleton-text');
    }

    /**
     * Show loading state
     */
    setLoading() {
      if (!this.nameLabel) return;
      this.nameLabel.textContent = '';
      this.nameLabel.classList.add('skeleton', 'skeleton-text');
    }
  }

  return WorkspaceSwitcher;
})();

window.WorkspaceSwitcherComponent = WorkspaceSwitcherComponent;
