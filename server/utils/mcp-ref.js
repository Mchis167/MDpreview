const fs   = require('fs');
const path = require('path');

/**
 * mdp-ref.js — pure helpers for the Claude Code bridge ref token.
 *
 * Ref format: mdp://<wsId>/<encodedPath>?c=pending
 *             mdp://<wsId>/<encodedPath>?c=<commentId>
 *             mdp://<wsId>/<encodedPath>              (no query -> defaults to "pending")
 *
 * These functions are pure / filesystem-light so they can be unit tested
 * without booting Express.
 */

const REF_PREFIX = 'mdp://';

/**
 * Parses a ref string into { wsId, filePath, commentFilter }.
 * Returns { error: 'BAD_REF', message } on malformed input.
 */
function parseRef(ref) {
  if (!ref || typeof ref !== 'string') {
    return { error: 'BAD_REF', message: 'Ref is missing or not a string' };
  }

  const trimmed = ref.trim();
  if (!trimmed.startsWith(REF_PREFIX)) {
    return { error: 'BAD_REF', message: `Ref must start with "${REF_PREFIX}"` };
  }

  const rest = trimmed.slice(REF_PREFIX.length); // "<wsId>/<encodedPath>?c=..."
  const slashIdx = rest.indexOf('/');
  if (slashIdx === -1) {
    return { error: 'BAD_REF', message: 'Ref is missing a "/" separator between wsId and path' };
  }

  const wsId = rest.slice(0, slashIdx);
  let pathAndQuery = rest.slice(slashIdx + 1);
  if (!wsId) {
    return { error: 'BAD_REF', message: 'Ref is missing a workspace id' };
  }
  if (!pathAndQuery) {
    return { error: 'BAD_REF', message: 'Ref is missing a file path' };
  }

  let encodedPath = pathAndQuery;
  let commentFilter = 'pending';

  const qIdx = pathAndQuery.indexOf('?');
  if (qIdx !== -1) {
    encodedPath = pathAndQuery.slice(0, qIdx);
    const queryStr = pathAndQuery.slice(qIdx + 1);
    const params = new URLSearchParams(queryStr);
    const c = params.get('c');
    if (c) commentFilter = c;
  }

  if (!encodedPath) {
    return { error: 'BAD_REF', message: 'Ref is missing a file path' };
  }

  let filePath;
  try {
    filePath = decodeURIComponent(encodedPath);
  } catch (_e) {
    return { error: 'BAD_REF', message: 'File path is not valid percent-encoding' };
  }

  return { wsId, filePath, commentFilter };
}

/**
 * Loads workspaces.json (same shape used by server/routes/workspaces.js)
 * and returns the workspace matching wsId, or null if not found.
 */
function resolveWorkspace(dataDir, wsId) {
  try {
    const file = path.join(dataDir, 'workspaces.json');
    if (!fs.existsSync(file)) return null;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!data.workspaces || !Array.isArray(data.workspaces)) return null;
    return data.workspaces.find(w => w.id === wsId) || null;
  } catch (_e) {
    return null;
  }
}

/**
 * Builds a ref string from its parts (inverse of parseRef).
 */
function buildRef(wsId, filePath, commentFilter = 'pending') {
  const encodedPath = encodeURIComponent(filePath);
  return `${REF_PREFIX}${wsId}/${encodedPath}?c=${commentFilter}`;
}

module.exports = { parseRef, resolveWorkspace, buildRef, REF_PREFIX };
