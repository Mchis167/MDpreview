const express = require('express');
const router = express.Router();
const history = require('../services/history-service');

router.get('/history/list', (req, res) => {
  const watchDir = req.watchDir;
  const filePath = req.query.path;
  if (!watchDir || !filePath) return res.status(400).json({ error: 'Missing params' });
  res.json({ versions: history.list(watchDir, filePath).map(({ ts, size }) => ({ ts, size })) });
});

router.get('/history/get', (req, res) => {
  const watchDir = req.watchDir;
  const { path: filePath, ts } = req.query;
  if (!watchDir || !filePath || !ts) return res.status(400).json({ error: 'Missing params' });
  const content = history.get(watchDir, filePath, ts);
  if (content === null) return res.status(404).json({ error: 'Snapshot not found' });
  res.json({ content, ts: parseInt(ts, 10) });
});

module.exports = router;
