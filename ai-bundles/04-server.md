# Module: SERVER


<file path="server/index.js">
```js
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const path     = require('path');
const chokidar = require('chokidar');
const os       = require('os');
const fs       = require('fs');

const app    = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const server = http.createServer(app);
const io     = new Server(server);

const PORT = process.env.PORT || 3737;

/**
 * Resolves the default data directory.
 * Prioritizes the Electron app's userData folder if it exists.
 */
function getDefaultDataDir() {
  if (process.env.MDPREVIEW_DATA_DIR) return process.env.MDPREVIEW_DATA_DIR;

  const home = os.homedir();
  let appPath = '';

  if (process.platform === 'darwin') {
    appPath = path.join(home, 'Library/Application Support/MDpreview');
  } else if (process.platform === 'win32') {
    appPath = path.join(process.env.APPDATA || path.join(home, 'AppData/Roaming'), 'MDpreview');
  } else {
    appPath = path.join(home, '.config/MDpreview');
  }

  // If the Electron app data folder exists, use it to share data
  if (fs.existsSync(appPath)) {
    return appPath;
  }

  // Fallback to local data folder in the project
  return path.join(__dirname, '../data');
}

let currentWatchDir = null;
let currentDataDir  = getDefaultDataDir();
let watcher         = null;

// --- Static renderer assets ---
app.use('/css',    express.static(path.join(__dirname, '../renderer/css')));
app.use('/js',     express.static(path.join(__dirname, '../renderer/js')));
app.use('/testing', express.static(path.join(__dirname, '../renderer/testing')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// --- Main HTML ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../renderer/index.html'));
});

// --- Inject watchDir and dataDir into requests ---
app.use('/api', (req, res, next) => {
  req.watchDir = currentWatchDir;
  req.dataDir  = currentDataDir;
  next();
});

// Debug route to verify API is alive
app.get('/api/ping', (req, res) => res.json({ status: 'alive', time: new Date().toISOString() }));

// Endpoint to set watch directory (used by web version)
app.post('/api/set-watch-dir', (req, res) => {
  const { dir } = req.body;
  if (!dir) return res.status(400).send('Missing directory path');
  setWatchDir(dir);
  res.json({ success: true, watchDir: dir });
});

app.use('/api', require('./routes/state'));
app.use('/api', require('./routes/files'));
app.use('/api', require('./routes/render'));
app.use('/api', require('./routes/workspaces'));
app.use('/api', require('./routes/comments'));
app.use('/api', require('./routes/file-ops'));
app.use('/api', require('./routes/handoff'));
app.use('/api', require('./routes/worker-publish'));

// --- File watcher ---
function startWatcher(dir) {
  if (watcher) { watcher.close(); watcher = null; }
  if (!dir) return;

  watcher = chokidar
    .watch(dir, { ignored: /(node_modules|\.git)/, persistent: true, ignoreInitial: true })
    .on('change',    (fp) => io.emit('file-changed', { file: path.relative(dir, fp) }))
    .on('add',       ()   => io.emit('tree-changed'))
    .on('unlink',    (fp) => {
      io.emit('file-deleted', { file: path.relative(dir, fp) });
      io.emit('tree-changed');
    })
    .on('addDir',    ()   => io.emit('tree-changed'))
    .on('unlinkDir', ()   => io.emit('tree-changed'));
}

function setWatchDir(dir) {
  currentWatchDir = dir;
  startWatcher(dir);
  io.emit('workspace-changed');
}

function start(userDataPath) {
  if (userDataPath) {
    currentDataDir = userDataPath;
    console.log(`Server: Using data directory: ${currentDataDir}`);
  }
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is in use, trying a random available port...`);
        server.listen(0);
      } else {
        server.removeListener('error', onError);
        reject(err);
      }
    };

    server.on('error', onError);

    server.listen(PORT, () => {
      server.removeListener('error', onError);
      const actualPort = server.address().port;
      console.log(`MDpreview running at http://localhost:${actualPort}`);
      resolve(actualPort);
    });
  });
}

function stop() {
  if (watcher) { watcher.close(); watcher = null; }
  server.close();
}

module.exports = { start, stop, setWatchDir, getWatchDir: () => currentWatchDir };

if (require.main === module) {
  start();
}

```
</file>

<file path="server/routes/comments.js">
```js
const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const { v4: uuidv4 } = require('uuid');

