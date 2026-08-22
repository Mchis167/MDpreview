const vscode = require('vscode');
const { createCommentsCore } = require('./vendor/shared/comments-core');
const { createCommentStorage } = require('./commentStorage');

/**
 * Wires one preview panel to the comment store for its file: the active list,
 * the archive, the watchers that pick up changes made elsewhere, and the
 * message handlers the webview talks to.
 *
 * Returns null when the file lives outside any workspace folder — there is no
 * `.mdpreview/` to store comments in, and the preview works fine without one.
 */
function createCommentSession(document, webviewPanel) {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!workspaceFolder) return null;

  const relPath = vscode.workspace.asRelativePath(document.uri, false);
  const storage = createCommentStorage(workspaceFolder);
  const core = createCommentsCore({
    storage,
    context: { workspaceId: () => workspaceFolder.uri.toString(), currentFile: () => relPath }
  });

  const post = (message) => webviewPanel.webview.postMessage(message);
  const sendComments = () => post({ type: 'comments', list: core.list() });
  const sendArchive = async () => {
    post({ type: 'archivedComments', list: await storage.getArchive(relPath) });
  };
  const unsubscribe = core.onChange(sendComments);

  // Reload when either file changes outside this editor — e.g. the MCP
  // tool consuming comments (moves active -> archive), a restore/delete
  // from another panel of the same file, or another panel saving a comment.
  const storeWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(workspaceFolder, `.mdpreview/comments/${relPath}.json`)
  );
  const reloadActive = () => core.load(relPath);
  storeWatcher.onDidChange(reloadActive);
  storeWatcher.onDidCreate(reloadActive);
  storeWatcher.onDidDelete(reloadActive);

  const archiveWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(workspaceFolder, `.mdpreview/comments/.archive/${relPath}.json`)
  );
  archiveWatcher.onDidChange(sendArchive);
  archiveWatcher.onDidCreate(sendArchive);
  archiveWatcher.onDidDelete(sendArchive);

  return {
    /** Push the current state to a webview that just announced it is listening. */
    sendAll() {
      sendComments();
      sendArchive();
    },

    load: () => core.load(relPath),

    /** Returns true when the message was a comment message and has been handled. */
    async handleMessage(message) {
      switch (message.type) {
        case 'saveComment':
          core.save(message.data);
          return true;
        case 'deleteComment':
          core.remove(message.id);
          return true;
        case 'clearComments':
          core.clear();
          return true;
        case 'restoreComment':
          await storage.restore(relPath, message.id);
          await core.load(relPath);
          await sendArchive();
          return true;
        case 'deleteArchivedComment':
          await storage.deleteArchived(relPath, message.id);
          await sendArchive();
          return true;
        case 'clearArchive':
          await storage.clearArchive(relPath);
          await sendArchive();
          return true;
        default:
          return false;
      }
    },

    dispose() {
      unsubscribe();
      archiveWatcher.dispose();
      storeWatcher.dispose();
    }
  };
}

module.exports = { createCommentSession };
