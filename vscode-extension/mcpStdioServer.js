#!/usr/bin/env node
/* ============================================================
   mdp-mcp-server — MDpreview review comments, over stdio.

   Zero dependencies on purpose: this single file is copied to
   ~/.mdpreview/mcp-server.js when the extension activates, and a
   file with no node_modules behind it can be copied anywhere and
   still run. MCP over stdio is newline-delimited JSON-RPC 2.0,
   which is little enough to implement directly.

   Scope comes from the filesystem, not from a list of open editor
   folders: given a file, walk up to the directory that owns the
   comment store. Two repos therefore cannot resolve into each
   other, whatever any editor happens to have open.

   stdout carries protocol traffic only. Anything else goes to stderr.
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

const NAME = 'mdpreview';
const VERSION = '2.1.0';
const PROTOCOL_VERSION = '2024-11-05';

const ROOT_DIR = '.mdpreview';
const STORE_DIR = path.join('.mdpreview', 'comments');
const ARCHIVE_DIR = path.join('.mdpreview', 'comments', '.archive');

const TOOL = {
  name: 'mdp_read_comments',
  description:
    'Read all pending review comments the user left on a markdown file in MDpreview. ' +
    'Reading consumes them: the tool archives the comments in the same operation, so ' +
    'there is nothing to delete or resolve afterwards — just apply the requested changes. ' +
    'A comment may carry a "tag" saying what kind of feedback it is (bug, enhancement, ' +
    'or comment) and an "images" list of absolute paths to screenshots the user pasted in — ' +
    'read those image files, they usually show the problem more directly than the text does. ' +
    'Pass the path to the markdown file, relative to the project root (e.g. "docs/plan.md") ' +
    'or absolute.',
  inputSchema: {
    type: 'object',
    properties: {
      file: { type: 'string', description: 'Markdown file path, relative to the project root or absolute' }
    },
    required: ['file']
  }
};

// ── Locating the store ──────────────────────────────────────

/**
 * Walk up from `startDir` to the directory that owns the comment store.
 * An existing store wins over a .git marker, so a repo nested inside
 * another repo keeps its own comments.
 * @returns {string|null}
 */
function findRoot(startDir) {
  const stop = path.parse(startDir).root;
  let gitRoot = null;
  let dir = startDir;

  for (;;) {
    if (isDir(path.join(dir, STORE_DIR))) return dir;
    if (!gitRoot && exists(path.join(dir, '.git'))) gitRoot = dir;

    const parent = path.dirname(dir);
    if (parent === dir || dir === stop) break;
    dir = parent;
  }

  return gitRoot;
}

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/**
 * @returns {{root, rel, commentsPath, archivePath}|{error: string}}
 */
function resolveTarget(file, cwd) {
  if (typeof file !== 'string' || !file.trim()) {
    return { error: 'Missing required argument "file".' };
  }

  const abs = path.resolve(cwd, file);
  const root = findRoot(path.dirname(abs));
  if (!root) {
    return {
      error:
        `Could not find a workspace root for "${file}" — no .mdpreview/comments ` +
        `store and no .git directory above it.`
    };
  }

  const rel = path.relative(root, abs);
  // path.relative only starts with ".." when abs sits outside root, which a
  // resolved path shouldn't after findRoot — belt and braces against symlinks.
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return { error: `"${file}" resolves outside its workspace root.` };
  }

  return {
    root,
    rel,
    commentsPath: path.join(root, STORE_DIR, `${rel}.json`),
    archivePath: path.join(root, ARCHIVE_DIR, `${rel}.json`)
  };
}

// ── Reading and consuming ───────────────────────────────────

