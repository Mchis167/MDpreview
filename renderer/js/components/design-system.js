/* ============================================================
   design-system.js — Core Design System Module
   ============================================================ */

const DesignSystem = (() => {
  /**
   * Helper to create a DOM element with classes and attributes
   */
  const ICONS = {
    'trash': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
    'trash-2': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
    'copy': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>`,
    'message': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    'message-square': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    'message-circle': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>`,
    'bookmark': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`,
    'book-open': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    'pen-line': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    'x': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    'maximize-2': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`,
    'minimize-2': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`,
    'folder': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`,
    'edit': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    'plus': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`
  };


  /**
   * Helper to create a DOM element with classes and attributes
   */
  function createElement(tag, className, attributes = {}) {
    const el = document.createElement(tag);
    if (className) {
      if (Array.isArray(className)) {
        const validClasses = className.filter(c => c && typeof c === 'string' && c.trim() !== '');
        if (validClasses.length > 0) el.classList.add(...validClasses);
      } else if (className && className.trim() !== '') {
        el.className = className;
      }
    }
    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'text') el.textContent = value;
      else if (key === 'html') el.innerHTML = value;
      else el.setAttribute(key, value);
    }
    return el;
  }

  return {
    createElement,
    ICONS,
    /**
     * Helper to get an icon SVG from the registry
     */
    getIcon: (name) => ICONS[name] || '',
    /**
     * Helper to create a 48x48 square action button
     */
    createHeaderAction: (iconName, title, onClick) => {
      const iconHtml = ICONS[iconName] || iconName; // Fallback to raw string if not in registry
      
      const btn = createElement('button', 'ds-header-action', {
        'title': title,
        'html': iconHtml
      });
      if (onClick) btn.onclick = onClick;
      return btn;
    },

    /**
     * Helper to create a select dropdown
     */
    createSelect: (options = [], currentVal, onChange) => {
      const select = createElement('select', 'ds-select');
      options.forEach(opt => {
        const value = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const el = createElement('option', '', { value, text: label });
        if (value === currentVal) el.selected = true;
        select.appendChild(el);
      });
      if (onChange) select.onchange = (e) => onChange(e.target.value);
      return select;
    },

    /**
     * Create a Popover Shield (Backdrop + Modal Container)
     * Highly reusable for Settings, Workspace Picker, Confirm Modals, etc.
     */
    createPopoverShield: (options = {}) => {
      const { 
        title = 'Modal', 
        content = '', 
        footer = null,
        className = '',
        width = null,
        hasBackdrop = true,
        showHeader = true,
        position = null, // { top, right, bottom, left }
        container = document.body,
        onClose = null 
      } = options;

      const shieldClass = hasBackdrop ? 'ds-popover-shield' : 'ds-popover-floating';
      const shield = createElement('div', shieldClass);
      
      // If mounting to body, use fixed. If mounting to sub-container, use absolute.
      const isBody = container === document.body;
      shield.style.position = isBody ? 'fixed' : 'absolute';

      const card = createElement('div', ['ds-popover-card', className]);
      
      if (width) card.style.width = width;
      if (position) {
        if (position.top) card.style.top = position.top;
        if (position.right) card.style.right = position.right;
        if (position.bottom) card.style.bottom = position.bottom;
        if (position.left) card.style.left = position.left;
        card.style.position = 'fixed';
        card.style.margin = '0';
      }

      // ── Header ──────────────────────────────────────────
      const header = createElement('div', 'ds-popover-header');
      const titleEl = createElement('h2', 'ds-popover-title', { text: title });
      const closeBtn = createElement('button', 'ds-popover-close', {
        html: ICONS['x'] || '✕'
      });

      // ── Body ────────────────────────────────────────────
      const body = createElement('div', 'ds-popover-body');
      if (content instanceof HTMLElement) {
        body.appendChild(content);
      } else if (typeof content === 'string') {
        body.innerHTML = content;
      }

      // ── Assemble ────────────────────────────────────────
      if (showHeader) {
        header.appendChild(titleEl);
        header.appendChild(closeBtn);
        card.appendChild(header);
      }
      card.appendChild(body);

      // ── Footer (Optional) ───────────────────────────────
      if (footer) {
        const footerEl = createElement('div', 'ds-popover-footer');
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
        }, 250); // Match CSS transition
      };

      closeBtn.onclick = closeAction;
      shield.onclick = (e) => {
        if (hasBackdrop && e.target === shield) closeAction();
      };

      // Auto-show
      container.appendChild(shield);
      setTimeout(() => shield.classList.add('show'), 10);

      // Global click-away for non-backdrop floating popovers
      if (!hasBackdrop) {
        const clickAway = (e) => {
          if (!card.contains(e.target)) {
            closeAction();
            document.removeEventListener('click', clickAway, true);
          }
        };
        // Delay adding listener to avoid immediate trigger from the button that opened it
        setTimeout(() => document.addEventListener('click', clickAway, true), 100);
      }

      // Store instance for child interaction
      const popoverInstance = {
        shield,
        card,
        body,
        close: closeAction
      };
      shield.__popover = popoverInstance;

      return popoverInstance;
    }
  };
})();
