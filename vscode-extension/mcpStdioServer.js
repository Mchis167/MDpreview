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
const crypto = require('crypto');

const NAME = 'mdpreview';
const VERSION = '2.3.0';
const PROTOCOL_VERSION = '2024-11-05';

const ROOT_DIR = '.mdpreview';
const STORE_DIR = path.join('.mdpreview', 'comments');
const ARCHIVE_DIR = path.join('.mdpreview', 'comments', '.archive');

const READ_TOOL = {
  name: 'mdp_read_comments',
  description:
    'Read the pending review comments the user left on a markdown file in MDpreview. ' +
    'Reading is non-destructive: comments stay pending until you close them with ' +
    'mdp_resolve_comments, so after applying a requested change, resolve that comment ' +
    'by its "id" — and leave open any comment that still needs the user\'s decision. ' +
    'A comment may carry a "tag" saying what kind of feedback it is (bug, enhancement, ' +
    'comment, or question) and an "images" list of absolute paths to screenshots the user ' +
    'pasted in — ' +
    'read those image files, they usually show the problem more directly than the text does. ' +
    'Pass the path to the markdown file, relative to the project root (e.g. "docs/plan.md") ' +
    'or absolute. Can also pass optional "workspace" if file is relative.',
  inputSchema: {
    type: 'object',
    properties: {
      file: { type: 'string', description: 'Markdown file path, relative to the project root or absolute' },
      workspace: {
        type: 'string',
        description: 'Optional workspace root directory used to resolve relative file paths'
      }
    },
    required: ['file']
  }
};

const RESOLVE_TOOL = {
  name: 'mdp_resolve_comments',
  description:
    'Mark review comments on a markdown file as handled, moving them out of the pending ' +
    'list into the archive. Call this after actually addressing a comment, passing the ' +
    '"id" values from mdp_read_comments. Omit "ids" to resolve every pending comment on ' +
    'the file. Leave a comment unresolved when it still needs the user\'s confirmation.',
  inputSchema: {
    type: 'object',
    properties: {
      file: { type: 'string', description: 'Markdown file path, relative to the project root or absolute' },
      ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Comment ids to resolve; omit to resolve all pending comments on the file'
      },
      workspace: {
        type: 'string',
        description: 'Optional workspace root directory used to resolve relative file paths'
      }
    },
    required: ['file']
  }
};

const LIST_TOOL = {
  name: 'mdp_list_pending',
  description:
    'List every markdown file in the current workspace that has pending MDpreview review ' +
    'comments, with a count and the newest comment timestamp per file. Use this to find ' +
    'out whether there is new feedback without guessing file paths; then read each file\'s ' +
    'comments with mdp_read_comments. The workspace is resolved from the server\'s working ' +
    'directory, or from the optional "workspace" argument.',
  inputSchema: {
    type: 'object',
    properties: {
      workspace: {
        type: 'string',
        description: 'Optional workspace root directory. Defaults to server working directory.'
      }
    }
  }
};

