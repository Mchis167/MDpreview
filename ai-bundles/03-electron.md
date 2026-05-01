# Module: ELECTRON


<file path="electron/ipc/comments.js">
```js
const { app } = require('electron');
const path = require('path');
const fs   = require('fs');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR     = app.getPath('userData');
const COMMENTS_DIR = path.join(DATA_DIR, 'comments');

// Ensure comments base directory exists
if (!fs.existsSync(COMMENTS_DIR)) {
  fs.mkdirSync(COMMENTS_DIR, { recursive: true });
}

function commentsFile(workspaceId, filePath) {
  // Encode file path to a safe filename
  const encoded = filePath.replace(/[/\\:.]/g, '_');
  const dir = path.join(COMMENTS_DIR, workspaceId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${encoded}.json`);
}

function loadComments(wsId, filePath) {
  try {
    const data = fs.readFileSync(commentsFile(wsId, filePath), 'utf8');
    const comments = JSON.parse(data);
    
    // Auto-fix: Ensure every comment has a unique ID
    let changed = false;
    comments.forEach(c => {
      if (!c.id) {
        c.id = uuidv4();
        changed = true;
      }
    });
    
    if (changed) {
      saveComments(wsId, filePath, comments);
    }
    
    return comments;
  } catch {
    return [];
  }
}

function saveComments(wsId, filePath, comments) {
  fs.writeFileSync(commentsFile(wsId, filePath), JSON.stringify(comments, null, 2), 'utf8');
}

function register(ipcMain) {
  ipcMain.handle('get-comments', (event, wsId, filePath) => {
    return loadComments(wsId, filePath);
  });

  ipcMain.handle('save-comment', (event, wsId, filePath, commentData) => {
    const comments = loadComments(wsId, filePath);
    let resultComment;

    // Destructure to avoid overwriting id with null/undefined from frontend
    const { id, createdAt: _createdAt, ...data } = commentData;

    if (id) {
      // Update existing
      const idx = comments.findIndex(c => c.id === id);
      if (idx !== -1) {
        comments[idx] = { ...comments[idx], ...data, updatedAt: new Date().toISOString() };
        resultComment = comments[idx];
      } else {
        // ID provided but not found, create new anyway
        resultComment = { ...data, id, createdAt: new Date().toISOString() };
        comments.push(resultComment);
      }
    } else {
      // Create new
      resultComment = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
      comments.push(resultComment);
    }

    comments.sort((a, b) => a.lineStart - b.lineStart);
    saveComments(wsId, filePath, comments);
    return resultComment;
  });

  ipcMain.handle('delete-comment', (event, wsId, filePath, commentId) => {
    if (!commentId) return loadComments(wsId, filePath);
    const comments = loadComments(wsId, filePath).filter(c => c.id !== commentId);
    saveComments(wsId, filePath, comments);
    return comments;
  });

  ipcMain.handle('clear-comments', (event, wsId, filePath) => {
    saveComments(wsId, filePath, []);
    return [];
  });
}

module.exports = { register };

```
</file>

<file path="electron/ipc/files.js">
```js
const fs = require('fs');
const path = require('path');
const os = require('os');
const clipboardEx = require('electron-clipboard-ex');

