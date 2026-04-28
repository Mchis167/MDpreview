/* ============================================================
   design-system.js — Core Design System Module
   ============================================================ */

const DesignSystem = (() => {
  const ICONS = {};

  /**
   * Private: Helper to create a DOM element
   */
  function createElement(tag, className, attributes = {}) {
    const el = document.createElement(tag);
    if (className) {
      if (Array.isArray(className)) {
        const validClasses = className
          .flatMap(c => (typeof c === 'string' ? c.trim().split(/\s+/) : [c]))
          .filter(c => c && typeof c === 'string' && c.trim() !== '');
        if (validClasses.length > 0) el.classList.add(...validClasses);
      } else if (typeof className === 'string' && className.trim() !== '') {
        const tokens = className.trim().split(/\s+/);
        el.classList.add(...tokens);
      }
    }
    if (attributes) {
      Object.keys(attributes).forEach(key => {
        if (key === 'text') {
          el.textContent = attributes[key];
        } else if (key === 'html') {
          el.innerHTML = attributes[key];
        } else {
          el.setAttribute(key, attributes[key]);
        }
      });
    }
    return el;
  }

  /**
   * Private: Create a Popover Shield
   */
  function createPopoverShield(options = {}) {
    const {
      title = 'Modal',
      content = '',
      footer = null,
      className = '',
      width = null,
      hasBackdrop = true,
      showHeader = true,
      position = null,
      alignment = 'center', // 'center', 'bottom-left', or 'custom'
      container = document.body,
      onClose = null
    } = options;

    const shieldClass = hasBackdrop ? 'ds-popover-shield' : 'ds-popover-floating';
    const shield = createElement('div', [shieldClass, `ds-popover-${alignment}`]);
    const isBody = container === document.body;
    shield.style.position = isBody ? 'fixed' : 'absolute';

    const card = createElement('div', ['ds-popover-card', className]);
    if (width) card.style.width = width;
    if (position) {
      if (position.top) card.style.top = position.top;
      if (position.right) card.style.right = position.right;
      if (position.bottom) card.style.bottom = position.bottom;
      if (position.left) card.style.left = position.left;
      card.style.position = 'fixed';
      card.style.margin = '0';
    }

    const header = createElement('div', 'ds-popover-header');
    const titleEl = createElement('h2', 'ds-popover-title', { text: title });
    const closeBtn = createElement('button', 'ds-popover-close', { html: ICONS['x'] || '✕' });

    const body = createElement('div', 'ds-popover-body');
    if (content instanceof HTMLElement) {
      body.appendChild(content);
    } else if (typeof content === 'string') {
      body.innerHTML = content;
    }

    if (showHeader) {
      header.appendChild(titleEl);
      header.appendChild(closeBtn);
      card.appendChild(header);
    }
    card.appendChild(body);

    if (footer) {
      const footerEl = createElement('div', 'ds-popover-footer');
      if (footer instanceof HTMLElement) {
        footerEl.appendChild(footer);
      } else {
        footerEl.innerHTML = footer;
      }
      card.appendChild(footerEl);
    }

    shield.appendChild(card);

    const closeAction = () => {
      shield.classList.remove('show');
      setTimeout(() => {
        shield.remove();
        if (onClose) onClose();
      }, 250);
    };

    closeBtn.onclick = closeAction;
    shield.onclick = (e) => {
      if (hasBackdrop && e.target === shield) closeAction();
    };

    container.appendChild(shield);
    setTimeout(() => shield.classList.add('show'), 10);

    if (!hasBackdrop) {
      const clickAway = (e) => {
        if (!card.contains(e.target)) {
          closeAction();
          document.removeEventListener('click', clickAway, true);
        }
      };
      setTimeout(() => document.addEventListener('click', clickAway, true), 100);
    }

    const popoverInstance = { shield, card, body, close: closeAction };
    shield.__popover = popoverInstance;
    return popoverInstance;
  }

  /**
   * Public API
   */
  return {
    createElement,
    createPopoverShield,

    /**
     * Registers a set of icons into the DesignSystem registry
     * @param {Object} icons - Dictionary of icon names and SVG strings
     */
    registerIcons: (icons) => {
      Object.assign(ICONS, icons);
    },

    createContextMenu: (e, items) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (typeof ContextMenuComponent !== 'undefined') {
        return ContextMenuComponent.open({ event: e, items });
      }
      return null;
    },

    getIcon: (name) => ICONS[name] || '',

    createHeaderAction: (iconName, title, onClick, id, tooltipPos = 'bottom') => {
      const iconHtml = ICONS[iconName] || iconName;
      const btn = createElement('button', 'ds-header-action', { 'html': iconHtml, 'id': id });
      if (id) btn.dataset.actionId = id;
      if (title) DesignSystem.applyTooltip(btn, title, tooltipPos);
      if (onClick) {
        btn.addEventListener('click', (e) => {
          onClick(e);
        });
      }
      return btn;
    },

    applyTooltip: (element, text, position = 'bottom') => {
      if (!element || !text) return;
      element.setAttribute('data-ds-tooltip', text);
      element.setAttribute('data-ds-tooltip-pos', position);
      element.removeAttribute('title');
    },

    createTooltip: (text, position = 'bottom') => {
      return createElement('div', ['ds-tooltip', `ds-tooltip-${position}`], { text });
    },

    createSelect: (options = [], currentVal, onChange) => {
      const select = createElement('select', 'ds-select');
      options.forEach(opt => {
        const value = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const el = createElement('option', '', { value, text: label });
        if (value === currentVal) el.selected = true;
        select.appendChild(el);
      });
      if (onChange) select.onchange = (e) => onChange(e.target.value);
      return select;
    },

    createButton: (options = {}) => {
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
        radius = 'var(--ds-radius-widget)' // Initial value
      } = options;

      // Enforce single icon for off-label buttons
      let activeLeadingIcon = leadingIcon;
      let activeTrailingIcon = trailingIcon;
      if (offLabel && activeLeadingIcon && activeTrailingIcon) {
        activeTrailingIcon = null;
      }

      const btn = createElement('button', [
        `ds-btn`,
        `ds-btn-${variant}`,
        offLabel ? 'ds-btn-off-label' : '',
        className
      ]);

      btn.style.setProperty('--_radius', radius);

      if (activeLeadingIcon) {
        const iconHtml = ICONS[activeLeadingIcon] || activeLeadingIcon;
        const span = createElement('span', 'ds-btn-icon-leading', { html: iconHtml });
        btn.appendChild(span);
      }

      if (label && !offLabel) {
        const textSpan = createElement('span', 'ds-btn-text', { text: label });
        btn.appendChild(textSpan);
      }

      if (activeTrailingIcon) {
        const iconHtml = ICONS[activeTrailingIcon] || activeTrailingIcon;
        const span = createElement('span', 'ds-btn-icon-trailing', { html: iconHtml });
        btn.appendChild(span);
      }

      if (disabled) btn.disabled = true;
      if (onClick) btn.onclick = onClick;

      if (title || (offLabel && label)) {
        DesignSystem.applyTooltip(btn, title || label, options.tooltipPos || 'bottom');
      }

      return btn;
    },

    createSegmentedControl: (options = {}) => {
      const {
        items = [],
        activeId = null,
        onChange = null,
        radius = 'var(--ds-radius-panel)', // Initial value
        className = ''
      } = options;

      const control = createElement('div', ['ds-segmented-control', className]);
      control.style.setProperty('--_radius', radius);

      const indicator = createElement('div', 'ds-segment-indicator');
      control.appendChild(indicator);

      items.forEach(itemData => {
        const item = createElement('div', 'ds-segment-item', {
          'data-id': itemData.id,
          'html': DesignSystem.getIcon(itemData.icon)
        });

        if (itemData.title) {
          DesignSystem.applyTooltip(item, itemData.title, options.tooltipPos || 'bottom');
        }

        if (itemData.id === activeId) item.classList.add('active');

        item.addEventListener('mousedown', (e) => e.preventDefault());
        item.addEventListener('click', () => {
          if (onChange) onChange(itemData.id);
        });

        control.appendChild(item);
      });

      const instance = {
        el: control,
        indicator,
        updateActive: (id) => {
          const allItems = control.querySelectorAll('.ds-segment-item');
          let activeItem = null;
          allItems.forEach(item => {
            const isActive = item.getAttribute('data-id') === id;
            item.classList.toggle('active', isActive);
            if (isActive) activeItem = item;
          });

          if (indicator && activeItem) {
            requestAnimationFrame(() => {
              indicator.style.width = `${activeItem.offsetWidth}px`;
              indicator.style.height = `${activeItem.offsetHeight}px`;
              indicator.style.left = `${activeItem.offsetLeft}px`;
              indicator.style.top = `${activeItem.offsetTop}px`;
            });
          }
        }
      };

      if (activeId) {
        setTimeout(() => instance.updateActive(activeId), 0);
      }

      return instance;
    },

    showConfirm: ({ title, message, onConfirm, onCancel }) => {
      const content = createElement('div', 'ds-confirm-content');
      content.innerHTML = `<p class="ds-confirm-message">${message}</p>`;

      const footer = createElement('div', 'ds-confirm-footer');
      const cancelBtn = createElement('button', 'ds-btn ds-btn-ghost', { text: 'Cancel' });
      const confirmBtn = createElement('button', 'ds-btn ds-btn-primary', { text: 'Confirm' });

      footer.appendChild(cancelBtn);
      footer.appendChild(confirmBtn);

      const popover = createPopoverShield({
        title,
        content,
        footer,
        width: '400px',
        className: 'ds-modal-confirm'
      });

      confirmBtn.onclick = async () => {
        try {
          if (onConfirm) await onConfirm();
        } finally {
          popover.close();
        }
      };
      cancelBtn.onclick = () => {
        if (onCancel) onCancel();
        popover.close();
      };
    },

    showPrompt: (options) => {
      const { title, message, placeholder, defaultValue = '', onConfirm, onCancel } = options;
      const content = createElement('div', 'ds-prompt-content');
      const label = createElement('label', 'ds-field-label', { text: message });
      const input = createElement('input', 'ds-input', { type: 'text', placeholder: placeholder, value: defaultValue });

      content.appendChild(label);
      content.appendChild(input);

      const footer = createElement('div', 'ds-confirm-footer');
      const cancelBtn = createElement('button', 'ds-btn ds-btn-ghost', { text: 'Cancel' });
      const confirmBtn = createElement('button', 'ds-btn ds-btn-primary', { text: 'Continue' });

      footer.appendChild(cancelBtn);
      footer.appendChild(confirmBtn);

      const popover = createPopoverShield({
        title,
        content,
        footer,
        width: '440px',
        className: 'ds-modal-prompt'
      });

      setTimeout(() => input.focus(), 150);

      confirmBtn.onclick = async () => {
        const val = input.value.trim();
        if (!val) {
          input.classList.add('ds-input-error');
          input.focus();
          return;
        }
        if (onConfirm) await onConfirm(val);
        popover.close();
      };

      input.oninput = () => input.classList.remove('ds-input-error');
      input.onkeydown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); confirmBtn.click(); }
        if (e.key === 'Escape') { e.preventDefault(); cancelBtn.click(); }
      };

      cancelBtn.onclick = () => {
        if (onCancel) onCancel();
        popover.close();
      };
    },

    initSmartTooltips: function() {
      let tooltipEl = document.getElementById('ds-global-tooltip');
      if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'ds-global-tooltip';
        tooltipEl.className = 'ds-tooltip';
        document.body.appendChild(tooltipEl);
      }

      let currentTarget = null;
      let hideTimer = null;
      let showTimer = null;

      document.addEventListener('mouseover', (e) => {
        const target = e.target.closest && e.target.closest('[data-ds-tooltip]');
        if (!target) return;
        
        // If we are already showing tooltip for this target, don't re-trigger
        if (target === currentTarget) {
          if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
          }
          return;
        }

        if (hideTimer) clearTimeout(hideTimer);
        if (showTimer) clearTimeout(showTimer);

        showTimer = setTimeout(() => {
          currentTarget = target;
          const text = target.getAttribute('data-ds-tooltip');
          const preferredPos = target.getAttribute('data-ds-tooltip-pos') || 'bottom';
          
          tooltipEl.textContent = text;
          
          // Measure tooltip
          tooltipEl.style.opacity = '0';
          tooltipEl.style.display = 'block';
          tooltipEl.classList.add('is-visible');
          const tw = tooltipEl.offsetWidth;
          const th = tooltipEl.offsetHeight;
          tooltipEl.classList.remove('is-visible');
          tooltipEl.style.opacity = '';

          const rect = target.getBoundingClientRect();
          let top, left, finalPos = preferredPos;

          if (preferredPos === 'bottom') {
            top = rect.bottom + 8;
            if (top + th > window.innerHeight) {
              top = rect.top - th - 8;
              finalPos = 'top';
            }
          } else {
            top = rect.top - th - 8;
            if (top < 0) {
              top = rect.bottom + 8;
              finalPos = 'bottom';
            }
          }

          left = rect.left + (rect.width / 2) - (tw / 2);
          
          // horizontal bounds
          if (left < 8) left = 8;
          if (left + tw > window.innerWidth - 8) left = window.innerWidth - tw - 8;

          tooltipEl.style.left = `${left}px`;
          tooltipEl.style.top = `${top}px`;
          tooltipEl.className = `ds-tooltip pos-${finalPos} is-visible`;
          showTimer = null;
        }, 500); // 500ms delay
      }, true);

      document.addEventListener('mouseout', (e) => {
        const target = e.target.closest && e.target.closest('[data-ds-tooltip]');
        if (!target) return;

        // If we are moving to a child of the same target, don't hide
        const related = e.relatedTarget;
        if (related && target.contains(related)) return;

        if (showTimer) {
          clearTimeout(showTimer);
          showTimer = null;
        }

        hideTimer = setTimeout(() => {
          tooltipEl.classList.remove('is-visible');
          currentTarget = null;
        }, 100);
      }, true);

      // Hide tooltip on click/tap to avoid overlapping during interactions
      document.addEventListener('click', () => {
        if (showTimer) {
          clearTimeout(showTimer);
          showTimer = null;
        }
        tooltipEl.classList.remove('is-visible');
        currentTarget = null;
      }, true);
    }
  };
})();

// Auto-initialize tooltips
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DesignSystem.initSmartTooltips());
  } else {
    DesignSystem.initSmartTooltips();
  }
}

window.DesignSystem = DesignSystem;