const TOOLS = [READ_TOOL, RESOLVE_TOOL, LIST_TOOL];

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
function resolveTarget(file, cwd, workspace) {
  if (typeof file !== 'string' || !file.trim()) {
    return { error: 'Missing required argument "file".' };
  }

  const baseDir = (workspace && typeof workspace === 'string' && workspace.trim()) ? workspace.trim() : cwd;
  const abs = path.resolve(baseDir, file);
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
 * Read the pending comments without consuming anything: the store file stays
 * put, so a compacted context or a second agent can read them again. The one
 * write it may do is assigning an id to a legacy comment that has none —
 * persisted back so a later resolve-by-id can find it.
 */
function readPending(loc) {
  const comments = readJsonArray(loc.commentsPath);
  if (!comments.length) return { comments: [] };

  let assigned = false;
  for (const c of comments) {
    if (!c.id) {
      c.id = crypto.randomUUID();
      assigned = true;
    }
  }
  if (assigned) fs.writeFileSync(loc.commentsPath, JSON.stringify(comments, null, 2));

  return { comments };
}

/**
 * Move the listed comments (all of them when `ids` is omitted) from the
 * pending store into the archive, stamped with `consumedAt` — the same field
 * the old read-and-consume flow wrote, so archived entries stay uniform.
 *
 * The emptied store file is deleted rather than rewritten as `[]`, so a file
 * with no outstanding comments leaves no trace in the tree. Pasted images
 * stay put: the archived copies still reference them.
 */
function resolveComments(loc, ids) {
  const comments = readJsonArray(loc.commentsPath);
  const wanted = Array.isArray(ids) ? new Set(ids) : null;

  const toArchive = wanted ? comments.filter((c) => wanted.has(c.id)) : comments;
  const remaining = wanted ? comments.filter((c) => !wanted.has(c.id)) : [];
  const found = new Set(toArchive.map((c) => c.id));
  const unknown = wanted ? [...wanted].filter((id) => !found.has(id)) : [];

  if (toArchive.length) {
    const consumedAt = new Date().toISOString();
    const archive = readJsonArray(loc.archivePath);
    archive.push(...toArchive.map((c) => ({ ...c, consumedAt })));

    fs.mkdirSync(path.dirname(loc.archivePath), { recursive: true });
    fs.writeFileSync(loc.archivePath, JSON.stringify(archive, null, 2));

    if (remaining.length) {
      fs.writeFileSync(loc.commentsPath, JSON.stringify(remaining, null, 2));
    } else {
      removeAndPrune(loc.root, loc.commentsPath);
    }
  }

  return { resolved: toArchive.map((c) => c.id), remaining: remaining.length, unknown };
}

/**
 * Every file in the workspace with pending comments. The workspace root comes
 * from `cwd` the same way a file's root does — walk up to the store or a .git
 * marker. `.archive` and `assets` are the store's two non-comment residents.
 */
function listPending(cwd, workspace) {
  const baseDir = (workspace && typeof workspace === 'string' && workspace.trim()) ? workspace.trim() : cwd;
  const root = findRoot(path.resolve(baseDir));
  if (!root) {
    return { error: 'Could not find a workspace root — no .mdpreview/comments store and no .git directory above the working directory.' };
  }

  const storeAbs = path.join(root, STORE_DIR);
  const files = [];

  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === '.archive' || entry.name === 'assets') continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else if (entry.name.endsWith('.json')) {
        const comments = readJsonArray(abs);
        if (!comments.length) continue;
        const newestAt = comments.reduce(
          (max, c) => (c.createdAt && c.createdAt > max ? c.createdAt : max),
          ''
        );
        files.push({
          file: path.relative(storeAbs, abs).slice(0, -'.json'.length),
          count: comments.length,
          newestAt: newestAt || undefined
        });
      }
    }
  };
  walk(storeAbs);

  files.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
  return { root, files };
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
  const workspace = args && args.workspace;
  if (name === LIST_TOOL.name) {
    const result = listPending(cwd, workspace);
    if (result.error) return toolError(result.error);
    if (!result.files.length) return toolText('No files have pending comments.');
    return toolText(
      `${result.files.length} file(s) with pending comments:\n` + JSON.stringify(result.files, null, 2)
    );
  }

  if (name !== READ_TOOL.name && name !== RESOLVE_TOOL.name) {
    return toolError(`Unknown tool "${name}".`);
  }

  const loc = resolveTarget(args && args.file, cwd, workspace);
  if (loc.error) return toolError(loc.error);

  if (name === RESOLVE_TOOL.name) {
    const ids = args && args.ids;
    if (ids !== undefined && !Array.isArray(ids)) {
      return toolError('"ids" must be an array of comment ids (or omitted to resolve all).');
    }
    const result = resolveComments(loc, ids);
    if (!result.resolved.length && result.unknown.length) {
      return toolError(`No pending comment on ${loc.rel} matches: ${result.unknown.join(', ')}.`);
    }
    let text = `Resolved ${result.resolved.length} comment(s) on ${loc.rel}; ${result.remaining} still pending.`;
    if (result.unknown.length) text += ` Unknown ids ignored: ${result.unknown.join(', ')}.`;
    return toolText(text);
  }

  const { comments } = readPending(loc);
  if (!comments.length) return toolText(`No pending comments on ${loc.rel}.`);

  const payload = comments.map((c) => {
    const entry = {
      id: c.id,
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
    `${comments.length} pending comment(s) on ${loc.rel} — resolve each with mdp_resolve_comments after addressing it:\n` +
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
      return reply({ tools: TOOLS });

    case 'tools/call': {
      const params = msg.params || {};
      // A failure inside the tool is reported through isError so the model
      // can read and act on it; only protocol faults become JSON-RPC errors.
      try {
        return reply(callTool(params.name, params.arguments, cwd));
      } catch (err) {
        return reply(toolError(`${params.name || 'tool'} failed: ${err.message}`));
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

module.exports = {
  findRoot,
  resolveTarget,
  readPending,
  resolveComments,
  listPending,
  removeAndPrune,
  callTool,
  handleMessage,
  TOOLS,
  VERSION
};
