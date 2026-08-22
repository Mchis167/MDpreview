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
const VERSION = '2.0.0';
const PROTOCOL_VERSION = '2024-11-05';

const STORE_DIR = path.join('.mdpreview', 'comments');
const ARCHIVE_DIR = path.join('.mdpreview', 'comments', '.archive');

const TOOL = {
  name: 'mdp_read_comments',
  description:
    'Read all pending review comments the user left on a markdown file in MDpreview. ' +
    'Reading consumes them: the tool archives the comments in the same operation, so ' +
    'there is nothing to delete or resolve afterwards — just apply the requested changes. ' +
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
 * Read the pending comments and archive them in the same operation.
 * Nothing pending means nothing is written — no empty archive files.
 */
function readAndConsume(loc) {
  const comments = readJsonArray(loc.commentsPath);
  if (!comments.length) return { comments: [] };

  const consumedAt = new Date().toISOString();
  const archive = readJsonArray(loc.archivePath);
  archive.push(...comments.map((c) => ({ ...c, consumedAt })));

  fs.mkdirSync(path.dirname(loc.archivePath), { recursive: true });
  fs.writeFileSync(loc.archivePath, JSON.stringify(archive, null, 2));
  fs.writeFileSync(loc.commentsPath, '[]');

  return { comments, consumedAt };
}

function callTool(name, args, cwd) {
  if (name !== TOOL.name) return toolError(`Unknown tool "${name}".`);

  const loc = resolveTarget(args && args.file, cwd);
  if (loc.error) return toolError(loc.error);

  const { comments } = readAndConsume(loc);
  if (!comments.length) return toolText(`No pending comments on ${loc.rel}.`);

  const payload = comments.map((c) => ({
    text: c.text,
    selectedText: c.selectedText,
    lineStart: c.lineStart,
    lineEnd: c.lineEnd,
    context: c.context,
    createdAt: c.createdAt
  }));

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

module.exports = { findRoot, resolveTarget, readAndConsume, handleMessage, TOOL, VERSION };
