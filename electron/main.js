const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');

let mainWindow;
let serverModule;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  serverModule = require('../server/index');
  const port = await serverModule.start();

  mainWindow.loadURL(`http://localhost:${port}`);

  mainWindow.on('closed', () => { mainWindow = null; });
}

// --- Dock menu (macOS) ---
if (process.platform === 'darwin') {
  app.dock.setMenu(Menu.buildFromTemplate([
    {
      label: 'New Window',
      click() {
        if (!mainWindow) createWindow();
        else mainWindow.show();
      }
    }
  ]));
}

// --- IPC: File dialog ---
ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Document Folder'
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

// --- IPC: Update server watch dir ---
ipcMain.handle('set-watch-dir', async (event, dirPath) => {
  if (serverModule) serverModule.setWatchDir(dirPath);
  return true;
});

// Register domain IPC handlers
require('./ipc/workspace').register(ipcMain);
require('./ipc/comments').register(ipcMain);

app.whenReady().then(createWindow);

// Quit immediately when all windows are closed (including macOS)
app.on('window-all-closed', () => app.quit());

// Kill server before exit
app.on('will-quit', () => {
  if (serverModule && typeof serverModule.stop === 'function') serverModule.stop();
  process.exit(0);
});
