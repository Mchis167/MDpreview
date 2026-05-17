/**
 * MonacoImagePreviewComponent
 * Purpose: Floating image preview panel for Monaco Editor hover.
 * Pattern: IIFE Singleton
 */

const MonacoImagePreviewComponent = (() => {
  'use strict';

  let _el = null;
  let _img = null;
  let _activeUrl = null;
  let _hideTimer = null;

  function _build() {
    if (_el) return;

    _el = document.createElement('div');
    _el.className = 'ds-monaco-image-preview';

    _el.innerHTML = `
      <div class="ds-monaco-image-preview__body">
        <img class="ds-monaco-image-preview__img" alt="">
      </div>
    `;

    _img = _el.querySelector('.ds-monaco-image-preview__img');

    document.body.appendChild(_el);
  }

  /**
   * @param {string} url - Resolved image URL
   * @param {number} anchorX - Viewport X of anchor (link start)
   * @param {number} anchorBottom - Viewport Y of bottom of the line
   * @param {number} anchorTop - Viewport Y of top of the line (fallback above)
   */
  function show(url, anchorX, anchorBottom, anchorTop) {
    if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null; }

    _build();

    const thumbUrl = `${url}?thumbnail=true`;
    if (_activeUrl !== thumbUrl) {
      _activeUrl = thumbUrl;
      _img.src = thumbUrl;
    }

    // Dimensions
    const PANEL_W = 340;
    const PANEL_H = 280;
    const GAP = 10;

    // Horizontal: align to anchor, clamp to viewport
    let left = anchorX;
    if (left + PANEL_W > window.innerWidth - 16) {
      left = window.innerWidth - PANEL_W - 16;
    }
    left = Math.max(16, left);

    // Vertical: prefer below, fallback above
    let top = anchorBottom + GAP;
    if (top + PANEL_H > window.innerHeight - 16) {
      top = anchorTop - PANEL_H - GAP;
    }
    top = Math.max(16, top);

    _el.style.left = `${left}px`;
    _el.style.top = `${top}px`;
    _el.classList.add('visible');
  }

  function hide() {
    if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null; }
    if (_el) _el.classList.remove('visible');
    _activeUrl = null;
  }

  function destroy() {
    hide();
    if (_el) { _el.remove(); _el = null; _img = null; }
    _activeUrl = null;
  }

  return { show, hide, destroy };
})();

window.MonacoImagePreviewComponent = MonacoImagePreviewComponent;
