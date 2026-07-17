const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '_md-workspace-assets', 'assets']);
const MAX_FILE_SIZE = 1024 * 1024; // 1MB — skip anything bigger
const MAX_RESULTS = 50;
const MAX_MATCHES_PER_FILE = 5;
const EXCERPT_RADIUS = 60;

/**
 * Find matches of `query` (case-insensitive substring) inside file content.
 * Returns up to maxMatches entries: { line, column, excerpt }.
 */
function findMatches(content, query, maxMatches = MAX_MATCHES_PER_FILE) {
  const q = query.toLowerCase();
  const matches = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length && matches.length < maxMatches; i++) {
    const idx = lines[i].toLowerCase().indexOf(q);
    if (idx === -1) continue;
    const start = Math.max(0, idx - EXCERPT_RADIUS);
    const end = Math.min(lines[i].length, idx + query.length + EXCERPT_RADIUS);
    matches.push({
      line: i + 1,
      column: idx + 1,
      excerpt: (start > 0 ? '…' : '') + lines[i].slice(start, end) + (end < lines[i].length ? '…' : ''),
    });
  }
  return matches;
}

/** Recursively list .md files under dir (relative paths). */
async function listMarkdownFiles(dir, relative = '', out = []) {
  let items;
  try {
    items = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch (_err) {
    return out;
  }
  for (const item of items) {
    if (item.name.startsWith('.') || EXCLUDE_DIRS.has(item.name)) continue;
    const rel = relative ? `${relative}/${item.name}` : item.name;
    if (item.isDirectory()) {
      await listMarkdownFiles(path.join(dir, item.name), rel, out);
    } else if (item.name.toLowerCase().endsWith('.md')) {
      out.push(rel);
    }
  }
  return out;
}

/**
 * Full-text search across all markdown files in a workspace.
 */
async function searchWorkspace(watchDir, query, maxResults = MAX_RESULTS) {
  const files = await listMarkdownFiles(watchDir);
  const results = [];
  for (const rel of files) {
    if (results.length >= maxResults) break;
    try {
      const full = path.join(watchDir, rel);
      const stat = await fs.promises.stat(full);
      if (stat.size > MAX_FILE_SIZE) continue;
      const content = await fs.promises.readFile(full, 'utf8');
      const matches = findMatches(content, query);
      if (matches.length > 0) {
        results.push({ path: rel, name: path.basename(rel), matches });
      }
    } catch (_err) {
      // unreadable file — skip
    }
  }
  return results;
}

router.get('/search/content', async (req, res) => {
  const watchDir = req.watchDir;
  const query = (req.query.q || '').trim();
  if (!watchDir) return res.json({ results: [] });
  if (query.length < 2) return res.json({ results: [] });

  try {
    const results = await searchWorkspace(watchDir, query);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports._internal = { findMatches, listMarkdownFiles, searchWorkspace };
