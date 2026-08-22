/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';

const {
  ACCENT_COLORS,
  DEFAULT_ACCENT,
  hexToRgb,
  selectArrowUrl,
  applyAccent,
  applyBackground
} = require('../shared/theme-kit/theme.js');

let root;
let layer;

beforeEach(() => {
  document.body.innerHTML = '';
  root = document.createElement('div');
  layer = document.createElement('div');
  document.body.append(root, layer);
});

describe('hexToRgb', () => {
  it('splits a six-digit hex into channels, with or without the hash', () => {
    expect(hexToRgb('#FF4500')).toEqual({ r: 255, g: 69, b: 0 });
    expect(hexToRgb('ff4500')).toEqual({ r: 255, g: 69, b: 0 });
    expect(hexToRgb('  #1E90FF ')).toEqual({ r: 30, g: 144, b: 255 });
  });

  it('refuses shorthand, names and nonsense rather than guessing', () => {
    expect(hexToRgb('#fff')).toBeNull();
    expect(hexToRgb('red')).toBeNull();
    expect(hexToRgb('')).toBeNull();
    expect(hexToRgb(null)).toBeNull();
    expect(hexToRgb(0xff4500)).toBeNull();
  });
});

describe('ACCENT_COLORS', () => {
  it('is a list of usable presets, orange first', () => {
    expect(ACCENT_COLORS).toHaveLength(9);
    expect(DEFAULT_ACCENT).toBe(ACCENT_COLORS[0].value);
    ACCENT_COLORS.forEach((c) => {
      expect(c.name).toBeTruthy();
      expect(hexToRgb(c.value)).not.toBeNull();
    });
  });
});

describe('applyAccent', () => {
  it('writes the colour and its rgb channels, which the DS tokens read', () => {
    applyAccent(root, '#1E90FF');

    expect(root.style.getPropertyValue('--accent-color')).toBe('#1E90FF');
    expect(root.style.getPropertyValue('--accent-rgb')).toBe('30, 144, 255');
  });

  it('regenerates the select chevron, which cannot inherit currentColor', () => {
    applyAccent(root, '#FF4500');

    const arrow = root.style.getPropertyValue('--select-arrow');
    expect(arrow).toBe(selectArrowUrl('#FF4500'));
    expect(decodeURIComponent(arrow)).toContain('stroke="#FF4500"');
  });

  it('falls back to the default rather than writing a broken colour', () => {
    const used = applyAccent(root, 'not-a-colour');

    expect(used).toBe(DEFAULT_ACCENT);
    expect(root.style.getPropertyValue('--accent-color')).toBe(DEFAULT_ACCENT);
    expect(root.style.getPropertyValue('--accent-rgb')).toBe('255, 191, 72');
  });

  it('reports back the colour it applied, so callers persist what is real', () => {
    expect(applyAccent(root, '#40E0D0')).toBe('#40E0D0');
  });

  it('does nothing, and does not throw, without a root', () => {
    expect(applyAccent(null, '#1E90FF')).toBe(DEFAULT_ACCENT);
  });
});

describe('applyBackground', () => {
  it('shows the image when enabled and one is chosen', () => {
    expect(applyBackground(layer, true, 'https://x/pic.jpg')).toBe(true);
    expect(layer.style.display).toBe('block');
    expect(layer.style.backgroundImage).toContain('pic.jpg');
  });

  it('hides the layer when switched off, and drops the image with it', () => {
    applyBackground(layer, true, 'https://x/pic.jpg');
    expect(applyBackground(layer, false, 'https://x/pic.jpg')).toBe(false);

    expect(layer.style.display).toBe('none');
    expect(layer.style.backgroundImage).toBe('');
  });

  it('treats enabled-with-no-image as nothing to show, not an error', () => {
    expect(applyBackground(layer, true, null)).toBe(false);
    expect(layer.style.display).toBe('none');
  });

  it('does nothing, and does not throw, without a layer', () => {
    expect(applyBackground(null, true, 'x.jpg')).toBe(false);
  });
});
