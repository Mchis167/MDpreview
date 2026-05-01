/**
 * HTML Shell for published documents
 */
export function buildShell({ slug, html, title = 'Document', assetsUrl = '/publish.css' }) {
  const escapedTitle = title.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));

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
    document.addEventListener('DOMContentLoaded', () => {
      // 1. Initialize Mermaid
      mermaid.initialize({ 
        startOnLoad: true, 
        theme: 'dark',
        securityLevel: 'loose'
      });

      // 2. Setup Code Copy Logic
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
