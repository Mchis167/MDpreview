const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const CACHE_FILENAME = 'publish-cache.json';
const CACHE_DIR = '.mdpreview';

function getCachePath(watchDir) {
  return path.join(watchDir, CACHE_DIR, CACHE_FILENAME);
}

/**
 * GET /api/publish-cache
 * Read the image cache manifest from workspace.
 * Returns { version: 1, images: {} } if not found.
 */
router.get('/publish-cache', (req, res) => {
  const watchDir = req.watchDir;
  if (!watchDir) return res.json({ version: 1, images: {} });

  const cachePath = getCachePath(watchDir);
  try {
    const content = fs.readFileSync(cachePath, 'utf-8');
    res.json(JSON.parse(content));
  } catch {
    res.json({ version: 1, images: {} });
  }
});

/**
 * POST /api/publish-cache
 * Write the image cache manifest to workspace.
 */
router.post('/publish-cache', (req, res) => {
  const watchDir = req.watchDir;
  if (!watchDir) return res.status(400).json({ error: 'No active workspace' });

  const cacheData = req.body;
  if (!cacheData || typeof cacheData !== 'object') {
    return res.status(400).json({ error: 'Invalid cache data' });
  }

  const cacheDir = path.join(watchDir, CACHE_DIR);
  const cachePath = getCachePath(watchDir);

  try {
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (err) {
    console.error('[publish-cache] Write error:', err.message);
    res.status(500).json({ error: 'Failed to write cache file' });
  }
});

module.exports = router;
