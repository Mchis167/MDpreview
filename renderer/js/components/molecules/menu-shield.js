/* global DesignSystem */
/**
 * MenuShield Molecule
 * Purpose: A generic glass shell for menus, popovers, and context menus.
 * Handles: Positioning, Blur effect, Close on click-outside/Escape.
 */
const MenuShield = (() => {
  'use strict';

  let _activeInstance = null;

  /**
   * Open a new menu shield
   * @param {Object} options 
   * @param {HTMLElement} options.content - The DOM element to put inside
   * @param {string} options.title - Optional header title
   * @param {MouseEvent} options.event - Event for cursor positioning
   * @param {HTMLElement} options.anchor - Element for anchor positioning
   * @param {string} options.className - Extra class
   * @param {Function} options.onClose - Callback when closed
   */
  function open(options) {
    // 1. Close existing
    close();

    // 2. Create Shield
    const shield = DesignSystem.createElement('div', ['ds-menu-shield', options.className]);

    // 3. Add Header if title exists
    if (options.title) {
      const header = DesignSystem.createElement('div', 'ds-menu-shield-header');
      header.appendChild(DesignSystem.createElement('div', 'ds-menu-shield-title', { text: options.title }));
      shield.appendChild(header);
    }

    // 4. Add Content
    const contentWrapper = DesignSystem.createElement('div', 'ds-menu-shield-content');
    contentWrapper.appendChild(options.content);
    shield.appendChild(contentWrapper);

    document.body.appendChild(shield);

    // 5. Positioning
    requestAnimationFrame(() => {
      _calculatePosition(shield, options);
    });

    // 6. Event Listeners
    const _handleOutsideClick = (e) => {
      // Don't close if clicking inside the shield
      if (shield.contains(e.target)) return;

      // Don't close if clicking on another active modal shield (e.g. Confirm Modal)
      if (e.target.closest('.ds-popover-shield')) return;

      // Don't close if clicking inside the anchor (let the toggle logic handle it)
      if (options.anchor && (options.anchor === e.target || options.anchor.contains(e.target))) {
        return;
      }

      close();
    };

    const _handleEscape = (e) => {
      if (e.key === 'Escape') close();
    };

    // Use a small timeout to avoid immediate closure from the trigger click
    setTimeout(() => {
      window.addEventListener('mousedown', _handleOutsideClick);
      window.addEventListener('keydown', _handleEscape);
    }, 10);

    // 7. Track Instance
    _activeInstance = {
      element: shield,
      close: () => {
        window.removeEventListener('mousedown', _handleOutsideClick);
        window.removeEventListener('keydown', _handleEscape);
        if (shield.parentNode) shield.parentNode.removeChild(shield);
        if (options.onClose) options.onClose();
        _activeInstance = null;
      }
    };

    return _activeInstance;
  }

  function close() {
    if (_activeInstance) {
      _activeInstance.close();
    }
  }

  /**
   * Private: Position calculation logic
   */
  function _calculatePosition(el, options) {
    const { event, anchor, position } = options;
    const rect = el.getBoundingClientRect();

    const style = getComputedStyle(document.documentElement);
    const margin = parseInt(style.getPropertyValue('--ds-space-xs')) || 4;
    const safePadding = parseInt(style.getPropertyValue('--ds-space-md')) || 12;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let x = 0, y = 0;
    let useRight = false;
    let useBottom = false;
    const align = options.align || 'auto';

    if (position) {
      x = position.x;
      y = position.y;
    } else if (anchor) {
      const anchorRect = anchor.getBoundingClientRect();

      // Horizontal Alignment
      if (align === 'right') {
        useRight = true;
        x = screenWidth - anchorRect.right;
      } else if (align === 'left') {
        x = anchorRect.left;
      } else {
        if (anchorRect.left + rect.width > screenWidth - margin) {
          useRight = true;
          x = screenWidth - anchorRect.right;
        } else {
          x = anchorRect.left;
        }
      }

      // Vertical Alignment
      const spaceBelow = screenHeight - anchorRect.bottom;
      if (spaceBelow < rect.height + margin && anchorRect.top > rect.height + margin) {
        useBottom = true;
        y = screenHeight - anchorRect.top + margin;
      } else {
        y = anchorRect.bottom + margin;
      }
    } else if (event) {
      x = event.clientX;
      y = event.clientY;
    }

    // Safety bounds for X
    if (useRight) {
      if (x < safePadding) x = safePadding;
      el.style.right = `${x}px`;
      el.style.left = 'auto';
    } else {
      if (x < safePadding) x = safePadding;
      if (x + rect.width > screenWidth - safePadding) x = screenWidth - rect.width - safePadding;
      el.style.left = `${x}px`;
      el.style.right = 'auto';
    }

    // Safety bounds for Y
    if (useBottom) {
      if (y < safePadding) y = safePadding;
      el.style.bottom = `${y}px`;
      el.style.top = 'auto';
    } else {
      if (y < safePadding) y = safePadding;
      if (y + rect.height > screenHeight - safePadding) y = screenHeight - rect.height - safePadding;
      el.style.top = `${y}px`;
      el.style.bottom = 'auto';
    }
  }

  return {
    open,
    close,
    get active() { return _activeInstance; }
  };
})();

// Export
window.MenuShield = MenuShield;
