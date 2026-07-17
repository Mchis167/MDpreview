const path = require('path');
const fs = require('fs');
const WikiIndexer = require('../../server/services/wiki-indexer');

function updateWikiSettings(dataDir, workspaceId, settings) {
  const workspacesFile = path.join(dataDir, 'workspaces.json');
  if (!fs.existsSync(workspacesFile)) return;
  try {
    const data = JSON.parse(fs.readFileSync(workspacesFile, 'utf8'));
    const ws = data.workspaces.find(w => w.id === workspaceId);
    if (ws) {
      ws.wikiScanner = { ...ws.wikiScanner, ...settings };
      fs.writeFileSync(workspacesFile, JSON.stringify(data, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('[WikiIPC] Failed to update workspace settings:', err);
  }
}

function runScan(getServerModule, workspaceId, wsPath) {
  const sm = getServerModule();
  const dataDir = sm ? sm.getDataDir() : null;
  const indexer = new WikiIndexer(wsPath);
  indexer.build()
    .then(() => indexer.buildAgentIndex())
    .then(() => {
      if (dataDir) updateWikiSettings(dataDir, workspaceId, {
        status: 'active',
        lastScanned: new Date().toISOString(),
        errorMessage: null
      });
    })
    .catch((err) => {
      console.error('[WikiIPC] Scan failed:', err);
      if (dataDir) updateWikiSettings(dataDir, workspaceId, {
        status: 'error',
        errorMessage: err.message
      });
    });
}

function register(ipcMain, getServerModule) {
  ipcMain.handle('wiki:get-status', async (_event, workspaceId) => {
    const sm = getServerModule();
    const dataDir = sm ? sm.getDataDir() : null;
    if (!dataDir) return { status: 'off' };
    const workspacesFile = path.join(dataDir, 'workspaces.json');
    try {
      const data = JSON.parse(fs.readFileSync(workspacesFile, 'utf8'));
      const ws = data.workspaces.find(w => w.id === workspaceId);
      return ws?.wikiScanner || { status: 'off' };
    } catch (_err) {
      return { status: 'off' };
    }
  });

  ipcMain.handle('wiki:enable', async (_event, workspaceId, wsPath) => {
    const sm = getServerModule();
    const dataDir = sm ? sm.getDataDir() : null;
    if (dataDir) updateWikiSettings(dataDir, workspaceId, { status: 'scanning', enabled: true });
    runScan(getServerModule, workspaceId, wsPath);
    return { success: true, status: 'scanning' };
  });

  ipcMain.handle('wiki:rescan', async (_event, workspaceId, wsPath) => {
    const sm = getServerModule();
    const dataDir = sm ? sm.getDataDir() : null;
    if (dataDir) updateWikiSettings(dataDir, workspaceId, { status: 'scanning' });
    runScan(getServerModule, workspaceId, wsPath);
    return { success: true, status: 'scanning' };
  });

  ipcMain.handle('wiki:disable', async (_event, workspaceId) => {
    const sm = getServerModule();
    const dataDir = sm ? sm.getDataDir() : null;
    if (dataDir) updateWikiSettings(dataDir, workspaceId, { status: 'inactive', enabled: false });
    return { success: true, status: 'inactive' };
  });

  ipcMain.handle('wiki:remove', async (_event, workspaceId, wsPath) => {
    const sm = getServerModule();
    const dataDir = sm ? sm.getDataDir() : null;

    const toRemove = [
      path.join(wsPath, '.wiki-index.json'),
      path.join(wsPath, '.wiki-index.json.bak'),
      path.join(wsPath, '.wiki-agent-index.json'),
      path.join(wsPath, '.wiki-agent-index.json.bak'),
    ];
    for (const f of toRemove) {
      try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (_e) { /* ignore */ }
    }

    if (dataDir) updateWikiSettings(dataDir, workspaceId, {
      status: 'off',
      enabled: false,
      lastScanned: null,
      errorMessage: null
    });
    return { success: true, status: 'off' };
  });
}

module.exports = { register };
