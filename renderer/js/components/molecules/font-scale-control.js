/* global DesignSystem, AppState, SettingsService, MenuShield */
/**
 * FontScaleControl.js — Atomic Design (Molecule)
 * Toolbar button showing the current editor font scale (e.g. "100%").
 * Tapping it opens a MenuShield popover with a slider to adjust the scale.
 */
class FontScaleControl {
  render() {
    const btn = DesignSystem.createElement('button', 'ds-font-scale-btn', {
      text: `${AppState.settings.editorFontScale || 100}%`
    });
    DesignSystem.applyTooltip(btn, 'Editor Font Size', 'bottom');

    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleMenu(btn);
    });

    this.btn = btn;
    return btn;
  }

  _toggleMenu(anchor) {
    if (MenuShield.active && MenuShield.active.element.classList.contains('ds-font-scale-shield')) {
      MenuShield.close();
      return;
    }

    MenuShield.open({
      anchor,
      title: 'Editor Font Size',
      content: this._createSliderContent(),
      className: 'ds-font-scale-shield'
    });
  }

  _createSliderContent() {
    const ctrl = DesignSystem.createElement('div', 'setting-control-col');
    const currentVal = AppState.settings.editorFontScale || 100;

    const slider = DesignSystem.createElement('input', 'zoom-slider', {
      type: 'range',
      min: '50',
      max: '200',
      step: '1'
    });
    slider.value = currentVal;

    const label = DesignSystem.createElement('span', 'zoom-val-label', {
      text: `${currentVal}%`
    });

    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      label.innerText = `${val}%`;
      if (this.btn) this.btn.textContent = `${val}%`;
      SettingsService.update('editorFontScale', val);
    });

    ctrl.appendChild(slider);
    ctrl.appendChild(label);
    return ctrl;
  }
}

window.FontScaleControl = FontScaleControl;
