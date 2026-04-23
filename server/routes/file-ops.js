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
  
  // Case-insensitive check for Mac and Windows
  const isCaseInsensitive = process.platform === 'win32' || process.platform === 'darwin';
  const checkFullPath = isCaseInsensitive ? fullPath.toLowerCase() : fullPath;
  const checkWatchDir = isCaseInsensitive ? normalizedWatchDir.toLowerCase() : normalizedWatchDir;

  // Add trailing separator to watchDir check to avoid partial folder name matches (e.g., /work vs /work-files)
  const sep = path.sep;
  const checkWatchDirWithSep = checkWatchDir.endsWith(sep) ? checkWatchDir : checkWatchDir + sep;

  if (!checkFullPath.startsWith(checkWatchDirWithSep) && checkFullPath !== checkWatchDir) {
    throw new Error('Security Error: Path traversal detected.');
  }
  return fullPath;
}

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
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST create file
router.post('/file-ops/create-file', (req, res) => {
  const { path: filePath, content = '' } = req.body;
  const watchDir = req.watchDir;
  if (!watchDir || !filePath) return res.status(400).json({ error: 'Missing path' });

  try {
    const fullPath = resolvePath(watchDir, filePath);
    if (fs.existsSync(fullPath)) return res.status(400).json({ success: false, error: 'File already exists' });
    
    // Ensure parent directory exists
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });

    fs.writeFileSync(fullPath, content);
    res.json({ success: true, path: filePath });
  } catch (e) {
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
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
