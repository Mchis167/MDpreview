/**
 * AttachmentService
 * Purpose: Coordinates image/asset management between the Editor and the Main process.
 * Pattern: IIFE Singleton
 */

/* global MonacoService, monaco, AssetPickerComponent, AssetUploadPreviewComponent */

const AttachmentService = (() => {
  'use strict';

  /**
   * Process a file (image) and save it to the workspace.
   * @param {File|Blob} file 
   * @param {string} vaultPath 
   * @param {string|null} customName - Optional custom filename
   * @returns {Promise<Object>} { success, relativePath, error }
   */
  async function saveImage(file, vaultPath, customName = null) {
    try {
      if (!vaultPath) throw new Error('No active workspace');

      const buffer = await file.arrayBuffer();
      const originalName = customName || file.name || 'pasted-image.png';

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
   * Process a list of image files (deduplicate + save + insert)
   * @param {Array<File>} imageFiles 
   * @param {Object|null} pos { lineNumber, column } or null for current cursor
   * @param {string} vaultPath 
   */
  async function processImageFiles(imageFiles, pos, vaultPath) {
    if (imageFiles.length === 0) return;

    // SINGLE FILE: Show Preview before upload
    if (imageFiles.length === 1 && typeof AssetUploadPreviewComponent !== 'undefined') {
      const file = imageFiles[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        AssetUploadPreviewComponent.show({
          title: 'Insert Image',
          confirmLabel: 'Upload & Insert',
          file: {
            name: file.name,
            size: file.size,
            preview: e.target.result,
            data: e.target.result.split(',')[1]
          },
          onConfirm: async (payload) => {
            const result = await saveImage(file, vaultPath, payload.newName);
            if (result.success) {
              const link = `![image](${result.relativePath})`;
              if (pos) _insertLinkAtPosition(link, pos);
              else _insertAtCursor(link);
              
              if (window.AssetManager) window.AssetManager.refresh();
              if (window.showToast) window.showToast('Image added', 'success');
            } else {
              if (window.showToast) window.showToast(`Failed: ${result.error}`, 'error');
            }
          }
        });
      };
      
      reader.readAsDataURL(file);
      return;
    }

    // BULK FILES: Direct upload (no preview for now to avoid modal spam)
    if (window.showToast) {
      const msg = `Processing ${imageFiles.length} image(s)...`;
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
      await processImageFiles(imageFiles, null, vaultPath);
    }
  }

  /**
   * Handles the 'drop' event from Monaco Editor.
   * @param {DragEvent} e 
   * @param {Object} pos { lineNumber, column }
   * @param {string} vaultPath 
   */
  async function handleDrop(e, pos, vaultPath) {
    // 0. Guard: Don't allow drop if editor is read-only
    if (window.MonacoService && window.MonacoService.isInitialized()) {
      const editor = window.MonacoService.getInstance();
      if (editor.getOption(monaco.editor.EditorOption.readOnly)) {
        return;
      }
    }

    // 1. Check for internal asset drag (application/mdpreview-assets)
    const assetData = e.dataTransfer?.getData('application/mdpreview-assets');
    if (assetData) {
      e.preventDefault();
      e.stopPropagation();

      try {
        const assetNames = JSON.parse(assetData);
        if (!Array.isArray(assetNames) || assetNames.length === 0) return;

        // Verify assets exist in registry for safety
        const registry = window.AssetManager?.getRegistry();
        const allAssets = registry ? [...(registry.assets || []), ...(registry.orphans || []), ...(registry.broken || [])] : [];
        const existingNames = new Set(allAssets.map(a => a.name));

        const validAssets = assetNames.filter(name => existingNames.has(name));
        if (validAssets.length === 0) {
          if (window.showToast) window.showToast('Asset(s) no longer exist', 'warn');
          return;
        }

        const links = validAssets.map(name => `![${name}](/assets/${encodeURIComponent(name)})`).join('\n');

        if (pos) {
          _insertLinkAtPositionSmart(links, pos);
        } else {
          _insertAtCursor(links);
        }

        if (window.showToast) {
          window.showToast(validAssets.length === 1 ? 'Asset inserted' : `${validAssets.length} assets inserted`, 'success');
        }
      } catch (err) {
        console.error('[AttachmentService] Internal drop failed:', err);
      }
      return;
    }

    // 2. Fallback to external files
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    // Filter for images
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    e.preventDefault();
    e.stopPropagation();
    await processImageFiles(imageFiles, pos, vaultPath);
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

  function _insertLinkAtPositionSmart(text, pos) {
    if (!window.MonacoService || !MonacoService.isInitialized()) return;

    const editor = MonacoService.getInstance();
    const model = editor ? editor.getModel() : null;

    let insertText = text;
    if (model && pos.lineNumber <= model.getLineCount()) {
      const lineContent = model.getLineContent(pos.lineNumber);
      const textBeforeDrop = lineContent.substring(0, pos.column - 1);
      if (textBeforeDrop.trim().length > 0) {
        insertText = '\n' + text;
      }
    }

    const range = {
      startLineNumber: pos.lineNumber,
      startColumn: pos.column,
      endLineNumber: pos.lineNumber,
      endColumn: pos.column
    };

    MonacoService.executeEdit(range, insertText);
    MonacoService.focus();
  }

  /**
   * Download a web image to local assets and replace link in editor
   */
  async function downloadWebImage(url, range) {
    const vaultPath = window.AppState?.currentWorkspace?.path;
    if (!vaultPath) {
      if (window.showToast) window.showToast('No active workspace', 'error');
      return;
    }

    if (window.showToast) window.showToast('Downloading image...', 'info');

    try {
      const response = await fetch('/api/assets/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, vaultPath })
      });

      const result = await response.json();
      if (result.success) {
        if (window.MonacoService) {
          window.MonacoService.executeEdit(range, result.relativePath);
        }
        if (window.showToast) window.showToast('Downloaded to assets', 'success');
      } else {
        throw new Error(result.error || 'Failed to download');
      }
    } catch (err) {
      console.error('[AttachmentService] Download failed:', err);
      if (window.showToast) window.showToast(err.message, 'error');
    }
  }

  /**
   * Show details for a specific asset
   */
  function viewAssetDetail(url) {
    const fileName = url.split(/[\\/]/).pop();
    if (!window.AssetManager || !window.AssetDetailPanel) return;

    const registry = window.AssetManager.getRegistry();
    const allAssets = [...(registry.assets || []), ...(registry.orphans || []), ...(registry.broken || [])];
    const assetItem = allAssets.find(a => a.name === fileName);

    if (assetItem) {
      window.AssetDetailPanel.show(assetItem);
    } else {
      if (window.showToast) window.showToast('Asset info not found', 'warn');
    }
  }

  /**
   * Replace all occurrences of a broken asset in editor buffer with a new asset
   * Scans Monaco content directly (before save) to catch all unsaved broken links
   * @param {string} oldName - broken asset name (e.g., 'missing.png')
   * @param {string} newName - replacement asset name (e.g., 'fixed.png')
   * @returns {number} - count of replacements made
   */
  function _replaceAllBrokenAssetOccurrences(oldName, newName) {
    if (!window.MonacoService || !MonacoService.isInitialized()) return 0;

    const editor = MonacoService.getInstance();
    const model = editor?.getModel();
    if (!model) return 0;

    const content = model.getValue();

    // Regex for Markdown ![alt](/assets/name) and HTML <img src="/assets/name">
    const assetRegex = /(!\[.*?\]\s*\((\/?assets\/([^)]+))\))|(<img\s+[^>]*src=["'](\/?assets\/([^"']+))["'])/g;

    const edits = [];
    let match;
    let count = 0;

    while ((match = assetRegex.exec(content)) !== null) {
      const assetPath = match[3] || match[6];
      if (!assetPath) continue;

      const assetName = assetPath.split('?')[0].split('#')[0];
      const decodedName = decodeURIComponent(assetName);

      // Only replace if matches the broken asset name
      if (decodedName === oldName) {
        const urlPartStartIndex = match[3]
          ? match.index + match[1].indexOf(match[2])
          : match.index + match[4].indexOf(match[5]);
        const urlPartLength = (match[2] || match[5]).length;

        const startPos = model.getPositionAt(urlPartStartIndex);
        const endPos = model.getPositionAt(urlPartStartIndex + urlPartLength);

        edits.push({
          range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
          text: `assets/${newName}`
        });

        count++;
      }
    }

    if (edits.length > 0) {
      MonacoService.applyEdits(edits);
    }

    return count;
  }

  /**
   * Open the smart replacement dialog for an image
   * @param {Object} imageInfo 
   * @param {string} mode - 'existing' or 'upload'
   * @param {boolean} isBroken - If true, performs a global project-wide replacement
   */
  async function openSmartReplace(imageInfo, mode = 'existing', isBroken = false) {
    const { url, range } = imageInfo;
    const fileName = url.split(/[\\/]/).pop();

    if (!window.AssetReplacementDialog) return;

    const _onConfirm = async (payload) => {
      const vaultPath = window.AppState?.currentWorkspace?.path;
      if (!vaultPath) return;

      if (isBroken) {
        // CASE: Broken Asset - Use Global Replacement (Sync all files in project)
        try {
          // Step 1: Replace all occurrences in Monaco buffer FIRST (catches unsaved changes)
          const oldName = fileName;
          const newNameRaw = payload.newName || '';
          const newName = newNameRaw.split('/').pop(); // Extract basename
          const editorReplacementCount = _replaceAllBrokenAssetOccurrences(oldName, newName);

          // Step 2: Sync changes to disk via backend
          const res = await window.electronAPI.assets.replace({
            vaultPath,
            ...payload
          });

          if (res.success) {
            if (window.AssetManager) window.AssetManager.refresh();

            const message = editorReplacementCount > 0
              ? `Fixed ${editorReplacementCount} broken link(s) + synced project-wide`
              : 'Broken links fixed project-wide';

            if (window.showToast) window.showToast(message, 'success');
          } else {
            throw new Error(res.error || 'Global replacement failed');
          }
        } catch (err) {
          console.error('[AttachmentService] Global replace failed:', err);
          if (window.showToast) window.showToast(err.message, 'error');
        }
        return;
      }

      // CASE: Valid Asset - Use Local Replacement (Update only this link)
      if (payload.isUpload) {
        try {
          // Convert base64 data to ArrayBuffer
          const base64Data = payload.fileData || payload.data;
          if (!base64Data) throw new Error('No image data received');

          const binaryString = window.atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const isOverwrite = payload.newName === fileName;
          
          const res = await window.electronAPI.saveAttachment({
            buffer: bytes.buffer,
            originalName: payload.newName,
            vaultPath: vaultPath,
            overwrite: isOverwrite
          });

          if (res.success) {
            if (window.MonacoService) {
              window.MonacoService.executeEdit(range, res.relativePath);
            }
            if (window.AssetManager) window.AssetManager.refresh();
            if (window.showToast) window.showToast('Link replaced with new attachment', 'success');
          } else {
            throw new Error(res.error || 'Failed to save attachment');
          }
        } catch (err) {
          console.error('[AttachmentService] Link replacement failed:', err);
          if (window.showToast) window.showToast(err.message, 'error');
        }
      } else {
        if (window.MonacoService) {
          const newPath = (payload.newName.startsWith('assets/') || payload.newName.startsWith('/assets/'))
            ? payload.newName
            : `assets/${payload.newName}`;
          window.MonacoService.executeEdit(range, newPath);
          if (window.showToast) window.showToast('Link replaced with existing asset', 'success');
        }
      }
    };

    // Gọi Dialog và để nó tự xử lý việc chọn file hoặc hiện danh sách
    window.AssetReplacementDialog.show({ name: fileName }, {
      mode,
      isBroken,
      title: isBroken ? 'Fix Broken Asset' : 'Replace Asset',
      confirmLabel: mode === 'upload' ? 'Upload & Replace' : 'Replace with Selected',
      onConfirm: _onConfirm
    });
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
          const _ext = filePath.split('.').pop().toLowerCase();
          const _mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
          const file = new File([blob], filePath.split(/[\\/]/).pop(), { type: _mimeMap[_ext] || 'image/png' });
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
   * Picking an image and inserting it as a Markdown link at cursor
   */
  async function pickAndInsertImage() {
    const vaultPath = window.AppState?.currentWorkspace?.path;
    if (!vaultPath) return;

    if (window.electronAPI.isElectron) {
      const paths = await window.electronAPI.openFiles({
        title: 'Select Image to Upload',
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }]
      });

      if (paths && paths.length > 0) {
        const imageFiles = [];
        for (const filePath of paths) {
          const data = await window.electronAPI.readFile(filePath);
          if (data.success) {
            const blob = new Blob([data.content]);
            const file = new File([blob], filePath.split(/[\\/]/).pop(), { type: 'image/png' });
            // Add path for deduplication logic in processImageFiles
            Object.defineProperty(file, 'path', { value: filePath });
            imageFiles.push(file);
          }
        }
        await processImageFiles(imageFiles, null, vaultPath);
      }
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = async () => {
        if (input.files && input.files.length > 0) {
          await processImageFiles(Array.from(input.files), null, vaultPath);
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

  /**
   * Open the asset picker to select an existing image or upload a new one,
   * then insert it as a Markdown link at the current cursor.
   */
  async function pickAndInsertAsset() {
    const vaultPath = window.AppState?.currentWorkspace?.path;
    if (!vaultPath) {
      if (window.showToast) window.showToast('No active workspace', 'error');
      return;
    }

    if (!window.AssetPickerComponent) return;

    AssetPickerComponent.show({
      title: 'Insert Image from Assets',
      confirmLabel: 'Insert Image',
      multiSelect: true,
      onConfirm: async (selectedNames) => {
        const names = Array.isArray(selectedNames) ? selectedNames : [selectedNames];
        const links = names.map(name => {
          const newPath = (name.startsWith('assets/') || name.startsWith('/assets/'))
            ? name
            : `assets/${name}`;
          return `![image](${newPath})`;
        }).join('\n');

        _insertAtCursor(links);
        if (window.showToast) {
          window.showToast(names.length === 1 ? 'Image inserted' : `${names.length} images inserted`, 'success');
        }
      }
    });
  }

  return {
    saveImage,
    handlePaste,
    handleDrop,
    processImageFiles,
    pickAndReplaceImage,
    pickAndInsertImage,
    pickAndInsertAsset,
    revealAsset,
    downloadWebImage,
    viewAssetDetail,
    openSmartReplace
  };
})();

window.AttachmentService = AttachmentService;
