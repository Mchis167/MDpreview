/* global DesignSystem */
/**
 * SegmentedControlComponent (Atom)
 * Purpose: Provides a standardized segmented control with a sliding indicator.
 */
const SegmentedControlComponent = (() => {
  'use strict';

  /**
   * Create a segmented control
   */
  function create(options = {}) {
    const {
      items = [],
      activeId = null,
      onChange = null,
      radius = 'var(--ds-radius-panel)',
      className = ''
    } = options;

    const control = DesignSystem.createElement('div', ['ds-segmented-control', className]);
    control.style.setProperty('--_radius', radius);

    const indicator = DesignSystem.createElement('div', 'ds-segment-indicator');
    control.appendChild(indicator);

    items.forEach(itemData => {
      const item = DesignSystem.createElement('div', 'ds-segment-item', {
        'data-id': itemData.id,
        'html': DesignSystem.getIcon(itemData.icon)
      });

      if (itemData.title) {
        DesignSystem.applyTooltip(item, itemData.title, options.tooltipPos || 'bottom');
      }

      if (itemData.id === activeId) item.classList.add('active');

      item.addEventListener('mousedown', (e) => e.preventDefault());
      item.addEventListener('click', () => {
        if (onChange) onChange(itemData.id);
      });

      control.appendChild(item);
    });

    const instance = {
      el: control,
      indicator,
      updateActive: (id) => {
        const allItems = control.querySelectorAll('.ds-segment-item');
        let activeItem = null;
        allItems.forEach(item => {
          const isActive = item.getAttribute('data-id') === id;
          item.classList.toggle('active', isActive);
          if (isActive) activeItem = item;
        });

        if (indicator && activeItem) {
          requestAnimationFrame(() => {
            indicator.style.width = `${activeItem.offsetWidth}px`;
            indicator.style.height = `${activeItem.offsetHeight}px`;
            indicator.style.left = `${activeItem.offsetLeft}px`;
            indicator.style.top = `${activeItem.offsetTop}px`;
          });
        }
      }
    };

    if (activeId) {
      setTimeout(() => instance.updateActive(activeId), 0);
    }

    return instance;
  }

  return { create };
})();

window.SegmentedControlComponent = SegmentedControlComponent;
