/**
 * ScrollContainer Molecule
 * Purpose: Provides a standard scrollable container with mask-fading and an automatic safe zone.
 * Dependencies: DesignSystem
 */
const ScrollContainer = (() => {
  'use strict';

  /**
   * Create a scrollable container
   * @param {HTMLElement} contentEl - The content to be scrolled
   * @param {Object} options - Configuration options
   * @param {string} options.id - Optional ID for the container
   * @param {string} options.className - Optional additional class
   * @param {number} options.safeHeight - Custom safe zone height (px)
   * @param {boolean} options.enableFade - Enable/disable mask fade (default: true)
   * @param {boolean} options.enableSafeZone - Enable/disable safe zone spacer (default: true)
   */
  function create(contentEl, options = {}) {
    const { id, className, safeHeight, enableFade = true, _enableSafeZone = true } = options;

    // 1. Create Main Container
    const container = document.createElement('div');
    container.className = `ds-scroll-container ${className || ''}`.trim();
    if (id) container.id = id;

    // 2. Create Content Wrapper (to ensure children are handled correctly)
    const wrapper = document.createElement('div');
    wrapper.className = 'ds-scroll-content';
    wrapper.appendChild(contentEl);
    container.appendChild(wrapper);

    // 3. Create Safe Zone (Always create, but visibility controlled by CSS)
    const safeZone = document.createElement('div');
    safeZone.className = 'ds-scroll-safe-zone';
    if (safeHeight) {
      safeZone.style.setProperty('--ds-scroll-safe-height', `${safeHeight}px`);
    }
    container.appendChild(safeZone);

    // 4. Handle Mask Fade Logic
    if (enableFade) {
      _initFadeLogic(container);
    }

    // 5. Automatic Scrollable Detection (Dynamic Safe Zone)
    _initScrollableDetection(container);

    return container;
  }

  /**
   * Private: Initialize ResizeObserver to detect if container is scrollable
   */
  function _initScrollableDetection(container) {
    const checkScrollable = () => {
      const isScrollable = container.scrollHeight > container.clientHeight + 2; // +2 for buffer
      container.classList.toggle('is-scrollable', isScrollable);
    };

    if (window.ResizeObserver) {
      const observer = new ResizeObserver(() => {
        requestAnimationFrame(checkScrollable);
      });
      observer.observe(container);
      // Also observe the content wrapper for better accuracy
      const wrapper = container.querySelector('.ds-scroll-content');
      if (wrapper) observer.observe(wrapper);
    } else {
      // Fallback
      window.addEventListener('resize', checkScrollable);
      setTimeout(checkScrollable, 100);
    }
  }

  /**
   * Private: Initialize scroll listener to update mask fade
   */
  function _initFadeLogic(container) {
    const updateFade = () => {
      const scrollTop = container.scrollTop;
      const topFade = Math.min(scrollTop, 16);
      container.style.setProperty('--_fade-top', `${topFade}px`);
    };

    container.addEventListener('scroll', updateFade, { passive: true });
    requestAnimationFrame(updateFade);
  }

  return {
    create
  };
})();

// Explicit export to global scope
window.ScrollContainer = ScrollContainer;
