/* global DesignSystem */
/**
 * InputComponent
 * Purpose: A robust, reusable input atom with support for labels, actions, and status indicators.
 * Follows the Design System's Atomic design principles.
 */
const InputComponent = (() => {
  'use strict';

  /**
   * Create a standardized input component
   * @param {Object} options
   * @returns {HTMLElement} The enhanced container element
   */
  function create(options = {}) {
    const {
      type = 'text',
      placeholder = '',
      value = '',
      className = '',
      id = '',
      label = null,
      variant = 'default', // 'default', 'error', 'success', 'warning'
      status = null, // { text, variant }
      action = null, // { icon, onClick, title }
      onInput = null,
      onChange = null,
      disabled = false,
      readOnly = false,
      description = null
    } = options;

    // 1. Create Container (Form Field)
    const container = DesignSystem.createElement('div', ['ds-form-field', className]);
    if (id) container.id = id;

    // 2. Label & Tooltip Description
    if (label) {
      const labelEl = DesignSystem.createElement('label', 'ds-form-field-label', { text: label });
      if (description) {
        DesignSystem.applyTooltip(labelEl, description, 'top');
        labelEl.classList.add('has-tooltip');
      }
      container.appendChild(labelEl);
    }

    // 3. Input Wrapper (Group if action exists)
    const wrapperClass = action ? 'ds-input-group' : 'ds-input-wrapper';
    const wrapper = DesignSystem.createElement('div', [wrapperClass]);
    if (variant && variant !== 'default') {
      wrapper.classList.add(`ds-input--${variant}`);
    }
    container.appendChild(wrapper);

    // 4. Actual Input
    const input = DesignSystem.createElement('input', 'ds-input');
    input.type = type;
    input.placeholder = placeholder;
    input.value = value;
    if (disabled) input.disabled = true;
    if (readOnly) input.readOnly = true;
    if (className) input.classList.add(className);
    wrapper.appendChild(input);

    // 5. Action Button
    let actionBtn = null;
    if (action) {
      actionBtn = DesignSystem.createButton({
        variant: 'ghost',
        leadingIcon: action.icon,
        onClick: action.onClick,
        title: action.title,
        offLabel: true,
        className: 'ds-input-group-action'
      });
      wrapper.appendChild(actionBtn);
    }

    // 6. Status Indicator
    const statusEl = DesignSystem.createElement('div', 'ds-form-field-status');
    container.appendChild(statusEl);

    // ── Instance API (Attached to container) ─────────────────────
    
    /**
     * Update the status message and variant
     * @param {Object} data - { text, variant, isLoading }
     */
    container.setStatus = (data) => {
      if (!data || (!data.text && !data.icon)) {
        statusEl.innerHTML = '';
        statusEl.className = 'ds-form-field-status';
        statusEl.classList.remove('show');
        return;
      }

      statusEl.className = 'ds-form-field-status show';
      
      let html = '';
      if (data.icon) {
        const iconHtml = DesignSystem.getIcon(data.icon);
        html += `<span class="ds-form-field-status-icon">${iconHtml}</span>`;
      }
      if (data.text) {
        html += `<span class="ds-form-field-status-text">${data.text}</span>`;
      }
      
      statusEl.innerHTML = html;
      
      if (data.variant) {
        statusEl.classList.add(`ds-form-field-status--${data.variant}`);
      }
      
      if (data.isLoading) {
        statusEl.classList.add('is-loading');
      }
    };

    /**
     * Update the input variant (border/bg)
     * @param {string} newVariant - 'default', 'error', 'success', 'warning'
     */
    container.setVariant = (newVariant) => {
      // Clean old variants
      ['error', 'success', 'warning'].forEach(v => {
        wrapper.classList.remove(`ds-input--${v}`);
      });
      
      if (newVariant && newVariant !== 'default') {
        wrapper.classList.add(`ds-input--${newVariant}`);
      }
    };

    /**
     * Set loading state for the status indicator
     * @param {boolean} isLoading
     * @param {string} loadingText
     */
    container.setLoading = (isLoading, loadingText = 'Processing...') => {
      if (isLoading) {
        container.setStatus({ text: loadingText, variant: 'info', isLoading: true });
      } else {
        container.setStatus(null);
      }
    };

    // Proxy standard properties
    Object.defineProperty(container, 'value', {
      get: () => input.value,
      set: (v) => { input.value = v; },
      configurable: true
    });

    container.focus = () => input.focus();
    container.input = input;
    if (actionBtn) container.actionBtn = actionBtn;

    // Events
    if (onInput) input.addEventListener('input', (e) => onInput(e, input.value));
    if (onChange) input.addEventListener('change', (e) => onChange(e, input.value));

    // Initial status
    if (status) container.setStatus(status);

    return container;
  }

  return { create };
})();

window.InputComponent = InputComponent;
