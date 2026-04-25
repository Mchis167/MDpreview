/* ============================================================
   switch-toggle.js — Reusable Toggle Component Logic
   ============================================================ */

const SwitchToggleModule = (() => {

  /**
   * Initialize a switch toggle component
   * @param {Object} options 
   * @param {string} options.containerId - ID of the element to turn into a toggle
   * @param {boolean} options.isOn - Initial state (default: false)
   * @param {boolean} options.disabled - Initial disabled state (default: false)
   * @param {Function} options.onChange - Optional callback on change(isOn)
   */
  function init(options) {
    const el = options.element || document.getElementById(options.containerId);
    if (!el) {
      console.warn(`[SwitchToggleModule] Element not found: ${options.containerId}`);
      return null;
    }

    // ── Setup HTML if needed ───────────────────────────────────
    // If the element is empty, we inject the indicator
    if (el.children.length === 0) {
      el.classList.add('switch-toggle');
      const indicator = document.createElement('div');
      indicator.className = 'switch-indicator';
      el.appendChild(indicator);
    }

    // ── State Management ───────────────────────────────────────
    let isOn = !!options.isOn;
    let isDisabled = !!options.disabled;

    const updateUI = () => {
      el.classList.toggle('on', isOn);
      el.classList.toggle('disabled', isDisabled);
    };

    const toggle = (force) => {
      if (isDisabled) return;
      isOn = (typeof force === 'boolean') ? force : !isOn;
      updateUI();
      if (options.onChange) options.onChange(isOn);
    };

    const setDisabled = (val) => {
      isDisabled = !!val;
      updateUI();
    };

    // ── Interaction ──────────────────────────────────────────
    el.addEventListener('click', (e) => {
      e.preventDefault();
      toggle();
    });

    // Handle spacebar/enter if focused (if we make it focusable)
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'switch');
    el.setAttribute('aria-checked', isOn);

    el.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggle();
      }
    });

    // Initial sync
    updateUI();

    // ── Exposed Public API ────────────────────────────────────
    return {
      toggle,
      setDisabled,
      get isOn() { return isOn; }
    };
  }

  return { init };
})();
window.SwitchToggleModule = SwitchToggleModule;
