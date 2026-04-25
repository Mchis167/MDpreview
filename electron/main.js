const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');

let mainWindow;
let serverModule;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

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
  const port = await serverModule.start(app.getPath('userData'));

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

ipcMain.handle('open-file-dialog', async (event, options = {}) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    title: options.title || 'Select Files to Import',
    filters: options.filters || []
  });
  if (result.canceled || !result.filePaths.length) return [];
  return result.filePaths;
});

// --- IPC: Update server watch dir ---
ipcMain.handle('set-watch-dir', async (event, dirPath) => {
  if (serverModule) serverModule.setWatchDir(dirPath);
  return true;
});

// --- IPC: Rebuild / Relaunch ---
ipcMain.on('rebuild-app', () => {
  const { spawn } = require('child_process');
  const fs = require('fs');

  // Get the app path and escape the ASAR virtual filesystem if necessary
  let projectRoot = app.getAppPath();
  if (projectRoot.endsWith('app.asar')) {
    projectRoot = path.dirname(projectRoot); // Resources folder
  }

  // Navigate up from dist/mac-arm64/MDpreview.app/Contents/Resources to project root
  // We'll search upwards until we find rebuild.sh
  let searchDir = projectRoot;
  let scriptPath = '';
  // Maximum search depth of 6 levels
  for (let i = 0; i < 6; i++) {
    const potentialPath = path.join(searchDir, 'rebuild.sh');
    if (fs.existsSync(potentialPath)) {
      scriptPath = potentialPath;
      projectRoot = searchDir;
      break;
    }
    const parent = path.dirname(searchDir);
    if (parent === searchDir) break;
    searchDir = parent;
  }

  if (!scriptPath) {
    console.error('Could not find rebuild.sh in parent directories.');
    return;
  }

  const customPath = process.env.PATH + ':/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin';

  const subprocess = spawn('bash', [scriptPath], {
    detached: true,
    stdio: 'ignore',
    cwd: projectRoot,
    env: { ...process.env, PATH: customPath }
  });

  subprocess.unref();
  app.quit();
});

// Register domain IPC handlers
require('./ipc/workspace').register(ipcMain);
require('./ipc/comments').register(ipcMain);
require('./ipc/files').register(ipcMain);

app.whenReady().then(createWindow);

// Quit immediately when all windows are closed (including macOS)
app.on('window-all-closed', () => app.quit());

// Kill server before exit
app.on('will-quit', () => {
  if (serverModule && typeof serverModule.stop === 'function') serverModule.stop();
  process.exit(0);
});
