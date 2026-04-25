/**
 * FileService.js — High-level file operations service.
 * Wraps Electron IPC calls and provides unified file management.
 */
const FileService = (() => {
    
    /**
     * Fetch file tree from server
     * @param {Object} options { showHidden, hideEmpty, flat }
     */
    async function fetchFiles(options = {}) {
        const query = new URLSearchParams({
            showHidden: !!options.showHidden,
            hideEmpty: !!options.hideEmpty,
            flat: !!options.flat
        });
        const res = await fetch(`/api/files?${query}`).catch(() => null);
        if (!res || !res.ok) return [];
        return await res.json();
    }

    /**
     * Create a new file
     */
    async function createFile(absPath, content = '') {
        const res = await window.electronAPI.createFile(absPath, content);
        if (res.success) {
            if (typeof showToast === 'function') showToast('File created successfully');
        } else {
            if (typeof showToast === 'function') showToast(`Error creating file: ${res.error}`, 'error');
        }
        return res;
    }

    /**
     * Create a new folder
     */
    async function createFolder(absPath) {
        const res = await window.electronAPI.createFolder(absPath);
        if (res.success) {
            if (typeof showToast === 'function') showToast('Folder created successfully');
        } else {
            if (typeof showToast === 'function') showToast(`Error creating folder: ${res.error}`, 'error');
        }
        return res;
    }

    /**
     * Delete a file or folder
     */
    async function deleteFile(absPath) {
        const res = await window.electronAPI.deleteFile(absPath);
        if (res.success) {
            if (typeof showToast === 'function') showToast('Item deleted');
        } else {
            if (typeof showToast === 'function') showToast(`Error deleting item: ${res.error}`, 'error');
        }
        return res;
    }

    /**
     * Rename a file or folder
     */
    async function renameFile(oldAbs, newAbs) {
        const res = await window.electronAPI.renameFile(oldAbs, newAbs);
        if (!res.success) {
            if (typeof showToast === 'function') showToast(`Error renaming: ${res.error}`, 'error');
        }
        return res;
    }

    /**
     * Duplicate a file or folder
     */
    async function duplicateFile(absPath) {
        const res = await window.electronAPI.duplicateFile(absPath);
        if (res.success) {
            if (typeof showToast === 'function') showToast('Item duplicated');
        } else {
            if (typeof showToast === 'function') showToast(`Error duplicating: ${res.error}`, 'error');
        }
        return res;
    }

    /**
     * Move a file or folder
     */
    async function moveFile(srcAbs, destAbs) {
        const res = await window.electronAPI.moveFile(srcAbs, destAbs);
        if (!res.success) {
            if (typeof showToast === 'function') showToast(`Error moving item: ${res.error}`, 'error');
        }
        return res;
    }

    /**
     * Reveal in OS Finder/Explorer
     */
    function revealInFinder(absPath) {
        window.electronAPI.revealInFinder(absPath);
    }

    /**
     * Open native file picker (multi-selection)
     */
    async function openFiles(options = {}) {
        return await window.electronAPI.openFiles(options);
    }

    /**
     * Copy a file or folder
     */
    async function copyFile(srcAbs, destAbs) {
        const res = await window.electronAPI.copyFile(srcAbs, destAbs);
        if (!res.success) {
            if (typeof showToast === 'function') showToast(`Error copying item: ${res.error}`, 'error');
        }
        return res;
    }

    /**
     * Open native folder picker
     */
    async function openFolder() {
        return await window.electronAPI.openFolder();
    }

    return {
        fetchFiles,
        createFile,
        createFolder,
        deleteFile,
        renameFile,
        duplicateFile,
        moveFile,
        copyFile,
        revealInFinder,
        openFolder,
        openFiles
    };
})();

window.FileService = FileService;
