/**
 * UIUtils — General UI helper functions
 * Purpose: Provide shared UI logic like smart masks, transitions, etc.
 */
const UIUtils = (() => {
  'use strict';

  /**
   * Applies a smart scroll mask to a container
   * @param {HTMLElement} container - The scrollable element
   * @param {Object} options - Configuration
   * @param {number} options.fadeHeight - Height of the fade effect (px)
   */
  function applySmartScrollMask(container, options = {}) {
    if (!container) return;
    const { fadeHeight = 16 } = options;

    const updateFade = () => {
      const scrollTop = container.scrollTop;
      const topFade = Math.min(scrollTop, fadeHeight);
      container.style.setProperty('--_fade-top', `${topFade}px`);
    };

    const checkScrollable = () => {
      const isScrollable = container.scrollHeight > container.clientHeight + 2;
      container.classList.toggle('is-scrollable', isScrollable);
      updateFade();
    };

    container.addEventListener('scroll', updateFade, { passive: true });

    if (window.ResizeObserver) {
      const observer = new ResizeObserver(() => {
        requestAnimationFrame(checkScrollable);
      });
      observer.observe(container);
    } else {
      window.addEventListener('resize', checkScrollable);
    }

    // Initial check
    requestAnimationFrame(checkScrollable);
  }

  return {
    applySmartScrollMask
  };
})();

// Export to global scope
window.UIUtils = UIUtils;
