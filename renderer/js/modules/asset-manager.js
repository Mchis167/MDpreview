/* global AppState, AssetPanel */
/**
 * AssetManager - Renderer Module
 * Chịu trách nhiệm quản lý trạng thái Asset, giao diện Panel và đồng bộ dữ liệu.
 */
window.AssetManager = (() => {
  let registry = { assets: [], orphans: [], broken: [] };

  return {
    /**
     * Khởi tạo module, lắng nghe socket để cập nhật dữ liệu.
     */
    init() {
      // Khởi tạo UI Panel
      if (typeof AssetPanel !== 'undefined') {
        AssetPanel.init();
      }

      if (typeof AppState !== 'undefined' && AppState.socket) {
        AppState.socket.on('assets-changed', () => {
          this.refresh();
        });
      }

      // Refresh assets whenever the workspace is loaded or changed
      window.addEventListener('workspace-changed', () => {
        this.refresh();
      });

      // Initial fetch attempt
      this.refresh();
    },

    /**
     * Lấy dữ liệu mới nhất từ Server.
     */
    async refresh() {
      if (!AppState.currentWorkspace) return;

      try {
        const res = await fetch('/api/assets');
        if (!res.ok) throw new Error('Failed to fetch assets');
        
        registry = await res.json();
        
        // Nếu panel đang mở thì re-render
        if (typeof AssetPanel !== 'undefined') {
          AssetPanel.update(registry);
        }
        
        // Cập nhật badge trên Home View nếu có (Phase 4 enhancement)
        this.updateBadges();

        // Sync broken link warnings in Editor
        if (window.MonacoValidationService) window.MonacoValidationService.trigger();
      } catch (err) {
        console.error('[AssetManager] Refresh failed:', err);
      }
    },

    /**
     * Mở Asset Panel (Right Drawer).
     */
    async openPanel() {
      // Đảm bảo dữ liệu mới nhất trước khi mở
      await this.refresh();

      if (typeof AssetPanel !== 'undefined') {
        AssetPanel.show(registry);
      }
    },

    /**
     * Đóng Asset Panel.
     */
    closePanel() {
      if (typeof AssetPanel !== 'undefined') {
        AssetPanel.close();
      }
    },

    /**
     * Đóng/Mở Asset Panel luân phiên.
     */
    async togglePanel() {
      if (typeof AssetPanel !== 'undefined') {
        if (AssetPanel.isOpen()) {
          this.closePanel();
        } else {
          await this.openPanel();
        }
      }
    },

    /**
     * Trả về dữ liệu hiện tại.
     */
    getRegistry() {
      return registry;
    },

    /**
     * (Placeholder) Cập nhật các badge cảnh báo trên UI.
     */
    updateBadges() {
      // Sẽ thực hiện ở Phase 4: Hiển thị chấm đỏ trên nút Assets nếu có broken links
    }
  };
})();
