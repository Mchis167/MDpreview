/* ============================================================
   theme-kit/theme.js — turning appearance settings into CSS.

   Pure in the sense that matters: every function is told which
   document root or element to write to, and reads nothing global.
   That makes it testable directly, and lets a host apply a theme
   to something other than `document` if it ever needs to.

   The design system reads --accent-color / --accent-rgb through
   its own --ds-accent tokens, so setting those two variables is
   all it takes to re-tint everything.
   ============================================================ */

(function () {

// Nine presets, deliberately a fixed list rather than a free colour
// picker: the design system tints borders, glows and shadows from the
// accent, and an arbitrary hex can land somewhere those read as broken.
const ACCENT_COLORS = [
  { name: 'Orange', value: '#ffbf48' },
  { name: 'Red', value: '#FF4500' },
  { name: 'Pink', value: '#FF69B4' },
  { name: 'Purple', value: '#9370DB' },
  { name: 'Blue', value: '#1E90FF' },
  { name: 'Teal', value: '#40E0D0' },
  { name: 'Cyan', value: '#00FFFF' },
  { name: 'Lime', value: '#00FF00' },
  { name: 'Green', value: '#ADFF2F' }
];

const DEFAULT_ACCENT = ACCENT_COLORS[0].value;

/** @returns {{r,g,b}|null} null for anything that isn't a 6-digit hex. */
function hexToRgb(hex) {
  if (typeof hex !== 'string') return null;
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

/**
 * The chevron on a <select> is a background image, so it cannot inherit
 * currentColor — it has to be regenerated whenever the accent changes.
 */
function selectArrowUrl(color) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" ` +
    `fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" ` +
    `stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * Paint one accent colour onto a document root.
 * @param {HTMLElement} root usually document.documentElement
 * @param {string} hex
 * @returns {string} the colour actually applied — the default when `hex`
 *   was not a usable one, so callers can persist what they really used.
 */
function applyAccent(root, hex) {
  if (!root || !root.style) return DEFAULT_ACCENT;

  const rgb = hexToRgb(hex);
  const color = rgb ? hex : DEFAULT_ACCENT;
  const parts = rgb || hexToRgb(DEFAULT_ACCENT);

  root.style.setProperty('--accent-color', color);
  root.style.setProperty('--accent-rgb', `${parts.r}, ${parts.g}, ${parts.b}`);
  root.style.setProperty('--select-arrow', selectArrowUrl(color));
  return color;
}

/**
 * Show or hide the background layer behind the app.
 *
 * An enabled background with no image chosen yet is not an error — it
 * simply has nothing to show, and hiding the layer is the honest result.
 * @param {HTMLElement} layerEl the fixed, full-bleed background element
 */
function applyBackground(layerEl, enabled, src) {
  if (!layerEl || !layerEl.style) return false;

  const on = !!enabled && !!src;
  if (on) layerEl.style.backgroundImage = `url(${src})`;
  else layerEl.style.backgroundImage = '';
  layerEl.style.display = on ? 'block' : 'none';
  return on;
}

const exportsObj = {
  ACCENT_COLORS,
  DEFAULT_ACCENT,
  hexToRgb,
  selectArrowUrl,
  applyAccent,
  applyBackground
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exportsObj;
}
if (typeof window !== 'undefined') {
  window.ThemeKit = exportsObj;
}

})();
