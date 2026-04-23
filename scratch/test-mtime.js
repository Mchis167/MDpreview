const fs = require('fs');
const path = require('path');

async function buildTree(dir, relativePath = '') {
  const node = {
    name: path.basename(dir),
    path: relativePath,
    type: 'directory',
    children: []
  };

  const items = await fs.promises.readdir(dir);
  for (const child of items) {
    if (child.startsWith('.') || child === 'node_modules') continue;
    const childFull = path.join(dir, child);
    const childRelative = relativePath ? path.join(relativePath, child) : child;
    const stat = await fs.promises.stat(childFull);
    if (stat.isDirectory()) {
       // skip
    } else if (child.endsWith('.md')) {
      node.children.push({ name: child, path: childRelative, type: 'file', mtime: stat.mtimeMs });
    }
  }
  return node;
}

buildTree(process.cwd()).then(tree => {
  console.log(JSON.stringify(tree.children[0], null, 2));
});
