/**
 * @vitest-environment jsdom
 *
 * ZoomSystem's control bar carries no feature-specific buttons of its own.
 * Callers inject what they need (mermaid injects "copy SVG"); a caller that
 * injects nothing gets a bare fit / − / % / + bar.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

global.window = global;
window.DesignSystem = { getIcon: (name) => `<svg data-icon="${name}"></svg>` };
window.requestAnimationFrame = (cb) => cb();

const SRC = fs.readFileSync(path.join(__dirname, '../renderer/js/utils/zoom.js'), 'utf8');

function loadZoom() {
  document.body.innerHTML = '';
  delete window.ZoomSystem;
  new Function(SRC).call(window);
  return window.ZoomSystem;
}

/** A rendered mermaid diagram, as ZoomSystem receives it. */
function diagram() {
  const div = document.createElement('div');
  div.className = 'mermaid';
  div.innerHTML = '<svg viewBox="0 0 400 300"><rect/></svg>';
  document.body.appendChild(div);
  return div;
}

const actionButtons = () =>
  Array.from(document.querySelectorAll('#zoom-controls-bar [data-zoom-action]'));

let ZoomSystem;
beforeEach(() => {
  ZoomSystem = loadZoom();
});

describe('ZoomSystem action injection', () => {
  it('renders no extra buttons when the caller passes none', async () => {
    await ZoomSystem.open(diagram(), 'svg');

    expect(actionButtons()).toHaveLength(0);
    expect(document.querySelector('#zoom-controls-bar')).toBeTruthy();
    expect(document.getElementById('zoom-fit-btn')).toBeTruthy();
  });

  it('renders one button per injected action', async () => {
    await ZoomSystem.open(diagram(), 'svg', {
      actions: [
        { id: 'copy-svg', icon: 'copy', title: 'Copy SVG code', onClick: () => {} },
        { id: 'download', icon: 'download', title: 'Download', onClick: () => {} }
      ]
    });

    const btns = actionButtons();
    expect(btns.map((b) => b.dataset.zoomAction)).toEqual(['copy-svg', 'download']);
    expect(btns[0].getAttribute('title')).toBe('Copy SVG code');
    expect(btns[0].innerHTML).toContain('data-icon="copy"');
  });

  it('hands the click the zoomed content, not the caller-side node', async () => {
    const onClick = vi.fn();
    await ZoomSystem.open(diagram(), 'svg', {
      actions: [{ id: 'copy-svg', icon: 'copy', title: 'Copy SVG code', onClick }]
    });

    actionButtons()[0].click();

    expect(onClick).toHaveBeenCalledTimes(1);
    const ctx = onClick.mock.calls[0][0];
    expect(ctx.type).toBe('svg');
    expect(ctx.container.id).toBe('zoom-container');
    expect(ctx.container.querySelector('svg')).toBeTruthy();
  });

  it('drops the previous caller\'s actions on the next open', async () => {
    await ZoomSystem.open(diagram(), 'svg', {
      actions: [{ id: 'copy-svg', icon: 'copy', title: 'Copy SVG code', onClick: () => {} }]
    });
    expect(actionButtons()).toHaveLength(1);

    // An image caller reuses the same modal and injects nothing.
    await ZoomSystem.open(diagram(), 'svg');

    expect(actionButtons()).toHaveLength(0);
  });
});
