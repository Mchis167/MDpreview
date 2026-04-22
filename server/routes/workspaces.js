const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const { v4: uuidv4 } = require('uuid');

function getWorkspacesFile(dataDir) {
  const file = path.join(dataDir, 'workspaces.json');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return file;
}

function loadWorkspaces(dataDir) {
  try {
    const file = getWorkspacesFile(dataDir);
    if (!fs.existsSync(file)) return { workspaces: [], activeWorkspaceId: null };
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return { workspaces: [], activeWorkspaceId: null };
  }
}

function saveWorkspaces(dataDir, data) {
  fs.writeFileSync(getWorkspacesFile(dataDir), JSON.stringify(data, null, 2), 'utf8');
}

// GET all workspaces
router.get('/workspaces', (req, res) => {
  res.json(loadWorkspaces(req.dataDir));
});

// POST new workspace
router.post('/workspaces', (req, res) => {
  const { name, path: folderPath } = req.body;
  const data = loadWorkspaces(req.dataDir);
  const ws = {
    id: uuidv4(),
    name,
    path: folderPath,
    createdAt: new Date().toISOString()
  };
  data.workspaces.push(ws);
  if (!data.activeWorkspaceId) data.activeWorkspaceId = ws.id;
  saveWorkspaces(req.dataDir, data);
  res.json(ws);
});

// DELETE workspace
router.delete('/workspaces/:id', (req, res) => {
  const { id } = req.params;
  const data = loadWorkspaces(req.dataDir);
  data.workspaces = data.workspaces.filter(w => w.id !== id);
  if (data.activeWorkspaceId === id) {
    data.activeWorkspaceId = data.workspaces[0]?.id || null;
  }
  saveWorkspaces(req.dataDir, data);
  res.json(data);
});

// POST set active workspace
router.post('/workspaces/active', (req, res) => {
  const { id } = req.body;
  const data = loadWorkspaces(req.dataDir);
  data.activeWorkspaceId = id;
  saveWorkspaces(req.dataDir, data);
  res.json(data);
});

// POST rename workspace
router.post('/workspaces/rename', (req, res) => {
  const { id, name } = req.body;
  const data = loadWorkspaces(req.dataDir);
  const ws = data.workspaces.find(w => w.id === id);
  if (ws) {
    ws.name = name;
    saveWorkspaces(req.dataDir, data);
  }
  res.json(data);
});

module.exports = router;
