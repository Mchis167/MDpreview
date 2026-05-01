/**
 * Worker Publish IPC Handler
 * Purpose: Handle direct publishing to Cloudflare Worker from the main process
 */
function register(ipcMain) {
  ipcMain.handle('publish-to-worker', async (event, { payload, workerUrl, secret }) => {
    try {
      const response = await fetch(`${workerUrl}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': secret
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (!response.ok) {
        return { 
          success: false, 
          error: result.error || `Publish failed with status ${response.status}` 
        };
      }
      
      return { success: true, ...result };
    } catch (error) {
      console.error('[WORKER PUBLISH IPC] Error:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { register };
