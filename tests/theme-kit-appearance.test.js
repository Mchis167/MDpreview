/**
 * @vitest-environment jsdom
 *
 * Like the font-kit tests, these run the controls against the app's real
 * design system components rather than stand-ins, so a factory that stops
 * existing fails here instead of rendering half a panel inside the host.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');

function loadScript(rel) {
  const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  // Classic <script> semantics: top-level declarations land on the global.
  new Function(`${code}\n;`).call(globalThis);
}

function loadUi() {
  ['atoms/modal.js', 'atoms/button.js', 'atoms/select.js', 'atoms/segmented-control.js',
    'atoms/switch-toggle.js', 'molecules/setting-row.js']
    .forEach((f) => loadScript(`renderer/js/components/${f}`));
  loadScript('renderer/js/components/design-system.js');
  loadScript('shared/theme-kit/theme.js');
  loadScript('shared/theme-kit/appearance.js');
  loadScript('shared/ui-mdpreview.js');

  window.DesignSystem.registerIcons({ plus: '<svg data-icon="plus"></svg>' });

  return window.MdpUi.createUi(window.DesignSystem, window.SettingRow, window.SwitchToggleModule);
}

function makeBridge(overrides = {}) {
  let n = 0;
  return {
    setAccent: overrides.setAccent || vi.fn(),
    setBackgroundEnabled: overrides.setBackgroundEnabled || vi.fn(),
    setBackgroundImage: overrides.setBackgroundImage || vi.fn(),
    addBackground: overrides.addBackground || vi.fn(async () => `stored://img-${++n}`),
    removeBackground: overrides.removeBackground || vi.fn(async () => {})
  };
}

function mountAccent(overrides = {}) {
  const ui = loadUi();
  const state = { accent: overrides.accent ?? '#ffbf48' };
  const bridge = makeBridge(overrides);

  const el = window.ThemeKitAppearance.createAccentGroup({ ui, bridge, state }).render();
  document.body.appendChild(el);
  return { el, bridge, state };
}

function mountBackground(overrides = {}) {
  const ui = loadUi();
  const state = {
    bgEnabled: overrides.bgEnabled ?? true,
    bgImage: overrides.bgImage ?? null,
    backgrounds: overrides.backgrounds ?? []
  };
  const bridge = makeBridge(overrides);

  const group = window.ThemeKitAppearance.createBackgroundGroup({
    ui,
    bridge,
    state,
    presets: overrides.presets
  });
  const el = group.render();
  document.body.appendChild(el);
  return { el, bridge, state, group };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** A File the jsdom FileList accepts, standing in for a chosen image. */
function fakeFile(name) {
  return new window.File(['bytes'], name, { type: 'image/png' });
}

/** Drive the hidden <input type=file> the way a real pick would. */
async function pickFiles(el, files) {
  const input = el.querySelector('.bg-new-image input[type="file"]');
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  input.dispatchEvent(new window.Event('change'));
  await flush();
}

beforeEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

describe('accent group', () => {
  it('is one group card holding a real setting row', () => {
    const { el } = mountAccent();

    expect(el.classList).toContain('ds-popover-group');
    expect(el.querySelector('.ds-popover-group-title').textContent).toBe('Appearance');
    expect(el.querySelector('.ds-setting-row-label').textContent).toBe('Accent Color');
  });

  it('renders one swatch per preset, tinted to its own colour', () => {
    const { el } = mountAccent();
    const items = [...el.querySelectorAll('.color-item')];

    expect(items).toHaveLength(window.ThemeKit.ACCENT_COLORS.length);
    expect(items[0].dataset.color).toBe('#ffbf48');
    expect(items[0].title).toBe('Orange');
    expect(items[1].style.backgroundColor).toBeTruthy();
  });

  it('marks the colour already in use', () => {
    const { el } = mountAccent({ accent: '#1E90FF' });

    const active = el.querySelectorAll('.color-item.active');
    expect(active).toHaveLength(1);
    expect(active[0].dataset.color).toBe('#1E90FF');
  });

  it('tells the host which colour was picked, and moves the marker', () => {
    const { el, bridge, state } = mountAccent();

    el.querySelector('.color-item[data-color="#9370DB"]').click();

    expect(bridge.setAccent).toHaveBeenCalledWith('#9370DB');
    expect(state.accent).toBe('#9370DB');
    expect(el.querySelectorAll('.color-item.active')).toHaveLength(1);
    expect(el.querySelector('.color-item.active').dataset.color).toBe('#9370DB');
  });
});

