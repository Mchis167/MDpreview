const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const { v4: uuidv4 } = require('uuid');

function getCommentsDir(dataDir) {
  const dir = path.join(dataDir, 'comments');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getCommentsFile(dataDir, wsId, filePath) {
  const encoded = filePath.replace(/[/\\:.]/g, '_');
  const dir = path.join(getCommentsDir(dataDir), wsId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${encoded}.json`);
}

function loadComments(dataDir, wsId, filePath) {
  try {
    const file = getCommentsFile(dataDir, wsId, filePath);
    if (!fs.existsSync(file)) return [];
    const data = fs.readFileSync(file, 'utf8');
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
      saveComments(dataDir, wsId, filePath, comments);
    }

    return comments;
  } catch {
    return [];
  }
}

function saveComments(dataDir, wsId, filePath, comments) {
  fs.writeFileSync(getCommentsFile(dataDir, wsId, filePath), JSON.stringify(comments, null, 2), 'utf8');
}

// GET comments
router.get('/comments', (req, res) => {
  const { wsId, file } = req.query;
  if (!wsId || !file) return res.status(400).json({ error: 'Missing wsId or file' });
  res.json(loadComments(req.dataDir, wsId, file));
});

// POST save comment
router.post('/comments', (req, res) => {
  const { wsId, file, commentData } = req.body;
  if (!wsId || !file || !commentData) return res.status(400).json({ error: 'Missing data' });

  const comments = loadComments(req.dataDir, wsId, file);
  let resultComment;

  // Destructure to avoid overwriting id with null/undefined from frontend
  const { id, createdAt: _createdAt, ...data } = commentData;

  if (id) {
    const idx = comments.findIndex(c => c.id === id);
    if (idx !== -1) {
      comments[idx] = { ...comments[idx], ...data, updatedAt: new Date().toISOString() };
      resultComment = comments[idx];
    } else {
      resultComment = { ...data, id, createdAt: new Date().toISOString() };
      comments.push(resultComment);
    }
  } else {
    resultComment = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    comments.push(resultComment);
  }

  comments.sort((a, b) => a.lineStart - b.lineStart);
  saveComments(req.dataDir, wsId, file, comments);
  res.json(resultComment);
});

// DELETE comment
router.delete('/comments', (req, res) => {
  const { wsId, file, commentId } = req.query;
  const comments = loadComments(req.dataDir, wsId, file).filter(c => c.id !== commentId);
  saveComments(req.dataDir, wsId, file, comments);
  res.json(comments);
});

// POST clear comments
router.post('/comments/clear', (req, res) => {
  const { wsId, file } = req.body;
  saveComments(req.dataDir, wsId, file, []);
  res.json([]);
});

module.exports = router;
