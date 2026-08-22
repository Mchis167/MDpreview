/* global DesignSystem, SettingRow, SettingsService, AppState, SwitchToggleModule, MdpUi, ThemeKitAppearance, PublishSettingsFormComponent, PublishManagerComponent */
/* ══════════════════════════════════════════════════
   SettingsComponent.js — Settings View Organism
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class SettingsComponent {
  /**
   * Backgrounds the app ships with. Passed to theme-kit rather than baked
   * into it: the VSCode extension has none, since a webview's CSP will not
   * load an image from a remote host.
   */
  static BACKGROUND_PRESETS = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2574&auto=format&fit=crop'
  ];

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

    // The accent swatches and the background grid come from theme-kit, so
    // this panel and the VSCode extension's Settings panel are the same
    // controls rather than two implementations that drift apart.
    const ui = MdpUi.createUi(DesignSystem, SettingRow, SwitchToggleModule);
    const themeState = this._themeState();
    const themeBridge = this._themeBridge();

    // 1. Appearance Group
    container.appendChild(
      ThemeKitAppearance.createAccentGroup({ ui, bridge: themeBridge, state: themeState }).render()
    );

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
    container.appendChild(
      ThemeKitAppearance.createBackgroundGroup({
        ui,
        bridge: themeBridge,
        state: themeState,
        presets: SettingsComponent.BACKGROUND_PRESETS
      }).render()
    );

    // 4. Integrations Group
    container.appendChild(this._createGroup('Integrations', [
      SettingRow.create({
        label: 'Publish Configuration',
        control: this._createTokenConfigButton()
      }),
      SettingRow.create({
        label: 'Publish Management',
        control: this._createManagementButton()
      })
    ]));

    return container;
  }

  _createTokenConfigButton() {
    const btn = DesignSystem.createButton({
      variant: 'subtitle',
      label: 'Config Publish',
      leadingIcon: 'settings-2',
      onClick: () => {
        if (typeof PublishSettingsFormComponent !== 'undefined') {
          PublishSettingsFormComponent.open({
            onConfirm: () => {
              // Re-render settings to update button label
              SettingsComponent.hide();
              setTimeout(() => SettingsComponent.open(), 50);
            }
          });
        }
      }
    });
    
    btn.style.height = '28px';
    btn.style.padding = '0 12px';
    btn.style.fontSize = '11px';

    return btn;
  }

  _createManagementButton() {
    const btn = DesignSystem.createButton({
      variant: 'subtitle',
      label: 'Manage Slugs',
      leadingIcon: 'layers',
      onClick: () => {
        if (typeof PublishManagerComponent !== 'undefined') {
          PublishManagerComponent.open();
        }
      }
    });
    
    btn.style.height = '28px';
    btn.style.padding = '0 12px';
    btn.style.fontSize = '11px';

    return btn;
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

  // ── theme-kit wiring ────────────────────────────────────
  // theme-kit reads and writes a plain state object and calls a bridge for
  // anything that has to persist. Here both sit on SettingsService, which
  // already knows how to store a setting and re-apply the theme.

  _themeState() {
    const s = AppState.settings || {};
    return {
      accent: s.accentColor,
      bgEnabled: s.bgEnabled,
      bgImage: s.bgImage,
      backgrounds: SettingsService.getCustomBackgrounds()
    };
  }

  _themeBridge() {
    const set = (key, value) => {
      if (typeof SettingsService !== 'undefined') SettingsService.update(key, value);
    };

    return {
      setAccent: (hex) => set('accentColor', hex),
      setBackgroundEnabled: (on) => set('bgEnabled', on),
      setBackgroundImage: (src) => set('bgImage', src),

      // In the app an image is stored inline as a data URL, which is both
      // the stored form and the displayable one.
      async addBackground(file) {
        const dataUrl = await SettingsComponent._toBase64(file);
        return SettingsService.addCustomBackground(dataUrl) ? dataUrl : null;
      },

      async removeBackground(src) {
        SettingsService.removeCustomBackground(src);
      }
    };
  }

  static _toBase64(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
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
