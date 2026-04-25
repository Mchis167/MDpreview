/* ══════════════════════════════════════════════════
   SettingsComponent.js — Settings View Organism
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class SettingsComponent {
  constructor(options = {}) {
    this.options = {
      onClose: options.onClose || (() => {})
    };
    this.mount = null;
    this.popover = null;
  }

  /**
   * Main render function that returns the content element
   */
  render() {
    const container = DesignSystem.createElement('div', ['settings-container', 'settings-organism']);

    // 1. Appearance Group
    container.appendChild(this._createGroup('Appearance', [
      this._createSettingRow('Accent Color', this._createColorSelector())
    ]));

    // 2. Typography & Zoom Group
    container.appendChild(this._createGroup('Typography & Zoom', [
      this._createSettingRow('Interface Font', this._createFontSelect('text')),
      this._createSettingRow('Editor Font', this._createFontSelect('code')),
      this._createSettingRow('Text Zoom', this._createZoomControl('text')),
      this._createSettingRow('Code Zoom', this._createZoomControl('code'))
    ]));

    // 3. Background Group
    container.appendChild(this._createGroup('Background', [
      this._createSettingRow('Custom Background', this._createToggle('bg-toggle-mount')),
      this._createBackgroundGridWrapper()
    ]));

    return container;
  }

  // ── Helper Methods ──────────────────────────────────────

  _createGroup(title, children) {
    const group = DesignSystem.createElement('div', 'ds-popover-group');
    if (title) {
      group.appendChild(this._createSectionTitle(title));
    }
    
    children.forEach((child, index) => {
      group.appendChild(child);
      // Auto-insert divider between items, but not after the last item
      if (index < children.length - 1) {
        group.appendChild(this._createDivider());
      }
    });
    
    return group;
  }

  _createSectionTitle(text) {
    return DesignSystem.createElement('div', 'ds-popover-group-title', { text });
  }

  _createSettingRow(label, control) {
    const row = DesignSystem.createElement('div', 'setting-item-row');
    const labelCol = DesignSystem.createElement('div', 'setting-label-col');
    labelCol.appendChild(DesignSystem.createElement('span', 'setting-label', { text: label }));
    
    row.appendChild(labelCol);
    if (control) row.appendChild(control);
    return row;
  }

  _createDivider() {
    return DesignSystem.createElement('div', 'setting-divider');
  }

  _createColorSelector() {
    return DesignSystem.createElement('div', 'color-selector');
  }

  _createFontSelect(type) {
    const fonts = type === 'text' ? [
      'System Default', 'Inter', 'Be Vietnam Pro', 'Roboto', 'Open Sans', 'Montserrat', 'Lato', 
      'Source Sans 3', 'Noto Sans', 'Nunito', 'Raleway', 'Work Sans', 
      'Quicksand', 'Barlow', 'Jost', 'Public Sans', 'Rubik', 'Kanit', 
      'Outfit', 'Urbanist', 'Plus Jakarta Sans', 'Lexend', 'Syne',
      'Figtree', 'Manrope', 'DM Sans', 'Sora', 'Space Grotesk', 'Mulish', 
      'Cabin', 'Titillium Web', 'Heebo', 'Karla', 'Libre Franklin', 'Arimo', 
      'Varela Round', 'Commissioner', 'Epilogue', 'Archivo', 'Chivo', 'Bricolage Grotesk'
    ] : [
      'System Mono', 'Roboto Mono', 'Fira Code', 'JetBrains Mono', 'Source Code Pro', 
      'Inconsolata', 'IBM Plex Mono', 'Ubuntu Mono', 'Space Mono', 
      'Share Tech Mono', 'Victor Mono', 'Anonymous Pro', 'DM Mono', 
      'PT Mono', 'Red Hat Mono', 'Sono', 'Spline Sans Mono', 'Xanh Mono', 
      'Cousine', 'Nova Mono', 'Major Mono Display'
    ];

    let currentVal = type === 'text' ? AppState.settings.fontText : AppState.settings.fontCode;
    
    // Normalize display value if it's the system default
    if (type === 'text' && currentVal === 'var(--font-text-system)') currentVal = 'System Default';
    if (type === 'code' && currentVal === 'var(--font-code-system)') currentVal = 'System Mono';

    return DesignSystem.createSelect(fonts, currentVal, (val) => {
      if (typeof SettingsModule !== 'undefined') {
        SettingsModule.updateFont(type, val);
      }
    });
  }

  _createZoomControl(type) {
    const ctrl = DesignSystem.createElement('div', 'setting-control-col');
    const currentVal = type === 'text' ? AppState.settings.textZoom : AppState.settings.codeZoom;
    
    const slider = DesignSystem.createElement('input', 'zoom-slider', {
      type: 'range',
      id: `${type}-zoom-slider`,
      min: '50',
      max: '200',
      step: '5'
    });
    slider.value = currentVal || 100;

    const label = DesignSystem.createElement('span', 'zoom-val-label', {
      id: `${type}-zoom-val`,
      text: `${slider.value}%`
    });

    slider.addEventListener('input', (e) => {
      const val = e.target.value;
      label.innerText = `${val}%`;
      if (type === 'text') {
        AppState.settings.textZoom = parseInt(val, 10);
        localStorage.setItem('md-text-zoom', val);
      } else {
        AppState.settings.codeZoom = parseInt(val, 10);
        localStorage.setItem('md-code-zoom', val);
      }
      if (typeof applyTheme === 'function') applyTheme();
      if (typeof AppState !== 'undefined' && AppState.savePersistentState) {
        AppState.savePersistentState();
      }
    });

    ctrl.appendChild(slider);
    ctrl.appendChild(label);
    return ctrl;
  }

  _createToggle(id) {
    return DesignSystem.createElement('div', 'switch-toggle', {
      id: id,
      tabindex: '0',
      role: 'switch',
      html: '<div class="switch-indicator"></div>'
    });
  }

  _createBackgroundGridWrapper() {
    const wrapper = DesignSystem.createElement('div', 'bg-grid-wrapper', { id: 'bg-grid-wrapper' });
    wrapper.appendChild(this._createBackgroundGrid());
    return wrapper;
  }

  _createBackgroundGrid() {
    const bgGrid = DesignSystem.createElement('div', 'bg-image-grid');
    bgGrid.innerHTML = `
      <div class="bg-image-item bg-new-image" id="bg-upload-trigger">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>New Image</span>
        <input type="file" id="bg-file-input" accept="image/*" style="display: none;" multiple>
      </div>
      <div id="custom-bg-list" style="display: contents;"></div>
      <div class="bg-image-item">
        <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" alt="Abstract 1">
      </div>
      <div class="bg-image-item">
        <img src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2574&auto=format&fit=crop" alt="Abstract 2">
      </div>
    `;
    return bgGrid;
  }

  /**
   * Static instance to track open popover
   */
  static activeInstance = null;

  /**
   * Toggle the Settings UI (Singleton)
   */
  static toggle() {
    if (this.activeInstance) {
      this.activeInstance.close();
    } else {
      this.activeInstance = this.open();
    }
  }

  /**
   * Open the Settings UI in a floating popover (No backdrop)
   */
  static open() {
    const component = new SettingsComponent();
    const content = component.render();
    
    const popover = DesignSystem.createPopoverShield({
      title: 'Settings',
      content: content,
      hasBackdrop: false,
      alignment: 'bottom-left',
      className: 'settings-dynamic-popover',
      onClose: () => {
        SettingsComponent.activeInstance = null;
      }
    });

    // Re-initialize SettingsModule logic with the new DOM
    if (typeof SettingsModule !== 'undefined') {
      SettingsModule.init();
    }
    
    return popover;
  }
}

// Export for Design System
window.SettingsComponent = SettingsComponent;
