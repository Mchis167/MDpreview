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

// GET /api/wiki/debug — kiểm tra nhanh trạng thái index
router.get('/wiki/debug', (req, res) => {
  const { watchDir } = req;
  if (!watchDir) return res.status(400).json({ error: 'No workspace set' });

  const indexPath = path.join(watchDir, '.wiki-index.json');
  if (!fs.existsSync(indexPath)) {
    return res.json({ status: 'NO_INDEX', indexPath });
  }

  try {
    const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    res.json({
      status: 'OK',
      indexPath,
      generated_at: data.generated_at,
      all_paths_count: (data.all_paths || []).length,
      id_count: Object.keys(data.id_to_path || {}).length,
      alias_count: Object.keys(data.alias_to_path || {}).length,
      backlink_count: Object.keys(data.backlinks || {}).length,
      all_paths: data.all_paths || [],
      id_to_path: data.id_to_path || {},
      alias_to_path: data.alias_to_path || {},
      backlinks: data.backlinks || {}
    });
  } catch (err) {
    res.status(500).json({ status: 'PARSE_ERROR', error: err.message });
  }
});

// GET /api/wiki/debug/backlinks?file=relative/path.md — backlinks của 1 file cụ thể
router.get('/wiki/debug/backlinks', (req, res) => {
  const { watchDir } = req;
  const { file } = req.query;
  if (!watchDir) return res.status(400).json({ error: 'No workspace set' });
  if (!file) return res.status(400).json({ error: 'Missing ?file= param' });

  const indexPath = path.join(watchDir, '.wiki-index.json');
  if (!fs.existsSync(indexPath)) {
    return res.json({ status: 'NO_INDEX' });
  }

  try {
    const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const id = (data.path_to_id || {})[file] || file;
    const backlinkIds = (data.backlinks || {})[id] || [];
    const outgoing = (data.outgoing || {})[file] || null;

    res.json({
      file,
      resolved_id: id,
      backlinks: backlinkIds.map(sourceId => ({
        id: sourceId,
        path: (data.id_to_path || {})[sourceId] || sourceId
      })),
      outgoing
    });
  } catch (err) {
    res.status(500).json({ status: 'PARSE_ERROR', error: err.message });
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
    .then(() => indexer.buildAgentIndex())
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
  
  const toRemove = [
    path.join(wsPath, '.wiki-index.json'),
    path.join(wsPath, '.wiki-index.json.bak'),
    path.join(wsPath, '.wiki-agent-index.json'),
    path.join(wsPath, '.wiki-agent-index.json.bak'),
  ];

  try {
    for (const f of toRemove) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
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
    .then(() => indexer.buildAgentIndex())
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
