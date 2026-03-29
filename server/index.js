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
let watcher         = null;

// --- Static renderer assets ---
app.use('/css',    express.static(path.join(__dirname, '../renderer/css')));
app.use('/js',     express.static(path.join(__dirname, '../renderer/js')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// --- Main HTML ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../renderer/index.html'));
});

// --- Inject watchDir into requests ---
app.use('/api', (req, res, next) => {
  req.watchDir = currentWatchDir;
  next();
});

app.use('/api', require('./routes/files'));
app.use('/api', require('./routes/render'));

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

function start() {
  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`MDpreview running at http://localhost:${PORT}`);
      resolve(PORT);
    });
  });
}

function stop() {
  if (watcher) { watcher.close(); watcher = null; }
  server.close();
}

module.exports = { start, stop, setWatchDir, getWatchDir: () => currentWatchDir };
