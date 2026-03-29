const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Folder picker
  openFolder: () => ipcRenderer.invoke('open-folder-dialog'),

  // Server watch dir
  setWatchDir: (dirPath) => ipcRenderer.invoke('set-watch-dir', dirPath),

  // Workspaces
  getWorkspaces:      ()               => ipcRenderer.invoke('get-workspaces'),
  saveWorkspace:      (ws)             => ipcRenderer.invoke('save-workspace', ws),
  deleteWorkspace:    (id)             => ipcRenderer.invoke('delete-workspace', id),
  setActiveWorkspace: (id)             => ipcRenderer.invoke('set-active-workspace', id),

  // Comments
  getComments:    (wsId, file)             => ipcRenderer.invoke('get-comments', wsId, file),
  saveComment:    (wsId, file, comment)    => ipcRenderer.invoke('save-comment', wsId, file, comment),
  deleteComment:  (wsId, file, commentId) => ipcRenderer.invoke('delete-comment', wsId, file, commentId),
  clearComments:  (wsId, file)             => ipcRenderer.invoke('clear-comments', wsId, file)
});
