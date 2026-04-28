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

  /**
   * Renders a skeleton loading state
   * @param {string} type - 'list' or 'map'
   * @param {number} count - Number of rows (for list)
   */
  function renderSkeleton(type = 'list', count = 6) {
    const frag = document.createDocumentFragment();
    
    if (type === 'list') {
      const widths = ['70%', '85%', '60%', '75%', '90%', '65%', '80%', '55%'];
      for (let i = 0; i < count; i++) {
        const row = DesignSystem.createElement('div', 'skeleton-row');
        const icon = DesignSystem.createElement('div', ['skeleton', 'skeleton-icon']);
        const text = DesignSystem.createElement('div', ['skeleton', 'skeleton-text']);
        text.style.width = widths[i % widths.length];

        row.appendChild(icon);
        row.appendChild(text);
        frag.appendChild(row);
      }
    } else if (type === 'map') {
      // For map, we show a full-height shimmer block or multiple blocks
      const container = DesignSystem.createElement('div', 'skeleton-map');
      for (let i = 0; i < 12; i++) {
        const row = DesignSystem.createElement('div', ['skeleton', 'skeleton-text'], {
          style: `width: ${Math.random() * 40 + 60}%; height: 12px; margin-bottom: 12px;`
        });
        container.appendChild(row);
      }
      frag.appendChild(container);
    }
    
    return frag;
  }

  return {
    applySmartScrollMask,
    renderSkeleton
  };
})();

// Export to global scope
window.UIUtils = UIUtils;
