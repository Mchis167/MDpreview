const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const WikiIndexer = require('../services/wiki-indexer');

// Helper to update workspace settings via IPC-like logic on server
async function updateWorkspaceWikiSettings(req, workspaceId, settings) {
  const { dataDir } = req;
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
    console.error('[WikiRoute] Failed to update workspace settings:', err);
  }
}

// GET /api/wiki/status?workspaceId=...
router.get('/wiki/status', (req, res) => {
  const { workspaceId } = req.query;
  const { dataDir } = req;
  const workspacesFile = path.join(dataDir, 'workspaces.json');
  
  try {
    if (fs.existsSync(workspacesFile)) {
      const data = JSON.parse(fs.readFileSync(workspacesFile, 'utf8'));
      const ws = data.workspaces.find(w => w.id === workspaceId);
      if (ws) {
        return res.json(ws.wikiScanner || { status: 'off' });
      }
    }
    res.json({ status: 'off' });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to read status' });
  }
});

// GET /api/wiki/index
router.get('/wiki/index', (req, res) => {
  const { watchDir } = req;
  if (!watchDir) return res.status(400).json({ error: 'No workspace set' });

  const indexPath = path.join(watchDir, '.wiki-index.json');
  if (!fs.existsSync(indexPath)) {
    return res.status(404).json({ error: 'Index not found' });
  }

  try {
    const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    res.json(data);
  } catch (_err) {
    res.status(500).json({ error: 'Failed to parse index' });
  }
});

router.post('/wiki/enable', async (req, res) => {
  try {
    const { workspaceId, path: wsPath } = req.body;
    if (!workspaceId || !wsPath) {
      return res.status(400).json({ error: 'Missing workspaceId or path' });
    }

    console.log(`[Server] Enabling Wiki for workspace: ${workspaceId} at ${wsPath}`);

    await updateWorkspaceWikiSettings(req, workspaceId, { status: 'scanning', enabled: true });
  
  // Trigger scan in background
  const indexer = new WikiIndexer(wsPath);
  indexer.build()
    .then(() => {
      updateWorkspaceWikiSettings(req, workspaceId, { 
        status: 'active', 
        lastScanned: new Date().toISOString(),
        errorMessage: null 
      });
    })
    .catch((err) => {
      updateWorkspaceWikiSettings(req, workspaceId, { 
        status: 'error', 
        errorMessage: err.message 
      });
    });

    res.json({ success: true, status: 'scanning' });
  } catch (err) {
    console.error('[WikiRoute] Enable failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/wiki/disable
router.post('/wiki/disable', async (req, res) => {
  const { workspaceId } = req.body;
  console.log(`[Server] Disabling Wiki for workspace: ${workspaceId}`);
  
  await updateWorkspaceWikiSettings(req, workspaceId, { status: 'inactive', enabled: false });
  res.json({ success: true, status: 'inactive' });
});

// POST /api/wiki/remove
router.post('/wiki/remove', async (req, res) => {
  const { workspaceId, path: wsPath } = req.body;
  console.log(`[Server] Removing Wiki for workspace: ${workspaceId}`);
  
  const indexPath = path.join(wsPath, '.wiki-index.json');
  const backupPath = path.join(wsPath, '.wiki-index.json.bak');
  
  try {
    if (fs.existsSync(indexPath)) fs.unlinkSync(indexPath);
    if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
  } catch (err) {
    console.warn('[WikiRoute] Cleanup failed:', err.message);
  }

  await updateWorkspaceWikiSettings(req, workspaceId, { 
    status: 'off', 
    enabled: false, 
    lastScanned: null,
    errorMessage: null 
  });
  
  res.json({ success: true, status: 'off' });
});

// POST /api/wiki/rescan
router.post('/wiki/rescan', async (req, res) => {
  const { workspaceId, path: wsPath } = req.body;
  console.log(`[Server] Rescanning Wiki for workspace: ${workspaceId}`);

  await updateWorkspaceWikiSettings(req, workspaceId, { status: 'scanning' });

  const indexer = new WikiIndexer(wsPath);
  indexer.build()
    .then(() => {
      updateWorkspaceWikiSettings(req, workspaceId, { 
        status: 'active', 
        lastScanned: new Date().toISOString(),
        errorMessage: null 
      });
    })
    .catch((err) => {
      updateWorkspaceWikiSettings(req, workspaceId, { 
        status: 'error', 
        errorMessage: err.message 
      });
    });

  res.json({ success: true, status: 'scanning' });
});

module.exports = router;
