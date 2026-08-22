const vscode = require('vscode');
const crypto = require('crypto');
const {
  STORE_ROOT,
  normalizeTag,
  decodeDataUrl,
  assetRelPath,
  imagePathsOf,
  pruneDirs,
  ensureIgnoreLine
} = require('./commentStoreUtil');

// Storage adapter for shared/comments-core.js. Persists comments as JSON
// files under .mdpreview/comments/, mirroring the workspace's own directory
// structure (docs/plan.md -> .mdpreview/comments/docs/plan.md.json).
//
// Two rules shape the writes:
//   * An empty list deletes its file and prunes the directories that leaves
//     empty, so a document with no outstanding comments leaves no trace.
//   * Pasted images belong to the comment that carries them. They are named
//     after its id and removed with it — except on the way into the archive,
//     where the archived copy still references them.
//
// workspaceFolder is the vscode.WorkspaceFolder the document belongs to;
// comments-core's wsId/file params are unused here since the destination
// path is already scoped to one folder per adapter instance.
function createCommentStorage(workspaceFolder) {
  const uriOf = (rel) => vscode.Uri.joinPath(workspaceFolder.uri, ...rel.split('/'));

  const commentsRel = (relPath) => `${STORE_ROOT}/comments/${relPath}.json`;
  // Matches mcpStdioServer.js's archivePath — comments consumed by
  // mdp_read_comments land here instead of being deleted outright.
  const archiveRel = (relPath) => `${STORE_ROOT}/comments/.archive/${relPath}.json`;
  const assetRel = (name) => `${STORE_ROOT}/comments/${name}`;

  async function readFile(rel) {
    try {
      const bytes = await vscode.workspace.fs.readFile(uriOf(rel));
      const parsed = JSON.parse(Buffer.from(bytes).toString('utf8'));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async function writeFile(rel, comments) {
    if (!comments.length) {
      await deleteAndPrune(rel);
      return;
    }
    const uri = uriOf(rel);
    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(uri, '..'));
    await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(comments, null, 2), 'utf8'));
  }

  /**
   * Delete one file, then walk up removing each directory it left empty,
   * stopping at `.mdpreview` inclusive. pruneDirs refuses to name anything
   * outside that folder, and the first still-occupied directory ends the walk.
   */
  async function deleteAndPrune(rel) {
    try {
      await vscode.workspace.fs.delete(uriOf(rel));
    } catch {
      return; // already gone — nothing to prune on its behalf
    }

    for (const dir of pruneDirs(rel)) {
      let entries;
      try {
        entries = await vscode.workspace.fs.readDirectory(uriOf(dir));
      } catch {
        return;
      }
      if (entries.length) return;
      try {
        await vscode.workspace.fs.delete(uriOf(dir), { recursive: false });
      } catch {
        return;
      }
    }
  }

  // ── Images ────────────────────────────────────────────────

  /**
   * Write the freshly pasted data URLs to disk as this comment's images.
   * `startIndex` continues the numbering when a comment already owns some.
   * @returns {Promise<string[]>} their paths, relative to the comments dir.
   */
  async function writeImages(commentId, dataUrls, startIndex) {
    if (!Array.isArray(dataUrls) || !dataUrls.length) return [];

    const written = [];
    let n = startIndex;
    for (const dataUrl of dataUrls) {
      const decoded = decodeDataUrl(dataUrl);
      if (!decoded) continue; // not an image we recognise; drop it silently
      const rel = assetRelPath(commentId, n, decoded.ext);
      const uri = uriOf(assetRel(rel));
      await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(uri, '..'));
      await vscode.workspace.fs.writeFile(uri, decoded.bytes);
      written.push(rel);
      n++;
    }
    return written;
  }

  async function deleteImages(comments) {
    for (const comment of comments) {
      for (const rel of imagePathsOf(comment)) {
        await deleteAndPrune(assetRel(rel));
      }
    }
  }

  // ── .gitignore ────────────────────────────────────────────

  // Checked once per session: the first save creates the store, and a
  // workspace that already ignores it needs no further reads.
  let ignoreChecked = false;

  async function ensureGitignored() {
    if (ignoreChecked) return;
    ignoreChecked = true;

    // Only a git repo has anything to ignore with.
    try {
      await vscode.workspace.fs.stat(uriOf('.git'));
    } catch {
      return;
    }

    const uri = uriOf('.gitignore');
    let current = '';
    try {
      current = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf8');
    } catch {
      current = '';
    }

    const updated = ensureIgnoreLine(current);
    if (updated === null) return;
    try {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(updated, 'utf8'));
    } catch {
      // A read-only or otherwise unwritable .gitignore isn't worth
      // interrupting the save the user actually asked for.
    }
  }

  return {
    async get(wsId, relPath) {
      return readFile(commentsRel(relPath));
    },

    /**
     * `commentData.pendingImages` carries newly pasted images as data URLs,
     * and `commentData.images` the ones an edited comment keeps. Images the
     * user removed in the form are therefore absent from both, and get
     * deleted here.
     */
    async save(wsId, relPath, commentData) {
      await ensureGitignored();

      const rel = commentsRel(relPath);
      const comments = await readFile(rel);
      const { pendingImages, imageUris, ...fields } = commentData;
      fields.tag = normalizeTag(fields.tag) || undefined;

      const idx = fields.id ? comments.findIndex((c) => c.id === fields.id) : -1;
      const existing = idx !== -1 ? comments[idx] : null;
      const id = existing ? existing.id : crypto.randomUUID();

      const owned = existing ? imagePathsOf(existing) : [];
      const kept = imagePathsOf(fields).filter((p) => owned.includes(p));
      const added = await writeImages(id, pendingImages, owned.length + 1);
      const images = [...kept, ...added];

      const comment = existing
        ? { ...existing, ...fields, id, images }
        : { ...fields, id, images, createdAt: new Date().toISOString() };
      if (!comment.tag) delete comment.tag;
      if (!images.length) delete comment.images;

      if (existing) comments[idx] = comment;
      else comments.push(comment);

      await writeFile(rel, comments);
      // Anything the edit dropped is now unreferenced.
      const orphans = owned.filter((p) => !kept.includes(p));
      if (orphans.length) await deleteImages([{ images: orphans }]);

      return comment;
    },

    async remove(wsId, relPath, commentId) {
      const rel = commentsRel(relPath);
      const all = await readFile(rel);
      const remaining = all.filter((c) => c.id !== commentId);
      await writeFile(rel, remaining);
      await deleteImages(all.filter((c) => c.id === commentId));
      return remaining;
    },

    async clear(wsId, relPath) {
      const rel = commentsRel(relPath);
      const all = await readFile(rel);
      await writeFile(rel, []);
      await deleteImages(all);
      return [];
    },

    async getArchive(relPath) {
      return readFile(archiveRel(relPath));
    },

    // Moves one comment back from .archive/ into the active store. Keeps its
    // original id/text/selection/images so highlighting picks it up unchanged.
    async restore(relPath, commentId) {
      const archRel = archiveRel(relPath);
      const archived = await readFile(archRel);
      const idx = archived.findIndex((c) => c.id === commentId);
      if (idx === -1) return null;

      const [comment] = archived.splice(idx, 1);
      delete comment.consumedAt;
      await writeFile(archRel, archived);

      const activeRel = commentsRel(relPath);
      const active = await readFile(activeRel);
      active.push(comment);
      await writeFile(activeRel, active);
      return comment;
    },

    async deleteArchived(relPath, commentId) {
      const rel = archiveRel(relPath);
      const all = await readFile(rel);
      const remaining = all.filter((c) => c.id !== commentId);
      await writeFile(rel, remaining);
      await deleteImages(all.filter((c) => c.id === commentId));
      return remaining;
    },

    async clearArchive(relPath) {
      const rel = archiveRel(relPath);
      const all = await readFile(rel);
      await writeFile(rel, []);
      await deleteImages(all);
      return [];
    },

    /** Absolute Uri for one of a comment's stored images, for the webview to load. */
    imageUri(rel) {
      return uriOf(assetRel(rel));
    }
  };
}

module.exports = { createCommentStorage };
