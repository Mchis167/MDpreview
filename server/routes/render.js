const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { resolvePath } = require('../utils/path-util');
const { renderWithLineNumbers } = require('../../shared/md-render');

function loadWikiIndex(watchDir) {
  try {
    const indexPath = path.join(watchDir, '.wiki-index.json');
    if (!fs.existsSync(indexPath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (err) {
    console.error(`[WikiIndex] Failed to load index: ${err.message}`);
    return null;
  }
}


router.get('/render', (req, res) => {
  const watchDir = req.watchDir;
  const file = req.query.file;

  if (!watchDir) return res.status(400).json({ error: 'No workspace set' });
  if (!file) return res.status(400).json({ error: 'Missing file param' });

  try {
    const fullPath = resolvePath(watchDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const wikiIndex = loadWikiIndex(watchDir);
    const html = renderWithLineNumbers(content, wikiIndex, file);
    const totalLines = content.split('\n').length;
    res.json({ html, file, totalLines, raw: content });
  } catch (err) {
    if (err.message.includes('Security Error')) {
      return res.status(403).json({ error: err.message });
    }
    res.status(404).json({ error: 'File not found' });
  }
});

router.post('/render-raw', (req, res) => {
  const { content } = req.body;

  if (content === undefined) {
    return res.status(400).json({ error: 'Missing content body' });
  }

  try {
    const html = renderWithLineNumbers(content);
    const totalLines = content.split('\n').length;
    res.json({ html, totalLines });
  } catch (err) {
    res.status(500).json({ error: 'Render failed', details: err.message });
  }
});

module.exports = router;
module.exports.renderWithLineNumbers = renderWithLineNumbers;
