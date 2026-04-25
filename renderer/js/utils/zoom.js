/* ============================================================
   zoom.js — Mermaid diagram zoom modal
   Handles pan, zoom, wheel zoom, and close interactions.
   openZoom() is a global called from mermaid.js
   ============================================================ */

(() => {
'use strict';

let zoomScale = 1, zoomX = 0, zoomY = 0;
let zoomMoving = false, zoomStartX = 0, zoomStartY = 0;
let _zoomNatW = 0, _zoomNatH = 0;

function renderZoomModal() {
  if (document.getElementById('zoom-modal')) return;
  const icon = (path) => `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  const el = document.createElement('div');
  el.id = 'zoom-modal';
  el.innerHTML = `
    <button id="zoom-close" title="Close (Esc)">
      ${icon('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>')}
    </button>
    <div id="zoom-container"></div>
    <div id="zoom-controls-bar">
      <button class="zoom-ctrl-btn" id="zoom-fit-btn" title="Fit to screen">
        ${icon('<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>')}
      </button>
      <div class="zoom-ctrl-divider"></div>
      <button class="zoom-ctrl-btn" id="zoom-out-btn" title="Zoom out">
        ${icon('<line x1="5" y1="12" x2="19" y2="12"/>')}
      </button>
      <span id="zoom-pct">100%</span>
      <button class="zoom-ctrl-btn" id="zoom-in-btn" title="Zoom in">
        ${icon('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>')}
      </button>
      <div class="zoom-ctrl-divider"></div>
      <button class="zoom-ctrl-btn" id="zoom-copy-btn" title="Copy SVG code">
        ${icon('<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>')}
      </button>
    </div>`;
  document.body.appendChild(el);
}

function updateZoomTransform() {
  const el = document.getElementById('zoom-container');
  if (el) el.style.transform = `translate(${zoomX}px, ${zoomY}px) scale(${zoomScale})`;
}

function updateZoomPercent() {
  const pct = document.getElementById('zoom-pct');
  if (pct) pct.textContent = Math.round(zoomScale * 100) + '%';
}

function fitZoom() {
  if (!_zoomNatW || !_zoomNatH) return;
  const padX = 80, padY = 130;
  const scaleX = (window.innerWidth  - padX * 2) / _zoomNatW;
  const scaleY = (window.innerHeight - padY * 2) / _zoomNatH;
  zoomScale = Math.min(scaleX, scaleY);
  zoomX = (window.innerWidth  - _zoomNatW * zoomScale) / 2;
  zoomY = (window.innerHeight - _zoomNatH * zoomScale) / 2;
  updateZoomTransform();
  updateZoomPercent();
}

function openZoom(mermaidDiv) {
  const svg = mermaidDiv.querySelector('svg');
  if (!svg) return;

  const modal     = document.getElementById('zoom-modal');
  const container = document.getElementById('zoom-container');
  container.innerHTML = '';

  const clone = svg.cloneNode(true);
  const rect  = svg.getBoundingClientRect();
  const vb    = svg.viewBox?.baseVal;

  _zoomNatW = (vb && vb.width  > 0) ? vb.width  : (rect.width  || 800);
  _zoomNatH = (vb && vb.height > 0) ? vb.height : (rect.height || 600);

  clone.setAttribute('width',  _zoomNatW);
  clone.setAttribute('height', _zoomNatH);
  clone.style.cssText = `width:${_zoomNatW}px;height:${_zoomNatH}px;display:block;`;

  container.appendChild(clone);
  modal.classList.add('show');

  // Fit after paint so viewport dimensions are accurate
  requestAnimationFrame(fitZoom);
}

function closeZoom() {
  document.getElementById('zoom-modal').classList.remove('show');
}

function initZoom() {
  renderZoomModal();
  document.getElementById('zoom-close')  ?.addEventListener('click', closeZoom);
  document.getElementById('zoom-fit-btn')?.addEventListener('click', fitZoom);

  document.getElementById('zoom-in-btn')?.addEventListener('click', () => {
    zoomScale = Math.min(10, zoomScale * 1.3);
    zoomX = (window.innerWidth  - _zoomNatW * zoomScale) / 2;
    zoomY = (window.innerHeight - _zoomNatH * zoomScale) / 2;
    updateZoomTransform(); updateZoomPercent();
  });

  document.getElementById('zoom-out-btn')?.addEventListener('click', () => {
    zoomScale = Math.max(0.05, zoomScale / 1.3);
    zoomX = (window.innerWidth  - _zoomNatW * zoomScale) / 2;
    zoomY = (window.innerHeight - _zoomNatH * zoomScale) / 2;
    updateZoomTransform(); updateZoomPercent();
  });

  document.getElementById('zoom-copy-btn')?.addEventListener('click', () => {
    const container = document.getElementById('zoom-container');
    const svg = container.querySelector('svg');
    if (svg) {
      const svgData = svg.outerHTML;
      navigator.clipboard.writeText(svgData).then(() => {
        if (typeof showToast === 'function') showToast('SVG copied to clipboard');
      });
    }
  });

  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeZoom(); });

  const modal = document.getElementById('zoom-modal');
  if (!modal) return;

  // Pan with mouse drag
  modal.addEventListener('mousedown', e => {
    if (e.target.closest('#zoom-close') || e.target.closest('#zoom-controls-bar')) return;
    zoomMoving = true;
    zoomStartX = e.clientX - zoomX;
    zoomStartY = e.clientY - zoomY;
  });
  window.addEventListener('mousemove', e => {
    if (!zoomMoving) return;
    zoomX = e.clientX - zoomStartX;
    zoomY = e.clientY - zoomStartY;
    updateZoomTransform();
  });
  window.addEventListener('mouseup', () => { zoomMoving = false; });

  // Comment sidebar resizer logic has been moved to comments.js

  // Wheel zoom toward cursor
  modal.addEventListener('wheel', e => {
    e.preventDefault();
    const factor   = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const newScale = Math.min(10, Math.max(0.05, zoomScale * factor));
    const xs = (e.clientX - zoomX) / zoomScale;
    const ys = (e.clientY - zoomY) / zoomScale;
    zoomScale = newScale;
    zoomX = e.clientX - xs * zoomScale;
    zoomY = e.clientY - ys * zoomScale;
    updateZoomTransform();
    updateZoomPercent();
  }, { passive: false });
}

window.openZoom = openZoom;
window.initZoom = initZoom;

})();
