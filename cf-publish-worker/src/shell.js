/**
 * HTML Shell for published documents
 */
import { buildTree } from '../../renderer/js/services/toc-service.js';
import { slugifyHeading } from './utils/slug.js';

/**
 * Parse headings from rendered HTML string (server-side, no DOM).
 * Also injects IDs into headings if they are missing to ensure TOC navigation works.
 */
function extractHeadingsSSR(html) {
  const flat = [];
  const usedSlugs = new Map();
  
  // Pattern to match headings h2-h6 and their content
  const headingRegex = /<h([2-6])([^>]*)>(.*?)<\/h\1>/gi;
  
  const modifiedHtml = html.replace(headingRegex, (match, level, attrs, text) => {
    let id = '';
    const idMatch = attrs.match(/id=["']([^"']*)["']/);
    
    if (idMatch && idMatch[1]) {
      id = idMatch[1];
    } else {
      // Clean HTML tags from text for slugification
      const cleanText = text.replace(/<[^>]+>/g, '').trim();
      id = slugifyHeading(cleanText, usedSlugs);
      // Inject ID into attributes
      attrs = ` id="${id}"${attrs}`;
    }

    const cleanText = text.replace(/<[^>]+>/g, '').trim();
    if (cleanText) {
      flat.push({
        level: parseInt(level, 10),
        id,
        text: cleanText,
        children: []
      });
    }

    return `<h${level}${attrs}>${text}</h${level}>`;
  });
  
  return {
    headings: buildTree(flat),
    modifiedHtml
  };
}

/**
 * Recursively renders TOC item HTML for SSR.
 */
function renderTocItemSSR(node) {
  const indent = `level-${node.level}`;
  const childrenHtml = node.children.length > 0
    ? `<div class="item-children is-expanded">
        ${node.children.map(c => renderTocItemSSR(c)).join('')}
       </div>`
    : '';
    
  return `
    <div class="ds-toc-item ${indent} is-expanded" data-heading-id="${node.id}">
      <a class="item-link" href="#${node.id}">
        <div class="item-content">
          <span class="item-label">${node.text}</span>
        </div>
      </a>
      ${childrenHtml}
    </div>`;
}

/**
 * Builds the full TOC navigation sidebar HTML.
 * Returns both the TOC HTML and the modified content HTML with injected IDs.
 */
export function buildTocHtml(renderedHtml) {
  const { headings, modifiedHtml } = extractHeadingsSSR(renderedHtml);
  if (headings.length === 0) return { tocHtml: '', modifiedHtml };
  
  const tocHtml = `
    <nav class="publish-toc-sidebar" aria-label="Table of Contents">
      <div class="publish-toc-header">On this page</div>
      ${headings.map(n => renderTocItemSSR(n)).join('')}
    </nav>`;

  return { tocHtml, modifiedHtml };
}

export function buildShell({ slug, html, title = 'Document', assetsUrl = '/publish.css' }) {
  const safeTitle = String(title || 'Document');
  const escapedTitle = safeTitle.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));

  const mermaidConfig = {
    theme: 'dark',
    startOnLoad: true,
    securityLevel: 'loose'
  };

  const { tocHtml, modifiedHtml } = buildTocHtml(html);
  const hasToc = tocHtml.length > 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${assetsUrl}">
  <script src="/code-blocks.js"></script>
  <script src="/zoom.js"></script>
  <script src="/design-system.js"></script>
  <script src="/design-system-icons.js"></script>
  <script src="/mockup-images.js"></script>
  <script src="/carousel.js"></script>
  <script src="/toc-publish.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
</head>
<body class="md-publish-body">
  <header class="tab-bar-container">
    <div class="ds-publish-header-inner">
      <div class="ds-logo-wrap">
        <span class="ds-logo-box">M</span>
        <span class="ds-logo-text">MDpreview</span>
      </div>
      <div class="ds-publish-doc-title">${escapedTitle}</div>
      <div id="ds-reading-progress" class="ds-reading-progress"></div>
    </div>
  </header>
  <div id="md-publish-loading" class="ds-publish-loading">
    <div class="ds-publish-loading-content">
      <div class="ds-publish-spinner"></div>
      <div class="ds-publish-loading-text">Loading <strong>document</strong>...</div>
    </div>
  </div>
 
  <!-- Floating Action Group for TOC Toggle -->
  <div class="publish-floating-actions">
    <button id="publish-toc-toggle" class="publish-floating-btn" title="Toggle Table of Contents">
      <!-- Icon: sidebar-collapse (default open) -->
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6-6 6 6 6"/><path d="M3 12h12"/><path d="M21 19V5"/></svg>
    </button>
  </div>
 
  <div class="${hasToc ? 'publish-layout' : 'ds-publish-content-wrapper'}" id="publish-root">
    ${tocHtml}
    <main class="publish-main-content">
      <div id="md-content" class="md-content md-render-body">
        <div class="md-content-inner">
          ${modifiedHtml}
        </div>
      </div>
    </main>
  </div>

  <script>
    const mermaidConfig = ${JSON.stringify(mermaidConfig)};
    
    (async () => {
      // 1. Initialize Code Blocks
      if (window.CodeBlockModule) {
        const container = document.getElementById('md-content');
        window.CodeBlockModule.process(container);
      }

      // 1b. Wrap mockup frames, then init carousel (carousel type-detection needs frames first)
      const _mdContent = document.getElementById('md-content');
      if (window.MockupImageModule) window.MockupImageModule.process(_mdContent);
      if (window.CarouselModule) window.CarouselModule.process(_mdContent);

      // 2. Initialize Mermaid
      mermaid.initialize(mermaidConfig);

      // 3. Render Mermaid diagrams
      try {
        const container = document.getElementById('md-content');
        const nodes = [];

        container.querySelectorAll('.mermaid').forEach(div => {
          if (!div.querySelector('svg')) {
            nodes.push(div);
          }
        });

        if (nodes.length > 0) {
          await new Promise(resolve => requestAnimationFrame(resolve));
          await mermaid.run({ nodes });
        }

        // 4. Initialize Zoom and wire up clicks
        if (window.initZoom) {
          window.initZoom();
          const allMermaid = container.querySelectorAll('.mermaid');
          allMermaid.forEach(div => {
            div.style.cursor = 'zoom-in';
            div.onclick = () => window.openZoom(div);
          });
        }
      } catch (err) {
        // Silently handle render errors in production
      } finally {
        const loadingEl = document.getElementById('md-publish-loading');
        if (loadingEl) {
          loadingEl.classList.add('hidden');
        }
      }
    })();
  </script>
</body>
</html>`;
}
