/* global DesignSystem */
/**
 * ZoomSystem — Universal Pan/Zoom System
 * Supports SVG (Mermaid) and Images (Assets) with a unified high-fidelity experience.
 *
 * The control bar owns only what every caller needs: fit, zoom out/in, percent.
 * Anything feature-specific (copying a Mermaid diagram's SVG, say) is injected
 * by the caller through `open(content, type, { actions })`, so a host that
 * doesn't want it simply doesn't pass it.
 */
window.ZoomSystem = (() => {
  'use strict';

  const _state = {
    scale: 1,
    x: 0,
    y: 0,
    isMoving: false,
    startX: 0,
    startY: 0,
    naturalW: 0,
    naturalH: 0,
    type: null, // 'svg' | 'image'
    isVisible: false
  };

  /**
   * Khởi tạo DOM của Zoom Modal nếu chưa tồn tại.
   */
  function _renderModal() {
    if (document.getElementById('zoom-modal')) return;

    const el = document.createElement('div');
    el.id = 'zoom-modal';
    el.innerHTML = `
      <button id="zoom-close" class="ds-icon-action-btn is-large" title="Close (Esc)">
        ${DesignSystem.getIcon('x', { width: 18, height: 18 })}
      </button>
      <div id="zoom-container"></div>
      <div id="zoom-controls-bar">
        <button class="ds-icon-action-btn is-large" id="zoom-fit-btn" title="Fit to screen">
          ${DesignSystem.getIcon('maximize-2', { width: 14, height: 14 })}
        </button>
        <div class="zoom-ctrl-divider"></div>
        <button class="ds-icon-action-btn is-large" id="zoom-out-btn" title="Zoom out">
          ${DesignSystem.getIcon('minus', { width: 14, height: 14 })}
        </button>
        <span id="zoom-pct">100%</span>
        <button class="ds-icon-action-btn is-large" id="zoom-in-btn" title="Zoom in">
          ${DesignSystem.getIcon('plus', { width: 14, height: 14 })}
        </button>
        <span id="zoom-actions"></span>
      </div>`;
    document.body.appendChild(el);
    _bindEvents();
  }

  /**
   * Dựng lại nhóm nút do caller cung cấp. Gọi mỗi lần open() vì mỗi caller
   * mang một bộ action khác nhau qua cùng một modal.
   * @param {Array<{id, icon, title, onClick}>} actions
   */
  function _renderActions(actions) {
    const slot = document.getElementById('zoom-actions');
    if (!slot) return;
    slot.innerHTML = '';
    if (!actions.length) return;

    const divider = document.createElement('div');
    divider.className = 'zoom-ctrl-divider';
    slot.appendChild(divider);

    actions.forEach(({ id, icon, title, onClick }) => {
      const btn = document.createElement('button');
      btn.className = 'ds-icon-action-btn is-large';
      btn.dataset.zoomAction = id;
      btn.title = title || '';
      btn.innerHTML = DesignSystem.getIcon(icon, { width: 14, height: 14 });
      btn.addEventListener('click', () => {
        onClick({ container: document.getElementById('zoom-container'), type: _state.type });
      });
      slot.appendChild(btn);
    });
  }

  function _updateTransform() {
    const el = document.getElementById('zoom-container');
    if (el) el.style.transform = `translate(${_state.x}px, ${_state.y}px) scale(${_state.scale})`;
  }

  function _updatePercent() {
    const pct = document.getElementById('zoom-pct');
    if (pct) pct.textContent = Math.round(_state.scale * 100) + '%';
  }

  /**
   * Căn chỉnh nội dung vừa khít màn hình.
   */
  function fit() {
    if (!_state.naturalW || !_state.naturalH) return;
    
    const padX = 80, padY = 130;
    const scaleX = (window.innerWidth - padX * 2) / _state.naturalW;
    const scaleY = (window.innerHeight - padY * 2) / _state.naturalH;
    
    _state.scale = Math.min(scaleX, scaleY, 1.5); // Không zoom quá 150% khi fit
    _state.x = (window.innerWidth - _state.naturalW * _state.scale) / 2;
    _state.y = (window.innerHeight - _state.naturalH * _state.scale) / 2;
    
    _updateTransform();
    _updatePercent();
  }

  /**
   * Mở overlay zoom cho nội dung bất kỳ.
   * @param {HTMLElement|string} content - Div chứa SVG hoặc URL hình ảnh.
   * @param {string} type - 'svg' hoặc 'image'.
   * @param {{actions?: Array<{id: string, icon: string, title: string, onClick: (ctx: {container: HTMLElement, type: string}) => void}>}} [options]
   */
  async function open(content, type = 'svg', options = {}) {
    _renderModal();
    const modal = document.getElementById('zoom-modal');
    const container = document.getElementById('zoom-container');
    if (!modal || !container) return;

    _state.type = type;
    _state.isVisible = true;
    container.innerHTML = '';

    _renderActions(options.actions || []);

    if (type === 'svg') {
      const svg = content.querySelector('svg');
      if (!svg) return;
      const clone = svg.cloneNode(true);
      const rect = svg.getBoundingClientRect();
      const vb = svg.viewBox?.baseVal;

      _state.naturalW = (vb && vb.width > 0) ? vb.width : (rect.width || 800);
      _state.naturalH = (vb && vb.height > 0) ? vb.height : (rect.height || 600);

      clone.setAttribute('width', _state.naturalW);
      clone.setAttribute('height', _state.naturalH);
      clone.style.cssText = `width:${_state.naturalW}px;height:${_state.naturalH}px;display:block;`;
      container.appendChild(clone);
    } else {
      // Image support
      const img = new Image();
      img.src = content;
      img.draggable = false;
      img.addEventListener('dragstart', e => e.preventDefault());
      await new Promise((resolve) => {
        img.onload = () => {
          _state.naturalW = img.naturalWidth;
          _state.naturalH = img.naturalHeight;
          img.style.cssText = `width:${_state.naturalW}px;height:${_state.naturalH}px;display:block;`;
          container.appendChild(img);
          resolve();
        };
      });
    }

    modal.classList.add('show');
    requestAnimationFrame(fit);
  }

  function close() {
    const modal = document.getElementById('zoom-modal');
    if (modal) modal.classList.remove('show');
    _state.isVisible = false;
  }

  function _bindEvents() {
    const modal = document.getElementById('zoom-modal');
    
    document.getElementById('zoom-close')?.addEventListener('click', close);
    document.getElementById('zoom-fit-btn')?.addEventListener('click', fit);

    document.getElementById('zoom-in-btn')?.addEventListener('click', () => {
      _state.scale = Math.min(10, _state.scale * 1.3);
      _state.x = (window.innerWidth - _state.naturalW * _state.scale) / 2;
      _state.y = (window.innerHeight - _state.naturalH * _state.scale) / 2;
      _updateTransform(); _updatePercent();
    });

    document.getElementById('zoom-out-btn')?.addEventListener('click', () => {
      _state.scale = Math.max(0.05, _state.scale / 1.3);
      _state.x = (window.innerWidth - _state.naturalW * _state.scale) / 2;
      _state.y = (window.innerHeight - _state.naturalH * _state.scale) / 2;
      _updateTransform(); _updatePercent();
    });

    window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    // Pan with mouse drag
    modal.addEventListener('mousedown', e => {
      if (e.target.closest('#zoom-close') || e.target.closest('#zoom-controls-bar')) return;
      _state.isMoving = true;
      _state.startX = e.clientX - _state.x;
      _state.startY = e.clientY - _state.y;
    });

    window.addEventListener('mousemove', e => {
      if (!_state.isMoving) return;
      _state.x = e.clientX - _state.startX;
      _state.y = e.clientY - _state.startY;
      _updateTransform();
    });

    window.addEventListener('mouseup', () => { _state.isMoving = false; });

    // Wheel zoom toward cursor
    modal.addEventListener('wheel', e => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const newScale = Math.min(10, Math.max(0.05, _state.scale * factor));
      const xs = (e.clientX - _state.x) / _state.scale;
      const ys = (e.clientY - _state.y) / _state.scale;
      _state.scale = newScale;
      _state.x = e.clientX - xs * _state.scale;
      _state.y = e.clientY - ys * _state.scale;
      _updateTransform();
      _updatePercent();
    }, { passive: false });

    // Touch support (Pan & Pinch)
    let initialPinchDist = 0;
    let initialPinchScale = 1;
    const getDist = (t1, t2) => Math.sqrt(Math.pow(t1.clientX - t2.clientX, 2) + Math.pow(t1.clientY - t2.clientY, 2));

    modal.addEventListener('touchstart', e => {
      if (e.target.closest('#zoom-close') || e.target.closest('#zoom-controls-bar')) return;
      if (e.touches.length === 1) {
        _state.isMoving = true;
        _state.startX = e.touches[0].clientX - _state.x;
        _state.startY = e.touches[0].clientY - _state.y;
      } else if (e.touches.length === 2) {
        _state.isMoving = false;
        initialPinchDist = getDist(e.touches[0], e.touches[1]);
        initialPinchScale = _state.scale;
      }
    }, { passive: true });

    modal.addEventListener('touchmove', e => {
      if (e.touches.length === 1 && _state.isMoving) {
        _state.x = e.touches[0].clientX - _state.startX;
        _state.y = e.touches[0].clientY - _state.startY;
        _updateTransform();
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const dist = getDist(e.touches[0], e.touches[1]);
        const factor = dist / (initialPinchDist || 1);
        const newScale = Math.min(10, Math.max(0.05, initialPinchScale * factor));
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const xs = (centerX - _state.x) / _state.scale;
        const ys = (centerY - _state.y) / _state.scale;
        _state.scale = newScale;
        _state.x = centerX - xs * _state.scale;
        _state.y = centerY - ys * _state.scale;
        _updateTransform();
        _updatePercent();
      }
    }, { passive: false });

    modal.addEventListener('touchend', () => { _state.isMoving = false; });
  }

  return {
    init: () => _renderModal(),
    open: (content, type, options) => open(content, type, options),
    close: () => close(),
    fit: () => fit()
  };
})();

