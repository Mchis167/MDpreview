/**
 * BaseFormModal Component (Organism)
 * Purpose: Standard template for all form modals (Workspace, API Config, etc.)
 * Dependencies: DesignSystem
 */
const BaseFormModal = (() => {
  'use strict';

  /**
   * Creates the form container with standard layout
   */
  function create(options = {}) {
    const {
      iconHtml = '',
      title = '',
      subtitle = '',
      bodyContent = null,
      actions = [] // Array of buttons
    } = options;

    const container = DesignSystem.createElement('div', 'ds-form-modal');

    // 1. Header Group
    const header = DesignSystem.createElement('div', 'ds-form-header');
    if (iconHtml) {
      const iconWrapper = DesignSystem.createElement('div', 'ds-form-icon-wrapper', {
        html: iconHtml
      });
      header.appendChild(iconWrapper);
    }
    if (title) {
      header.appendChild(DesignSystem.createElement('h3', 'ds-form-title', { text: title }));
    }
    if (subtitle) {
      header.appendChild(DesignSystem.createElement('p', 'ds-form-subtitle', { text: subtitle }));
    }
    container.appendChild(header);

    // Divider Top
    container.appendChild(DesignSystem.createElement('div', 'ds-form-divider'));

    // 2. Body Group
    const body = DesignSystem.createElement('div', 'ds-form-body');
    const fieldsContainer = DesignSystem.createElement('div', 'ds-form-fields');
    if (bodyContent instanceof HTMLElement) {
      fieldsContainer.appendChild(bodyContent);
    } else if (typeof bodyContent === 'string') {
      fieldsContainer.innerHTML = bodyContent;
    }
    body.appendChild(fieldsContainer);
    container.appendChild(body);

    // Divider Bottom
    container.appendChild(DesignSystem.createElement('div', 'ds-form-divider'));

    // 3. Footer Group (Actions)
    if (actions && actions.length > 0) {
      const footer = DesignSystem.createElement('div', 'ds-form-footer');
      const actionsContainer = DesignSystem.createElement('div', 'ds-form-actions');
      actions.forEach(btn => {
        if (btn instanceof HTMLElement) {
          actionsContainer.appendChild(btn);
        }
      });
      footer.appendChild(actionsContainer);
      container.appendChild(footer);
    }

    return container;
  }

  /**
   * Static helper to open the modal
   */
  function open(options = {}) {
    const { width = '480px', ...formOptions } = options;
    const content = create(formOptions);

    const popover = DesignSystem.createPopoverShield({
      content: content,
      width: width,
      showHeader: false,
      className: 'ds-base-form-popover'
    });

    return popover;
  }

  return {
    create,
    open
  };
})();

// Explicit export
window.BaseFormModal = BaseFormModal;