describe('background group', () => {
  it('is one group card with a switch and the grid', () => {
    const { el } = mountBackground();

    expect(el.querySelector('.ds-popover-group-title').textContent).toBe('Background');
    expect(el.querySelector('.switch-toggle')).toBeTruthy();
    expect(el.querySelector('.bg-image-grid')).toBeTruthy();
  });

  it('hides the grid while the background is switched off', () => {
    const { el } = mountBackground({ bgEnabled: false });
    expect(el.querySelector('.bg-grid-wrapper').style.display).toBe('none');
  });

  it('reveals the grid and tells the host when switched on', () => {
    const { el, bridge, state } = mountBackground({ bgEnabled: false });

    el.querySelector('.switch-toggle').click();

    expect(bridge.setBackgroundEnabled).toHaveBeenCalledWith(true);
    expect(state.bgEnabled).toBe(true);
    expect(el.querySelector('.bg-grid-wrapper').style.display).toBe('block');
  });

  it('always offers the upload tile first', () => {
    const { el } = mountBackground({ backgrounds: ['stored://a'] });
    const tiles = [...el.querySelectorAll('.bg-image-item')];

    expect(tiles[0].classList).toContain('bg-new-image');
    expect(tiles[0].querySelector('[data-icon="plus"]')).toBeTruthy();
  });

  it('shows the host\'s presets after the user\'s own images', () => {
    const { el } = mountBackground({
      backgrounds: ['stored://mine'],
      presets: ['https://preset/one.jpg']
    });

    const srcs = [...el.querySelectorAll('.bg-image-item[data-src]')].map((n) => n.dataset.src);
    expect(srcs).toEqual(['stored://mine', 'https://preset/one.jpg']);
  });

  it('hands a chosen file to the host and shows what it stored', async () => {
    const { el, bridge, state } = mountBackground();

    await pickFiles(el, [fakeFile('a.png')]);

    expect(bridge.addBackground).toHaveBeenCalledTimes(1);
    expect(state.backgrounds).toEqual(['stored://img-1']);
    expect(el.querySelector('.bg-image-item[data-src="stored://img-1"]')).toBeTruthy();
  });

  it('owns state.backgrounds itself — one tile per file, however the host stores it', async () => {
    // The bridge returns a url and nothing else: appending is this module's
    // job. A host that also pushed onto state.backgrounds made every image
    // appear twice, which is what this pins down.
    const { el, state } = mountBackground();

    await pickFiles(el, [fakeFile('a.png')]);
    await pickFiles(el, [fakeFile('b.png')]);

    expect(state.backgrounds).toEqual(['stored://img-1', 'stored://img-2']);
    expect(el.querySelectorAll('.bg-image-item[data-src]')).toHaveLength(2);
  });

  it('accepts several files in one pick', async () => {
    const { el, state } = mountBackground();

    await pickFiles(el, [fakeFile('a.png'), fakeFile('b.png')]);

    expect(state.backgrounds).toHaveLength(2);
  });

  it('stops at the cap and says why, instead of failing silently', async () => {
    const existing = ['a', 'b', 'c', 'd', 'e'].map((n) => `stored://${n}`);
    const { el, bridge } = mountBackground({ backgrounds: existing });

    await pickFiles(el, [fakeFile('f.png')]);

    expect(bridge.addBackground).not.toHaveBeenCalled();
    const status = el.querySelector('.bg-status');
    expect(status.style.display).toBe('block');
    expect(status.textContent).toContain('5');
  });

  it('selects an image and tells the host', () => {
    const { el, bridge, state } = mountBackground({ backgrounds: ['stored://a', 'stored://b'] });

    el.querySelector('.bg-image-item[data-src="stored://b"]').click();

    expect(bridge.setBackgroundImage).toHaveBeenCalledWith('stored://b');
    expect(state.bgImage).toBe('stored://b');
    expect(el.querySelector('.bg-image-item[data-src="stored://b"]').classList).toContain('active');
    expect(el.querySelector('.bg-image-item[data-src="stored://a"]').classList).not.toContain('active');
  });

  it('offers a remove button on the user\'s own images but not on presets', () => {
    const { el } = mountBackground({
      backgrounds: ['stored://mine'],
      presets: ['https://preset/one.jpg']
    });

    expect(el.querySelector('.bg-image-item[data-src="stored://mine"] .bg-image-remove')).toBeTruthy();
    expect(el.querySelector('.bg-image-item[data-src="https://preset/one.jpg"] .bg-image-remove')).toBeNull();
  });

  it('removes an image without also selecting it', async () => {
    const { el, bridge, state } = mountBackground({ backgrounds: ['stored://a', 'stored://b'] });

    el.querySelector('.bg-image-item[data-src="stored://a"] .bg-image-remove').click();
    await flush();

    expect(bridge.removeBackground).toHaveBeenCalledWith('stored://a');
    expect(state.backgrounds).toEqual(['stored://b']);
    // The click must not have fallen through to the tile underneath.
    expect(bridge.setBackgroundImage).not.toHaveBeenCalledWith('stored://a');
  });

  it('clears the selection when the image in use is removed', async () => {
    const { el, bridge, state } = mountBackground({
      backgrounds: ['stored://a'],
      bgImage: 'stored://a'
    });

    el.querySelector('.bg-image-remove').click();
    await flush();

    expect(state.bgImage).toBeNull();
    expect(bridge.setBackgroundImage).toHaveBeenCalledWith(null);
  });

  it('frees a slot again once an image is removed', async () => {
    const existing = ['a', 'b', 'c', 'd', 'e'].map((n) => `stored://${n}`);
    const { el, bridge } = mountBackground({ backgrounds: existing });

    el.querySelector('.bg-image-item[data-src="stored://a"] .bg-image-remove').click();
    await flush();
    await pickFiles(el, [fakeFile('f.png')]);

    expect(bridge.addBackground).toHaveBeenCalledTimes(1);
  });
});
