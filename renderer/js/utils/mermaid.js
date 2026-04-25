/* ============================================================
   mermaid.js — Mermaid diagram init and rendering
   processMermaid() is called from app.js after file load.
   setupMermaidClicks() wires diagrams to openZoom() from zoom.js.
   ============================================================ */

(() => {
'use strict';

function initMermaid() {
  if (typeof mermaid === 'undefined') return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      primaryColor:        '#ffbf48',
      primaryTextColor:    '#000000',
      primaryBorderColor:  '#e6a800',
      lineColor:           '#aaaaaa',
      secondaryColor:      '#2a2a3e',
      tertiaryColor:       '#1d1d2e',
      mainBkg:             '#2d2d42',
      nodeBorder:          '#5a5a7a',
      clusterBkg:          'rgba(255,255,255,0.04)',
      titleColor:          '#ffffff',
      edgeLabelBackground: '#1a1a2e',
      fontFamily:          'Inter, sans-serif'
    }
  });
}

async function processMermaid(container) {
  if (typeof mermaid === 'undefined') return;
  const nodes = [];
  container.querySelectorAll('pre > code.language-mermaid').forEach(el => {
    const wrapper = document.createElement('div');
    wrapper.className = 'mermaid';
    wrapper.textContent = el.textContent;
    el.closest('pre').replaceWith(wrapper);
    nodes.push(wrapper);
  });
  if (nodes.length > 0) {
    try {
      await mermaid.run({ nodes });
      setupMermaidClicks(container);
    } catch (err) {
      console.error('Mermaid render error:', err);
    }
  }
}

function setupMermaidClicks(container) {
  container.querySelectorAll('.mermaid').forEach(div => {
    div.onclick = () => window.openZoom(div);
  });
}

window.initMermaid = initMermaid;
window.processMermaid = processMermaid;

})();
