/**
 * StatusBadge Component (Atom)
 * Purpose: A subtle status indicator consisting of a dot and a label.
 */
const StatusBadge = (() => {
  'use strict';

  /**
   * Create a StatusBadge element
   * @param {Object} options - { text, variant, className }
   * @returns {HTMLElement}
   */
  function create(options = {}) {
    const {
      text = '',
      variant = 'info',
      className = ''
    } = options;

    const container = document.createElement('div');
    container.className = `ds-status-badge ds-status-badge--${variant} ${className}`;

    const dot = document.createElement('span');
    dot.className = 'ds-status-badge-dot';

    const label = document.createElement('span');
    label.className = 'ds-status-badge-label';
    label.textContent = text;

    container.appendChild(dot);
    container.appendChild(label);

    // Dynamic API
    container.setText = (newText) => {
      label.textContent = newText;
    };

    container.setVariant = (newVariant) => {
      container.className = `ds-status-badge ds-status-badge--${newVariant} ${className}`;
    };

    return container;
  }

  return {
    create
  };
})();

window.StatusBadge = StatusBadge;
