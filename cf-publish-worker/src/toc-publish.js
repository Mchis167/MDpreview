/**
 * toc-publish.js — TOC runtime for published documents.
 * Handles: scroll sync active highlight, auto-scrolling TOC sidebar.
 */
(function () {
  'use strict';

  // Must match ADR 20260428-toc-scroll-sync-strategy
  const SCROLL_OFFSET = 200;

  const sidebar = document.querySelector('.publish-toc-sidebar');
  const mainContent = document.querySelector('.md-render-body');
  const toggleBtn = document.getElementById('publish-toc-toggle');
  const root = document.getElementById('publish-root');

  const ICON_LIST = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>`;
  const ICON_SIDEBAR_COLLAPSE = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6-6 6 6 6"/><path d="M3 12h12"/><path d="M21 19V5"/></svg>`;
  const ICON_CLOSE = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

  const progressBar = document.getElementById('ds-reading-progress');
  const isMobile = () => window.innerWidth <= 1024;



  if (!sidebar || !mainContent) {
    if (toggleBtn) toggleBtn.style.display = 'none';
    return;
  }

  // --- Toggle Logic ---
  const STORAGE_KEY = 'publish_toc_visible';

  function setTocVisible(visible) {
    if (visible) {
      root.classList.remove('toc-hidden');
      toggleBtn.classList.add('is-active');
      toggleBtn.innerHTML = isMobile() ? ICON_CLOSE : ICON_SIDEBAR_COLLAPSE;
      if (isMobile()) document.body.classList.add('no-scroll');
    } else {
      root.classList.add('toc-hidden');
      toggleBtn.classList.remove('is-active');
      toggleBtn.innerHTML = ICON_LIST;
      document.body.classList.remove('no-scroll');
    }
    localStorage.setItem(STORAGE_KEY, visible);
  }

  // Initialize state: On desktop default to visible unless explicitly false; on mobile default to hidden to avoid blocking page scroll
  const savedState = localStorage.getItem(STORAGE_KEY);
  if (savedState === 'false' || (savedState === null && isMobile())) {
    setTocVisible(false);
  } else {
    setTocVisible(true);
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isVisible = !root.classList.contains('toc-hidden');
      setTocVisible(!isVisible);
    });
  }

  const headings = Array.from(mainContent.querySelectorAll('h2, h3, h4, h5, h6'));
  const tocItems = Array.from(sidebar.querySelectorAll('.ds-toc-item[data-heading-id]'));



  if (headings.length === 0) return;

  // --- Click Logic (Manual Smooth Scroll) ---
  tocItems.forEach(item => {
    const link = item.querySelector('.item-link');
    if (link) {
      link.addEventListener('click', (e) => {
        const targetId = item.getAttribute('data-heading-id');

        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          e.preventDefault();
          const targetTop = targetEl.getBoundingClientRect().top + window.pageYOffset - 100;
          window.scrollTo({
            top: targetTop,
            behavior: 'smooth'
          });

          // Auto-dismiss on mobile after navigation
          if (isMobile()) {
            setTocVisible(false);
          }
        }
      });
    }
  });

  /**
   * Updates the active state in TOC based on current scroll position.
   */
  function updateActive() {
    let activeHeading = null;

    // Find the last heading that has passed the scroll threshold
    for (const h of headings) {
      const rect = h.getBoundingClientRect();
      if (rect.top <= SCROLL_OFFSET) {
        activeHeading = h;
      } else {
        // Since headings are in order, we can stop once we hit one below the threshold
        break;
      }
    }

    tocItems.forEach(item => item.classList.remove('is-active'));

    if (activeHeading) {
      const match = sidebar.querySelector(`.ds-toc-item[data-heading-id="${activeHeading.id}"]`);
      if (match) {

        match.classList.add('is-active');

        // Auto-scroll TOC sidebar to keep active item visible
        const itemTop = match.offsetTop;
        const sidebarH = sidebar.clientHeight;
        const sidebarScroll = sidebar.scrollTop;

        if (itemTop < sidebarScroll || itemTop > sidebarScroll + sidebarH - 60) {
          sidebar.scrollTo({
            top: itemTop - 60,
            behavior: 'smooth'
          });
        }
      }
    }
  }

  /**
   * Updates the reading progress bar based on scroll position.
   */
  function updateProgressBar() {
    if (!progressBar) return;
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    progressBar.style.width = scrolled + '%';
  }

  // Use throttle for performance
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateActive();
        updateProgressBar();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Run once on load
  setTimeout(updateActive, 320);
})();
