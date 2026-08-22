/* ============================================================
   theme-kit/appearance.js — the accent and background controls.

   Two group cards a host composes into its own Settings surface,
   built through an injected `ui` adapter rather than touching a
   design system directly — same arrangement as font-kit/picker.js.

   `bridge` is the host's side of it: where the settings live and
   how an uploaded image becomes something the page can display.
   The Electron app backs it with localStorage; the VSCode
   extension writes files into its globalStorage and hands back
   webview URIs. Neither difference reaches this file.
   ============================================================ */

(function () {

// In a browser theme.js has already run and left ThemeKit on window; under
// node there is no window and the file is required. Checking window first
// matters: a bundler or test harness can leave a `require` in scope even
// when the real module graph is the script-tag one.
const themeKit = (typeof window !== 'undefined' && window.ThemeKit)
  ? window.ThemeKit
  : require('./theme.js');

// Matches the app's own cap. Five is enough to pick a mood from and
// small enough that storing the images stays cheap.
const MAX_CUSTOM_BACKGROUNDS = 5;

/**
 * The Appearance group: a row of accent swatches.
 *
 * bridge.setAccent(hex) is called on every pick. Applying the colour is
 * the host's job — it owns the document root.
 */
function createAccentGroup(options) {
  const { ui, bridge, state } = options;

  function render() {
    const selector = ui.createElement('div', 'color-selector');

    themeKit.ACCENT_COLORS.forEach((color) => {
      const item = ui.createElement('div', 'color-item', { title: color.name });
      item.style.backgroundColor = color.value;
      item.dataset.color = color.value;
      if (color.value === state.accent) item.classList.add('active');

      item.addEventListener('click', () => {
        state.accent = color.value;
        selector.querySelectorAll('.color-item').forEach((el) => el.classList.remove('active'));
        item.classList.add('active');
        bridge.setAccent(color.value);
      });

      selector.appendChild(item);
    });

    return ui.createGroup('Appearance', [
      ui.createSettingRow({ label: 'Accent Color', control: selector })
    ]);
  }

  return { render };
}

/**
 * The Background group: an on/off switch and the grid of images.
 *
 * `presets` are images the host supplies and the user cannot remove —
 * the Electron app passes its bundled ones, the extension passes none,
 * since a webview cannot load them from a remote host anyway.
 */
function createBackgroundGroup(options) {
  const { ui, bridge, state } = options;
  const presets = options.presets || [];

  const el = {};

  function isCustom(src) {
    return !presets.includes(src);
  }

  function customCount() {
    return (state.backgrounds || []).length;
  }

  async function addImages(files) {
    for (const file of files) {
      if (customCount() >= MAX_CUSTOM_BACKGROUNDS) {
        setStatus(`At most ${MAX_CUSTOM_BACKGROUNDS} images. Remove one to add another.`);
        break;
      }
      const src = await bridge.addBackground(file);
      if (!src) continue;
      state.backgrounds = [...(state.backgrounds || []), src];
    }
    renderGrid();
  }

  async function removeImage(src) {
    await bridge.removeBackground(src);
    state.backgrounds = (state.backgrounds || []).filter((s) => s !== src);
    // Removing the image that was on leaves nothing to show.
    if (state.bgImage === src) {
      state.bgImage = null;
      bridge.setBackgroundImage(null);
    }
    setStatus('');
    renderGrid();
  }

  function select(src) {
    state.bgImage = src;
    bridge.setBackgroundImage(src);
    renderGrid();
  }

  function setStatus(text) {
    if (!el.status) return;
    el.status.textContent = text || '';
    el.status.style.display = text ? 'block' : 'none';
  }

  function buildUploadItem() {
    const item = ui.createElement('div', 'bg-image-item bg-new-image');
    item.appendChild(ui.createElement('span', 'bg-new-image-icon', { html: ui.getIcon('plus') }));
    item.appendChild(ui.createElement('span', null, { text: 'New Image' }));

    const input = ui.createElement('input', null, {
      type: 'file',
      accept: 'image/*',
      multiple: 'multiple'
    });
    input.style.display = 'none';
    item.appendChild(input);

    item.addEventListener('click', () => input.click());
    input.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      // Reset first: picking the same file twice in a row fires no change
      // event otherwise, and re-adding an image you just removed is normal.
      input.value = '';
      if (files.length) await addImages(files);
    });

    return item;
  }

  function buildImageItem(src) {
    const item = ui.createElement('div', 'bg-image-item');
    item.dataset.src = src;
    if (src === state.bgImage) item.classList.add('active');

    const img = ui.createElement('img', null, { src, alt: '' });
    item.appendChild(img);
    item.addEventListener('click', () => select(src));

    // The app used to cap uploads at five with no way to delete, which
    // meant the sixth image was simply refused forever.
    if (isCustom(src)) {
      const remove = ui.createElement('button', 'bg-image-remove', {
        type: 'button',
        title: 'Remove image',
        'aria-label': 'Remove image'
      });
      remove.textContent = '✕';
      remove.addEventListener('click', (e) => {
        e.stopPropagation();
        removeImage(src);
      });
      item.appendChild(remove);
    }

    return item;
  }

  function renderGrid() {
    if (!el.grid) return;
    el.grid.innerHTML = '';
    el.grid.appendChild(buildUploadItem());
    [...(state.backgrounds || []), ...presets].forEach((src) => {
      el.grid.appendChild(buildImageItem(src));
    });
  }

  function setEnabled(on) {
    state.bgEnabled = !!on;
    el.wrapper.style.display = on ? 'block' : 'none';
    bridge.setBackgroundEnabled(!!on);
  }

  function render() {
    const toggle = ui.createSwitch({
      isOn: !!state.bgEnabled,
      onChange: setEnabled
    });

    el.grid = ui.createElement('div', 'bg-image-grid');
    el.status = ui.createElement('div', 'bg-status');
    el.wrapper = ui.createElement('div', 'bg-grid-wrapper');
    el.wrapper.appendChild(el.grid);
    el.wrapper.appendChild(el.status);

    renderGrid();
    setStatus('');
    el.wrapper.style.display = state.bgEnabled ? 'block' : 'none';

    return ui.createGroup('Background', [
      ui.createSettingRow({ label: 'Custom Background', control: toggle.el }),
      el.wrapper
    ]);
  }

  return { render, refresh: renderGrid };
}

const exportsObj = { createAccentGroup, createBackgroundGroup, MAX_CUSTOM_BACKGROUNDS };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exportsObj;
}
if (typeof window !== 'undefined') {
  window.ThemeKitAppearance = exportsObj;
}

})();
