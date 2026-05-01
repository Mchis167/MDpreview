/* global DesignSystem */
/**
 * InlineMessageComponent (Atom)
 * Purpose: Provides standardized inline callouts/messages.
 */
const InlineMessageComponent = (() => {
  'use strict';

  /**
   * Create an inline message (callout)
   */
  function create(options = {}) {
    const {
      text = '',
      variant = 'info', // 'info', 'success', 'warning', 'error'
      icon = 'info',
      className = ''
    } = options;

    const container = DesignSystem.createElement('div', [
      `ds-inline-message`, 
      `ds-inline-message--${variant}`, 
      className
    ]);
    
    const iconHtml = DesignSystem.getIcon(icon) || DesignSystem.getIcon('info') || '';
    if (iconHtml) {
      const iconWrapper = DesignSystem.createElement('div', 'ds-inline-message-icon', { html: iconHtml });
      container.appendChild(iconWrapper);
    }

    const textEl = DesignSystem.createElement('div', 'ds-inline-message-text', { text });
    container.appendChild(textEl);

    return container;
  }

  return { create };
})();

window.InlineMessageComponent = InlineMessageComponent;
