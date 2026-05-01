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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${assetsUrl}">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      mermaid.initialize({ 
        startOnLoad: true, 
        theme: 'dark',
        securityLevel: 'loose'
      });
    });
  </script>
</head>
<body class="md-publish-body">
  <div class="md-publish-container">
    <div class="md-content">${html}</div>
  </div>
  <footer style="text-align: center; padding: 40px; color: #666; font-size: 12px; font-family: sans-serif;">
    Published with <a href="https://github.com/Mchis167/MDpreview" style="color: #888; text-decoration: none;">MDpreview</a>
  </footer>
</body>
</html>`;
}
