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
}

module.exports = { register };
