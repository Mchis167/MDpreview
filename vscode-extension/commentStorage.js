const vscode = require('vscode');
const crypto = require('crypto');

// Storage adapter for shared/comments-core.js. Persists comments as JSON
// files under .mdpreview/comments/, mirroring the workspace's own directory
// structure (docs/plan.md -> .mdpreview/comments/docs/plan.md.json).
//
// workspaceFolder is the vscode.WorkspaceFolder the document belongs to;
// comments-core's wsId/file params are unused here since the destination
// path is already scoped to one folder per adapter instance.
function createCommentStorage(workspaceFolder) {
  function commentsFileUri(relPath) {
    return vscode.Uri.joinPath(workspaceFolder.uri, '.mdpreview', 'comments', `${relPath}.json`);
  }

  // Matches vscode-extension/mcpServer.js's archivePath — comments consumed
  // by mdp_read_comments land here instead of being deleted outright.
  function archiveFileUri(relPath) {
    return vscode.Uri.joinPath(workspaceFolder.uri, '.mdpreview', 'comments', '.archive', `${relPath}.json`);
  }

  async function readFile(uri) {
    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      const parsed = JSON.parse(Buffer.from(bytes).toString('utf8'));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async function writeFile(uri, comments) {
    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(uri, '..'));
    const bytes = Buffer.from(JSON.stringify(comments, null, 2), 'utf8');
    await vscode.workspace.fs.writeFile(uri, bytes);
  }

  return {
    async get(wsId, relPath) {
      return readFile(commentsFileUri(relPath));
    },

    async save(wsId, relPath, commentData) {
      const uri = commentsFileUri(relPath);
      const comments = await readFile(uri);
      let comment;

      if (commentData.id) {
        const idx = comments.findIndex((c) => c.id === commentData.id);
        if (idx !== -1) {
          comment = { ...comments[idx], ...commentData };
          comments[idx] = comment;
        }
      }
      if (!comment) {
        comment = { ...commentData, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        comments.push(comment);
      }

      await writeFile(uri, comments);
      return comment;
    },

    async remove(wsId, relPath, commentId) {
      const uri = commentsFileUri(relPath);
      const comments = (await readFile(uri)).filter((c) => c.id !== commentId);
      await writeFile(uri, comments);
      return comments;
    },

    async clear(wsId, relPath) {
      await writeFile(commentsFileUri(relPath), []);
      return [];
    },

    async getArchive(relPath) {
      return readFile(archiveFileUri(relPath));
    },

    // Moves one comment back from .archive/ into the active store. Keeps its
    // original id/text/selection so highlighting picks it up unchanged.
    async restore(relPath, commentId) {
      const archiveUri = archiveFileUri(relPath);
      const archived = await readFile(archiveUri);
      const idx = archived.findIndex((c) => c.id === commentId);
      if (idx === -1) return null;

      const [comment] = archived.splice(idx, 1);
      delete comment.consumedAt;
      await writeFile(archiveUri, archived);

      const activeUri = commentsFileUri(relPath);
      const active = await readFile(activeUri);
      active.push(comment);
      await writeFile(activeUri, active);
      return comment;
    },

    async deleteArchived(relPath, commentId) {
      const archiveUri = archiveFileUri(relPath);
      const archived = (await readFile(archiveUri)).filter((c) => c.id !== commentId);
      await writeFile(archiveUri, archived);
      return archived;
    },

    async clearArchive(relPath) {
      await writeFile(archiveFileUri(relPath), []);
      return [];
    }
  };
}

module.exports = { createCommentStorage };
