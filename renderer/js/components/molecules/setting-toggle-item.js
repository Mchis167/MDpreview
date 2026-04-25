/* global DesignSystem, SwitchToggleModule */
/**
 * SettingToggleItem Molecule
 * Purpose: A reusable row containing a label and a toggle switch
 * Dependencies: SwitchToggleModule (Atom)
 */
const SettingToggleItem = (() => {
  'use strict';

  /**
   * Create a new SettingToggleItem element
   * @param {Object} options 
   * @param {string} options.label - The label text
   * @param {boolean} options.isOn - Initial state
   * @param {Function} options.onChange - Callback(isOn)
   * @param {string} options.variant - 'menu' or 'panel' (default: 'panel')
   * @returns {HTMLElement}
   */
  function create(options) {
    const { label, isOn, onChange, variant = 'panel' } = options;

    // 1. Create Container
    const container = DesignSystem.createElement('div', [
      'ds-setting-toggle-item',
      `ds-setting-toggle-item--${variant}`
    ]);

    // 2. Create Label
    const labelEl = DesignSystem.createElement('span', 'ds-setting-toggle-label', { text: label });

    // 3. Create Toggle Wrapper
    const toggleWrapper = DesignSystem.createElement('div', 'ds-setting-toggle-control');

    container.appendChild(labelEl);
    container.appendChild(toggleWrapper);

    // 4. Initialize Toggle Logic
    const toggleApi = SwitchToggleModule.init({
      element: toggleWrapper, // Note: SwitchToggleModule update required to support 'element'
      isOn: isOn,
      onChange: onChange
    });

    // 5. Allow clicking the whole row to toggle
    container.addEventListener('click', (e) => {
      // Avoid double toggle if clicking the switch directly 
      // (though switch is pointer-events: none in CSS)
      if (e.target === toggleWrapper || toggleWrapper.contains(e.target)) return;
      
      if (toggleApi && toggleApi.toggle) {
        toggleApi.toggle();
      }
    });

    return container;
  }

  return {
    create: create
  };
})();

// Export to global scope
window.SettingToggleItem = SettingToggleItem;
