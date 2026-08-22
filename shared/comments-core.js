/* ============================================================
   comments-core.js — pure comment CRUD/state, no DOM, no globals.
   Takes an adapter (storage/context/notify) so the Electron app and
   the VSCode extension can share this logic with different backends.
   ============================================================ */

(function () {

function createCommentsCore({ storage, context, notify }) {
  let comments = [];
  const listeners = [];

  function emit() {
    listeners.forEach(cb => cb(comments));
  }

  function list() {
    return comments;
  }

  async function load(filePath) {
    const wsId = context.workspaceId();
    if (!wsId || !filePath) {
      comments = [];
      emit();
      return comments;
    }
    comments = await storage.get(wsId, filePath);
    emit();
    return comments;
  }

  async function save(commentData) {
    const wsId = context.workspaceId();
    const file = context.currentFile();
    if (!wsId || !file) return null;

    const comment = await storage.save(wsId, file, commentData);

    if (commentData.id) {
      const idx = comments.findIndex(c => c.id === commentData.id);
      if (idx !== -1) {
        comments[idx] = comment;
      } else {
        // Fallback: search by new ID if the old one wasn't found
        const idxNew = comments.findIndex(c => c.id === comment.id);
        if (idxNew !== -1) comments[idxNew] = comment;
        else comments.push(comment);
      }
    } else {
      comments.push(comment);
    }

    comments.sort((a, b) => a.lineStart - b.lineStart);
    emit();
    return comment;
  }

  async function remove(commentId) {
    const wsId = context.workspaceId();
    const file = context.currentFile();
    if (!wsId || !file) return comments;

    comments = await storage.remove(wsId, file, commentId);
    emit();
    if (notify) notify('Comment removed');
    return comments;
  }

  async function clear() {
    const wsId = context.workspaceId();
    const file = context.currentFile();
    if (!wsId || !file) return comments;

    comments = await storage.clear(wsId, file);
    emit();
    return comments;
  }

  function onChange(cb) {
    listeners.push(cb);
    return () => {
      const idx = listeners.indexOf(cb);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }

  return { list, load, save, remove, clear, onChange };
}

const exportsObj = { createCommentsCore };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exportsObj;
}
if (typeof window !== 'undefined') {
  window.CommentsCore = exportsObj;
}

})();
