const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const { v4: uuidv4 } = require('uuid');

const { loadComments, saveComments } = require('./comments');
const { loadWorkspaces } = require('./workspaces');
const { parseRef, resolveWorkspace } = require('../utils/mcp-ref');

/**
 * Finds the workspace a given absolute path lives under, by longest matching
 * root (so a nested workspace wins over a parent one, if both are registered).
 */
function findWorkspaceForPath(dataDir, absPath) {
  const { workspaces } = loadWorkspaces(dataDir);
  let best = null;
  for (const ws of workspaces) {
    if (!ws.path) continue;
    const rel = path.relative(ws.path, absPath);
    const isInside = rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
    if (isInside && (!best || ws.path.length > best.path.length)) {
      best = ws;
    }
  }
  return best;
}

function sendRefError(res, result) {
  const status = result.error === 'BAD_REF' ? 400 : 404;
  return res.status(status).json({ error: result.error, message: result.message });
}

/**
 * Resolves { wsId, filePath, commentFilter, workspace, absPath } from a ref string.
 * Returns { error, message } on failure (BAD_REF / WORKSPACE_NOT_FOUND).
 */
function resolveRef(dataDir, ref) {
  const parsed = parseRef(ref);
  if (parsed.error) return parsed;

  const workspace = resolveWorkspace(dataDir, parsed.wsId);
  if (!workspace) {
    return { error: 'WORKSPACE_NOT_FOUND', message: `No workspace with id "${parsed.wsId}"` };
  }

  const absPath = path.isAbsolute(parsed.filePath)
    ? parsed.filePath
    : path.join(workspace.path, parsed.filePath);

  return { wsId: parsed.wsId, filePath: parsed.filePath, commentFilter: parsed.commentFilter, workspace, absPath };
}

// POST /api/mcp/open — { wsId?, path } -> focus window + open file
//
// The caller (Claude Code) usually knows nothing about which MDpreview
// workspace a file belongs to, and the app may currently be showing a
// completely different project. So when wsId isn't given, we auto-detect
// the owning workspace by matching the absolute path against every
// registered workspace root — same idea as `git rev-parse --show-toplevel`
// picking the repo for a path. A relative path with no wsId is ambiguous
// and rejected outright.
router.post('/mcp/open', (req, res) => {
  const { wsId: rawWsId, path: rawPath } = req.body || {};
  if (!rawPath) {
    return res.status(400).json({ error: 'BAD_REF', message: 'Missing "path"' });
  }

  let workspace = null;

  if (rawWsId) {
    workspace = resolveWorkspace(req.dataDir, rawWsId);
    if (!workspace) {
      return res.status(404).json({ error: 'WORKSPACE_NOT_FOUND', message: `No workspace with id "${rawWsId}"` });
    }
  } else if (path.isAbsolute(rawPath)) {
    workspace = findWorkspaceForPath(req.dataDir, rawPath);
    if (!workspace) {
      return res.status(404).json({
        error: 'WORKSPACE_NOT_REGISTERED',
        message: `"${rawPath}" is not inside any workspace open in MDpreview. Add this folder as a workspace in the app, then retry.`
      });
    }
  } else {
    return res.status(400).json({ error: 'BAD_REF', message: 'A relative "path" requires "wsId"' });
  }

  const absPath = path.isAbsolute(rawPath) ? rawPath : path.join(workspace.path, rawPath);

  if (!fs.existsSync(absPath)) {
    return res.status(404).json({ error: 'FILE_NOT_FOUND', message: `File not found: ${absPath}` });
  }

  const relPath = path.isAbsolute(rawPath) ? path.relative(workspace.path, absPath) : rawPath;

  if (req.io) req.io.emit('mcp-open-file', { wsId: workspace.id, path: relPath });
  res.json({ success: true, path: absPath, wsId: workspace.id, workspaceName: workspace.name });
});

// GET /api/mcp/comments?ref=...
router.get('/mcp/comments', (req, res) => {
  const { ref } = req.query;
  const resolved = resolveRef(req.dataDir, ref);
  if (resolved.error) return sendRefError(res, resolved);

  const { wsId, filePath, commentFilter, absPath } = resolved;
  const comments = loadComments(req.dataDir, wsId, filePath);

  // "pending" means "not yet resolved" — there's no separate manual
  // send-to-Claude step; every unresolved comment is fair game to paste.
  let filtered;
  if (commentFilter === 'pending') {
    filtered = comments.filter(c => (c.claude?.status || 'none') !== 'resolved');
  } else {
    const found = comments.find(c => c.id === commentFilter);
    if (!found) {
      return res.status(404).json({ error: 'COMMENT_NOT_FOUND', message: `No comment with id "${commentFilter}"` });
    }
    filtered = [found];
  }

  res.json({ wsId, filePath, absPath, comments: filtered });
});

// POST /api/mcp/comments/:id/reply — { ref, text }
router.post('/mcp/comments/:id/reply', (req, res) => {
  const { id } = req.params;
  const { ref, text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'BAD_REF', message: 'Missing "text"' });

  const resolved = resolveRef(req.dataDir, ref);
  if (resolved.error) return sendRefError(res, resolved);

  const { wsId, filePath } = resolved;
  const comments = loadComments(req.dataDir, wsId, filePath);
  const comment = comments.find(c => c.id === id);
  if (!comment) {
    return res.status(404).json({ error: 'COMMENT_NOT_FOUND', message: `No comment with id "${id}"` });
  }

  if (!comment.claude || typeof comment.claude !== 'object') {
    comment.claude = { status: 'none', replies: [] };
  }
  if (!Array.isArray(comment.claude.replies)) comment.claude.replies = [];

  comment.claude.replies.push({ id: uuidv4(), text, createdAt: new Date().toISOString() });
  saveComments(req.dataDir, wsId, filePath, comments);

  if (req.io) req.io.emit('comments-changed', { wsId, file: filePath });
  res.json(comment);
});

// POST /api/mcp/comments/:id/resolve — { ref }
router.post('/mcp/comments/:id/resolve', (req, res) => {
  const { id } = req.params;
  const { ref } = req.body || {};

  const resolved = resolveRef(req.dataDir, ref);
  if (resolved.error) return sendRefError(res, resolved);

  const { wsId, filePath } = resolved;
  const comments = loadComments(req.dataDir, wsId, filePath);
  const comment = comments.find(c => c.id === id);
  if (!comment) {
    return res.status(404).json({ error: 'COMMENT_NOT_FOUND', message: `No comment with id "${id}"` });
  }

  if (!comment.claude || typeof comment.claude !== 'object') {
    comment.claude = { status: 'none', replies: [] };
  }
  comment.claude.status = 'resolved';
  saveComments(req.dataDir, wsId, filePath, comments);

  if (req.io) req.io.emit('comments-changed', { wsId, file: filePath });
  res.json(comment);
});

module.exports = router;
