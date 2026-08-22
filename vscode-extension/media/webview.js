(function () {
  const vscode = acquireVsCodeApi();
  const content = document.getElementById('md-content');

  if (typeof mermaid !== 'undefined' && typeof mermaidConfig !== 'undefined') {
    mermaid.initialize(mermaidConfig.getMermaidConfig('server'));
  }

  function renderMermaidDiagrams() {
    if (typeof mermaid === 'undefined') return;
    const nodes = Array.from(content.querySelectorAll('.mermaid')).filter((el) => !el.querySelector('svg'));
    if (nodes.length) mermaid.run({ nodes });
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
    }
  });
})();
