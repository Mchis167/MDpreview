const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const path     = require('path');
const chokidar = require('chokidar');

const app    = express();
app.use(express.json());
const server = http.createServer(app);
const io     = new Server(server);

const PORT = process.env.PORT || 3737;

let currentWatchDir = null;
let currentDataDir  = path.join(__dirname, '../data');
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

app.use('/api', require('./routes/files'));
app.use('/api', require('./routes/render'));
app.use('/api', require('./routes/workspaces'));
app.use('/api', require('./routes/comments'));
app.use('/api', require('./routes/file-ops'));

// --- File watcher ---
function startWatcher(dir) {
  if (watcher) { watcher.close(); watcher = null; }
  if (!dir) return;

  watcher = chokidar
    .watch(dir, { ignored: /(node_modules|\.git)/, persistent: true, ignoreInitial: true })
    .on('change',    (fp) => io.emit('file-changed', { file: path.relative(dir, fp) }))
    .on('add',       ()   => io.emit('tree-changed'))
    .on('unlink',    ()   => io.emit('tree-changed'))
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
