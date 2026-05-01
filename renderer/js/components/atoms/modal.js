/* global DesignSystem */
/**
 * ModalComponent (Atom)
 * Purpose: Provides standardized popover shields, confirmation dialogs, and prompts.
 */
const ModalComponent = (() => {
  'use strict';

  /**
   * Create a Popover Shield
   */
  function create(options = {}) {
    const {
      title = 'Modal',
      content = '',
      footer = null,
      className = '',
      width = null,
      hasBackdrop = true,
      showHeader = true,
      position = null,
      alignment = 'center', // 'center', 'bottom-left', or 'custom'
      container = document.body,
      onClose = null
    } = options;

    const shieldClass = hasBackdrop ? 'ds-popover-shield' : 'ds-popover-floating';
    const shield = DesignSystem.createElement('div', [shieldClass, `ds-popover-${alignment}`]);
    const isBody = container === document.body;
    shield.style.position = isBody ? 'fixed' : 'absolute';

    const card = DesignSystem.createElement('div', ['ds-popover-card', className]);
    if (width) card.style.width = width;
    if (position) {
      if (position.top) card.style.top = position.top;
      if (position.right) card.style.right = position.right;
      if (position.bottom) card.style.bottom = position.bottom;
      if (position.left) card.style.left = position.left;
      card.style.position = 'fixed';
      card.style.margin = '0';
    }

    const header = DesignSystem.createElement('div', 'ds-popover-header');
    const titleEl = DesignSystem.createElement('h2', 'ds-popover-title', { text: title });
    const closeBtn = DesignSystem.createElement('button', 'ds-popover-close', { 
      html: DesignSystem.getIcon('x') || '✕' 
    });

    const body = DesignSystem.createElement('div', 'ds-popover-body');
    if (content instanceof HTMLElement) {
      body.appendChild(content);
    } else if (typeof content === 'string') {
      body.innerHTML = content;
    }

    if (showHeader) {
      header.appendChild(titleEl);
      header.appendChild(closeBtn);
      card.appendChild(header);
    }
    card.appendChild(body);

    if (footer) {
      const footerEl = DesignSystem.createElement('div', 'ds-popover-footer');
      if (footer instanceof HTMLElement) {
        footerEl.appendChild(footer);
      } else {
        footerEl.innerHTML = footer;
      }
      card.appendChild(footerEl);
    }

    shield.appendChild(card);

    const closeAction = () => {
      shield.classList.remove('show');
      setTimeout(() => {
        shield.remove();
        if (onClose) onClose();
      }, 250);
    };

    closeBtn.onclick = closeAction;
    shield.onclick = (e) => {
      if (hasBackdrop && e.target === shield) closeAction();
    };

    container.appendChild(shield);
    setTimeout(() => shield.classList.add('show'), 10);

    if (!hasBackdrop) {
      const clickAway = (e) => {
        if (e.target.closest('.ds-popover-card')) return;
        if (!card.contains(e.target)) {
          closeAction();
          document.removeEventListener('click', clickAway, true);
        }
      };
      setTimeout(() => document.addEventListener('click', clickAway, true), 100);
    }

    const popoverInstance = { shield, card, body, close: closeAction };
    shield.__popover = popoverInstance;
    return popoverInstance;
  }

  /**
   * Show a confirmation dialog
   */
  function confirm({ title, message, onConfirm, onCancel }) {
    const content = DesignSystem.createElement('div', 'ds-confirm-content');
    content.innerHTML = `<p class="ds-confirm-message">${message}</p>`;

    const footer = DesignSystem.createElement('div', 'ds-confirm-footer');
    const cancelBtn = DesignSystem.createButton({ label: 'Cancel', variant: 'ghost' });
    const confirmBtn = DesignSystem.createButton({ label: 'Confirm', variant: 'primary' });

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    const popover = create({
      title,
      content,
      footer,
      width: '400px',
      className: 'ds-modal-confirm'
    });

    confirmBtn.onclick = async () => {
      try {
        if (onConfirm) await onConfirm();
      } finally {
        popover.close();
      }
    };
    cancelBtn.onclick = () => {
      if (onCancel) onCancel();
      popover.close();
    };
  }

  /**
   * Show a prompt dialog
   */
  function prompt(options) {
    const { title, message, placeholder, defaultValue = '', onConfirm, onCancel } = options;
    const content = DesignSystem.createElement('div', 'ds-prompt-content');
    const label = DesignSystem.createElement('label', 'ds-field-label', { text: message });
    const input = DesignSystem.createInput({ 
      type: 'text', 
      placeholder: placeholder, 
      value: defaultValue 
    });

    content.appendChild(label);
    content.appendChild(input);

    const footer = DesignSystem.createElement('div', 'ds-confirm-footer');
    const cancelBtn = DesignSystem.createButton({ label: 'Cancel', variant: 'ghost' });
    const confirmBtn = DesignSystem.createButton({ label: 'Continue', variant: 'primary' });

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    const popover = create({
      title,
      content,
      footer,
      width: '440px',
      className: 'ds-modal-prompt'
    });

    setTimeout(() => input.focus(), 150);

    confirmBtn.onclick = async () => {
      const val = input.value.trim();
      if (!val) {
        input.classList.add('ds-input-error');
        input.focus();
        return;
      }
      if (onConfirm) await onConfirm(val);
      popover.close();
    };

    input.oninput = () => input.classList.remove('ds-input-error');
    input.onkeydown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); confirmBtn.click(); }
      if (e.key === 'Escape') { e.preventDefault(); cancelBtn.click(); }
    };

    cancelBtn.onclick = () => {
      if (onCancel) onCancel();
      popover.close();
    };
  }

  return { create, confirm, prompt };
})();

window.ModalComponent = ModalComponent;
