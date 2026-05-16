/**
 * AssetPanelActions - Business logic for AssetPanel.
 */
window.AssetPanelActions = (() => {
  'use strict';

  const _state = window.AssetPanelState;

  return {
    /**
     * Hành động: Import ảnh từ máy tính.
     */
    async handleImport() {
      if (!window.AppState || !window.AppState.currentWorkspace) {
        if (typeof showToast === 'function') showToast('Please open a workspace first', 'warning');
        return;
      }
      
      const vaultPath = window.AppState.currentWorkspace.path;

      if (!vaultPath) {
        if (typeof showToast === 'function') showToast('Please open a workspace first', 'warning');
        return;
      }

      const res = await window.electronAPI.assets.import(vaultPath);

      if (res.success && res.count > 0) {
        if (typeof showToast === 'function') showToast(`Successfully imported ${res.count} images`, 'success');
        if (window.AssetManager) window.AssetManager.refresh();
      } else if (res.error) {
        if (typeof showToast === 'function') showToast(`Import failed: ${res.error}`, 'error');
      }
    },

    /**
     * Dọn dẹp toàn bộ ảnh mồ côi.
     */
    async handlePurgeOrphans() {
      const orphans = _state.registry.orphans || [];
      if (orphans.length === 0) return;

      DesignSystem.showConfirm({
        title: 'Purge All Orphans',
        message: `Are you sure you want to delete all ${orphans.length} orphan assets? This action cannot be undone.`,
        confirmLabel: 'Purge All',
        confirmVariant: 'danger',
        onConfirm: async () => {
          try {
            let result;
            if (window.electronAPI) {
              const vaultPath = window.AppState.currentWorkspace.path;
              result = await window.electronAPI.assets.purgeOrphans(vaultPath);
            } else {
              const res = await fetch('/api/assets/purge-orphans', { method: 'POST' });
              result = await res.json();
            }

            if (result.success) {
              if (typeof showToast === 'function') {
                showToast(`Successfully purged ${result.count} orphan assets.`, 'success');
              }
              if (window.AssetManager) window.AssetManager.refresh();
            } else {
              throw new Error(result.error || 'Purge failed');
            }
          } catch (err) {
            if (typeof showToast === 'function') {
              showToast(`Purge failed: ${err.message}`, 'error');
            }
          }
        }
      });
    },

    /**
     * Dọn dẹp toàn bộ tham chiếu hỏng.
     */
    async handlePurgeBroken() {
      const broken = _state.registry.broken || [];
      if (broken.length === 0) return;

      DesignSystem.showConfirm({
        title: 'Clean All Broken Links',
        message: `Are you sure you want to remove all references to ${broken.length} missing assets? This will modify your Markdown files.`,
        confirmLabel: 'Clean All',
        confirmVariant: 'danger',
        onConfirm: async () => {
          try {
            let result;
            if (window.electronAPI) {
              const vaultPath = window.AppState.currentWorkspace.path;
              result = await window.electronAPI.assets.purgeBroken(vaultPath);
            } else {
              const res = await fetch('/api/assets/purge-broken', { method: 'POST' });
              result = await res.json();
            }

            if (result.success) {
              if (typeof showToast === 'function') {
                showToast(`Successfully removed ${result.count} broken references across ${result.updatedFiles} files.`, 'success');
              }
              if (window.AssetManager) window.AssetManager.refresh();
            } else {
              throw new Error(result.error || 'Cleanup failed');
            }
          } catch (err) {
            if (typeof showToast === 'function') {
              showToast(`Cleanup failed: ${err.message}`, 'error');
            }
          }
        }
      });
    },

    /**
     * Kích hoạt chế độ đổi tên inline.
     */
    handleRename(item) {
      _state.renamingItemName = item.name;
      if (window.AssetPanel) window.AssetPanel.render();
    },

    /**
     * Thực hiện đổi tên thực tế.
     */
    async performRename(item, newName) {
      if (!newName || newName === item.name) {
        _state.renamingItemName = null;
        if (window.AssetPanel) window.AssetPanel.render();
        return;
      }

      if (!window.AppState || !window.AppState.currentWorkspace) return;
      const vaultPath = window.AppState.currentWorkspace.path;

      const res = await window.electronAPI.assets.rename({
        vaultPath,
        oldName: item.name,
        newName
      });

      _state.renamingItemName = null;

      if (res.success) {
        if (typeof showToast === 'function') {
          showToast(`Renamed successfully. Updated ${res.updatedFiles} files.`, 'success');
        }
        if (window.AssetManager) window.AssetManager.refresh();
      } else {
        if (typeof showToast === 'function') showToast(`Rename failed: ${res.error}`, 'error');
        if (window.AssetPanel) window.AssetPanel.render(); 
      }
    },

    /**
     * Hành động: Xóa một ảnh (đơn lẻ).
     */
    async handleDelete(item, type) {
      if (!window.AppState || !window.AppState.currentWorkspace) return;
      const vaultPath = window.AppState.currentWorkspace.path;

      let title = 'Delete Asset';
      let message = `Are you sure you want to delete "${item.name}"?`;
      let confirmLabel = 'Delete';
      let removeRefs = false;

      if (type === 'active') {
        message += `\n\nWarning: This asset is used in ${item.refCount} file(s). Do you want to remove these references as well?`;
        removeRefs = true;
      } else if (type === 'broken') {
        title = 'Cleanup Broken Reference';
        message = `The file "${item.name}" is already missing from your assets folder.\n\nDo you want to remove all broken links to this file from your Markdown documents?`;
        confirmLabel = 'Cleanup';
        removeRefs = true;
      }

      DesignSystem.showConfirm({
        title,
        message,
        confirmLabel,
        confirmVariant: 'danger',
        onConfirm: async () => {
          const res = await window.electronAPI.assets.delete({
            vaultPath,
            name: item.name,
            removeRefs
          });
          
          if (res.success) {
            const detail = res.updatedFiles > 0 ? ` (Updated ${res.updatedFiles} files)` : '';
            if (typeof showToast === 'function') showToast(`Successfully processed${detail}`, 'success');
            
            if (window.AssetDetailPanel) {
              const currentItem = window.AssetDetailPanel.getCurrentItem();
              if (currentItem && currentItem.name === item.name) {
                window.AssetDetailPanel.close();
              }
            }

            if (window.AssetManager) window.AssetManager.refresh();
          } else {
            if (typeof showToast === 'function') showToast(`Action failed: ${res.error}`, 'error');
          }
        }
      });
    },

    /**
     * Xóa hàng loạt asset đã chọn.
     */
    async handleBatchDelete() {
      const count = _state.selected.size;
      if (count === 0) return;

      DesignSystem.showConfirm({
        title: 'Delete Selected Assets',
        message: `Are you sure you want to delete ${count} selected asset(s)? This will also remove their references from Markdown files.`,
        confirmLabel: 'Delete All',
        confirmVariant: 'danger',
        onConfirm: async () => {
          if (!window.AppState || !window.AppState.currentWorkspace) return;
          const vaultPath = window.AppState.currentWorkspace.path;
          
          const names = Array.from(_state.selected);
          let successCount = 0;
          let totalFilesUpdated = 0;

          for (const name of names) {
            const res = await window.electronAPI.assets.delete({
              vaultPath,
              name,
              removeRefs: true
            });
            if (res.success) {
              successCount++;
              totalFilesUpdated += res.updatedFiles;
            }
          }

          if (typeof showToast === 'function') {
            showToast(`Successfully deleted ${successCount} assets. Updated ${totalFilesUpdated} files.`, 'success');
          }
          
          if (window.AssetDetailPanel) {
            const currentItem = window.AssetDetailPanel.getCurrentItem();
            if (currentItem && _state.selected.has(currentItem.name)) {
              window.AssetDetailPanel.close();
            }
          }

          _state.selected.clear();
          if (window.AssetManager) window.AssetManager.refresh();
        }
      });
    },

    /**
     * Hành động: Thay thế một ảnh bị hỏng.
     * @param {Object} item - Ảnh hỏng cần thay thế
     * @param {string} mode - 'existing' hoặc 'upload'
     */
    async handleReplaceBroken(item, mode = 'existing') {
      if (!window.AssetReplacementDialog) return;

      const _onConfirm = async (payload) => {
        if (!window.AppState || !window.AppState.currentWorkspace) return;
        const vaultPath = window.AppState.currentWorkspace.path;

        const res = await window.electronAPI.assets.replace({
          vaultPath,
          ...payload
        });

        if (res.success) {
          if (typeof showToast === 'function') {
            showToast(`Asset replaced successfully. Updated ${res.updatedFiles} files.`, 'success');
          }
          if (window.AssetManager) window.AssetManager.refresh();
          
          if (window.AssetDetailPanel) {
            const currentItem = window.AssetDetailPanel.getCurrentItem();
            if (currentItem && currentItem.name === item.name) {
              window.AssetDetailPanel.close();
            }
          }
        } else {
          throw new Error(res.error || 'Replacement failed');
        }
      };

      // Gọi Dialog và để nó tự xử lý việc chọn file hoặc hiện danh sách
      window.AssetReplacementDialog.show(item, {
        mode,
        title: item.isBroken ? 'Fix Broken Asset' : 'Replace Asset',
        confirmLabel: mode === 'upload' ? 'Upload & Replace' : 'Replace with Selected',
        onConfirm: _onConfirm
      });
    },

    /**
     * Hành động: Mở file trong OS Explorer.
     */
    async revealInFinder(name) {
      if (!window.AppState || !window.AppState.currentWorkspace) return;
      const fullPath = `${window.AppState.currentWorkspace.path}/assets/${name}`;
      await window.electronAPI.revealInFinder(fullPath);
    }
  };
})();
