/**
 * AttachmentService
 * Purpose: Coordinates image/asset management between the Editor and the Main process.
 * Pattern: IIFE Singleton
 */

/* global MonacoService */

const AttachmentService = (() => {
  'use strict';

  /**
   * Process a file (image) and save it to the workspace.
   * @param {File|Blob} file 
   * @param {string} vaultPath 
   * @returns {Promise<Object>} { success, relativePath, error }
   */
  async function saveImage(file, vaultPath) {
    try {
      if (!vaultPath) throw new Error('No active workspace');
      
      const buffer = await file.arrayBuffer();
      const originalName = file.name || 'pasted-image.png';
      
      const result = await window.electronAPI.saveAttachment({
        buffer: buffer,
        originalName: originalName,
        vaultPath: vaultPath
      });
      
      return result;
    } catch (error) {
      console.error('[AttachmentService] Save failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Internal helper: Process a list of image files (deduplicate + save + insert)
   * @param {Array<File>} imageFiles 
   * @param {Object|null} pos { lineNumber, column } or null for current cursor
   * @param {string} vaultPath 
   */
  async function _processImageFiles(imageFiles, pos, vaultPath) {
    if (imageFiles.length === 0) return;

    if (window.showToast) {
      const msg = imageFiles.length === 1 ? 'Processing image...' : `Processing ${imageFiles.length} image(s)...`;
      window.showToast(msg, 'info', { duration: 2000 });
    }

    const uploadedPaths = [];
    for (const file of imageFiles) {
      // 1. Check if file is already in this workspace's assets folder
      let alreadyExists = false;
      let existingPath = '';

      if (file.path) {
        // --- DESKTOP (ELECTRON) LOGIC: Compare absolute paths ---
        const normalize = (p) => p.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
        const nVault = normalize(vaultPath);
        const nFile = normalize(file.path);
        const nAssetsBase = `${nVault}/assets`;
        
        if (nFile.startsWith(nAssetsBase)) {
          alreadyExists = true;
          const originalVaultBase = vaultPath.replace(/\\/g, '/').replace(/\/+$/, '');
          const originalFileBase = file.path.replace(/\\/g, '/');
          existingPath = originalFileBase.substring(originalVaultBase.length);
        }
      } else {
        // --- BROWSER LOGIC: Use Metadata Fingerprint ---
        try {
          const response = await fetch('/api/file-ops/check-asset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: file.name,
              size: file.size,
              lastModified: file.lastModified,
              watchDir: vaultPath
            })
          });
          const check = await response.json();
          if (check.exists) {
            alreadyExists = true;
            existingPath = check.relativePath;
            console.warn('[AttachmentService] Reuse success:', existingPath);
          }
        } catch (err) {
          console.warn('[AttachmentService] Metadata check failed:', err);
        }
      }

      if (alreadyExists) {
        uploadedPaths.push(existingPath);
        continue;
      }

      // 2. Otherwise, save as new attachment
      const result = await saveImage(file, vaultPath);
      if (result.success) {
        uploadedPaths.push(result.relativePath);
      } else {
        if (window.showToast) window.showToast(`Failed to save ${file.name || 'image'}: ${result.error}`, 'error');
      }
    }
    
    if (uploadedPaths.length > 0) {
      const links = uploadedPaths.map(p => `![image](${p})`).join('\n');
      if (pos) {
        _insertLinkAtPosition(links, pos);
      } else {
        _insertAtCursor(links);
      }
      if (window.showToast) window.showToast(uploadedPaths.length === 1 ? 'Image added' : 'Images added', 'success');
    }
  }

  /**
   * Handles the 'paste' event from Monaco Editor.
   * @param {ClipboardEvent} e 
   * @param {string} vaultPath 
   */
  async function handlePaste(e, vaultPath) {
    const items = e.clipboardData?.items;
    const clipboardFiles = e.clipboardData?.files;
    const imageFiles = [];
    const seenFiles = new Set();

    function addFile(file) {
      if (!file) return;
      // Create a fingerprint to avoid duplicates (name + size + type)
      const fingerprint = `${file.name}-${file.size}-${file.type}`;
      if (!seenFiles.has(fingerprint)) {
        seenFiles.add(fingerprint);
        imageFiles.push(file);
      }
    }

    // 1. Collect files from items (Blobs/Screenshots)
    if (items) {
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          addFile(item.getAsFile());
        }
      }
    }

    // 2. Collect files from files (Copied files from OS)
    if (clipboardFiles && clipboardFiles.length > 0) {
      for (const file of clipboardFiles) {
        if (file.type.startsWith('image/')) {
          addFile(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      await _processImageFiles(imageFiles, null, vaultPath);
    }
  }

  /**
   * Handles the 'drop' event from Monaco Editor.
   * @param {DragEvent} e 
   * @param {Object} pos { lineNumber, column }
   * @param {string} vaultPath 
   */
  async function handleDrop(e, pos, vaultPath) {
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    // Filter for images
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    e.preventDefault();
    e.stopPropagation();

    await _processImageFiles(imageFiles, pos, vaultPath);
  }

  /**
   * Helper: Insert text at current cursor
   */
  function _insertAtCursor(text) {
    if (!window.MonacoService || !MonacoService.isInitialized()) return;
    
    const editor = MonacoService.getInstance();
    const selection = editor.getSelection();
    
    MonacoService.executeEdit(selection, text);
    MonacoService.focus();
  }

  /**
   * Helper: Insert text at specific position
   */
  function _insertLinkAtPosition(text, pos) {
    if (!window.MonacoService || !MonacoService.isInitialized()) return;
    
    const range = {
      startLineNumber: pos.lineNumber,
      startColumn: pos.column,
      endLineNumber: pos.lineNumber,
      endColumn: pos.column
    };
    
    MonacoService.executeEdit(range, text);
    MonacoService.focus();
  }

  /**
   * Picking a new image from device and replacing content at range
   */
  async function pickAndReplaceImage(range) {
    const vaultPath = window.AppState?.currentWorkspace?.path;
    if (!vaultPath) return;

    if (window.electronAPI.isElectron) {
      // Desktop logic
      const paths = await window.electronAPI.openFiles({
        title: 'Select Image',
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }]
      });

      if (paths && paths.length > 0) {
        const filePath = paths[0];
        const data = await window.electronAPI.readFile(filePath);
        if (data.success) {
          const blob = new Blob([data.content]);
          const file = new File([blob], filePath.split(/[\\/]/).pop(), { type: 'image/png' });
          const result = await saveImage(file, vaultPath);
          if (result.success) {
            window.MonacoService.executeEdit(range, result.relativePath);
          }
        }
      }
    } else {
      // Browser logic: create hidden input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        if (input.files && input.files[0]) {
          const result = await saveImage(input.files[0], vaultPath);
          if (result.success) {
            window.MonacoService.executeEdit(range, result.relativePath);
          }
        }
      };
      input.click();
    }
  }

  /**
   * Reveal the asset in OS file explorer
   */
  async function revealAsset(url) {
    if (!url.startsWith('/assets/') && !url.startsWith('assets/')) return;
    if (window.electronAPI.isElectron) {
      const absPath = await window.electronAPI.getAbsolutePath(url);
      window.electronAPI.revealInFinder(absPath);
    }
  }

  /**
   * Global listener for paste events (More robust for web/electron mix)
   */
  window.addEventListener('paste', (e) => {
    // Check if the focus is within Monaco
    const activeEl = document.activeElement;
    const isMonaco = activeEl?.closest('.monaco-editor') || activeEl?.classList.contains('monaco-editor');
    
    if (isMonaco && window.AppState?.currentWorkspace) {
      handlePaste(e, window.AppState.currentWorkspace.path);
    }
  }, true);

  return {
    saveImage,
    handlePaste,
    handleDrop,
    pickAndReplaceImage,
    revealAsset
  };
})();

window.AttachmentService = AttachmentService;
