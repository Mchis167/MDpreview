/* global DesignSystem, MenuShield */
/* ══════════════════════════════════════════════════
   ContextMenuComponent.js — Atomic Design (Molecule)
   Dùng để render danh sách items cho MenuShield.
   ══════════════════════════════════════════════════ */

class ContextMenuComponent {
  /**
   * Static helper to open a context menu
   * @param {Object} options
   */
  static open(options) {
    const { event, items, onClose, className } = options;
    
    const component = new ContextMenuComponent(items);
    const content = component.render();

    return MenuShield.open({
      event,
      content,
      onClose,
      className: className || 'ds-context-menu-shield'
    });
  }

  constructor(items = []) {
    this.items = items;
  }

  /**
   * Render items container
   */
  render() {
    const container = DesignSystem.createElement('div', 'ds-context-menu-container');

    this.items.forEach(item => {
      if (item.divider) {
        container.appendChild(DesignSystem.createElement('div', 'ctx-divider'));
        return;
      }

      const itemEl = DesignSystem.createElement('div', 'ctx-item');
      if (item.danger) itemEl.classList.add('danger');
      if (item.active) itemEl.classList.add('active');
      if (item.disabled) itemEl.classList.add('disabled');
      if (item.className) itemEl.classList.add(item.className);

      // Icon
      const iconWrap = DesignSystem.createElement('div', 'ctx-icon');
      iconWrap.innerHTML = DesignSystem.getIcon(item.icon);
      itemEl.appendChild(iconWrap);

      // Label
      itemEl.appendChild(DesignSystem.createElement('span', 'ctx-label', { text: item.label }));

      // Shortcut
      if (item.shortcut) {
        const shortcutWrap = DesignSystem.createElement('span', 'ctx-shortcut');
        const specialKeys = ['Enter', 'Tab', 'Space', 'Shift', 'Alt', 'Ctrl', 'Cmd', 'Delete', 'Backspace'];
        const keys = specialKeys.includes(item.shortcut) ? [item.shortcut] : item.shortcut.split('');
        
        keys.forEach(key => {
          shortcutWrap.appendChild(DesignSystem.createElement('kbd', '', { text: key }));
        });
        itemEl.appendChild(shortcutWrap);
      }

      // Click Event
      itemEl.onclick = (e) => {
        e.stopPropagation();
        if (item.disabled) return;
        
        MenuShield.close();
        if (item.onClick) item.onClick(e);
      };

      container.appendChild(itemEl);
    });

    return container;
  }
}

// Export for window
window.ContextMenuComponent = ContextMenuComponent;