function getCommentsDir(dataDir) {
  const dir = path.join(dataDir, 'comments');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getCommentsFile(dataDir, wsId, filePath) {
  const encoded = filePath.replace(/[/\\:.]/g, '_');
  const dir = path.join(getCommentsDir(dataDir), wsId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${encoded}.json`);
}

function loadComments(dataDir, wsId, filePath) {
  try {
    const file = getCommentsFile(dataDir, wsId, filePath);
    if (!fs.existsSync(file)) return [];
    const data = fs.readFileSync(file, 'utf8');
    const comments = JSON.parse(data);

    // Auto-fix: Ensure every comment has a unique ID
    let changed = false;
    comments.forEach(c => {
      if (!c.id) {
        c.id = uuidv4();
        changed = true;
      }
    });

    if (changed) {
      saveComments(dataDir, wsId, filePath, comments);
    }

    return comments;
  } catch {
    return [];
  }
}

function saveComments(dataDir, wsId, filePath, comments) {
  fs.writeFileSync(getCommentsFile(dataDir, wsId, filePath), JSON.stringify(comments, null, 2), 'utf8');
}

// GET comments
router.get('/comments', (req, res) => {
  const { wsId, file } = req.query;
  if (!wsId || !file) return res.status(400).json({ error: 'Missing wsId or file' });
  res.json(loadComments(req.dataDir, wsId, file));
});

// POST save comment
router.post('/comments', (req, res) => {
  const { wsId, file, commentData } = req.body;
  if (!wsId || !file || !commentData) return res.status(400).json({ error: 'Missing data' });

  const comments = loadComments(req.dataDir, wsId, file);
  let resultComment;

  // Destructure to avoid overwriting id with null/undefined from frontend
  const { id, createdAt: _createdAt, ...data } = commentData;

  if (id) {
    const idx = comments.findIndex(c => c.id === id);
    if (idx !== -1) {
      comments[idx] = { ...comments[idx], ...data, updatedAt: new Date().toISOString() };
      resultComment = comments[idx];
    } else {
      resultComment = { ...data, id, createdAt: new Date().toISOString() };
      comments.push(resultComment);
    }
  } else {
    resultComment = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    comments.push(resultComment);
  }

  comments.sort((a, b) => a.lineStart - b.lineStart);
  saveComments(req.dataDir, wsId, file, comments);
  res.json(resultComment);
});

// DELETE comment
router.delete('/comments', (req, res) => {
  const { wsId, file, commentId } = req.query;
  const comments = loadComments(req.dataDir, wsId, file).filter(c => c.id !== commentId);
  saveComments(req.dataDir, wsId, file, comments);
  res.json(comments);
});

// POST clear comments
router.post('/comments/clear', (req, res) => {
  const { wsId, file } = req.body;
  saveComments(req.dataDir, wsId, file, []);
  res.json([]);
});

module.exports = router;

```
</file>

<file path="server/routes/file-ops.js">
```js
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

```
</file>

<file path="server/routes/files.js">
```js
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
        } catch (_e) {
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
  } catch (_err) {
    res.json({ exists: false });
  }
});

// Get file metadata (mtime, size, etc.)
router.get('/file/meta', (req, res) => {
  const watchDir = req.watchDir;
  const filePath = req.query.path;
  if (!watchDir || !filePath) return res.status(400).json({ error: 'Missing params' });

  try {
    const fullPath = resolvePath(watchDir, filePath);
    const stat = fs.statSync(fullPath);
    res.json({
      name: path.basename(fullPath),
      path: filePath,
      mtime: stat.mtimeMs,
      size: stat.size,
      birthtime: stat.birthtimeMs
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

```
</file>

<file path="server/routes/handoff.js">
```js
const express = require('express');
const router = express.Router();


/**
 * Handoff Proxy Route
 * Purpose: Bypass CORS for web environment by proxying requests to handoff.host
 */
router.post('/handoff/publish', async (req, res) => {
  try {
    const { html, slug, token, note, password } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, error: 'Missing API Token' });
    }

    const formData = new FormData();
    
    // 1. Main file (HTML)
    const htmlBlob = new Blob([html], { type: 'text/html' });
    formData.append('file', htmlBlob, 'index.html');
    
    // 2. Metadata
    formData.append('slug', slug);
    if (note) formData.append('note', note);
    if (password) formData.append('password', password);
    
    // Perform server-to-server request (Bypasses CORS)
    const response = await fetch('https://handoff.host/api/upload/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        success: false, 
        error: result.error || result.message || `Upload failed with status ${response.status}` 
      });
    }
    
    res.json({ 
      success: true, 
      url: result.url,
      version: result.version
    });
  } catch (error) {
    console.error('[SERVER HANDOFF] Proxy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

```
</file>

<file path="server/routes/render.js">
```js
const express     = require('express');
const router      = express.Router();
const fs          = require('fs');
const path        = require('path');
const hljs        = require('highlight.js');
const { marked }  = require('marked');

// Configure marked with highlight.js
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (_ignored) {}
    }
    return hljs.highlightAuto(code).value;
  },
  langPrefix: 'hljs language-'
});

/**
 * Render markdown with line-number annotations on each block.
 * Each top-level block is wrapped in:
 *   <div class="md-block" data-line-start="N" data-line-end="M">...</div>
 */
function renderWithLineNumbers(content) {
  const tokens = marked.lexer(content);
  let currentLine = 1;
  let html = '';

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (!token.raw) { i++; continue; }

    const lineStart  = currentLine;
    let tokenRaw     = token.raw;



    // Advance counter for the current token
    const rawLines = tokenRaw.split('\n');
    currentLine += rawLines.length - (rawLines[rawLines.length - 1] === '' ? 1 : 0);

    if (token.type === 'space') { i++; continue; }

    // Check if this token starts a <details> block
    if (token.type === 'html' && token.raw.trim().toLowerCase().startsWith('<details')) {
      // Accumulate tokens until we find the closing </details>
      let j = i;
      let depth = 0;
      let combinedRaw = '';
      
      while (j < tokens.length) {
        combinedRaw += tokens[j].raw;
        // Simple tag counting (could be more robust with regex)
        if (tokens[j].raw.toLowerCase().includes('<details')) depth++;
        if (tokens[j].raw.toLowerCase().includes('</details>')) depth--;
        
        if (depth <= 0) break;
        j++;
      }
      
      if (j > i) {
        // We found a complete block or reached the end
        const entireRaw = combinedRaw;
        const entireHtml = marked.parse(entireRaw);
        
        // Calculate lines for the entire combined block
        const entireLines = entireRaw.split('\n');
        const lineEnd = lineStart + (entireLines.length - (entireLines[entireLines.length - 1] === '' ? 1 : 0)) - 1;
        
        html += `<div class="md-block" data-line-start="${lineStart}" data-line-end="${lineEnd}"><div class="md-line" data-line="${lineStart}">${entireHtml}</div></div>\n`;
        
        // Sync the main loop's currentLine and index
        // We already added lineStart's first token lines, but we need to account for the rest
        const _extraLines = entireRaw.trimEnd().split('\n').length - rawLines.length;
        // currentLine += Math.max(0, extraLines); // Already handled by the inner tokens if we continued, but we skip them
        
        // Let's just recalculate currentLine properly
        currentLine = lineStart + entireLines.length - (entireLines[entireLines.length - 1] === '' ? 1 : 0);
        
        i = j + 1;
        continue;
      }
    }

    // Default processing for other tokens
    let tokenHtml = '';
    if (token.type === 'code' && token.lang !== 'mermaid') {
      const lang = token.lang || '';
      let highlighted = '';
      try {
        if (lang && hljs.getLanguage(lang)) {
          highlighted = hljs.highlight(token.text, { language: lang }).value;
        } else {
          highlighted = hljs.highlightAuto(token.text).value;
        }
      } catch (_e) { highlighted = token.text; }
      tokenHtml = `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
    } else {
      tokenHtml = marked.parser([token]);
    }

    const blockLines = token.raw.trimEnd().split('\n').length;
    const lineEnd    = lineStart + blockLines - 1;

    const isAtomic = ['code', 'blockquote', 'list', 'table', 'html'].includes(token.type);
    
    if (isAtomic) {
      let finalHtml = tokenHtml;
      if (token.type === 'table') {
        finalHtml = `<div class="md-table-wrapper">${tokenHtml}</div>`;
      }
      html += `<div class="md-block" data-line-start="${lineStart}" data-line-end="${lineEnd}"><div class="md-line" data-line="${lineStart}">${finalHtml}</div></div>\n`;
      i++;
      continue;
    }

    // Split token HTML by lines and wrap each in .md-line
    const renderedLines = tokenHtml.trim().split('\n');
    let wrappedHtml = '';
    for (let k = 0; k < renderedLines.length; k++) {
        const lineNum = lineStart + k;
        if (lineNum <= lineEnd) {
            wrappedHtml += `<div class="md-line" data-line="${lineNum}">${renderedLines[k]}</div>\n`;
        } else {
            wrappedHtml += renderedLines[k] + '\n';
        }
    }
    html += `<div class="md-block" data-line-start="${lineStart}" data-line-end="${lineEnd}">${wrappedHtml}</div>\n`;
    i++;
  }

  return _sanitize(html);
}

