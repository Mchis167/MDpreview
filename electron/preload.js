const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Folder picker
  openFolder: () => ipcRenderer.invoke('open-folder-dialog'),
  openFiles: (options) => ipcRenderer.invoke('open-file-dialog', options),

  // Server watch dir
  setWatchDir: (dirPath) => ipcRenderer.invoke('set-watch-dir', dirPath),

  // Workspaces
  getWorkspaces:      ()               => ipcRenderer.invoke('get-workspaces'),
  saveWorkspace:      (ws)             => ipcRenderer.invoke('save-workspace', ws),
  deleteWorkspace:    (id)             => ipcRenderer.invoke('delete-workspace', id),
  setActiveWorkspace: (id)             => ipcRenderer.invoke('set-active-workspace', id),
  renameWorkspace:    (id, name)       => ipcRenderer.invoke('rename-workspace', { id, name }),

  // Comments
  getComments:    (wsId, file)             => ipcRenderer.invoke('get-comments', wsId, file),
  saveComment:    (wsId, file, comment)    => ipcRenderer.invoke('save-comment', wsId, file, comment),
  deleteComment:  (wsId, file, commentId) => ipcRenderer.invoke('delete-comment', wsId, file, commentId),
  clearComments:  (wsId, file)             => ipcRenderer.invoke('clear-comments', wsId, file),
  
  // File System
  readFile:      (filePath)          => ipcRenderer.invoke('read-file', filePath),
  deleteFile:    (filePath)          => ipcRenderer.invoke('delete-file', filePath),
  duplicateFile: (filePath)          => ipcRenderer.invoke('duplicate-file', filePath),
  renameFile:    (oldPath, newPath) => ipcRenderer.invoke('rename-file', oldPath, newPath),
  moveFile:      (oldPath, newPath) => ipcRenderer.invoke('move-file', oldPath, newPath),
  copyFile:      (srcPath, destPath) => ipcRenderer.invoke('copy-file', srcPath, destPath),
  createFile:    (filePath, content) => ipcRenderer.invoke('create-file', filePath, content),
  createFolder:  (folderPath)        => ipcRenderer.invoke('create-folder', folderPath),
  revealInFinder: (filePath)          => ipcRenderer.invoke('reveal-in-finder', filePath),
  
  // Clipboard & Drag
  copyFileToClipboard: (filePath) => ipcRenderer.invoke('copy-file-to-clipboard', filePath),
  copyFileFromBuffer: (buffer, filename) => ipcRenderer.invoke('copy-file-from-buffer', { buffer, filename }),
  startFileDrag: (filePath)       => ipcRenderer.send('start-file-drag', filePath),
  getAbsolutePath: (filePath)     => ipcRenderer.invoke('get-absolute-path', filePath),
  rasterizeSVG: (svg, w, h)       => ipcRenderer.invoke('rasterize-svg', svg, w, h),
  writeClipboardAdvanced: (data)  => ipcRenderer.invoke('write-clipboard-advanced', data),
  publishToHandoff: (options)     => ipcRenderer.invoke('publish-to-handoff', options),
  publishToWorker: (options)      => ipcRenderer.invoke('publish-to-worker', options),
  isElectron: true,
  
  // Custom
  rebuildApp: () => ipcRenderer.send('rebuild-app')
});
