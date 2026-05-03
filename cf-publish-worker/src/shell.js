/**
 * HTML Shell for published documents
 */

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
    </div>
  </header>
  <div id="md-publish-loading" class="ds-publish-loading">
    <div class="ds-publish-loading-content">
      <div class="ds-publish-spinner"></div>
      <div class="ds-publish-loading-text">Loading <strong>document</strong>...</div>
    </div>
  </div>
  <div class="ds-publish-content-wrapper">
    <div id="md-content" class="md-content md-render-body">
      <div class="md-content-inner">
        ${html}
      </div>
    </div>
  </div>
  <footer style="text-align: center; padding: 60px; color: #666; font-size: 12px; font-family: sans-serif;">
    Published with <a href="https://github.com/Mchis167/MDpreview" style="color: #888; text-decoration: none;">MDpreview</a>
  </footer>
  <script>
    const mermaidConfig = ${JSON.stringify(mermaidConfig)};
    
    (async () => {
      // 1. Initialize Code Blocks
      if (window.CodeBlockModule) {
        const container = document.getElementById('md-content');
        window.CodeBlockModule.process(container);
      }

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