function register(ipcMain) {
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      if (!fs.existsSync(filePath)) throw new Error('File not found');
      return { success: true, content: fs.readFileSync(filePath, 'utf8') };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-file', async (event, filePath) => {
    try {
      if (!fs.existsSync(filePath)) throw new Error('File does not exist');
      // Use rmSync to handle both files and directories recursively
      fs.rmSync(filePath, { recursive: true, force: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('duplicate-file', async (event, filePath) => {
    try {
      if (!fs.existsSync(filePath)) throw new Error('Source file does not exist');
      const dir = path.dirname(filePath);
      const ext = path.extname(filePath);
      const name = path.basename(filePath, ext);
      
      let copyPath;
      let counter = 1;
      do {
        copyPath = path.join(dir, `${name} (${counter++})${ext}`);
      } while (fs.existsSync(copyPath));

      fs.copyFileSync(filePath, copyPath);
      return { success: true, path: copyPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('rename-file', async (event, oldPath, newPath) => {
    try {
      if (!fs.existsSync(oldPath)) throw new Error('File not found');
      if (fs.existsSync(newPath)) throw new Error('Target file already exists');
      fs.renameSync(oldPath, newPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('move-file', async (event, oldPath, newPath) => {
    try {
      if (!fs.existsSync(oldPath)) throw new Error('Source not found');
      // Ensure target directory exists
      const targetDir = path.dirname(newPath);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      
      fs.renameSync(oldPath, newPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('copy-file', async (event, srcPath, destPath) => {
    try {
      if (!fs.existsSync(srcPath)) throw new Error('Source not found');
      const stats = fs.statSync(srcPath);
      
      if (stats.isDirectory()) {
        // Recursive copy for directory
        const copyRecursive = (src, dest) => {
          if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
          const entries = fs.readdirSync(src, { withFileTypes: true });
          for (let entry of entries) {
            const srcItem = path.join(src, entry.name);
            const destItem = path.join(dest, entry.name);
            entry.isDirectory() ? copyRecursive(srcItem, destItem) : fs.copyFileSync(srcItem, destItem);
          }
        };
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-file', async (event, filePath, content = '') => {
    try {
      if (fs.existsSync(filePath)) throw new Error('File already exists');
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, content);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-folder', async (event, folderPath) => {
    try {
      if (fs.existsSync(folderPath)) throw new Error('Folder already exists');
      fs.mkdirSync(folderPath, { recursive: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('reveal-in-finder', async (event, filePath) => {
    try {
      const { shell } = require('electron');
      if (!fs.existsSync(filePath)) throw new Error('Path does not exist');
      shell.showItemInFolder(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('copy-file-to-clipboard', async (event, filePath) => {
    console.log('[MAIN DEBUG] Received copy-file-to-clipboard request for:', filePath);
    try {
      const { getWatchDir } = require('../main');
      const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(getWatchDir() || '', filePath);
      console.log('[MAIN DEBUG] Resolved absolute path:', fullPath);
      
      if (!fs.existsSync(fullPath)) {
        console.error('[MAIN DEBUG] File does not exist:', fullPath);
        return { success: false, error: 'File does not exist' };
      }

      // Use clipboard-ex for robust OS-level file copy
      clipboardEx.writeFilePaths([fullPath]);
      
      console.log('[MAIN DEBUG] Successfully wrote to clipboard via clipboard-ex');
      return { success: true };
    } catch (error) {
      console.error('[MAIN DEBUG] Copy error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('copy-file-from-buffer', async (event, { buffer, filename }) => {
    console.log('[MAIN DEBUG] Received copy-file-from-buffer request for:', filename);
    try {
      const tempDir = os.tmpdir();
      const tempPath = path.join(tempDir, filename);

      // Convert array buffer to Buffer if needed
      const data = Buffer.from(buffer);
      fs.writeFileSync(tempPath, data);
      
      // Use clipboard-ex to copy the temp file
      clipboardEx.writeFilePaths([tempPath]);

      // Cleanup temp file after 60s
      setTimeout(() => {
        try {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        } catch (_e) { /* ignore cleanup errors */ }
      }, 60_000);

      console.log('[MAIN DEBUG] Successfully copied buffer to clipboard via temp file:', tempPath);
      return { success: true };
    } catch (error) {
      console.error('[MAIN DEBUG] Copy from buffer error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.on('start-file-drag', async (event, filePath) => {
    try {
      const { app } = require('electron');
      if (!fs.existsSync(filePath)) return;
      
      const icon = await app.getFileIcon(filePath);
      event.sender.startDrag({
        file: filePath,
        icon: icon
      });
    } catch (error) {
      console.error('Drag error:', error);
    }
  });

  ipcMain.handle('get-absolute-path', async (event, filePath) => {
    try {
      if (path.isAbsolute(filePath)) return filePath;
      const { getWatchDir } = require('../main');
      const watchDir = getWatchDir();
      return watchDir ? path.resolve(watchDir, filePath) : path.resolve(filePath);
    } catch (_error) {
      return filePath;
    }
  });

  ipcMain.handle('write-clipboard-advanced', async (event, { html, text }) => {
    console.log('[MAIN DEBUG] Received write-clipboard-advanced request. HTML Length:', html?.length, 'Text Length:', text?.length);
    try {
      const { clipboard } = require('electron');
      clipboard.write({
        html: html,
        text: text
      });
      console.log('[MAIN DEBUG] Successfully wrote HTML and Text to native clipboard');
      return { success: true };
    } catch (error) {
      console.error('[MAIN DEBUG] Advanced clipboard write error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('rasterize-svg', async (event, svgString, width, height) => {
    console.log('[MAIN DEBUG] Received rasterize-svg request. SVG Length:', svgString.length, 'Size:', width, 'x', height);
    try {
      const { nativeImage } = require('electron');
      const buffer = Buffer.from(svgString);
      const image = nativeImage.createFromBuffer(buffer, {
        width: Math.round(width),
        height: Math.round(height),
        scaleFactor: 2.0
      });
      const dataUrl = image.toDataURL();
      console.log('[MAIN DEBUG] Rasterization successful. DataURL length:', dataUrl.length);
      return { success: true, dataUrl };
    } catch (error) {
      console.error('[MAIN DEBUG] Rasterize error:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { register };

```
</file>

<file path="electron/ipc/handoff.js">
```js
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

```
</file>

<file path="electron/ipc/workspace.js">
```js
const { app } = require('electron');
const path = require('path');
const fs   = require('fs');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR  = app.getPath('userData');
const DATA_FILE = path.join(DATA_DIR, 'workspaces.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return { workspaces: [], activeWorkspaceId: null };
  }
}

function save(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function register(ipcMain) {
  ipcMain.handle('get-workspaces', () => load());

  ipcMain.handle('save-workspace', (event, { name, path: folderPath }) => {
    const data = load();
    const ws = {
      id: uuidv4(),
      name,
      path: folderPath,
      createdAt: new Date().toISOString()
    };
    data.workspaces.push(ws);
    if (!data.activeWorkspaceId) data.activeWorkspaceId = ws.id;
    save(data);
    return ws;
  });

  ipcMain.handle('delete-workspace', (event, id) => {
    const data = load();
    data.workspaces = data.workspaces.filter(w => w.id !== id);
    if (data.activeWorkspaceId === id) {
      data.activeWorkspaceId = data.workspaces[0]?.id || null;
    }
    save(data);
    return load();
  });

  ipcMain.handle('set-active-workspace', (event, id) => {
    const data = load();
    data.activeWorkspaceId = id;
    save(data);
    return data;
  });

  ipcMain.handle('rename-workspace', (event, { id, name }) => {
    const data = load();
    const ws = data.workspaces.find(w => w.id === id);
    if (ws) {
      ws.name = name;
      save(data);
    }
    return data;
  });
}

module.exports = { register };

```
</file>

<file path="electron/main.js">
```js
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
require('./ipc/handoff').register(ipcMain);
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

module.exports = {
  getWatchDir: () => (serverModule && typeof serverModule.getWatchDir === 'function') ? serverModule.getWatchDir() : null
};

```
</file>

<file path="electron/preload.js">
```js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Folder picker
  openFolder: () => ipcRenderer.invoke('open-folder-dialog'),
  openFiles: (options) => ipcRenderer.invoke('open-file-dialog', options),

  // Server watch dir
  setWatchDir: (dirPath) => ipcRenderer.invoke('set-watch-dir', dirPath),

  // Workspaces
  getWorkspaces:      ()               => ipcRenderer.invoke('get-workspaces'),
  saveWorkspace:      (ws)             => ipcRenderer.invoke('save-workspace', ws),
  deleteWorkspace:    (id)             => ipcRenderer.invoke('delete-workspace', id),
  setActiveWorkspace: (id)             => ipcRenderer.invoke('set-active-workspace', id),
  renameWorkspace:    (id, name)       => ipcRenderer.invoke('rename-workspace', { id, name }),

  // Comments
  getComments:    (wsId, file)             => ipcRenderer.invoke('get-comments', wsId, file),
  saveComment:    (wsId, file, comment)    => ipcRenderer.invoke('save-comment', wsId, file, comment),
  deleteComment:  (wsId, file, commentId) => ipcRenderer.invoke('delete-comment', wsId, file, commentId),
  clearComments:  (wsId, file)             => ipcRenderer.invoke('clear-comments', wsId, file),
  
  // File System
  readFile:      (filePath)          => ipcRenderer.invoke('read-file', filePath),
  deleteFile:    (filePath)          => ipcRenderer.invoke('delete-file', filePath),
  duplicateFile: (filePath)          => ipcRenderer.invoke('duplicate-file', filePath),
  renameFile:    (oldPath, newPath) => ipcRenderer.invoke('rename-file', oldPath, newPath),
  moveFile:      (oldPath, newPath) => ipcRenderer.invoke('move-file', oldPath, newPath),
  copyFile:      (srcPath, destPath) => ipcRenderer.invoke('copy-file', srcPath, destPath),
  createFile:    (filePath, content) => ipcRenderer.invoke('create-file', filePath, content),
  createFolder:  (folderPath)        => ipcRenderer.invoke('create-folder', folderPath),
  revealInFinder: (filePath)          => ipcRenderer.invoke('reveal-in-finder', filePath),
  
  // Clipboard & Drag
  copyFileToClipboard: (filePath) => ipcRenderer.invoke('copy-file-to-clipboard', filePath),
  copyFileFromBuffer: (buffer, filename) => ipcRenderer.invoke('copy-file-from-buffer', { buffer, filename }),
  startFileDrag: (filePath)       => ipcRenderer.send('start-file-drag', filePath),
  getAbsolutePath: (filePath)     => ipcRenderer.invoke('get-absolute-path', filePath),
  rasterizeSVG: (svg, w, h)       => ipcRenderer.invoke('rasterize-svg', svg, w, h),
  writeClipboardAdvanced: (data)  => ipcRenderer.invoke('write-clipboard-advanced', data),
  publishToHandoff: (options)     => ipcRenderer.invoke('publish-to-handoff', options),
  isElectron: true,
  
  // Custom
  rebuildApp: () => ipcRenderer.send('rebuild-app')
});

```
</file>
