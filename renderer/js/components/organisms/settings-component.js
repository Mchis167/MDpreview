/* global DesignSystem, SettingRow, SettingsService, AppState, SwitchToggleModule, showToast */
/* ══════════════════════════════════════════════════
   SettingsComponent.js — Settings View Organism
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class SettingsComponent {
  constructor(options = {}) {
    this.options = {
      onClose: options.onClose || (() => { })
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
      SettingRow.create({
        label: 'Accent Color',
        control: this._createColorSelector()
      })
    ]));

    // 2. Typography & Zoom Group
    container.appendChild(this._createGroup('Typography & Zoom', [
      SettingRow.create({
        label: 'Interface Font',
        control: this._createFontSelect('text')
      }),
      SettingRow.create({
        label: 'Editor Font',
        control: this._createFontSelect('code')
      }),
      SettingRow.create({
        label: 'Text Zoom',
        control: this._createZoomControl('text')
      }),
      SettingRow.create({
        label: 'Code Zoom',
        control: this._createZoomControl('code')
      })
    ]));

    // 3. Background Group
    const toggleEl = DesignSystem.createElement('div', 'switch-toggle');
    SwitchToggleModule.init({
      element: toggleEl,
      isOn: AppState.settings.bgEnabled,
      onChange: (val) => {
        if (typeof SettingsService !== 'undefined') {
          SettingsService.update('bgEnabled', val);
          this._updateGridVisibility(container, val);
        }
      }
    });

    container.appendChild(this._createGroup('Background', [
      SettingRow.create({
        label: 'Custom Background',
        control: toggleEl
      }),
      this._createBackgroundGridWrapper()
    ]));

    // Sync initial visibility
    this._updateGridVisibility(container, AppState.settings.bgEnabled);

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

  _createDivider() {
    return DesignSystem.createElement('div', 'setting-divider');
  }

  _createColorSelector() {
    const container = DesignSystem.createElement('div', 'color-selector');
    const accentColors = [
      { name: 'Orange', value: '#ffbf48' },
      { name: 'Red',    value: '#FF4500' },
      { name: 'Pink',   value: '#FF69B4' },
      { name: 'Purple', value: '#9370DB' },
      { name: 'Blue',   value: '#1E90FF' },
      { name: 'Teal',   value: '#40E0D0' },
      { name: 'Cyan',   value: '#00FFFF' },
      { name: 'Lime',   value: '#00FF00' },
      { name: 'Green',  value: '#ADFF2F' }
    ];

    accentColors.forEach(color => {
      const item = DesignSystem.createElement('div', 'color-item', {
        title: color.name
      });
      item.style.backgroundColor = color.value;
      if (color.value === AppState.settings.accentColor) item.classList.add('active');

      item.addEventListener('click', () => {
        if (typeof SettingsService !== 'undefined') {
          SettingsService.update('accentColor', color.value);
          container.querySelectorAll('.color-item').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
        }
      });

      container.appendChild(item);
    });

    return container;
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
      if (typeof SettingsService !== 'undefined') {
        let fontVal = val;
        if (val === 'System Default') fontVal = 'var(--font-text-system)';
        if (val === 'System Mono') fontVal = 'var(--font-code-system)';
        SettingsService.update(type === 'text' ? 'fontText' : 'fontCode', fontVal);
      }
    });
  }

  _createZoomControl(type) {
    const ctrl = DesignSystem.createElement('div', 'setting-control-col');
    const currentVal = type === 'text' ? AppState.settings.textZoom : AppState.settings.codeZoom;

    const slider = DesignSystem.createElement('input', 'zoom-slider', {
      type: 'range',
      min: '50',
      max: '200',
      step: '5'
    });
    slider.value = currentVal || 100;

    const label = DesignSystem.createElement('span', 'zoom-val-label', {
      text: `${slider.value}%`
    });

    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      label.innerText = `${val}%`;
      if (typeof SettingsService !== 'undefined') {
        SettingsService.update(type === 'text' ? 'textZoom' : 'codeZoom', val);
      }
    });

    ctrl.appendChild(slider);
    ctrl.appendChild(label);
    return ctrl;
  }

  _createBackgroundGridWrapper() {
    const wrapper = DesignSystem.createElement('div', 'bg-grid-wrapper');
    wrapper.appendChild(this._createBackgroundGrid());
    return wrapper;
  }

  _createBackgroundGrid() {
    const bgGrid = DesignSystem.createElement('div', 'bg-image-grid');
    
    // 1. Upload Trigger
    const uploadItem = DesignSystem.createElement('div', ['bg-image-item', 'bg-new-image']);
    uploadItem.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      <span>New Image</span>
    `;
    const fileInput = DesignSystem.createElement('input', null, {
      type: 'file',
      accept: 'image/*',
      style: 'display: none;',
      multiple: true
    });
    uploadItem.appendChild(fileInput);

    uploadItem.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      
      for (const file of files) {
        const base64 = await this._toBase64(file);
        const added = SettingsService.addCustomBackground(base64);
        if (!added && typeof showToast === 'function') {
          showToast('Maximum 5 custom images allowed.', 'error');
          break;
        }
      }
      this._refreshGrid(bgGrid);
    });

    bgGrid.appendChild(uploadItem);

    // 2. Custom & Preset Images
    this._renderImageItems(bgGrid);

    return bgGrid;
  }

  _renderImageItems(container) {
    const customBgs = this._getCustomBgs();
    const presets = [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2574&auto=format&fit=crop'
    ];

    [...customBgs, ...presets].forEach(src => {
      const item = DesignSystem.createElement('div', 'bg-image-item');
      if (src === AppState.settings.bgImage) item.classList.add('active');
      item.innerHTML = `<img src="${src}" alt="Background">`;

      item.addEventListener('click', () => {
        if (typeof SettingsService !== 'undefined') {
          SettingsService.update('bgImage', src);
          container.querySelectorAll('.bg-image-item').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
        }
      });
      container.appendChild(item);
    });
  }

  _refreshGrid(container) {
    // Keep only the first item (upload trigger)
    const trigger = container.querySelector('.bg-new-image');
    container.innerHTML = '';
    container.appendChild(trigger);
    this._renderImageItems(container);
  }

  _getCustomBgs() {
    return SettingsService.getCustomBackgrounds();
  }

  _toBase64(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  _updateGridVisibility(container, enabled) {
    const wrapper = container.querySelector('.bg-grid-wrapper');
    if (wrapper) {
      wrapper.style.display = enabled ? 'block' : 'none';
    }
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
   * Explicitly hide the Settings UI
   */
  static hide() {
    if (this.activeInstance) {
      this.activeInstance.close();
    }
  }

  /**
   * Open the Settings UI in a floating popover (No backdrop)
   */
  static open() {
    if (this.activeInstance) return this.activeInstance;

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

    this.activeInstance = popover;
    return popover;
  }
}

// Export for Design System
window.SettingsComponent = SettingsComponent;
