/* global DesignSystem */
/**
 * SelectComponent (Atom)
 * Purpose: Provides a standardized styled select element.
 */
const SelectComponent = (() => {
  'use strict';

  /**
   * Create a standardized select element
   */
  function create(options = [], currentVal, onChange) {
    const select = DesignSystem.createElement('select', 'ds-select');
    options.forEach(opt => {
      const value = typeof opt === 'string' ? opt : opt.value;
      const label = typeof opt === 'string' ? opt : opt.label;
      const el = DesignSystem.createElement('option', '', { value, text: label });
      if (value === currentVal) el.selected = true;
      select.appendChild(el);
    });
    if (onChange) select.onchange = (e) => onChange(e.target.value);
    return select;
  }

  return { create };
})();

window.SelectComponent = SelectComponent;
