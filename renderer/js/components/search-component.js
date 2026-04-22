/* ============================================================
   search-component.js — Reusable Search Bar Component
   ============================================================ */

const SearchComponent = (() => {
  /**
   * Creates a new search bar instance
   * @param {Object} options 
   * @param {string} options.placeholder
   * @param {Function} options.onInput - Called on value change
   * @param {Function} options.onExit - Called on 'X' button click
   * @returns {HTMLElement} The root element of the component
   */
  function create({ placeholder = 'Search...', onInput, onExit }) {
    const group = document.createElement('div');
    group.className = 'sidebar-search-input-group';
    
    group.innerHTML = `
      <div class="sidebar-search-inner">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="${placeholder}" autocomplete="off">
      </div>
      <button class="exit-search-btn" title="Exit search">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    const input = group.querySelector('input');
    const exitBtn = group.querySelector('.exit-search-btn');

    // Prevent input from causing parent overflow
    input.style.minWidth = '0';

    if (onInput) {
      input.addEventListener('input', (e) => onInput(e.target.value));
    }

    if (onExit) {
      exitBtn.addEventListener('click', () => {
        input.value = '';
        onExit();
      });
    }

    // Expose methods via the element
    group.focus = () => {
      if (input) input.focus();
    };
    group.clear = () => {
      if (input) input.value = '';
    };
    group.getValue = () => input ? input.value : '';

    return group;
  }

  return { create };
})();
