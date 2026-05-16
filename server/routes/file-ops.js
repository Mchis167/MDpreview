const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const { resolvePath } = require('../utils/path-util');


// DELETE file or folder
router.delete('/file-ops', (req, res) => {
  const { path: filePath } = req.query;
  const watchDir = req.watchDir;
  
  if (!watchDir || !filePath) return res.status(400).json({ error: 'Missing path' });

  try {
    const fullPath = resolvePath(watchDir, filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    // Use rmSync to handle both files and directories recursively
    fs.rmSync(fullPath, { recursive: true, force: true });
    res.json({ success: true });
  } catch (e) {
    if (e.message.includes('Security Error')) {
      return res.status(403).json({ success: false, error: e.message });
    }
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST duplicate file
router.post('/file-ops/duplicate', (req, res) => {
  const { path: filePath } = req.body;
  const watchDir = req.watchDir;
  if (!watchDir || !filePath) return res.status(400).json({ error: 'Missing path' });

  try {
    const fullPath = resolvePath(watchDir, filePath);
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
    if (e.message.includes('Security Error')) {
      return res.status(403).json({ success: false, error: e.message });
    }
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST rename file
router.post('/file-ops/rename', (req, res) => {
  const { oldPath, newPath } = req.body;
  const watchDir = req.watchDir;
  if (!watchDir || !oldPath || !newPath) return res.status(400).json({ error: 'Missing path' });

  try {
    const fullOld = resolvePath(watchDir, oldPath);
    const fullNew = resolvePath(watchDir, newPath);

    if (!fs.existsSync(fullOld)) return res.status(404).json({ success: false, error: 'Source file not found' });
    if (fs.existsSync(fullNew)) return res.status(400).json({ success: false, error: 'Target file already exists' });

    fs.renameSync(fullOld, fullNew);
    res.json({ success: true });
  } catch (e) {
    if (e.message.includes('Security Error')) {
      return res.status(403).json({ success: false, error: e.message });
    }
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST move file
router.post('/file-ops/move', (req, res) => {
  const { oldPath, newPath } = req.body;
  const watchDir = req.watchDir;
  if (!watchDir || !oldPath || !newPath) return res.status(400).json({ error: 'Missing path' });

  try {
    const fullOld = resolvePath(watchDir, oldPath);
    const fullNew = resolvePath(watchDir, newPath);
    if (!fs.existsSync(fullOld)) return res.status(404).json({ success: false, error: 'Source not found' });

    fs.renameSync(fullOld, fullNew);
    res.json({ success: true });
  } catch (e) {
    if (e.message.includes('Security Error')) {
      return res.status(403).json({ success: false, error: e.message });
    }
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST copy file
router.post('/file-ops/copy', (req, res) => {
  const { srcPath, destPath } = req.body;
  const watchDir = req.watchDir;
  if (!watchDir || !srcPath || !destPath) return res.status(400).json({ error: 'Missing path' });

  try {
    const fullSrc = resolvePath(watchDir, srcPath);
    const fullDest = resolvePath(watchDir, destPath);
    if (!fs.existsSync(fullSrc)) return res.status(404).json({ success: false, error: 'Source not found' });

    const stats = fs.statSync(fullSrc);
    if (stats.isDirectory()) {
      const copyRecursive = (src, dest) => {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (let entry of entries) {
          const s = path.join(src, entry.name);
          const d = path.join(dest, entry.name);
          entry.isDirectory() ? copyRecursive(s, d) : fs.copyFileSync(s, d);
        }
      };
      copyRecursive(fullSrc, fullDest);
    } else {
      fs.copyFileSync(fullSrc, fullDest);
    }
    res.json({ success: true });
  } catch (e) {
    if (e.message.includes('Security Error')) {
      return res.status(403).json({ success: false, error: e.message });
    }
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST create file
router.post('/file-ops/create-file', (req, res) => {
  const { path: filePath, content = '' } = req.body;
  const watchDir = req.watchDir;
  if (!watchDir || !filePath) return res.status(400).json({ error: 'Missing path' });

  console.log('[file-ops/create-file] Request:', { filePath, watchDir });

  try {
    const fullPath = resolvePath(watchDir, filePath);
    console.log('[file-ops/create-file] Resolved:', { fullPath });
    if (fs.existsSync(fullPath)) return res.status(400).json({ success: false, error: 'File already exists' });

    // Ensure parent directory exists
    const parentDir = path.dirname(fullPath);
    console.log('[file-ops/create-file] Parent dir:', { parentDir, exists: fs.existsSync(parentDir) });
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });

    fs.writeFileSync(fullPath, content);
    res.json({ success: true, path: filePath });
  } catch (e) {
    if (e.message.includes('Security Error')) {
      return res.status(403).json({ success: false, error: e.message });
    }
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST create folder
router.post('/file-ops/create-folder', (req, res) => {
  const { path: folderPath } = req.body;
  const watchDir = req.watchDir;
  if (!watchDir || !folderPath) return res.status(400).json({ error: 'Missing path' });

  try {
    const fullPath = resolvePath(watchDir, folderPath);
    if (fs.existsSync(fullPath)) return res.status(400).json({ success: false, error: 'Folder already exists' });

    fs.mkdirSync(fullPath, { recursive: true });
    res.json({ success: true, path: folderPath });
  } catch (e) {
    if (e.message.includes('Security Error')) {
      return res.status(403).json({ success: false, error: e.message });
    }
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST save attachment (for web version)
router.post('/file-ops/save-attachment', express.raw({ type: 'application/octet-stream', limit: '50mb' }), async (req, res) => {
  const watchDir = req.watchDir;
  const originalName = req.query.name || 'pasted-image.png';
  
  if (!watchDir) return res.status(400).json({ error: 'No workspace set' });

  try {
    const assetsDir = path.join(watchDir, 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    const ext = path.extname(originalName).toLowerCase() || '.png';
    const timestamp = Date.now();
    const fileName = `image-${timestamp}${ext}`;
    const fullPath = path.join(assetsDir, fileName);

    fs.writeFileSync(fullPath, req.body);

    res.json({ 
      success: true, 
      relativePath: `/assets/${fileName}`,
      fileName: fileName
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- Check if asset already exists by metadata (for Browser support) ---
router.post('/file-ops/check-asset', (req, res) => {
  const { name, size, lastModified, watchDir } = req.body;
  if (!watchDir || !name) return res.status(400).json({ error: 'Missing info' });

  const assetsDir = path.join(watchDir, 'assets');
  if (!fs.existsSync(assetsDir)) return res.json({ exists: false });

  // Look for a file with the same name
  const filePath = path.join(assetsDir, name);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    // Compare size and mtime (allow 2s difference for some filesystem quirks)
    const sizeMatch = stats.size === size;
    const timeMatch = Math.abs(stats.mtimeMs - lastModified) < 2000;

    if (sizeMatch && timeMatch) {
      return res.json({ 
        exists: true, 
        relativePath: `/assets/${name}` 
      });
    }
  }

  res.json({ exists: false });
});

module.exports = router;
