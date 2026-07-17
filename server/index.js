const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const path     = require('path');
const chokidar = require('chokidar');
const os       = require('os');
const fs       = require('fs');
const WikiIndexer = require('./services/wiki-indexer');
const { resolvePath } = require('./utils/path-util');

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
app.use('/wasm-assets', express.static(path.join(__dirname, '../assets/wasm')));
app.use('/monaco', express.static(path.join(__dirname, '../node_modules/monaco-editor')));
app.use('/jsquash', express.static(path.join(__dirname, '../node_modules/@jsquash')));
app.use('/testing', express.static(path.join(__dirname, '../renderer/testing')));
app.use('/_md-workspace-assets', (req, res, next) => {
  if (currentWatchDir) {
    try {
      const decodedPath = decodeURIComponent(req.path).replace(/^\//, '');
      const assetsDir = path.join(currentWatchDir, '_md-workspace-assets');
      const workspaceAssetPath = resolvePath(assetsDir, decodedPath);

      if (fs.existsSync(workspaceAssetPath)) {
        // Thumbnail optimization
        if (req.query.thumbnail === 'true') {
          try {
            const electron = require('electron');
            if (electron && electron.nativeImage) {
              const image = electron.nativeImage.createFromPath(workspaceAssetPath);
              if (!image.isEmpty()) {
                const thumb = image.resize({ width: 300 }); // Resize to 300px for high-dpi
                res.type('image/jpeg');
                return res.send(thumb.toJPEG(75)); // 75% quality for performance
              }
            }
          } catch (_err) {
            // Fallback to full image if electron/nativeImage fails
          }

        }
        return res.sendFile(workspaceAssetPath);
      } else {
        console.warn(`[Server] Asset not found in workspace: ${workspaceAssetPath}`);
      }
    } catch (_e) {
      console.error('[Server] Failed to decode asset path:', req.path);
    }

  } else {
    console.warn('[Server] Asset requested but currentWatchDir is not set');
  }
  next();
}, express.static(path.join(__dirname, '../assets')));

// --- Main HTML ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../renderer/index.html'));
});

// Handle favicon.ico to avoid 404s
app.get('/favicon.ico', (req, res) => res.status(204).end());

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

  let normalizedDir = dir;
  try {
    normalizedDir = fs.realpathSync(dir);
  } catch (_e) {
    // Keep original if normalization fails
  }

  setWatchDir(normalizedDir);
  res.json({ success: true, watchDir: normalizedDir });
});

app.use('/api', require('./routes/state'));
app.use('/api', require('./routes/files'));
app.use('/api', require('./routes/render'));
app.use('/api', require('./routes/workspaces'));
app.use('/api', require('./routes/comments'));
app.use('/api', require('./routes/wiki'));
app.use('/api', require('./routes/assets'));
app.use('/api', require('./routes/file-ops'));
app.use('/api', require('./routes/handoff'));
app.use('/api', require('./routes/worker-publish'));
app.use('/api', require('./routes/publish-cache'));

// --- File watcher ---
function startWatcher(dir) {
  if (watcher) { watcher.close(); watcher = null; }
  if (!dir) return;

  watcher = chokidar
    .watch(dir, { ignored: /(node_modules|\.git)/, persistent: true, ignoreInitial: true })
    .on('change',    (fp) => {
      io.emit('file-changed', { file: path.relative(dir, fp) });
      if (fp.endsWith('.md')) {
        triggerReindex(dir);
        io.emit('assets-changed');
      }
      if (fp.includes(path.sep + '_md-workspace-assets' + path.sep)) {
        io.emit('assets-changed');
      }
    })
    .on('add',       (fp) => {
      io.emit('tree-changed');
      if (fp.endsWith('.md')) {
        triggerReindex(dir);
        io.emit('assets-changed');
      }
      if (fp.includes(path.sep + '_md-workspace-assets' + path.sep)) {
        io.emit('assets-changed');
      }
    })
    .on('unlink',    (fp) => {
      io.emit('file-deleted', { file: path.relative(dir, fp) });
      io.emit('tree-changed');
      if (fp.endsWith('.md')) {
        triggerReindex(dir);
        io.emit('assets-changed');
      }
      if (fp.includes(path.sep + '_md-workspace-assets' + path.sep)) {
        io.emit('assets-changed');
      }
    })
    .on('addDir',    (dp) => {
      io.emit('tree-changed');
      if (dp.endsWith(path.sep + '_md-workspace-assets')) {
        io.emit('assets-changed');
      }
    })
    .on('unlinkDir', (dp) => {
      io.emit('tree-changed');
      if (dp.endsWith(path.sep + '_md-workspace-assets')) {
        io.emit('assets-changed');
      }
    });
}

let reindexTimeout = null;
function triggerReindex(dir) {
  if (reindexTimeout) clearTimeout(reindexTimeout);
  reindexTimeout = setTimeout(async () => {
    try {
      const workspacesFile = path.join(currentDataDir, 'workspaces.json');
      if (!fs.existsSync(workspacesFile)) return;

      const data = JSON.parse(fs.readFileSync(workspacesFile, 'utf8'));
      const ws = data.workspaces.find(w => w.path === dir);
      
      if (ws && ws.wikiScanner && ws.wikiScanner.enabled) {
        console.log(`[Server] Auto-reindexing Wiki for ${dir}`);
        const indexer = new WikiIndexer(dir);
        await indexer.build();
        io.emit('wiki-index-updated');
      }
    } catch (err) {
      console.error('[Server] Auto-reindex failed:', err.message);
    }
  }, 1500); // 1.5s debounce
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

module.exports = { start, stop, setWatchDir, getWatchDir: () => currentWatchDir, getDataDir: () => currentDataDir };

if (require.main === module) {
  start();
}
