/* ============================================================
   mockup-images.js — Image Mockup Wrapper Post-processor
   Wraps <img> elements with UI frames (browser, phone) based on URL hash.
   Usage: ![Alt text](image.png#browser)  or  ![Alt text](image.png#phone:scroll)
   ============================================================ */

(() => {
'use strict';

const MockupImageModule = {
  TYPES: {
    browser: '_buildBrowserFrame',
    phone: '_buildPhoneFrame',
  },

  process(container) {
    if (!container) return;
    const images = container.querySelectorAll('img');
    images.forEach(imgEl => {
      const meta = this._extractMockupMeta(imgEl.getAttribute('src'));
      if (!meta || !this.TYPES[meta.type]) return;
      if (imgEl.dataset.mockupProcessed) return;

      const builder = this.TYPES[meta.type];
      const parent = imgEl.parentNode;
      const nextSibling = imgEl.nextSibling;
      imgEl.dataset.mockupProcessed = '1';
      const wrapper = this[builder](imgEl, meta.modifiers);
      if (parent) parent.insertBefore(wrapper, nextSibling);
    });
  },

  /**
   * Extract mockup type + modifiers from src hash fragment.
   * e.g. "image.png#browser:scroll" → { type: "browser", modifiers: Set{"scroll"} }
   */
  _extractMockupMeta(src) {
    if (!src) return null;
    const hashIndex = src.indexOf('#');
    if (hashIndex === -1) return null;
    const fragment = src.slice(hashIndex + 1).split('#')[0].toLowerCase();
    if (!fragment) return null;
    const [type, ...mods] = fragment.split(':');
    return { type, modifiers: new Set(mods) };
  },

  _buildBrowserFrame(imgEl, modifiers) {
    const scroll = modifiers && modifiers.has('scroll');
    const frame = document.createElement('div');
    frame.className = 'mockup-browser-frame';

    const chrome = document.createElement('div');
    chrome.className = 'mockup-browser-chrome';
    chrome.innerHTML = `
      <span class="mockup-browser-dot"></span>
      <span class="mockup-browser-dot"></span>
      <span class="mockup-browser-dot"></span>
      <span class="mockup-browser-addressbar"></span>
    `;

    const content = document.createElement('div');
    content.className = scroll ? 'mockup-browser-content is-scrollable' : 'mockup-browser-content';
    content.appendChild(imgEl);

    frame.appendChild(chrome);
    frame.appendChild(content);

    this._disableNativeDrag(imgEl);

    if (scroll) {
      this._enableDragToScroll(imgEl, content);
    } else {
      imgEl.addEventListener('load', () => {
        const { naturalWidth, naturalHeight } = imgEl;
        if (naturalWidth > 0) {
          const w = content.offsetWidth || naturalWidth;
          content.style.height = `${Math.round((naturalHeight / naturalWidth) * w)}px`;
        }
      });
      if (imgEl.complete && imgEl.naturalWidth > 0) {
        imgEl.dispatchEvent(new Event('load'));
      }
    }

    return frame;
  },

  _buildPhoneFrame(imgEl, modifiers) {
    const scroll = modifiers && modifiers.has('scroll');
    const frame = document.createElement('div');
    frame.className = 'mockup-phone-frame';

    const device = document.createElement('div');
    device.className = 'mockup-phone-device';

    const notch = document.createElement('div');
    notch.className = 'mockup-phone-notch';

    const content = document.createElement('div');
    content.className = scroll ? 'mockup-phone-content is-scrollable' : 'mockup-phone-content';
    content.appendChild(imgEl);

    device.appendChild(notch);
    device.appendChild(content);
    frame.appendChild(device);

    this._disableNativeDrag(imgEl);

    if (scroll) {
      this._enableDragToScroll(imgEl, content);
    } else {
      imgEl.addEventListener('load', () => {
        const { naturalWidth, naturalHeight } = imgEl;
        if (naturalWidth > 0) {
          const w = content.offsetWidth || naturalWidth;
          content.style.height = `${Math.round((naturalHeight / naturalWidth) * w)}px`;
        }
      });
      if (imgEl.complete && imgEl.naturalWidth > 0) {
        imgEl.dispatchEvent(new Event('load'));
      }
    }

    return frame;
  },

  _disableNativeDrag(imgEl) {
    imgEl.draggable = false;
    imgEl.addEventListener('dragstart', e => e.preventDefault());
  },

  _enableDragToScroll(imgEl, scrollEl) {
    const DRAG_THRESHOLD = 5;
    let startY = 0;
    let startScrollTop = 0;
    let dragging = false;
    let moved = false;

    imgEl.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      dragging = true;
      moved = false;
      startY = e.clientY;
      startScrollTop = scrollEl.scrollTop;
      scrollEl.classList.add('is-dragging');
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const delta = startY - e.clientY;
      if (!moved && Math.abs(delta) >= DRAG_THRESHOLD) moved = true;
      scrollEl.scrollTop = startScrollTop + delta;
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      scrollEl.classList.remove('is-dragging');
      if (!moved && window.ZoomSystem) {
        window.ZoomSystem.open(imgEl.src, 'image');
      }
      moved = false;
    });
  },
};

window.MockupImageModule = MockupImageModule;

})();
