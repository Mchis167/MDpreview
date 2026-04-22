const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

// Helper to resolve absolute path from watchDir and relative path
// Helper to resolve absolute path safely within watchDir
function resolvePath(watchDir, filePath) {
  // Always resolve to absolute path to handle ../ and other tricks
  const fullPath = path.isAbsolute(filePath) ? path.normalize(filePath) : path.resolve(watchDir, filePath);
  
  // Ensure the resolved path STARTS with the watchDir
  const normalizedWatchDir = path.normalize(watchDir);
  if (!fullPath.startsWith(normalizedWatchDir)) {
    throw new Error('Security Error: Path traversal detected.');
  }
  return fullPath;
}

// DELETE file
router.delete('/file-ops', (req, res) => {
  const { path: filePath } = req.query;
  const watchDir = req.watchDir;
  if (!watchDir || !filePath) return res.status(400).json({ error: 'Missing path' });

  const fullPath = resolvePath(watchDir, filePath);
  try {
    if (!fs.existsSync(fullPath)) return res.status(404).json({ success: false, error: 'File not found' });
    fs.unlinkSync(fullPath);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST duplicate file
router.post('/file-ops/duplicate', (req, res) => {
  const { path: filePath } = req.body;
  const watchDir = req.watchDir;
  if (!watchDir || !filePath) return res.status(400).json({ error: 'Missing path' });

  const fullPath = resolvePath(watchDir, filePath);
  try {
    if (!fs.existsSync(fullPath)) return res.status(404).json({ success: false, error: 'Source file not found' });
    
    const dir = path.dirname(fullPath);
    const ext = path.extname(fullPath);
    const name = path.basename(fullPath, ext);
    
    let copyPath;
    let counter = 1;
    do {
      copyPath = path.join(dir, `${name} (${counter++})${ext}`);
    } while (fs.existsSync(copyPath));

    fs.copyFileSync(fullPath, copyPath);
    res.json({ success: true, path: copyPath });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST rename file
router.post('/file-ops/rename', (req, res) => {
  const { oldPath, newPath } = req.body;
  const watchDir = req.watchDir;
  if (!watchDir || !oldPath || !newPath) return res.status(400).json({ error: 'Missing path' });

  const fullOld = resolvePath(watchDir, oldPath);
  const fullNew = resolvePath(watchDir, newPath);

  try {
    if (!fs.existsSync(fullOld)) return res.status(404).json({ success: false, error: 'Source file not found' });
    if (fs.existsSync(fullNew)) return res.status(400).json({ success: false, error: 'Target file already exists' });
    
    fs.renameSync(fullOld, fullNew);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
