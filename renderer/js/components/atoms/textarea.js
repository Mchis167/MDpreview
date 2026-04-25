/* ============================================================
   textarea.js — Reusable Text Area Component Logic
   ============================================================ */

const TextAreaModule = (() => {

  /**
   * Initialize a textarea component
   * @param {Object} options 
   * @param {string} options.containerId - ID of the textarea-component container
   * @param {string} options.inputId - ID of the main textarea
   * @param {string} options.expandBtnId - ID of the expand button
   * @param {string} options.modalId - ID of the expanded modal
   * @param {string} options.modalInputId - ID of the textarea inside the modal
   * @param {string} options.minimizeBtnId - ID of the minimize button in modal
   * @param {string} options.label - Optional text to sync across all .textarea-label elements
   * @param {Function} options.onInput - Optional callback on input change
   */
  function init(options) {
    const container = document.getElementById(options.containerId);
    const input = document.getElementById(options.inputId);
    const expandBtn = document.getElementById(options.expandBtnId);
    const modal = document.getElementById(options.modalId);
    const modalInput = document.getElementById(options.modalInputId);
    const minimizeBtn = document.getElementById(options.minimizeBtnId);

    if (!input || !container) return;

    // ── Label Synchronization ────────────────────────────────
    if (options.label) {
      const allLabels = [
        ...container.querySelectorAll('.textarea-label'),
        ...(modal ? modal.querySelectorAll('.textarea-label') : [])
      ];
      allLabels.forEach(lbl => lbl.textContent = options.label);
    }

    // ── State Transitions ──────────────────────────────────────
    input.addEventListener('focus', () => container.classList.add('is-typing'));
    input.addEventListener('blur', () => container.classList.remove('is-typing'));

    const updateFilledState = (val) => {
      const isFilled = !!(val && val.trim());
      container.classList.toggle('is-filled', isFilled);
    };

    // ── Input Syncing & Callbacks ──────────────────────────────
    input.addEventListener('input', () => {
      const val = input.value;
      updateFilledState(val);
      if (modalInput && modal.classList.contains('show')) {
        modalInput.value = val;
      }
      if (options.onInput) options.onInput(val);
    });

    // ── Expansion / Minimization ──────────────────────────────
    if (expandBtn && modal && modalInput) {
      expandBtn.addEventListener('click', () => {
        modalInput.value = input.value;
        modal.classList.add('show');
        setTimeout(() => modalInput.focus(), 50);
      });

      const closeModal = () => {
        input.value = modalInput.value;
        updateFilledState(input.value);
        modal.classList.remove('show');
        input.focus();
        if (options.onInput) options.onInput(input.value);
      };

      if (minimizeBtn) {
        minimizeBtn.addEventListener('click', closeModal);
      }

      // Backdrop click to close
      const backdrop = modal.querySelector('.expanded-textarea-backdrop');
      if (backdrop) {
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) closeModal();
        });
      }

      modalInput.addEventListener('input', () => {
        const val = modalInput.value;
        input.value = val;
        updateFilledState(val);
        if (options.onInput) options.onInput(val);
      });

      // Escape key to close modal
      modalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeModal();
        }
      });
    }

    // Initial state check
    updateFilledState(input.value);
  }

  return { init };
})();
window.TextAreaModule = TextAreaModule;
