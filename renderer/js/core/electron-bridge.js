/* ============================================================
   electron-bridge.js — Fallback for web browser environment
   ============================================================ */

(function() {
  // If window.electronAPI is already defined (by Electron preload), do nothing.
  if (window.electronAPI) return;

  // console.log('%c[Bridge] Electron not detected. Polyfilling window.electronAPI via Express APIs...', 'color: #ffbf48; font-weight: bold;');

  const FILE_CACHE = new Map();

  window.electronAPI = {
    // Folder picker (In browser, we'll just prompt for a string or return null)
    openFolder: () => {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        
        input.onchange = (e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            // On web, we can't get absolute path, but we can get the folder name 
            // from the relative path of the first file.
            const firstFile = files[0];
            const relativePath = firstFile.webkitRelativePath;
            const folderName = relativePath.split('/')[0];
            resolve(folderName || 'Selected Folder');
          } else {
            resolve(null);
          }
        };
        
        input.oncancel = () => resolve(null);
        input.click();
      });
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
    readFile: async (filePath) => {
      // Check frontend cache first (for web version picked files)
      if (FILE_CACHE.has(filePath)) {
        const file = FILE_CACHE.get(filePath);
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ success: true, content: reader.result });
          reader.onerror = () => resolve({ success: false, error: 'Failed to read file' });
          reader.readAsText(file);
        });
      }

      // Fallback to server API (only works for workspace files)
      const res = await fetch(`/api/file/raw?path=${encodeURIComponent(filePath)}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const content = await res.text();
      return { success: true, content };
    },
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
    moveFile: async (oldPath, newPath) => {
      const res = await fetch('/api/file-ops/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath, newPath })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    copyFile: async (srcPath, destPath) => {
      const res = await fetch('/api/file-ops/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ srcPath, destPath })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    createFile: async (filePath, content = '') => {
      const res = await fetch('/api/file-ops/create-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    createFolder: async (folderPath) => {
      const res = await fetch('/api/file-ops/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    revealInFinder: async (filePath) => {
      console.warn('Reveal in finder not supported in browser:', filePath);
      return { success: false, error: 'Not supported in browser' };
    },
    
    copyFileToClipboard: async (filePath) => {
      try {
        // Browser fallback: Since we can't truly copy a file to OS clipboard, we trigger a download
        const res = await fetch(`/api/file/raw?path=${encodeURIComponent(filePath)}`);
        if (!res.ok) throw new Error('Failed to fetch file content');
        const content = await res.text();
        
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filePath.split('/').pop() || 'document.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (typeof showToast === 'function') showToast('File download triggered (Copy-as-file not supported in browser)', 'info');
        return { success: true };
      } catch (error) {
        console.error('Browser copy error:', error);
        return { success: false, error: error.message };
      }
    },
    
    startFileDrag: async (filePath, event) => {
      try {
        // Browser fallback: Use the DownloadURL trick for dragging to desktop
        const res = await fetch(`/api/file/raw?path=${encodeURIComponent(filePath)}`);
        if (!res.ok) return;
        const content = await res.text();
        
        const fileName = filePath.split('/').pop() || 'document.md';
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        // This is a legacy but effective trick for web browsers to drag-and-download
        if (event && event.dataTransfer) {
          event.dataTransfer.setData('DownloadURL', `text/markdown:${fileName}:${url}`);
        }
      } catch (error) {
        console.error('Browser drag error:', error);
      }
    },

    getAbsolutePath: async (filePath) => filePath,
    
    openFiles: async (options = {}) => {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = options.properties && options.properties.includes('multiSelections');
        
        input.onchange = (e) => {
          const files = Array.from(e.target.files);
          const paths = files.map(f => {
            // Store the actual file object in cache using its name as key
            FILE_CACHE.set(f.name, f);
            return f.name;
          });
          resolve(paths);
        };
        
        input.oncancel = () => resolve([]);
        input.click();
      });
    },

    copyFileFromBuffer: async (buffer, filename) => {
      try {
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    rasterizeSVG: async (svg, w, h) => {
      // Browser-side SVG to PNG fallback
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        canvas.width = w * 2;
        canvas.height = h * 2;
        
        const encodedData = window.btoa(unescape(encodeURIComponent(svg)));
        const dataUrl = `data:image/svg+xml;base64,${encodedData}`;
        
        img.onload = () => {
          ctx.fillStyle = '#1e1e1e';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (e) => reject(new Error('SVG render failed: ' + e));
        img.src = dataUrl;
      });
    },

    writeClipboardAdvanced: async (data) => {
      try {
        if (data.html) {
          const blob = new Blob([data.html], { type: 'text/html' });
          const textBlob = new Blob([data.text || ''], { type: 'text/plain' });
          const item = new window.ClipboardItem({
            'text/html': blob,
            'text/plain': textBlob
          });
          await navigator.clipboard.write([item]);
        } else {
          await navigator.clipboard.writeText(data.text || '');
        }
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    isElectron: false,
    
    // Custom
    rebuildApp: () => {
      if (typeof showToast === 'function') showToast('Rebuild is only available in the desktop app.', 'error');
    }
  };
})();
