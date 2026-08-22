(function () {
  const vscode = acquireVsCodeApi();
  window.__mdpVscode = vscode;
  const content = document.getElementById('md-content');

  if (typeof mermaid !== 'undefined' && typeof mermaidConfig !== 'undefined') {
    mermaid.initialize(mermaidConfig.getMermaidConfig('server'));
  }

  // Reading progress, ported from cf-publish-worker/src/toc-publish.js. The
  // scrollbar is hidden in this webview (the host kept repainting its track),
  // so this bar is the only scroll affordance. Scrolling happens on
  // .md-viewer-viewport here, not the window as on a published page.
  const scroller = document.querySelector('.md-viewer-viewport');
  const progressBar = document.getElementById('ds-reading-progress');

  function updateProgressBar() {
    if (!progressBar || !scroller) return;
    const height = scroller.scrollHeight - scroller.clientHeight;
    const scrolled = height > 0 ? (scroller.scrollTop / height) * 100 : 0;
    progressBar.style.width = scrolled + '%';
  }

  let ticking = false;
  scroller.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      window.requestAnimationFrame(() => {
        updateProgressBar();
        ticking = false;
      });
      ticking = true;
    },
    { passive: true }
  );
  window.addEventListener('resize', updateProgressBar, { passive: true });

  function renderMermaidDiagrams() {
    if (typeof mermaid === 'undefined') return;
    const nodes = Array.from(content.querySelectorAll('.mermaid')).filter((el) => !el.querySelector('svg'));
    if (!nodes.length) return;
    mermaid.run({ nodes }).then(() => setupMermaidZoom(nodes));
  }

  // Charts are unreadable at page scale, so a click opens the app's full-screen
  // pan/zoom overlay. No actions are injected — the app's "Copy SVG code" button
  // belongs to the Electron host, not here.
  function setupMermaidZoom(nodes) {
    nodes.forEach((div) => {
      div.onclick = () => {
        if (window.ZoomSystem) window.ZoomSystem.open(div, 'svg');
      };
    });
  }

  function processCodeBlocks() {
    if (typeof CodeBlockModule !== 'undefined') CodeBlockModule.process(content);
  }

  function processMockupImages() {
    if (typeof MockupImageModule !== 'undefined') MockupImageModule.process(content);
  }

  function processCarousels() {
    if (typeof CarouselModule !== 'undefined') CarouselModule.process(content);
  }

  function processSummaries() {
    if (typeof DesignSystem === 'undefined') return;
    content.querySelectorAll('summary').forEach((summary) => {
      if (summary.querySelector('.ds-summary-icon')) return;
      const iconWrap = DesignSystem.createElement('span', 'ds-summary-icon', {
        html: DesignSystem.getIcon('chevron-right')
      });
      summary.prepend(iconWrap);
    });
  }

  function bindCheckboxes() {
    content.querySelectorAll('.task-list-item input[type="checkbox"]').forEach((cb) => {
      cb.onchange = (event) => {
        const lineEl = event.target.closest('.md-line');
        if (!lineEl) return;
        const line = parseInt(lineEl.dataset.line, 10);
        if (Number.isNaN(line)) return;
        vscode.postMessage({ type: 'toggleTask', line, checked: event.target.checked });
      };
    });
  }

  // Anchors (#heading) are left to the browser's own scroll-into-view.
  // Everything else (external URLs, relative .md paths) is handled by
  // the extension host, since only it can open tabs / the OS browser.
  content.addEventListener('click', (event) => {
    const anchor = event.target.closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#')) return;

    event.preventDefault();
    vscode.postMessage({ type: 'openLink', href });
  });

  // Handshake. A message posted to a webview whose document hasn't run its
  // scripts yet is dropped, not queued — and on window reload VSCode resolves
  // the restored editor before this page loads, so the initial render would be
  // lost and the tab would come back empty. Every script in this page is a
  // parser-blocking <script> in <body>, so by DOMContentLoaded all three
  // message listeners (this one, comments.js, diff.js) are installed.
  window.addEventListener('DOMContentLoaded', () => {
    vscode.postMessage({ type: 'ready' });
  });

  window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === 'render') {
      content.innerHTML = message.html;
      renderMermaidDiagrams();
      processCodeBlocks();
      processMockupImages();
      processCarousels();
      processSummaries();
      bindCheckboxes();
      document.dispatchEvent(new CustomEvent('mdp:content-rendered'));
      updateProgressBar(); // new content, new scroll height
    }
  });
})();
