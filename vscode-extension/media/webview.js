(function () {
  const content = document.getElementById('md-content');

  if (typeof mermaid !== 'undefined' && typeof mermaidConfig !== 'undefined') {
    mermaid.initialize(mermaidConfig.getMermaidConfig('server'));
  }

  function renderMermaidDiagrams() {
    if (typeof mermaid === 'undefined') return;
    const nodes = Array.from(content.querySelectorAll('.mermaid')).filter((el) => !el.querySelector('svg'));
    if (nodes.length) mermaid.run({ nodes });
  }

  window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === 'render') {
      content.innerHTML = message.html;
      renderMermaidDiagrams();
    }
  });
})();
