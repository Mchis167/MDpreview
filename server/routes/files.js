const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

router.get('/files', (req, res) => {
  const watchDir = req.watchDir;
  if (!watchDir) return res.json([]);

  function buildTree(dir, relativePath = '') {
    const node = {
      name: path.basename(dir),
      path: relativePath,
      type: 'directory',
      children: []
    };
    try {
      fs.readdirSync(dir)
        .sort()
        .forEach(child => {
          const childFull     = path.join(dir, child);
          const childRelative = relativePath ? path.join(relativePath, child) : child;
          const stat          = fs.statSync(childFull);

          if (stat.isDirectory()) {
            node.children.push(buildTree(childFull, childRelative));
          } else if (child.endsWith('.md')) {
            node.children.push({ name: child, path: childRelative, type: 'file' });
          }
        });
    } catch {
      // skip permission errors
    }
    return node;
  }

  try {
    res.json(buildTree(watchDir).children);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
