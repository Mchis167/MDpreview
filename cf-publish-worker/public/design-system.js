/* global InputComponent, ContextMenuComponent, StatusBadge, ButtonComponent, ModalComponent, InlineMessageComponent, SegmentedControlComponent, SelectComponent */
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
   * Public API
   */
  return {
    createElement,
    createPopoverShield: (options) => {
      if (typeof ModalComponent !== 'undefined') {
        return ModalComponent.create(options);
      }
      return null;
    },

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

    /**
     * Create an anchored menu (dropdown style)
     * @param {HTMLElement} anchor - The element to attach to
     * @param {Array} items - Menu items
     * @param {Object} options - Additional options
     */
    createMenu: (anchor, items, options = {}) => {
      if (typeof ContextMenuComponent !== 'undefined') {
        const { onClose, ...rest } = options;

        // Auto-manage is-open state for combo buttons
        if (anchor && anchor.classList.contains('ds-combo-btn')) {
          anchor.classList.add('is-open');
        }

        const wrappedOnClose = () => {
          if (anchor && anchor.classList.contains('ds-combo-btn')) {
            anchor.classList.remove('is-open');
          }
          if (onClose) onClose();
        };

        return ContextMenuComponent.open({ 
          anchor, 
          items, 
          onClose: wrappedOnClose,
          ...rest 
        });
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
      if (typeof SelectComponent !== 'undefined') {
        return SelectComponent.create(options, currentVal, onChange);
      }
      return null;
    },

    createComboButton: (options = {}) => {
      if (typeof ButtonComponent !== 'undefined') {
        return ButtonComponent.createCombo(options);
      }
      return null;
    },

    createButton: (options = {}) => {
      if (typeof ButtonComponent !== 'undefined') {
        return ButtonComponent.create(options);
      }
      return null;
    },

    /**
     * Creates a standardized input element
     */
    /**
     * Creates a standardized input element using InputComponent
     */
    createInput: (options = {}) => {
      if (typeof InputComponent !== 'undefined') {
        return InputComponent.create(options);
      }
      
      // Fallback if InputComponent is not yet loaded (unlikely)
      const { type = 'text', placeholder = '', value = '', className = '' } = options;
      const input = createElement('input', [`ds-input`, className]);
      input.type = type;
      input.placeholder = placeholder;
      input.value = value;
      return input;
    },

    /**
     * Creates an input with an attached action button using InputComponent
     */
    createInputGroup: (options = {}) => {
      if (typeof InputComponent !== 'undefined') {
        const { inputOptions = {}, ...rest } = options;
        return InputComponent.create({ ...inputOptions, ...rest });
      }

      // Fallback
      const group = createElement('div', ['ds-input-group']);
      const input = createElement('input', 'ds-input');
      group.appendChild(input);
      return group;
    },

    /**
     * Creates an inline message (callout)
     */
    createInlineMessage: (options = {}) => {
      if (typeof InlineMessageComponent !== 'undefined') {
        return InlineMessageComponent.create(options);
      }
      return null;
    },

    /**
     * Creates a subtle status indicator (Dot + Label)
     */
    createStatusBadge: (options = {}) => {
      if (typeof StatusBadge !== 'undefined') {
        return StatusBadge.create(options);
      }
      return createElement('div', 'ds-status-badge-fallback', { text: options.text });
    },

    createSegmentedControl: (options = {}) => {
      if (typeof SegmentedControlComponent !== 'undefined') {
        return SegmentedControlComponent.create(options);
      }
      return null;
    },

    showConfirm: (options) => {
      if (typeof ModalComponent !== 'undefined') {
        return ModalComponent.confirm(options);
      }
    },

    showPrompt: (options) => {
      if (typeof ModalComponent !== 'undefined') {
        return ModalComponent.prompt(options);
      }
    },

    showCustomModal: (options) => {
      if (typeof ModalComponent !== 'undefined') {
        return ModalComponent.create(options);
      }
      return null;
    },

    initSmartTooltips: function () {
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
        }, 150); // Reduced delay to 150ms for snappier feel
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
