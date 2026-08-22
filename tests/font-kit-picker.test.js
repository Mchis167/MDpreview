/**
 * @vitest-environment jsdom
 *
 * The panel is assembled from the app's real design system components —
 * not stand-ins — so this file loads the actual source of design-system.js
 * and the atoms/molecules it delegates to. If a factory the picker relies
 * on stops existing or starts returning null, these tests fail rather than
 * the panel silently rendering half of itself inside the extension.
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
  ['atoms/modal.js', 'atoms/select.js', 'atoms/segmented-control.js', 'molecules/setting-row.js']
    .forEach((f) => loadScript(`renderer/js/components/${f}`));
  loadScript('renderer/js/components/design-system.js');
  loadScript('shared/font-kit/picker.js');
  loadScript('shared/font-kit/ui-mdpreview.js');

  // design-system-icons.js pulls in the whole icon set; the panel only needs
  // a few, and a marker svg makes assertions readable.
  window.DesignSystem.registerIcons({
    search: '<svg data-icon="search"></svg>',
    check: '<svg data-icon="check"></svg>',
    'arrow-down': '<svg data-icon="arrow-down"></svg>',
    loader: '<svg data-icon="loader"></svg>',
    heading: '<svg data-icon="heading"></svg>',
    'file-text': '<svg data-icon="file-text"></svg>',
    code: '<svg data-icon="code"></svg>',
    x: '<svg data-icon="x"></svg>'
  });

  return window.FontKitUiMDpreview.createUi(window.DesignSystem, window.SettingRow);
}

const CATALOG = [
  { family: 'Lexend', category: 'Sans Serif', installed: false },
  { family: 'Inter', category: 'Sans Serif', installed: true }
];

function mountPicker(overrides = {}) {
  const ui = loadDesignSystem();
  const state = { title: null, body: 'Inter', code: null, ...(overrides.state || {}) };

  const bridge = {
    search: overrides.search || vi.fn(async () => CATALOG.map((f) => ({ ...f }))),
    apply: overrides.apply || vi.fn(async () => {})
  };

  const picker = window.FontKitPicker.createPicker({
    ui,
    bridge,
    state,
    initialRole: overrides.initialRole || 'title'
  });

  const el = picker.render();
  document.body.appendChild(el);
  return { picker, el, bridge, state };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

describe('font panel structure', () => {
  it('builds the two group cards the app uses for settings', async () => {
    const { el } = mountPicker();
    await flush();

    const titles = [...el.querySelectorAll('.ds-popover-group-title')].map((n) => n.textContent);
    expect(titles).toEqual(['Typography', 'Google Fonts']);
    expect(el.querySelectorAll('.ds-popover-group')).toHaveLength(2);
  });

  it('uses real setting rows for the role switch and the current font', async () => {
    const { el } = mountPicker();
    await flush();

    const labels = [...el.querySelectorAll('.ds-setting-row-label')].map((n) => n.textContent);
    expect(labels).toEqual(['Applies to', 'Current font']);
  });

  it('renders a segmented control with one icon segment per role', async () => {
    const { el } = mountPicker();
    await flush();

    const segments = [...el.querySelectorAll('.ds-segment-item')];
    expect(segments.map((s) => s.getAttribute('data-id'))).toEqual(['title', 'body', 'code']);
    expect(segments[0].innerHTML).toContain('data-icon="heading"');
  });
});

describe('font panel popover shell', () => {
  it('opens inside the app\'s own popover card, floating and without a backdrop', async () => {
    const ui = loadDesignSystem();
    window.FontKitPicker.openPicker({
      ui,
      bridge: { search: async () => [], apply: async () => {} },
      state: { title: null, body: null, code: null }
    });
    await flush();

    // hasBackdrop:false is what makes it a floating popover rather than a
    // modal that dims the document behind it — same as the app's Settings.
    expect(document.querySelector('.ds-popover-floating')).toBeTruthy();
    expect(document.querySelector('.ds-popover-shield')).toBeNull();

    const card = document.querySelector('.ds-popover-card');
    expect(card.classList).toContain('fk-popover');
    expect(card.querySelector('.ds-popover-title').textContent).toBe('Fonts');
    expect(card.querySelector('.fk-panel')).toBeTruthy();
  });

  it('closes through the popover close button', async () => {
    const ui = loadDesignSystem();
    const onClose = vi.fn();
    window.FontKitPicker.openPicker({
      ui,
      bridge: { search: async () => [], apply: async () => {} },
      state: { title: null, body: null, code: null },
      onClose
    });
    await flush();

    document.querySelector('.ds-popover-close').click();
    await new Promise((r) => setTimeout(r, 300));

    expect(onClose).toHaveBeenCalled();
    expect(document.querySelector('.ds-popover-card')).toBeNull();
  });
});

describe('font panel current-font row', () => {
  it('shows the system default and hides Reset when no font is set', async () => {
    const { el } = mountPicker({ initialRole: 'title' });
    await flush();

    expect(el.querySelector('.fk-current-value').textContent).toBe('System default');
    expect(el.querySelector('.fk-reset').style.visibility).toBe('hidden');
  });

  it('shows the chosen family, previewed in its own face, with Reset available', async () => {
    const { el } = mountPicker({ initialRole: 'body' });
    await flush();

    const value = el.querySelector('.fk-current-value');
    expect(value.textContent).toBe('Inter');
    expect(value.style.fontFamily).toContain('Inter');
    expect(el.querySelector('.fk-reset').style.visibility).toBe('visible');
  });

  it('clears the role through the bridge when Reset is clicked', async () => {
    const { el, bridge, state } = mountPicker({ initialRole: 'body' });
    await flush();

    el.querySelector('.fk-reset').click();
    await flush();

    expect(bridge.apply).toHaveBeenCalledWith('body', null);
    expect(state.body).toBeNull();
    expect(el.querySelector('.fk-current-value').textContent).toBe('System default');
  });
});

describe('font panel search', () => {
  it('asks the bridge for the current role and renders a row per result', async () => {
    const { el, bridge } = mountPicker({ initialRole: 'title' });
    await flush();

    expect(bridge.search).toHaveBeenCalledWith('', 'title', expect.any(Number));
    expect([...el.querySelectorAll('.fk-item-name')].map((n) => n.textContent))
      .toEqual(['Lexend', 'Inter']);
  });

  it('re-queries with the new role when the segmented control changes', async () => {
    const { el, bridge } = mountPicker({ initialRole: 'title' });
    await flush();
    bridge.search.mockClear();

    el.querySelector('.ds-segment-item[data-id="code"]').click();
    await flush();

    expect(bridge.search).toHaveBeenCalledWith('', 'code', expect.any(Number));
  });

  it('previews an installed font in its own face and marks it with a check', async () => {
    const { el } = mountPicker();
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
    const { el } = mountPicker({ search: vi.fn(async () => []) });
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

    const { el, picker } = mountPicker({ search });
    await flush();

    const input = el.querySelector('.fk-search-input');
    input.value = 'slow';
    input.dispatchEvent(new window.Event('input'));
    await new Promise((r) => setTimeout(r, 5));
    input.value = 'fresh';
    input.dispatchEvent(new window.Event('input'));

    await new Promise((r) => setTimeout(r, 80));

    expect(picker.role).toBe('title');
    expect([...el.querySelectorAll('.fk-item-name')].map((n) => n.textContent)).toEqual(['FRESH']);
  });

  it('reports a failed catalog fetch in the panel instead of throwing', async () => {
    const { el } = mountPicker({
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

describe('font panel picking a font', () => {
  it('applies the font, marks the row active and updates the current row', async () => {
    const { el, bridge, state } = mountPicker({ initialRole: 'title' });
    await flush();

    el.querySelectorAll('.fk-item')[0].click();
    await flush();

    expect(bridge.apply).toHaveBeenCalledWith('title', 'Lexend');
    expect(state.title).toBe('Lexend');
    expect(el.querySelectorAll('.fk-item')[0].classList).toContain('active');
    expect(el.querySelector('.fk-current-value').textContent).toBe('Lexend');
  });

  it('previews the newly downloaded font in its own face', async () => {
    const { el } = mountPicker();
    await flush();

    const row = el.querySelectorAll('.fk-item')[0];
    row.click();
    await flush();

    expect(row.querySelector('.fk-item-name').style.fontFamily).toContain('Lexend');
    expect(row.querySelector('.fk-item-mark').innerHTML).toContain('data-icon="check"');
  });

  it('leaves only one row active when a second font is picked', async () => {
    const { el } = mountPicker();
    await flush();

    el.querySelectorAll('.fk-item')[0].click();
    await flush();
    el.querySelectorAll('.fk-item')[1].click();
    await flush();

    expect(el.querySelectorAll('.fk-item.active')).toHaveLength(1);
  });

  it('restores the row and explains itself when the download fails', async () => {
    const { el, state } = mountPicker({
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

    const { el } = mountPicker({ apply });
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
