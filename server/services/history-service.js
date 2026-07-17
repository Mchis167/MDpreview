/**
 * HistoryService — per-file version snapshots.
 * Snapshots live under <watchDir>/_md-workspace-assets/.history/<encoded-rel-path>/<ts>.md
 * (that directory is already excluded from tree, search and wiki indexing).
 */
const fs = require('fs');
const path = require('path');

const MAX_SNAPSHOTS_PER_FILE = 30;
// A new snapshot within this window replaces bursts from autosave instead of piling up.
const MIN_SNAPSHOT_INTERVAL_MS = 60 * 1000;

function historyDirFor(watchDir, relPath) {
  return path.join(watchDir, '_md-workspace-assets', '.history', encodeURIComponent(relPath));
}

/**
 * Snapshot the CURRENT on-disk content of relPath (call BEFORE overwriting it).
 * Skips when: file doesn't exist, content matches the latest snapshot, or the
 * latest snapshot is younger than MIN_SNAPSHOT_INTERVAL_MS.
 */
function snapshot(watchDir, relPath, fullPath) {
  try {
    if (!fs.existsSync(fullPath)) return false;
    const content = fs.readFileSync(fullPath, 'utf8');
    const dir = historyDirFor(watchDir, relPath);
    fs.mkdirSync(dir, { recursive: true });

    const existing = list(watchDir, relPath);
    if (existing.length > 0) {
      const latest = existing[0];
      if (Date.now() - latest.ts < MIN_SNAPSHOT_INTERVAL_MS) return false;
      const latestContent = fs.readFileSync(path.join(dir, latest.file), 'utf8');
      if (latestContent === content) return false;
    }

    const ts = Date.now();
    const target = path.join(dir, `${ts}.md`);
    const tmp = `${target}.tmp`;
    fs.writeFileSync(tmp, content, 'utf8');
    fs.renameSync(tmp, target); // atomic — no torn snapshot on crash

    // Rotate oldest beyond the cap
    const all = list(watchDir, relPath);
    for (const old of all.slice(MAX_SNAPSHOTS_PER_FILE)) {
      fs.rmSync(path.join(dir, old.file), { force: true });
    }
    return true;
  } catch (_err) {
    return false; // history must never block a save
  }
}

/** List snapshots, newest first: [{ ts, file, size }] */
function list(watchDir, relPath) {
  const dir = historyDirFor(watchDir, relPath);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => /^\d+\.md$/.test(f))
    .map((f) => {
      const ts = parseInt(f, 10);
      let size = 0;
      try { size = fs.statSync(path.join(dir, f)).size; } catch (_e) { /* stat race */ }
      return { ts, file: f, size };
    })
    .sort((a, b) => b.ts - a.ts);
}

/** Read one snapshot's content, or null. */
function get(watchDir, relPath, ts) {
  const file = path.join(historyDirFor(watchDir, relPath), `${parseInt(ts, 10)}.md`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8');
}

module.exports = { snapshot, list, get, historyDirFor, MAX_SNAPSHOTS_PER_FILE, MIN_SNAPSHOT_INTERVAL_MS };
