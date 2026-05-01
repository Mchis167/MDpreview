/**
 * HTML Shell for published documents
 */

export function buildShell({ slug, html, title = 'Document', assetsUrl = '/publish.css' }) {
  const escapedTitle = title.replace(/[&<>"']/g, m => ({
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
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    const mermaidConfig = ${JSON.stringify(mermaidConfig)};
    document.addEventListener('DOMContentLoaded', async () => {
      // 1. Initialize Mermaid
      mermaid.initialize(mermaidConfig);

      // 2. Render Mermaid diagrams and hide loading indicator
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
      } catch (err) {
        console.warn('Mermaid render error:', err);
      } finally {
        const loadingEl = document.getElementById('md-publish-loading');
        if (loadingEl) {
          loadingEl.classList.add('hidden');
        }
      }

      // 3. Setup Code Copy Logic
      window.copyCode = (btn) => {
        const codeEl = btn.closest('.premium-code-block').querySelector('code');
        if (!codeEl) return;

        const text = codeEl.innerText;
        navigator.clipboard.writeText(text).then(() => {
          const iconCopy = btn.querySelector('.icon-copy');
          const iconCheck = btn.querySelector('.icon-check');
          const textSpan = btn.querySelector('span');

          btn.classList.add('copied');
          iconCopy.classList.add('hidden');
          iconCheck.classList.remove('hidden');
          textSpan.innerText = 'Copied!';

          setTimeout(() => {
            btn.classList.remove('copied');
            iconCopy.classList.remove('hidden');
            iconCheck.classList.add('hidden');
            textSpan.innerText = 'Copy';
          }, 2000);
        });
      };
    });
  </script>
</head>
<body class="md-publish-body">
  <div id="md-publish-loading" class="md-publish-loading">
    <div class="md-publish-loading-content">
      <div class="md-publish-spinner"></div>
      <div class="md-publish-loading-text">Loading <strong>document</strong>...</div>
    </div>
  </div>
  <div class="md-publish-container">
    <div id="md-content" class="md-content md-render-body">
      <div class="md-content-inner">
        ${html}
      </div>
    </div>
  </div>
  <footer style="text-align: center; padding: 60px; color: #666; font-size: 12px; font-family: sans-serif;">
    Published with <a href="https://github.com/Mchis167/MDpreview" style="color: #888; text-decoration: none;">MDpreview</a>
  </footer>
</body>
</html>`;
}
