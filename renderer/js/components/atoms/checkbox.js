/**
 * Checkbox Component (Atoms)
 * Purpose: Reusable checkbox atom with label support.
 * Dependencies: DesignSystem
 */
const Checkbox = (() => {
  'use strict';

  /**
   * Create a standardized checkbox
   * @param {Object} options
   * @returns {HTMLElement} The checkbox wrapper or input
   */
  function create(options = {}) {
    const {
      checked = false,
      label = null,
      onChange = null,
      disabled = false,
      className = '',
      id = '',
      name = ''
    } = options;

    // 1. Create Input
    const input = DesignSystem.createElement('input', 'ds-checkbox');
    input.type = 'checkbox';
    input.checked = checked;
    if (disabled) input.disabled = true;
    if (id) input.id = id;
    if (name) input.name = name;
    if (className) input.classList.add(className);

    if (onChange) {
      input.addEventListener('change', (e) => onChange(e, input.checked));
    }

    // 2. Wrap with Label if provided
    if (label) {
      const wrapper = DesignSystem.createElement('label', 'ds-checkbox-wrapper');
      const labelSpan = DesignSystem.createElement('span', 'ds-checkbox-label', { text: label });
      
      wrapper.appendChild(input);
      wrapper.appendChild(labelSpan);
      
      // Proxy value property for convenience
      Object.defineProperty(wrapper, 'checked', {
        get: () => input.checked,
        set: (v) => { input.checked = v; },
        configurable: true
      });
      wrapper.input = input;

      return wrapper;
    }

    return input;
  }

  return {
    create
  };
})();

// Explicit export to global scope
window.Checkbox = Checkbox;
