/* ══════════════════════════════════════════════════
   ShortcutsComponent.js — Keyboard Guide Organism
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class ShortcutsComponent {
  constructor() {
    this.isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform) || (navigator.userAgentData && navigator.userAgentData.platform === 'macOS');
  }

  /**
   * Main render function that returns the content element
   */
  render() {
    const container = DesignSystem.createElement('div', 'shortcuts-container');
    
    const sections = [
      {
        title: 'Navigation',
        items: [
          { label: 'Switch to Read mode', keys: ['1'] },
          { label: 'Switch to Edit mode', keys: ['2'] },
          { label: 'Switch to Comment mode', keys: ['3'] },
          { label: 'Switch to Collect mode', keys: ['4'] },
          { label: 'Toggle Sidebar', keys: ['Ctrl', 'B'] },
          { label: 'Focus Search', keys: ['Ctrl', 'F'] },
          { label: 'Scroll to Top', keys: ['Ctrl', '↑'] },
          { label: 'Scroll to Bottom', keys: ['Ctrl', '↓'] },
          { label: 'Toggle Fullscreen', keys: this.isMac ? ['Ctrl', 'Shift', 'F'] : ['F11'] }
        ]
      },
      {
        title: 'Editor',
        items: [
          { label: 'Save File', keys: ['Ctrl', 'S'] },
          { label: 'Undo', keys: ['Ctrl', 'Z'] },
          { label: 'Redo', keys: ['Ctrl', 'Y'] },
          { label: 'Markdown Helper', keys: ['Ctrl', 'H'] }
        ]
      },
      {
        title: 'Tab Management',
        items: [
          { label: 'Select All Tabs', keys: ['Ctrl', 'A'] },
          { label: 'Close All Tabs', keys: ['Ctrl', 'Shift', 'W'] },
          { label: 'Deselect Tabs', keys: ['Esc'] },
          { label: 'Range Selection', keys: ['Shift', 'Click'] },
          { label: 'Multi-selection', keys: ['Ctrl', 'Click'] }
        ]
      },
      {
        title: 'Sidebar & Workspace',
        items: [
          { label: 'New File', keys: ['Ctrl', 'N'] },
          { label: 'New Folder', keys: ['Ctrl', 'Shift', 'N'] },
          { label: 'Rename Selected', keys: ['Enter'] },
          { label: 'Duplicate File', keys: ['Ctrl', 'D'] },
          { label: 'Delete Selected', keys: this.isMac ? ['Ctrl', 'Backspace'] : ['Delete'] },
          { label: 'Hide / Unhide', keys: ['Ctrl', 'Shift', 'H'] },
          { label: 'Collapse All Folders', keys: ['Ctrl', '['] },
          { label: 'Collapse Other Folders', keys: ['Ctrl', 'Shift', '['] },
          { label: 'Toggle Sidebar', keys: ['Ctrl', 'B'] },
          { label: 'Focus Search', keys: ['Ctrl', 'F'] }
        ]
      },
      {
        title: 'General',
        items: [
          { label: 'Workspace Picker', keys: ['Ctrl', 'O'] },
          { label: 'Close Active Tab', keys: ['Ctrl', 'W'] },
          { label: 'Keyboard Shortcuts', keys: ['Ctrl', '/'] },
          { label: 'Open Settings', keys: ['Ctrl', ','] },
          { label: 'Close / Cancel', keys: ['Esc'] }
        ]
      }
    ];

    sections.forEach(sec => {
      const group = DesignSystem.createElement('div', 'ds-popover-group');
      const title = DesignSystem.createElement('div', 'ds-popover-group-title', { text: sec.title });
      const grid = DesignSystem.createElement('div', 'shortcuts-grid');

      sec.items.forEach(item => {
        const row = DesignSystem.createElement('div', 'shortcuts-item');
        const label = DesignSystem.createElement('span', 'shortcuts-label', { text: item.label });
        const keysContainer = DesignSystem.createElement('span', 'shortcuts-keys');

        item.keys.forEach(key => {
          let keyText = key;
          if (this.isMac && key === 'Ctrl') keyText = '⌘';
          if (this.isMac && key === 'Shift') keyText = '⇧';
          if (this.isMac && key === 'Option') keyText = '⌥';
          if (this.isMac && key === 'Backspace') keyText = '⌫';
          
          const kbd = DesignSystem.createElement('kbd', '', { text: keyText });
          keysContainer.appendChild(kbd);
        });

        row.appendChild(label);
        row.appendChild(keysContainer);
        grid.appendChild(row);
      });

      group.appendChild(title);
      group.appendChild(grid);
      container.appendChild(group);
    });

    return container;
  }

  /**
   * Static instance to track open popover
   */
  static activeInstance = null;

  /**
   * Toggle the Shortcuts UI (Singleton)
   */
  static toggle() {
    if (this.activeInstance) {
      this.activeInstance.close();
      // activeInstance is nullified via the onClose callback passed in open()
    } else {
      this.activeInstance = this.open();
    }
  }

  /**
   * Open the Shortcuts UI in a floating popover (No backdrop)
   * @param {Function} onClose - Optional callback when closed
   */
  static open(onClose = null) {
    const component = new ShortcutsComponent();
    const content = component.render();
    
    const popover = DesignSystem.createPopoverShield({
      title: 'Keyboard Shortcuts',
      content: content,
      width: '480px',
      hasBackdrop: false,
      alignment: 'bottom-left',
      className: 'shortcuts-dynamic-popover',
      onClose: () => {
        ShortcutsComponent.activeInstance = null;
        if (onClose) onClose();
      }
    });

    return popover;
  }
}

// Export for Design System
window.ShortcutsComponent = ShortcutsComponent;
