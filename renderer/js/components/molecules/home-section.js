/**
 * HomeSection.js — Reusable section container for Home dashboard.
 * 
 * Target: Home screen (Pinned Documents, Continue Edit).
 * Standard: Atomic Design V2 (Molecule).
 */
const HomeSection = (() => {
  'use strict';

  /**
   * Creates a section element with a title and a grid of cards.
   * @param {Object} options 
   * @param {string} options.title - Section title
   * @param {Array} options.items - Array of card options for HomeCard.create()
   * @param {string} [options.className] - Optional extra class name
   * @returns {HTMLElement}
   */
  function create(options = {}) {
    const { title, items, className } = options;
    if (!items || items.length === 0) return null;

    const section = DesignSystem.createElement('div', `ds-home-section ${className || ''}`.trim());
    
    const titleEl = DesignSystem.createElement('div', 'ds-home-section-title', {
      text: title
    });
    section.appendChild(titleEl);

    const grid = DesignSystem.createElement('div', 'ds-home-grid');
    
    items.forEach(item => {
      const card = window.HomeCard ? window.HomeCard.create(item) : null;
      if (card) grid.appendChild(card);
    });

    section.appendChild(grid);
    return section;
  }

  return {
    create
  };
})();

window.HomeSection = HomeSection;
