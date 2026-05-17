/* global DesignSystem, ZoomSystem */
window.CarouselModule = (() => {
  'use strict';

  function process(container) {
    if (!container) return;
    container.querySelectorAll('.md-carousel').forEach(_activate);
  }

  function _detectType(slides) {
    if (!slides.length) return 'default';
    if (slides[0].querySelector('.mockup-phone-frame')) return 'phone';
    if (slides[0].querySelector('.mockup-browser-frame')) return 'browser';
    return 'default';
  }

  function _activate(carousel) {
    const track = carousel.querySelector('.md-carousel-track');
    const slides = Array.from(carousel.querySelectorAll('.md-carousel-slide'));
    if (!track || slides.length < 2) return;

    // Wrap track in clip layer so overflow:hidden doesn't clip absolute buttons
    const clip = document.createElement('div');
    clip.className = 'md-carousel-clip';
    carousel.insertBefore(clip, track);
    clip.appendChild(track);

    const type = _detectType(slides);
    let current = 0;

    slides.forEach(s => {
      s.style.width = type === 'phone' ? 'max-content' : '80%';
    });

    const prev = _createBtn('is-prev', 'chevron-left', 'Previous');
    const next = _createBtn('is-next', 'chevron-right', 'Next');
    carousel.appendChild(prev);
    carousel.appendChild(next);
    carousel.setAttribute('tabindex', '0');

    function _updateMask() {
      const containerW = carousel.offsetWidth;
      if (!containerW) return;

      let stopPct;
      if (type === 'phone') {
        const frameEl = slides[0].querySelector('.mockup-phone-frame');
        const frameW = frameEl ? frameEl.offsetWidth : 0;
        stopPct = frameW
          ? ((containerW - frameW) / 2 / containerW * 100).toFixed(1)
          : '10';
      } else {
        stopPct = '10';
      }

      const endPct = (100 - parseFloat(stopPct)).toFixed(1);
      const grad = `linear-gradient(to right, transparent 0%, black ${stopPct}%, black ${endPct}%, transparent 100%)`;
      clip.style.webkitMaskImage = grad;
      clip.style.maskImage = grad;
    }

    function go(index) {
      current = Math.max(0, Math.min(slides.length - 1, index));

      const slideW = slides[current].offsetWidth || carousel.offsetWidth * 0.8;
      const containerW = carousel.offsetWidth;
      const gapStr = window.getComputedStyle(track).gap;
      const gap = gapStr ? parseFloat(gapStr) : 0;
      const offset = current * (slideW + gap) - (containerW - slideW) / 2;
      track.style.transform = `translateX(${-offset}px)`;

      prev.disabled = current === 0;
      next.disabled = current === slides.length - 1;

      slides.forEach((slide, i) => {
        slide.style.cursor = 'zoom-in';
        slide.classList.toggle('is-active', i === current);
      });

      _updateMask();
    }

    prev.addEventListener('click', e => { e.stopPropagation(); go(current - 1); });
    next.addEventListener('click', e => { e.stopPropagation(); go(current + 1); });

    carousel.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
    });

    slides.forEach((slide, _i) => {
      slide.addEventListener('click', e => {
        if (e.button !== 0 || e.target.closest('.md-carousel-btn')) return;
        const img = slide.querySelector('img');
        // Mockup frames handle zoom via their own mouseup handler (drag-to-scroll)
        if (!img || img.closest('.mockup-phone-frame, .mockup-browser-frame')) return;
        if (window.ZoomSystem) ZoomSystem.open(img.src, 'image');
      });
    });

    const ro = new ResizeObserver(() => go(current));
    ro.observe(carousel);

    go(0);
  }

  function _createBtn(cls, icon, label) {
    const btn = document.createElement('button');
    btn.className = `md-carousel-btn ${cls}`;
    btn.title = label;
    btn.innerHTML = DesignSystem.getIcon(icon, { width: 18, height: 18 });
    return btn;
  }

  return { process };
})();
