/* global DesignSystem, AppState, TreeModule, SettingToggleItem, MenuShield */
/* ══════════════════════════════════════════════════
   ExplorerSettingsComponent.js — Explorer Preferences
   Sử dụng MenuShield để đồng nhất giao diện menu nổi.
   ════════════════════════════════════════════════════ */

class ExplorerSettingsComponent {
  /**
   * Main render function that returns the content element
   */
  render() {
    const container = DesignSystem.createElement('div', 'ds-settings-menu-panel');
    const settings = AppState.settings;

    const items = [
      { 
        label: 'Show Hidden Files', 
        isOn: settings.showHidden,
        onChange: (val) => this._updateSetting('showHidden', 'md-show-hidden', val)
      },
      { 
        label: 'Hide Empty Folders', 
        isOn: settings.hideEmptyFolders,
        onChange: (val) => this._updateSetting('hideEmptyFolders', 'md-hide-empty', val)
      },
      { 
        label: 'Flat View', 
        isOn: settings.flatView,
        onChange: (val) => this._updateSetting('flatView', 'md-flat-view', val)
      }
    ];

    items.forEach(item => {
      const row = SettingToggleItem.create({
        label: item.label,
        isOn: item.isOn,
        onChange: item.onChange,
        variant: 'menu'
      });
      container.appendChild(row);
    });

    return container;
  }

  /**
   * Toggle the Explorer Settings UI
   * @param {Object} options
   * @param {MouseEvent} options.event - (Optional)
   * @param {HTMLElement} options.anchor - (Optional) Trigger element
   */
  static toggle(options = {}) {
    const { event, anchor } = options;
    
    if (MenuShield.active && MenuShield.active.element.classList.contains('ds-explorer-settings-shield')) {
      MenuShield.close();
      return;
    }

    const component = new ExplorerSettingsComponent();
    const content = component.render();

    MenuShield.open({
      event: event,
      anchor: anchor,
      title: 'Explorer Preferences',
      content: content,
      className: 'ds-explorer-settings-shield'
    });
  }

  /**
   * Private: Update setting and refresh tree
   */
  _updateSetting(key, storageKey, newVal) {
    AppState.settings[key] = newVal;
    localStorage.setItem(storageKey, newVal);
    
    if (typeof TreeModule !== 'undefined') {
      TreeModule.load();
    }

    if (typeof AppState !== 'undefined' && AppState.savePersistentState) {
      AppState.savePersistentState();
    }
  }
}

// Export for Design System
window.ExplorerSettingsComponent = ExplorerSettingsComponent;