/**
 * Basic XSS Sanitization
 * Strips script and iframe tags
 */
function _sanitize(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, ''); // Remove inline event handlers
}

// Helper to resolve absolute path safely within watchDir
function resolvePath(watchDir, filePath) {
  const fullPath = path.isAbsolute(filePath) ? path.normalize(filePath) : path.resolve(watchDir, filePath);
  const normalizedWatchDir = path.normalize(watchDir);
  if (!fullPath.startsWith(normalizedWatchDir)) {
    throw new Error('Security Error: Path traversal detected.');
  }
  return fullPath;
}

router.get('/render', (req, res) => {
  const watchDir = req.watchDir;
  const file     = req.query.file;

  if (!watchDir) return res.status(400).json({ error: 'No workspace set' });
  if (!file)     return res.status(400).json({ error: 'Missing file param' });

  try {
    const fullPath   = resolvePath(watchDir, file);
    const content    = fs.readFileSync(fullPath, 'utf8');
    const html       = renderWithLineNumbers(content);
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

```
</file>

<file path="server/routes/state.js">
```js
const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

/**
 * GET /api/state
 * Loads the global application state (settings, open tabs, etc.)
 */
router.get('/state', (req, res) => {
  const stateFile = path.join(req.dataDir, 'app_state.json');
  try {
    if (fs.existsSync(stateFile)) {
      const data = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      return res.json(data);
    }
    return res.json({});
  } catch (err) {
    console.error('Error loading state:', err);
    res.status(500).json({ error: 'Failed to load state' });
  }
});

/**
 * POST /api/state
 * Saves the global application state
 */
router.post('/state', (req, res) => {
  const stateFile = path.join(req.dataDir, 'app_state.json');
  try {
    const state = req.body;
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving state:', err);
    res.status(500).json({ error: 'Failed to save state' });
  }
});

module.exports = router;

```
</file>

<file path="server/routes/worker-publish.js">
```js
const express = require('express');
const router = express.Router();

/**
 * POST /api/worker-publish
 * Proxy request to Cloudflare Worker with Admin Secret
 * This prevents the secret from being exposed in the browser.
 */
router.post('/worker-publish', async (req, res) => {
  try {
    const { payload, workerUrl, secret } = req.body;

    if (!workerUrl || !secret) {
      return res.status(400).json({ error: 'Worker URL and Admin Secret are required' });
    }

    const response = await fetch(`${workerUrl}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret': secret
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: result.error || `Worker responded with ${response.status}` 
      });
    }

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[Server] Worker Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

```
</file>

<file path="server/routes/workspaces.js">
```js
const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const { v4: uuidv4 } = require('uuid');

function getWorkspacesFile(dataDir) {
  const file = path.join(dataDir, 'workspaces.json');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return file;
}

function loadWorkspaces(dataDir) {
  try {
    const file = getWorkspacesFile(dataDir);
    if (!fs.existsSync(file)) return { workspaces: [], activeWorkspaceId: null };
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_e) {
    return { workspaces: [], activeWorkspaceId: null };
  }
}

function saveWorkspaces(dataDir, data) {
  fs.writeFileSync(getWorkspacesFile(dataDir), JSON.stringify(data, null, 2), 'utf8');
}

// GET all workspaces
router.get('/workspaces', (req, res) => {
  res.json(loadWorkspaces(req.dataDir));
});

// POST new workspace
router.post('/workspaces', (req, res) => {
  const { name, path: folderPath } = req.body;
  const data = loadWorkspaces(req.dataDir);
  const ws = {
    id: uuidv4(),
    name,
    path: folderPath,
    createdAt: new Date().toISOString()
  };
  data.workspaces.push(ws);
  if (!data.activeWorkspaceId) data.activeWorkspaceId = ws.id;
  saveWorkspaces(req.dataDir, data);
  res.json(ws);
});

// DELETE workspace
router.delete('/workspaces/:id', (req, res) => {
  const { id } = req.params;
  const data = loadWorkspaces(req.dataDir);
  data.workspaces = data.workspaces.filter(w => w.id !== id);
  if (data.activeWorkspaceId === id) {
    data.activeWorkspaceId = data.workspaces[0]?.id || null;
  }
  saveWorkspaces(req.dataDir, data);
  res.json(data);
});

// POST set active workspace
router.post('/workspaces/active', (req, res) => {
  const { id } = req.body;
  const data = loadWorkspaces(req.dataDir);
  data.activeWorkspaceId = id;
  saveWorkspaces(req.dataDir, data);
  res.json(data);
});

// POST rename workspace
router.post('/workspaces/rename', (req, res) => {
  const { id, name } = req.body;
  const data = loadWorkspaces(req.dataDir);
  const ws = data.workspaces.find(w => w.id === id);
  if (ws) {
    ws.name = name;
    saveWorkspaces(req.dataDir, data);
  }
  res.json(data);
});

module.exports = router;

```
</file>

<file path="server/start.js">
```js
require('./index').start();

```
</file>

<file path="server/test-server.js">
```js
const server = require('./server/index');
server.start().then(port => {
  console.log('Test server started on port', port);
  // Set watch dir to project root for testing
  server.setWatchDir(process.cwd());
});

```
</file>
