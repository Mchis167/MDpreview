const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

router.get('/files', (req, res) => {
  const watchDir = req.watchDir;
  if (!watchDir) return res.json([]);

  // Query Params: showHidden=true/false, hideEmpty=true/false, flat=true/false
  const showHidden = req.query.showHidden === 'true';
  const hideEmpty  = req.query.hideEmpty  === 'true';
  const isFlat      = req.query.flat       === 'true';

  function buildTree(dir, relativePath = '') {
    const node = {
      name: path.basename(dir),
      path: relativePath,
      type: 'directory',
      children: []
    };

    try {
      const items = fs.readdirSync(dir).sort();
      
      items.forEach(child => {
        // Handle Hidden Files
        if (!showHidden && child.startsWith('.')) return;

        const childFull     = path.join(dir, child);
        const childRelative = relativePath ? path.join(relativePath, child) : child;
        const stat          = fs.statSync(childFull);

        if (stat.isDirectory()) {
          const subDir = buildTree(childFull, childRelative);
          // If hideEmpty is on, only add folder if it has children
          if (!hideEmpty || subDir.children.length > 0) {
            node.children.push(subDir);
          }
        } else if (child.endsWith('.md')) {
          node.children.push({ name: child, path: childRelative, type: 'file' });
        }
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
    const fullTree = buildTree(watchDir);
    if (isFlat) {
      res.json(flattenTree(fullTree).sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      res.json(fullTree.children);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/file/raw', (req, res) => {
  const { path: filePath } = req.query;
  const watchDir = req.watchDir;
  if (!watchDir || !filePath) return res.status(400).send('Missing path');

  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(watchDir, filePath);
  try {
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

  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(watchDir, filePath);
  try {
    fs.writeFileSync(fullPath, content, 'utf8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

module.exports = router;
