const fs = require('fs');
const path = require('path');

/**
 * Handoff IPC Handler
 * Purpose: Handle multipart/form-data uploads to handoff.host from the main process
 */
function register(ipcMain) {
  ipcMain.handle('publish-to-handoff', async (event, { html, slug, assets, token, note, password }) => {
    try {
      const { FormData, Blob } = require('buffer');
      const formData = new FormData();
      
      // 1. Main file (HTML)
      const htmlBlob = new Blob([html], { type: 'text/html' });
      formData.append('file', htmlBlob, 'index.html');
      
      // 2. Metadata
      formData.append('slug', slug);
      if (note) formData.append('note', note);
      if (password) formData.append('password', password);
      
      // 3. Assets (Images)
      if (Array.isArray(assets)) {
        for (const assetPath of assets) {
          if (fs.existsSync(assetPath)) {
            const buffer = fs.readFileSync(assetPath);
            const assetBlob = new Blob([buffer]);
            formData.append('assets', assetBlob, path.basename(assetPath));
          }
        }
      }
      
      const response = await fetch('https://handoff.host/api/upload/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result = await response.json();
      if (!response.ok) {
        return { 
          success: false, 
          error: result.error || result.message || `Upload failed with status ${response.status}` 
        };
      }
      
      return { 
        success: true, 
        url: result.url,
        version: result.version
      };
    } catch (error) {
      console.error('[HANDOFF IPC] Error:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { register };
