/**
 * EmptyStateComponent - Atom for rendering reusable empty state UI.
 */
window.EmptyStateComponent = (() => {
  'use strict';

  return {
    /**
     * Creates an empty state element.
     * @param {Object} options
     * @param {string} options.icon - Icon name from DesignSystem
     * @param {string} options.title - Primary text
     * @param {string} options.description - Secondary text
     * @param {string} options.className - Additional classes
     * @returns {HTMLElement}
     */
    create(options = {}) {
      const { icon, title, description, className = '' } = options;
      
      const container = DesignSystem.createElement('div', `ds-empty-state ${className}`);
      
      if (icon) {
        const iconEl = DesignSystem.createElement('div', 'ds-empty-state-icon');
        iconEl.innerHTML = DesignSystem.getIcon(icon, { width: 48, height: 48 });
        container.appendChild(iconEl);
      }
      
      if (title) {
        const titleEl = DesignSystem.createElement('div', 'ds-empty-state-title', { text: title });
        container.appendChild(titleEl);
      }
      
      if (description) {
        const descEl = DesignSystem.createElement('div', 'ds-empty-state-desc', { text: description });
        container.appendChild(descEl);
      }
      
      return container;
    }
  };
})();
