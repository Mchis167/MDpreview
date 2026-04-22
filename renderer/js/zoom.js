/* ============================================================
   zoom.js — Mermaid diagram zoom modal
   Handles pan, zoom, wheel zoom, and close interactions.
   openZoom() is a global called from mermaid.js
   ============================================================ */

let zoomScale = 1, zoomX = 0, zoomY = 0;
let zoomMoving = false, zoomStartX = 0, zoomStartY = 0;
let _zoomNatW = 0, _zoomNatH = 0;

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
  }, { passive: false });
}
