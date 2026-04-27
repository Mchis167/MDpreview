/* global DesignSystem */
/**
 * SettingRow Molecule
 * Purpose: A standard row for the settings panel with a label and a control element.
 */
const SettingRow = (() => {
  'use strict';

  /**
   * Create a new SettingRow element
   * @param {Object} options 
   * @param {string} options.label - The label text
   * @param {HTMLElement} options.control - The control element (slider, select, etc.)
   * @returns {HTMLElement}
   */
  function create(options) {
    const { label, control } = options;

    const row = DesignSystem.createElement('div', 'ds-setting-row');
    
    const labelCol = DesignSystem.createElement('div', 'ds-setting-row-label-col');
    labelCol.appendChild(DesignSystem.createElement('span', 'ds-setting-row-label', { text: label }));
    
    const controlCol = DesignSystem.createElement('div', 'ds-setting-row-control-col');
    if (control) {
      controlCol.appendChild(control);
    }

    row.appendChild(labelCol);
    row.appendChild(controlCol);

    return row;
  }

  return {
    create: create
  };
})();

window.SettingRow = SettingRow;
