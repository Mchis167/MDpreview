/* ============================================================
   mermaid.js — Mermaid diagram init and rendering
   processMermaid() is called from app.js after file load.
   setupMermaidClicks() wires diagrams to openZoom() from zoom.js.
   ============================================================ */

(() => {
'use strict';

function initMermaid() {
  if (typeof mermaid === 'undefined') return;
  mermaid.initialize(window.mermaidConfig.getMermaidConfig('server'));
}

async function processMermaid(container) {
  if (typeof mermaid === 'undefined') return;

  // Collect nodes to render:
  // 1. Existing .mermaid divs that haven't been rendered yet (no SVG children)
  // 2. Legacy pre > code.language-mermaid elements (for backwards compatibility)
  const nodes = [];

  // First: Check for existing mermaid divs that need rendering
  container.querySelectorAll('.mermaid').forEach(div => {
    if (!div.querySelector('svg')) {
      nodes.push(div);
    }
  });

  // Second: Handle legacy pre > code.language-mermaid (if any)
  container.querySelectorAll('pre > code.language-mermaid').forEach(el => {
    const content = el.textContent.trim();
    if (!content) return; // Skip empty blocks

    const wrapper = document.createElement('div');
    wrapper.className = 'mermaid';
    wrapper.textContent = content;

    // ── Defensive: Force stable width if inside Project Map ──
    // Mermaid's layout engine crashes if it detects the tiny scaled dimensions of the mini-map.
    if (container.closest('.ds-project-map__mirror') || container.classList.contains('ds-project-map__mirror')) {
      wrapper.style.width = '800px';
      wrapper.style.overflow = 'hidden';
    }

    el.closest('pre').replaceWith(wrapper);
    nodes.push(wrapper);
  });

  if (nodes.length > 0) {
    // ── Defensive: Wait for next frame to ensure DOM layout is ready ──
    await new Promise(resolve => requestAnimationFrame(resolve));

    try {
      // ── Defensive: Only process nodes that are actually in the document and have dimensions ──
      const activeNodes = nodes.filter(node => {
        if (!document.body.contains(node)) return false;

        // Use offsetWidth/Height to ensure the element is actually laid out and visible
        // If it's 0, Mermaid's layout engine (D3) will often produce NaN/undefined
        const style = window.getComputedStyle(node);
        const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && node.offsetWidth > 0;

        return isVisible;
      });

      if (activeNodes.length > 0) {
        await mermaid.run({ nodes: activeNodes });
        setupMermaidClicks(container);
      }
    } catch (err) {
      console.warn('Mermaid render error (prevented crash):', err);
    }
  }
}

function setupMermaidClicks(container) {
  container.querySelectorAll('.mermaid').forEach(div => {
    div.onclick = () => {
      if (window.ZoomSystem) {
        window.ZoomSystem.open(div, 'svg');
      }
    };
  });
}

window.initMermaid = initMermaid;
window.processMermaid = processMermaid;

})();
