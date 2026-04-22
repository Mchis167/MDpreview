/* ============================================================
   electron-bridge.js — Fallback for web browser environment
   ============================================================ */

(function() {
  // If window.electronAPI is already defined (by Electron preload), do nothing.
  if (window.electronAPI) return;

  // console.log('%c[Bridge] Electron not detected. Polyfilling window.electronAPI via Express APIs...', 'color: #ffbf48; font-weight: bold;');

  window.electronAPI = {
    // Folder picker (In browser, we'll just prompt for a string or return null)
    openFolder: async () => {
      const p = prompt('Please enter the absolute path to your local folder:');
      return p || null;
    },

    // Server watch dir
    setWatchDir: async (dirPath) => {
      const res = await fetch('/api/set-watch-dir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dir: dirPath })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },

    // Workspaces
    getWorkspaces: async () => {
      const res = await fetch('/api/workspaces');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    saveWorkspace: async (ws) => {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ws)
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    deleteWorkspace: async (id) => {
      const res = await fetch(`/api/workspaces/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    setActiveWorkspace: async (id) => {
      const res = await fetch('/api/workspaces/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    renameWorkspace: async (id, name) => {
      const res = await fetch('/api/workspaces/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },

    // Comments
    getComments: async (wsId, file) => {
      const res = await fetch(`/api/comments?wsId=${encodeURIComponent(wsId)}&file=${encodeURIComponent(file)}`);
      if (!res.ok) return []; // Fallback to empty if fails
      return res.json();
    },
    saveComment: async (wsId, file, comment) => {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wsId, file, commentData: comment })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    deleteComment: async (wsId, file, commentId) => {
      const res = await fetch(`/api/comments?wsId=${encodeURIComponent(wsId)}&file=${encodeURIComponent(file)}&commentId=${encodeURIComponent(commentId)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    clearComments: async (wsId, file) => {
      const res = await fetch('/api/comments/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wsId, file })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    
    // File System
    deleteFile: async (filePath) => {
      const res = await fetch(`/api/file-ops?path=${encodeURIComponent(filePath)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    duplicateFile: async (filePath) => {
      const res = await fetch('/api/file-ops/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    renameFile: async (oldPath, newPath) => {
      const res = await fetch('/api/file-ops/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath, newPath })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    
    // Custom
    rebuildApp: () => {
      alert('Rebuild is only available in the desktop app.');
    }
  };
})();
