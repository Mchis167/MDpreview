/**
 * @vitest-environment jsdom
 *
 * The controls are assembled from the app's real design system components —
 * not stand-ins — so this file loads the actual source of design-system.js
 * and the atoms/molecules it delegates to. If a factory font-kit relies on
 * stops existing or starts returning null, these tests fail rather than the
 * panel silently rendering half of itself inside the extension.
 *
 * font-kit ships two pieces a host composes separately: createTypography
 * (the settings rows) and createFontList (the Google Fonts catalogue).
 * MDpreview puts the first in its Settings panel and the second in a modal
 * opened from the font row, so they are exercised apart here too.
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

function loadDesignSystem() {
  ['atoms/modal.js', 'atoms/button.js', 'atoms/select.js', 'atoms/segmented-control.js', 'molecules/setting-row.js']
    .forEach((f) => loadScript(`renderer/js/components/${f}`));
  loadScript('renderer/js/components/design-system.js');
  loadScript('shared/font-kit/picker.js');
  loadScript('shared/font-kit/ui-mdpreview.js');

  // design-system-icons.js pulls in the whole icon set; font-kit only needs
  // a few, and a marker svg makes assertions readable.
  window.DesignSystem.registerIcons({
    search: '<svg data-icon="search"></svg>',
    check: '<svg data-icon="check"></svg>',
    'arrow-down': '<svg data-icon="arrow-down"></svg>',
    'chevron-down': '<svg data-icon="chevron-down"></svg>',
    loader: '<svg data-icon="loader"></svg>',
    heading: '<svg data-icon="heading"></svg>',
    'file-text': '<svg data-icon="file-text"></svg>',
    code: '<svg data-icon="code"></svg>',
    x: '<svg data-icon="x"></svg>',
    'refresh-cw': '<svg data-icon="refresh-cw"></svg>'
  });

  return window.FontKitUiMDpreview.createUi(window.DesignSystem, window.SettingRow);
}

const CATALOG = [
  { family: 'Lexend', category: 'Sans Serif', installed: false },
  { family: 'Inter', category: 'Sans Serif', installed: true }
];

function makeBridge(overrides = {}) {
  return {
    search: overrides.search || vi.fn(async () => CATALOG.map((f) => ({ ...f }))),
    apply: overrides.apply || vi.fn(async () => {}),
    setZoom: overrides.setZoom || vi.fn()
  };
}

function makeState(overrides = {}) {
  return {
    title: null,
    body: 'Inter',
    code: null,
    zoom: { title: 100, body: 100, code: 100 },
    ...overrides
  };
}

/** Mount the Typography rows on their own, as the Settings panel does. */
function mountTypography(overrides = {}) {
  const ui = loadDesignSystem();
  const state = makeState(overrides.state);
  const bridge = makeBridge(overrides);
  const onBrowse = overrides.onBrowse || vi.fn();

  const typography = window.FontKitPicker.createTypography({
    ui,
    bridge,
    state,
    onBrowse,
    initialRole: overrides.initialRole || 'title'
  });

  const el = typography.render();
  document.body.appendChild(el);
  return { typography, el, bridge, state, onBrowse, ui };
}