function readJsonArray(p) {
  try {
    const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Delete `filePath`, then remove every directory it leaves empty, walking up
 * and stopping at `<root>/.mdpreview` inclusive. The first directory that is
 * still occupied ends the walk, so nothing outside the store is ever touched.
 *
 * commentStoreUtil.js states the same rule for the extension host. The logic
 * is duplicated rather than shared because this file has to stay a
 * zero-dependency single file — it is copied to ~/.mdpreview/mcp-server.js
 * and run from there, with no node_modules behind it.
 */
function removeAndPrune(root, filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch {
    return; // already gone; nothing to prune on its behalf
  }

  const stopAt = path.resolve(root, ROOT_DIR);
  let dir = path.dirname(path.resolve(filePath));

  while (dir === stopAt || dir.startsWith(stopAt + path.sep)) {
    try {
      fs.rmdirSync(dir); // throws while the directory still holds anything
    } catch {
      return;
    }
    if (dir === stopAt) return;
    dir = path.dirname(dir);
  }
}

/**
 * Read the pending comments and archive them in the same operation.
 * Nothing pending means nothing is written — no empty archive files.
 *
 * The emptied store file is deleted rather than rewritten as `[]`, so a file
 * with no outstanding comments leaves no trace in the tree. Pasted images
 * stay put: the archived copies still reference them, and the agent that has
 * just read these comments may still need to open them.
 */
function readAndConsume(loc) {
  const comments = readJsonArray(loc.commentsPath);
  if (!comments.length) return { comments: [] };

  const consumedAt = new Date().toISOString();
  const archive = readJsonArray(loc.archivePath);
  archive.push(...comments.map((c) => ({ ...c, consumedAt })));

  fs.mkdirSync(path.dirname(loc.archivePath), { recursive: true });
  fs.writeFileSync(loc.archivePath, JSON.stringify(archive, null, 2));
  removeAndPrune(loc.root, loc.commentsPath);

  return { comments, consumedAt };
}

/**
 * Absolute paths to the images a comment carries, for the agent to read.
 * Entries that aren't a plain `assets/<name>` are dropped — the array comes
 * from a file on disk and its paths get handed to whoever reads them.
 */
function imagePaths(comment, root) {
  if (!Array.isArray(comment.images)) return [];
  return comment.images
    .filter((rel) => typeof rel === 'string' && /^assets\/[^/\\]+$/.test(rel) && !rel.includes('..'))
    .map((rel) => path.join(root, STORE_DIR, rel));
}

function callTool(name, args, cwd) {
  if (name !== TOOL.name) return toolError(`Unknown tool "${name}".`);

  const loc = resolveTarget(args && args.file, cwd);
  if (loc.error) return toolError(loc.error);

  const { comments } = readAndConsume(loc);
  if (!comments.length) return toolText(`No pending comments on ${loc.rel}.`);

  const payload = comments.map((c) => {
    const entry = {
      text: c.text,
      selectedText: c.selectedText,
      lineStart: c.lineStart,
      lineEnd: c.lineEnd,
      context: c.context,
      createdAt: c.createdAt
    };
    // Both are optional on a comment; omit them entirely rather than
    // reporting nulls the model would have to read past.
    if (c.tag) entry.tag = c.tag;
    const images = imagePaths(c, loc.root);
    if (images.length) entry.images = images;
    return entry;
  });

  return toolText(
    `${comments.length} comment(s) on ${loc.rel} (now consumed — no cleanup needed):\n` +
      JSON.stringify(payload, null, 2)
  );
}

const toolText = (text) => ({ content: [{ type: 'text', text }] });
const toolError = (text) => ({ content: [{ type: 'text', text }], isError: true });

// ── JSON-RPC ────────────────────────────────────────────────

/**
 * @returns {object|null} the reply, or null for a notification.
 */
function handleMessage(msg, cwd) {
  const isNotification = msg.id === undefined || msg.id === null;
  const reply = (result) => ({ jsonrpc: '2.0', id: msg.id, result });

  switch (msg.method) {
    case 'initialize':
      return reply({
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: NAME, version: VERSION }
      });

    case 'tools/list':
      return reply({ tools: [TOOL] });

    case 'tools/call': {
      const params = msg.params || {};
      // A failure inside the tool is reported through isError so the model
      // can read and act on it; only protocol faults become JSON-RPC errors.
      try {
        return reply(callTool(params.name, params.arguments, cwd));
      } catch (err) {
        return reply(toolError(`mdp_read_comments failed: ${err.message}`));
      }
    }

    case 'ping':
      return reply({});

    default:
      if (isNotification) return null;
      return {
        jsonrpc: '2.0',
        id: msg.id,
        error: { code: -32601, message: `Method not found: ${msg.method}` }
      };
  }
}

// ── stdio transport ─────────────────────────────────────────

function main() {
  const cwd = process.env.MDP_CWD || process.cwd();
  let buffer = '';

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    buffer += chunk;

    // Newline-delimited JSON: a message never contains a raw newline.
    let nl;
    while ((nl = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;

      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        write({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
        continue;
      }

      try {
        const reply = handleMessage(msg, cwd);
        if (reply) write(reply);
      } catch (err) {
        process.stderr.write(`mdpreview-mcp: ${err.stack}\n`);
        if (msg.id !== undefined && msg.id !== null) {
          write({ jsonrpc: '2.0', id: msg.id, error: { code: -32603, message: String(err.message) } });
        }
      }
    }
  });

  process.stdin.on('end', () => process.exit(0));
}

function write(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

if (require.main === module) main();

module.exports = { findRoot, resolveTarget, readAndConsume, removeAndPrune, callTool, handleMessage, TOOL, VERSION };
