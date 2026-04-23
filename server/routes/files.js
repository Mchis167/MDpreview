const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

router.get('/files', async (req, res) => {
  const watchDir = req.watchDir;
  if (!watchDir) return res.json([]);

  const showHidden = req.query.showHidden === 'true';
  const hideEmpty  = req.query.hideEmpty  === 'true';
  const isFlat      = req.query.flat       === 'true';

  const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', '.next'];

  async function buildTree(dir, relativePath = '') {
    const node = {
      name: path.basename(dir),
      path: relativePath,
      type: 'directory',
      children: []
    };

    try {
      const items = await fs.promises.readdir(dir);
      
      const promises = items.map(async (child) => {
        // Handle Hidden Files
        if (!showHidden && child.startsWith('.')) return;
        
        // Exclude common large/system directories
        if (EXCLUDE_DIRS.includes(child)) return;

        const childFull     = path.join(dir, child);
        const childRelative = relativePath ? path.join(relativePath, child) : child;
        
        try {
          const stat = await fs.promises.stat(childFull);

          if (stat.isDirectory()) {
            const subDir = await buildTree(childFull, childRelative);
            subDir.mtime = stat.mtimeMs; // Add mtime for directories
            // If hideEmpty is on, only add folder if it has children
            if (!hideEmpty || subDir.children.length > 0) {
              node.children.push(subDir);
            }
          } else if (child.endsWith('.md')) {
            node.children.push({ 
              name: child, 
              path: childRelative, 
              type: 'file',
              mtime: stat.mtimeMs // Add mtime for files
            });
          }
        } catch (e) {
          // skip inaccessible files
        }
      });

      await Promise.all(promises);
      node.children.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    } catch {
      // skip permission errors
    }
    return node;
  }

  function flattenTree(treeNode, list = []) {
    treeNode.children.forEach(child => {
      if (child.type === 'file') {
        list.push(child);
      } else if (child.type === 'directory') {
        flattenTree(child, list);
      }
    });
    return list;
  }

  try {
    const fullTree = await buildTree(watchDir);
    if (isFlat) {
      res.json(flattenTree(fullTree).sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      res.json(fullTree.children);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Helper to resolve absolute path safely within watchDir
function resolvePath(watchDir, filePath) {
  const fullPath = path.isAbsolute(filePath) ? path.normalize(filePath) : path.resolve(watchDir, filePath);
  const normalizedWatchDir = path.normalize(watchDir);
  if (!fullPath.startsWith(normalizedWatchDir)) {
    throw new Error('Security Error: Path traversal detected.');
  }
  return fullPath;
}

router.get('/file/raw', (req, res) => {
  const { path: filePath } = req.query;
  const watchDir = req.watchDir;
  if (!watchDir || !filePath) return res.status(400).send('Missing path');

  try {
    const fullPath = resolvePath(watchDir, filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    res.send(content);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

router.post('/file/save', (req, res) => {
  const { path: filePath, content } = req.body;
  const watchDir = req.watchDir;
  if (!watchDir || !filePath) return res.status(400).send('Missing path');

  try {
    const fullPath = resolvePath(watchDir, filePath);
    fs.writeFileSync(fullPath, content, 'utf8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// Check if file exists
router.get('/file/exists', (req, res) => {
  const watchDir = req.watchDir;
  const filePath = req.query.path;
  if (!watchDir || !filePath) return res.status(400).json({ error: 'Missing params' });

  try {
    const fullPath = resolvePath(watchDir, filePath);
    const exists = fs.existsSync(fullPath);
    res.json({ exists });
  } catch (err) {
    res.json({ exists: false });
  }
});

module.exports = router;
