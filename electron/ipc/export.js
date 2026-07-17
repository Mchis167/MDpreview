/**
 * IPC: Export current document as standalone HTML or PDF.
 * HTML: server-rendered body + inlined app CSS (tokens + markdown-render).
 * PDF: the same standalone HTML printed via a hidden BrowserWindow.
 */
const { dialog, BrowserWindow, app } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
// Give mermaid time to render diagrams before printing.
const PDF_RENDER_SETTLE_MS = 1500;

function buildStandaloneHtml(title, bodyHtml) {
  const root = path.join(__dirname, '../../renderer/css');
  const css = [
    fs.readFileSync(path.join(root, 'design-system/tokens.css'), 'utf8'),
    fs.readFileSync(path.join(root, 'shared/markdown-render.css'), 'utf8'),
  ].join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title.replace(/</g, '&lt;')}</title>
<style>${css}
body { margin: 0 auto; max-width: 860px; padding: 32px 24px; background: var(--ds-bg-primary, #fff); }
</style>
</head>
<body>
<main class="md-render-body">
${bodyHtml}
</main>
<script src="${MERMAID_CDN}"></script>
<script>if (window.mermaid) mermaid.initialize({ startOnLoad: true });</script>
</body>
</html>`;
}

async function fetchRenderedHtml(port, file) {
  const resp = await fetch(`http://localhost:${port}/api/render?file=${encodeURIComponent(file)}`);
  if (!resp.ok) throw new Error(`Render failed (${resp.status})`);
  const data = await resp.json();
  return data.html;
}

function register(ipcMain, getPort) {
  ipcMain.handle('export:html', async (_e, { file }) => {
    try {
      const html = await fetchRenderedHtml(getPort(), file);
      const name = path.basename(file).replace(/\.md$/i, '');
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Export as HTML',
        defaultPath: path.join(app.getPath('documents'), `${name}.html`),
        filters: [{ name: 'HTML', extensions: ['html'] }],
      });
      if (canceled || !filePath) return { success: false, canceled: true };
      fs.writeFileSync(filePath, buildStandaloneHtml(name, html), 'utf8');
      return { success: true, path: filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('export:pdf', async (_e, { file }) => {
    let win = null;
    let tmpFile = null;
    try {
      const html = await fetchRenderedHtml(getPort(), file);
      const name = path.basename(file).replace(/\.md$/i, '');
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Export as PDF',
        defaultPath: path.join(app.getPath('documents'), `${name}.pdf`),
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });
      if (canceled || !filePath) return { success: false, canceled: true };

      tmpFile = path.join(os.tmpdir(), `mdpreview-export-${Date.now()}.html`);
      fs.writeFileSync(tmpFile, buildStandaloneHtml(name, html), 'utf8');

      win = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
      await win.loadFile(tmpFile);
      await new Promise((r) => setTimeout(r, PDF_RENDER_SETTLE_MS));
      const pdf = await win.webContents.printToPDF({ printBackground: true });
      fs.writeFileSync(filePath, pdf);
      return { success: true, path: filePath };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      if (win && !win.isDestroyed()) win.destroy();
      if (tmpFile) fs.rm(tmpFile, { force: true }, () => {});
    }
  });
}

module.exports = { register };
