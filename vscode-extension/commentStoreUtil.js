/* ============================================================
   commentStoreUtil.js — the parts of the comment store that are
   pure: tag validation, clipboard-image decoding, asset naming,
   and which directories become prunable once a file is removed.

   Deliberately free of `vscode` so it can be unit-tested directly,
   the same way installer.js keeps to node builtins. The vscode.fs
   calls that use these results live in commentStorage.js.
   ============================================================ */

'use strict';

const path = require('path');

// The store lives under this directory; pruning never climbs past it.
const STORE_ROOT = '.mdpreview';
// Images sit in one flat directory shared by every file's comments, so a
// stored path means the same thing regardless of how deep the .md file was.
const ASSETS_DIR = 'assets';

const TAGS = ['bug', 'enhancement', 'comment'];

/** @returns {string|null} the tag if it is one we know, else null. */
function normalizeTag(tag) {
  if (typeof tag !== 'string') return null;
  const t = tag.trim().toLowerCase();
  return TAGS.includes(t) ? t : null;
}

// Only the formats a clipboard paste realistically produces. An unknown
// mime type is rejected rather than guessed at — a wrong extension would
// leave a file no viewer opens.
const MIME_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg'
};

/**
 * Decode a `data:image/...;base64,...` URL coming from the webview.
 * @returns {{ext: string, bytes: Buffer}|null} null for anything that
 *   isn't a base64 image data URL we recognise.
 */
function decodeDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(dataUrl.trim());
  if (!match) return null;

  const ext = MIME_EXT[match[1].toLowerCase()];
  if (!ext) return null;

  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length) return null;

  return { ext, bytes };
}

/** Where image `index` (1-based) of `commentId` is stored, relative to the store's comments dir. */
function assetRelPath(commentId, index, ext) {
  return `${ASSETS_DIR}/${commentId}-${index}.${ext}`;
}

/**
 * The asset paths a comment legitimately owns.
 *
 * Anything that isn't a plain `assets/<name>` entry is dropped: the array
 * reaches here from a JSON file on disk, and these paths are handed
 * straight to a delete call.
 * @returns {string[]}
 */
function imagePathsOf(comment) {
  const images = comment && comment.images;
  if (!Array.isArray(images)) return [];

  return images.filter((rel) => {
    if (typeof rel !== 'string' || !rel) return false;
    if (path.isAbsolute(rel) || rel.includes('\\')) return false;
    const parts = rel.split('/');
    return parts.length === 2 && parts[0] === ASSETS_DIR && parts[1] !== '' && parts[1] !== '.' && parts[1] !== '..';
  });
}

/**
 * Directories that may have been left empty by deleting `relFilePath`,
 * deepest first, stopping at `.mdpreview` inclusive.
 *
 * Callers delete each in turn and stop at the first non-empty one, so the
 * order matters: a parent can only be empty once its child is gone.
 * @param {string} relFilePath path relative to the workspace root, e.g.
 *   `.mdpreview/comments/docs/plan.md.json`
 * @returns {string[]} empty when the path lies outside `.mdpreview`.
 */
function pruneDirs(relFilePath) {
  if (typeof relFilePath !== 'string' || !relFilePath) return [];

  const normalized = relFilePath.split(path.sep).join('/').replace(/^\.\//, '');
  const parts = normalized.split('/').filter((p) => p !== '');
  if (parts[0] !== STORE_ROOT) return [];
  if (parts.includes('..')) return [];

  // Drop the filename itself, then peel one directory at a time.
  const dirs = [];
  for (let end = parts.length - 1; end >= 1; end--) {
    dirs.push(parts.slice(0, end).join('/'));
  }
  return dirs;
}

/**
 * Add `.mdpreview/` to a .gitignore that doesn't already ignore it.
 *
 * Recognises the entry however it was written — with or without the trailing
 * slash or a leading `/` — so re-running this never stacks up duplicates.
 * @param {string} content the current .gitignore ('' if there is none)
 * @returns {string|null} the new content, or null when nothing needs doing.
 */
function ensureIgnoreLine(content) {
  const text = typeof content === 'string' ? content : '';
  const already = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .some((line) => /^\/?\.mdpreview\/?$/.test(line));
  if (already) return null;

  const entry = `${STORE_ROOT}/`;
  if (!text.trim()) return `${entry}\n`;
  return text.endsWith('\n') ? `${text}${entry}\n` : `${text}\n${entry}\n`;
}

module.exports = {
  STORE_ROOT,
  ensureIgnoreLine,
  ASSETS_DIR,
  TAGS,
  normalizeTag,
  decodeDataUrl,
  assetRelPath,
  imagePathsOf,
  pruneDirs
};
