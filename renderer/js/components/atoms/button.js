/* global DesignSystem */
/**
 * ButtonComponent (Atom)
 * Purpose: Provides standardized button and combo-button elements.
 */
const ButtonComponent = (() => {
  'use strict';

  /**
   * Create a standardized button
   */
  function create(options = {}) {
    const {
      label,
      variant = 'primary',
      onClick,
      disabled = false,
      className = '',
      leadingIcon = null,
      trailingIcon = null,
      offLabel = false,
      title = null,
      radius = 'var(--ds-radius-widget)'
    } = options;

    // Enforce single icon for off-label buttons
    let activeLeadingIcon = leadingIcon;
    let activeTrailingIcon = trailingIcon;
    if (offLabel && activeLeadingIcon && activeTrailingIcon) {
      activeTrailingIcon = null;
    }

    const btn = DesignSystem.createElement('button', [
      `ds-btn`,
      `ds-btn-${variant}`,
      offLabel ? 'ds-btn-off-label' : '',
      className
    ]);

    if (options.id) btn.id = options.id;

    btn.style.setProperty('--_radius', radius);

    if (activeLeadingIcon) {
      const iconHtml = DesignSystem.getIcon(activeLeadingIcon) || activeLeadingIcon;
      const span = DesignSystem.createElement('span', 'ds-btn-icon-leading', { html: iconHtml });
      btn.appendChild(span);
    }

    if (label && !offLabel) {
      const textSpan = DesignSystem.createElement('span', 'ds-btn-text', { text: label });
      btn.appendChild(textSpan);
    }

    if (activeTrailingIcon) {
      const iconHtml = DesignSystem.getIcon(activeTrailingIcon) || activeTrailingIcon;
      const span = DesignSystem.createElement('span', 'ds-btn-icon-trailing', { html: iconHtml });
      btn.appendChild(span);
    }

    if (disabled) btn.disabled = true;
    if (onClick) btn.onclick = onClick;

    if (title || (offLabel && label)) {
      DesignSystem.applyTooltip(btn, title || label, options.tooltipPos || 'bottom');
    }

    // Add loading state helper
    btn.setLoading = (isLoading) => {
      if (isLoading) {
        btn.classList.add('is-loading');
        btn.disabled = true;

        // Handle icon swapping/appending
        const iconLeading = btn.querySelector('.ds-btn-icon-leading');
        if (iconLeading) {
          // Save original icon HTML to restore later
          iconLeading.dataset.originalIcon = iconLeading.innerHTML;
          iconLeading.innerHTML = DesignSystem.getIcon('loader') || '';
        } else {
          // Create a temporary leading icon for the loader
          const loaderSpan = DesignSystem.createElement('span', ['ds-btn-icon-leading', 'ds-btn-loader-temp'], {
            html: DesignSystem.getIcon('loader') || ''
          });
          btn.prepend(loaderSpan);
        }
      } else {
        btn.classList.remove('is-loading');
        btn.disabled = disabled;

        // Restore original state
        const loaderTemp = btn.querySelector('.ds-btn-loader-temp');
        if (loaderTemp) {
          loaderTemp.remove();
        } else {
          const iconLeading = btn.querySelector('.ds-btn-icon-leading');
          if (iconLeading && iconLeading.dataset.originalIcon) {
            iconLeading.innerHTML = iconLeading.dataset.originalIcon;
            delete iconLeading.dataset.originalIcon;
          }
        }
      }
    };

    // Add icon update helper
    btn.setIcon = (iconName) => {
      const span = btn.querySelector('.ds-btn-icon-leading');
      if (span) {
        span.innerHTML = DesignSystem.getIcon(iconName) || '';
      }
    };

    // Add label update helper
    btn.setLabel = (newLabel) => {
      const span = btn.querySelector('.ds-btn-text');
      if (span) {
        span.textContent = newLabel;
      }
    };

    return btn;
  }

  /**
   * Create a combo button (Main + Toggle)
   */
  function createCombo(options = {}) {
    const {
      label,
      variant = 'subtitle',
      leadingIcon = null,
      mainAction,
      toggleAction,
      disabled = false,
      className = '',
      tooltip = null,
      radius = 'var(--ds-radius-widget)'
    } = options;

    const container = DesignSystem.createElement('div', [
      'ds-combo-btn',
      `ds-combo-btn-${variant}`,
      className
    ]);

    if (options.id) container.id = options.id;

    container.style.setProperty('--_radius', radius);
    if (disabled) {
      container.classList.add('is-disabled');
      container.setAttribute('disabled', 'true'); 
    }

    // Main Part
    const main = DesignSystem.createElement('div', 'ds-combo-btn-main');
    if (leadingIcon) {
      const iconHtml = DesignSystem.getIcon(leadingIcon) || leadingIcon;
      main.appendChild(DesignSystem.createElement('span', 'ds-btn-icon-leading', { html: iconHtml }));
    }
    if (label) {
      main.appendChild(DesignSystem.createElement('span', 'ds-btn-text', { text: label }));
    }
    
    if (!disabled && mainAction) {
      main.onclick = (e) => {
        e.stopPropagation();
        mainAction(e);
      };
    }

    // Toggle Part
    const toggle = DesignSystem.createElement('div', 'ds-combo-btn-toggle', {
      html: DesignSystem.getIcon('chevron-down') || '▼'
    });
    
    if (options.toggleTooltip) {
      DesignSystem.applyTooltip(toggle, options.toggleTooltip, 'bottom');
    }
    
    if (!disabled && toggleAction) {
      toggle.onclick = (e) => {
        e.stopPropagation();
        if (container.classList.contains('is-open')) {
          if (typeof window.MenuShield !== 'undefined') window.MenuShield.close();
          return;
        }
        toggleAction(e);
      };
    }

    container.appendChild(main);
    container.appendChild(toggle);

    if (tooltip) {
      DesignSystem.applyTooltip(container, tooltip, 'bottom');
    }

    return container;
  }

  return { create, createCombo };
})();

window.ButtonComponent = ButtonComponent;
