/**
 * MonacoImagePreviewComponent
 * Purpose: Provides a custom floating preview for images in Monaco Editor.
 * Pattern: IIFE Singleton
 */

/* global DesignSystem */

const MonacoImagePreviewComponent = (() => {
  'use strict';

  let _el = null;
  let _activeUrl = null;
  let _hideTimer = null;

  /**
   * Create the preview element if it doesn't exist
   */
  function _create() {
    if (_el) return _el;

    _el = DesignSystem.createElement('div', 'ds-monaco-image-preview');
    _el.innerHTML = `
      <div class="ds-monaco-image-preview__header">IMAGE PREVIEW</div>
      <div class="ds-monaco-image-preview__body">
        <img class="ds-monaco-image-preview__img" src="" alt="Loading...">
      </div>
      <div class="ds-monaco-image-preview__footer"></div>
    `;

    document.body.appendChild(_el);
    return _el;
  }

  return {
    /**
     * Show the preview below a target rectangle
     * @param {string} url - Resolved image URL
     * @param {Object} rect - { left, top, right, bottom } in viewport pixels
     */
    show(url, rect) {
      if (_hideTimer) clearTimeout(_hideTimer);
      
      const el = _create();
      const img = el.querySelector('.ds-monaco-image-preview__img');
      const footer = el.querySelector('.ds-monaco-image-preview__footer');

      const fullUrl = `${url}?thumbnail=true`;

      if (_activeUrl !== fullUrl) {
        _activeUrl = fullUrl;
        img.src = fullUrl;
        footer.textContent = url.split('/').pop() || url;
      }

      // Position logic: ALWAYS BELOW
      const padding = 12;
      let left = rect.left;
      let top = rect.bottom + padding;

      // Keep within viewport horizontally
      const width = 340;
      if (left + width > window.innerWidth) {
        left = window.innerWidth - width - 20;
      }
      left = Math.max(20, left);

      // If bottom overflow, show above instead (fallback for edge cases)
      const height = 280;
      if (top + height > window.innerHeight) {
        top = rect.top - height - padding;
      }

      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
      el.classList.add('visible');
    },

    /**
     * Hide the preview with a small debounce to prevent flickering
     */
    hide() {
      if (_hideTimer) clearTimeout(_hideTimer);
      _hideTimer = setTimeout(() => {
        if (_el && _el.classList.contains('visible')) {
          _el.classList.remove('visible');
        }
        _activeUrl = null;
      }, 150);
    }
  };
})();

window.MonacoImagePreviewComponent = MonacoImagePreviewComponent;