/** Mount the catalogue on its own, as the font modal does. */
function mountList(overrides = {}) {
  const ui = overrides.ui || loadDesignSystem();
  const state = overrides.state || makeState();
  const bridge = makeBridge(overrides);
  let role = overrides.initialRole || 'title';

  const list = window.FontKitPicker.createFontList({
    ui,
    bridge,
    state,
    getRole: () => role,
    onApplied: overrides.onApplied
  });

  const el = list.render();
  document.body.appendChild(el);
  return { list, el, bridge, state, setRole: (r) => (role = r) };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

describe('typography group structure', () => {
  it('is one group card, so a host can drop it beside its own sections', async () => {
    const { el } = mountTypography();
    await flush();

    expect(el.classList).toContain('ds-popover-group');
    expect(el.querySelector('.ds-popover-group-title').textContent).toBe('Typography');
    // The catalogue is the host's to place; it must not smuggle itself in.
    expect(el.querySelector('.fk-catalog')).toBeNull();
    expect(el.querySelector('.fk-search-input')).toBeNull();
  });

  it('uses real setting rows for the role switch, the current font and zoom', async () => {
    const { el } = mountTypography();
    await flush();

    const labels = [...el.querySelectorAll('.ds-setting-row-label')].map((n) => n.textContent);
    expect(labels).toEqual(['Applies to', 'Current font', 'Zoom']);
  });

  it('renders a segmented control with one icon segment per role', async () => {
    const { el } = mountTypography();
    await flush();

    const segments = [...el.querySelectorAll('.ds-segment-item')];
    expect(segments.map((s) => s.getAttribute('data-id'))).toEqual(['title', 'body', 'code']);
    expect(segments[0].innerHTML).toContain('data-icon="heading"');
  });
});

describe('typography current-font row', () => {
  it('puts the family and its chevron in one button, with Reset past a divider', async () => {
    const { el } = mountTypography({ initialRole: 'body' });
    await flush();

    const trigger = el.querySelector('.fk-font-trigger');
    expect(trigger.querySelector('.fk-current-value').textContent).toBe('Inter');
    expect(trigger.querySelector('.fk-font-caret').innerHTML).toContain('data-icon="chevron-down"');
    // Changing the font and clearing it are opposite actions, so the divider
    // between them is structural, not decoration.
    expect(el.querySelector('.fk-current-divider')).toBeTruthy();
    expect(el.querySelector('.fk-reset')).toBeTruthy();
  });

  it('asks the host to open the catalogue, for the role in effect', async () => {
    const { el, onBrowse } = mountTypography({ initialRole: 'title' });
    await flush();

    el.querySelector('.ds-segment-item[data-id="code"]').click();
    el.querySelector('.fk-font-trigger').click();

    expect(onBrowse).toHaveBeenCalledWith('code');
  });

  it('keeps Reset in place but disabled when the font is the system default', async () => {
    // Hiding it outright leaves the row half empty and reading as forgotten.
    const { el } = mountTypography({ initialRole: 'title' });
    await flush();

    const value = el.querySelector('.fk-current-value');
    expect(value.textContent).toBe('System default');
    expect(value.classList).toContain('fk-current-default');

    const reset = el.querySelector('.fk-reset');
    expect(reset.disabled).toBe(true);
    expect(reset.innerHTML).toContain('data-icon="refresh-cw"');
  });

  it('does nothing when the disabled Reset is clicked', async () => {
    const { el, bridge } = mountTypography({ initialRole: 'title' });
    await flush();

    el.querySelector('.fk-reset').click();
    await flush();

    expect(bridge.apply).not.toHaveBeenCalled();
  });

  it('previews the chosen family in its own face', async () => {
    const { el } = mountTypography({ initialRole: 'body' });
    await flush();

    const value = el.querySelector('.fk-current-value');
    expect(value.style.fontFamily).toContain('Inter');
    expect(value.classList).not.toContain('fk-current-default');
    expect(el.querySelector('.fk-reset').disabled).toBe(false);
  });

  it('clears the role through the bridge when Reset is clicked', async () => {
    const { el, bridge, state } = mountTypography({ initialRole: 'body' });
    await flush();

    el.querySelector('.fk-reset').click();
    await flush();

    expect(bridge.apply).toHaveBeenCalledWith('body', null);
    expect(state.body).toBeNull();
    expect(el.querySelector('.fk-current-value').textContent).toBe('System default');
  });

  it('follows the current font when the role changes', async () => {
    const { el } = mountTypography({ initialRole: 'title' });
    await flush();
    expect(el.querySelector('.fk-current-value').textContent).toBe('System default');

    el.querySelector('.ds-segment-item[data-id="body"]').click();
    await flush();
    expect(el.querySelector('.fk-current-value').textContent).toBe('Inter');
  });

  it('tells subscribers about a role change, and lets them stop listening', async () => {
    // This is how the font modal keeps its results in step with the panel.
    const { el, typography } = mountTypography({ initialRole: 'title' });
    await flush();

    const seen = vi.fn();
    const stop = typography.onRoleChange(seen);
    el.querySelector('.ds-segment-item[data-id="body"]').click();
    expect(seen).toHaveBeenCalledWith('body');

    stop();
    el.querySelector('.ds-segment-item[data-id="code"]').click();
    expect(seen).toHaveBeenCalledTimes(1);
  });

  it('refresh() picks up a font applied elsewhere', async () => {
    // The catalogue writes into the same state object and calls back.
    const { el, typography, state } = mountTypography({ initialRole: 'title' });
    await flush();

    state.title = 'Lexend';
    typography.refresh();

    expect(el.querySelector('.fk-current-value').textContent).toBe('Lexend');
  });
});

describe('typography zoom row', () => {
  const slider = (el) => el.querySelector('.zoom-slider');
  const label = (el) => el.querySelector('.zoom-val-label');

  it('reuses the app\'s own zoom control markup and range', async () => {
    const { el } = mountTypography();
    await flush();

    const input = slider(el);
    expect(input.getAttribute('type')).toBe('range');
    expect([input.min, input.max, input.step]).toEqual(['50', '200', '5']);
    expect(el.querySelector('.setting-control-col')).toBeTruthy();
  });

  it('starts at 100% when nothing was saved', async () => {
    const { el } = mountTypography({ state: { zoom: {} } });
    await flush();

    expect(slider(el).value).toBe('100');
    expect(label(el).textContent).toBe('100%');
  });

  it('shows the saved zoom of the role it opened on', async () => {
    const { el } = mountTypography({
      initialRole: 'code',
      state: { zoom: { title: 130, body: 90, code: 115 } }
    });
    await flush();

    expect(slider(el).value).toBe('115');
    expect(label(el).textContent).toBe('115%');
  });

  it('follows the segmented control — one slider, three axes', async () => {
    // This is what makes three zoom axes fit in the panel without three
    // stacked sliders: the row is scoped by "Applies to", like the font row.
    const { el } = mountTypography({
      initialRole: 'title',
      state: { zoom: { title: 130, body: 90, code: 115 } }
    });
    await flush();
    expect(slider(el).value).toBe('130');

    el.querySelector('.ds-segment-item[data-id="body"]').click();
    await flush();
    expect(slider(el).value).toBe('90');
    expect(label(el).textContent).toBe('90%');
  });

  it('reports a drag to the bridge against the selected role', async () => {
    const { el, bridge } = mountTypography({ initialRole: 'code' });
    await flush();

    const input = slider(el);
    input.value = '145';
    input.dispatchEvent(new window.Event('input'));

    expect(bridge.setZoom).toHaveBeenCalledWith('code', 145);
    expect(label(el).textContent).toBe('145%');
  });

  it('keeps each axis separate when several are changed', async () => {
    const { el, state } = mountTypography({ initialRole: 'title' });
    await flush();

    const input = slider(el);
    input.value = '150';
    input.dispatchEvent(new window.Event('input'));

    el.querySelector('.ds-segment-item[data-id="code"]').click();
    await flush();
    slider(el).value = '80';
    slider(el).dispatchEvent(new window.Event('input'));

    expect(state.zoom).toMatchObject({ title: 150, code: 80, body: 100 });
  });

  it('does not disturb zoom when the font is reset', async () => {
    const { el, state } = mountTypography({ initialRole: 'body', state: { zoom: { body: 120 } } });
    await flush();

    el.querySelector('.fk-reset').click();
    await flush();

    expect(state.body).toBeNull();
    expect(state.zoom.body).toBe(120);
    expect(slider(el).value).toBe('120');
  });
});

describe('font catalogue search', () => {
  it('asks the bridge for the host\'s current role and renders a row per result', async () => {
    const { el, bridge } = mountList({ initialRole: 'title' });
    await flush();

    expect(bridge.search).toHaveBeenCalledWith('', 'title', expect.any(Number));
    expect([...el.querySelectorAll('.fk-item-name')].map((n) => n.textContent))
      .toEqual(['Lexend', 'Inter']);
  });

  it('re-queries against the new role when the host says it changed', async () => {
    const { list, bridge, setRole } = mountList({ initialRole: 'title' });
    await flush();
    bridge.search.mockClear();

    setRole('code');
    list.refresh();
    await flush();

    expect(bridge.search).toHaveBeenCalledWith('', 'code', expect.any(Number));
  });

  it('previews an installed font in its own face and marks it with a check', async () => {
    const { el } = mountList();
    await flush();

    const [lexend, inter] = [...el.querySelectorAll('.fk-item')];
    expect(inter.querySelector('.fk-item-name').style.fontFamily).toContain('Inter');
    expect(inter.querySelector('.fk-item-mark').innerHTML).toContain('data-icon="check"');

    // Not downloaded yet: no face to preview with, so a download arrow instead.
    expect(lexend.querySelector('.fk-item-name').style.fontFamily).toBe('');
    expect(lexend.querySelector('.fk-item-mark').innerHTML).toContain('data-icon="arrow-down"');
    expect(lexend.querySelector('.fk-item-mark').classList).toContain('fk-item-mark-download');
  });

  it('says so plainly when nothing matches', async () => {
    const { el } = mountList({ search: vi.fn(async () => []) });
    await flush();
    expect(el.querySelector('.fk-empty').textContent).toBe('No matching font.');
  });

  it('ignores a slow earlier search that lands after a newer one', async () => {
    // Typing "l" then "le" must not end with the results for "l" on screen.
    const search = vi.fn((query) =>
      query === 'slow'
        ? new Promise((resolve) => setTimeout(() => resolve([{ family: 'STALE', category: 'Serif' }]), 30))
        : Promise.resolve([{ family: 'FRESH', category: 'Serif' }])
    );

    const { el } = mountList({ search });
    await flush();

    const input = el.querySelector('.fk-search-input');
    input.value = 'slow';
    input.dispatchEvent(new window.Event('input'));
    await new Promise((r) => setTimeout(r, 5));
    input.value = 'fresh';
    input.dispatchEvent(new window.Event('input'));

    await new Promise((r) => setTimeout(r, 80));

    expect([...el.querySelectorAll('.fk-item-name')].map((n) => n.textContent)).toEqual(['FRESH']);
  });

  it('reports a failed catalog fetch in the panel instead of throwing', async () => {
    const { el } = mountList({
      search: vi.fn(async () => {
        throw new Error('getaddrinfo ENOTFOUND');
      })
    });
    await flush();

    const status = el.querySelector('.fk-status');
    expect(status.textContent).toContain('Could not reach Google Fonts');
    expect(status.className).toContain('fk-status-error');
  });
});

describe('font catalogue picking a font', () => {
  it('applies the font against the host\'s role and marks the row active', async () => {
    const { el, bridge, state } = mountList({ initialRole: 'title' });
    await flush();

    el.querySelectorAll('.fk-item')[0].click();
    await flush();

    expect(bridge.apply).toHaveBeenCalledWith('title', 'Lexend');
    expect(state.title).toBe('Lexend');
    expect(el.querySelectorAll('.fk-item')[0].classList).toContain('active');
  });

  it('tells the host so the row showing the current font can catch up', async () => {
    const onApplied = vi.fn();
    const { el } = mountList({ initialRole: 'body', onApplied });
    await flush();

    el.querySelectorAll('.fk-item')[0].click();
    await flush();

    expect(onApplied).toHaveBeenCalledWith('body', 'Lexend');
  });

  it('previews the newly downloaded font in its own face', async () => {
    const { el } = mountList();
    await flush();

    const row = el.querySelectorAll('.fk-item')[0];
    row.click();
    await flush();

    expect(row.querySelector('.fk-item-name').style.fontFamily).toContain('Lexend');
    expect(row.querySelector('.fk-item-mark').innerHTML).toContain('data-icon="check"');
  });

  it('leaves only one row active when a second font is picked', async () => {
    const { el } = mountList();
    await flush();

    el.querySelectorAll('.fk-item')[0].click();
    await flush();
    el.querySelectorAll('.fk-item')[1].click();
    await flush();

    expect(el.querySelectorAll('.fk-item.active')).toHaveLength(1);
  });

  it('restores the row and explains itself when the download fails', async () => {
    const { el, state } = mountList({
      apply: vi.fn(async () => {
        throw new Error('connection reset');
      })
    });
    await flush();

    const row = el.querySelectorAll('.fk-item')[0];
    row.click();
    await flush();

    expect(state.title).toBeNull();
    expect(row.classList).not.toContain('is-loading');
    expect(row.querySelector('.fk-item-mark').innerHTML).toContain('data-icon="arrow-down"');
    expect(el.querySelector('.fk-status').textContent).toContain('Could not install Lexend');
  });

  it('ignores a second click while a download is still running', async () => {
    let resolveApply;
    const apply = vi.fn(() => new Promise((resolve) => {
      resolveApply = resolve;
    }));

    const { el } = mountList({ apply });
    await flush();

    const row = el.querySelectorAll('.fk-item')[0];
    row.click();
    await flush();
    row.click();
    row.click();

    expect(apply).toHaveBeenCalledTimes(1);
    resolveApply();
  });
});
