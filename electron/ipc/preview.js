const { BrowserWindow } = require('electron');
const path = require('path');

let previewWindow = null;

function register(ipcMain, mainWindow) {
  ipcMain.handle('preview:open', async (event, { port }) => {
    if (previewWindow) {
      console.log('[IPC:Preview] Window already exists, showing...');
      previewWindow.show();
      return;
    }
    console.log('[IPC:Preview] Opening new preview window on port:', port);

    previewWindow = new BrowserWindow({
      width: 800,
      height: 900,
      title: 'Live Preview',
      // frame: false, // Optional: for a more custom look
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        preload: path.join(process.cwd(), 'electron/preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    // Load the preview.html through the local server to ensure correct asset loading
    previewWindow.loadURL(`http://localhost:${port}/renderer/preview.html`);

    previewWindow.on('closed', () => {
      previewWindow = null;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('preview:closed-handshake');
      }
    });
  });

  ipcMain.handle('preview:close', () => {
    if (previewWindow) {
      previewWindow.close();
    }
  });

  ipcMain.on('preview:update', (event, data) => {
    if (previewWindow && !previewWindow.isDestroyed()) {
      previewWindow.webContents.send('preview:update', data);
    } else {
      console.warn('[IPC:Preview] Received update but previewWindow is not available');
    }
  });

  ipcMain.on('preview:scroll', (event, data) => {
    if (previewWindow && !previewWindow.isDestroyed()) {
      previewWindow.webContents.send('preview:scroll', data);
    }
  });

  ipcMain.on('preview:theme-update', (event, data) => {
    if (previewWindow && !previewWindow.isDestroyed()) {
      previewWindow.webContents.send('preview:theme-update', data);
    }
  });

  ipcMain.on('preview:ready', () => {
    console.log('[IPC:Preview] Handshake: Preview Window is READY');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('preview:ready');
    } else {
      console.error('[IPC:Preview] Handshake failed: mainWindow not available');
    }
  });
}

module.exports = { register };
