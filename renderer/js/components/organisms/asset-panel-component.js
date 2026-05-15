/* global AssetPanelState, AssetPanelHeader, AssetPanelContent, AssetPanelSelection, AssetPanelActions */
/**
 * AssetPanel - Organism (Singleton UI)
 * Orchestrator for Asset Management drawer.
 */
window.AssetPanel = (function() {
  'use strict';

  let _isVisible = false;
  let _mount = null;
  let _panel = null;
  let _content = null;
  const _state = AssetPanelState;

  const AssetPanel = {
    /**
     * Khởi tạo drawer bằng cách gắn khung vào DOM.
     */
    init() {
      _mount = document.getElementById('asset-panel-mount');
      if (!_mount) {
        _mount = document.createElement('div');
        _mount.id = 'asset-panel-mount';
        document.body.appendChild(_mount);
      }
      this._renderSkeleton();
      this._bindGlobalEvents();
      if (window.AssetDetailPanel) window.AssetDetailPanel.init();
    },

    /**
     * Hiển thị panel với dữ liệu mới.
     */
    show(registry) {
      if (registry) _state.registry = registry;
      _isVisible = true;
      _state.isOpening = true;
      this._updateUIState();
      this.render();
    },

    /**
     * Đóng panel.
     */
    close() {
      if (!_isVisible) return;
      _isVisible = false;
      this._updateUIState();
      
      _state.selected.clear();
      _state.lastSelectedIndex = -1;
      if (window.AssetDetailPanel) window.AssetDetailPanel.close();
    },

    /**
     * Cập nhật dữ liệu mà không cần đóng/mở lại panel.
     */
    update(registry) {
      if (registry) _state.registry = registry;
      if (_isVisible) this.render();
    },

    isOpen() {
      return _isVisible;
    },

    /**
     * Render nội dung chính bằng cách gọi các sub-modules.
     */
    render() {
      if (!_content) return;

      // Clean up previous observer
      if (_state.observer) {
        _state.observer.disconnect();
        _state.observer = null;
      }

      _content.innerHTML = '';
      const container = DesignSystem.createElement('div', 'ds-asset-panel');

      // 1. Đồng bộ Selection Mode class
      container.classList.toggle('is-selection-mode', _state.selected.size > 0);

      // 2. Delegate rendering to Content module
      if (AssetPanelContent) {
        AssetPanelContent.render({
          container,
          onToggleSelection: (name, isShift) => this._handleToggleSelection(name, isShift)
        });
      }
      
      _content.appendChild(container);
    },

    _renderSkeleton() {
      if (!_mount) return;
      _mount.innerHTML = '';

      const container = DesignSystem.createElement('div', 'ds-asset-drawer');
      const overlay = DesignSystem.createElement('div', 'ds-asset-drawer-overlay');
      overlay.onclick = () => this.close();

      _panel = DesignSystem.createElement('div', 'ds-asset-drawer-panel');

      // Render Header via Sub-module
      const header = AssetPanelHeader.render({
        onClose: () => this.close(),
        onImport: () => { if (AssetPanelActions) AssetPanelActions.handleImport(); },
        onToggleView: () => {
          _state.viewMode = _state.viewMode === 'grid' ? 'list' : 'grid';
          localStorage.setItem('mdpreview_asset_view_mode', _state.viewMode);
          this._renderSkeleton();
          this.render();
          this._updateUIState();
        }
      });

      _content = DesignSystem.createElement('div', 'ds-asset-content-wrapper', {
        style: 'flex: 1; overflow: hidden; display: flex; flex-direction: column;'
      });
      
      _panel.appendChild(header);
      _panel.appendChild(_content);
      container.appendChild(overlay);
      container.appendChild(_panel);

      _panel.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'transform' && _isVisible && _state.isOpening) {
          _state.isOpening = false;
          this.render();
        }
      });

      _mount.appendChild(container);
    },

    _updateUIState() {
      const container = _mount.querySelector('.ds-asset-drawer');
      if (container) {
        container.classList.toggle('is-open', _isVisible);
      }
    },

    _handleToggleSelection(name, isShift) {
      if (AssetPanelSelection) {
        const items = this._getFilteredItems();
        AssetPanelSelection.toggleSelection(name, isShift, items);
      }
    },

    /**
     * Lấy danh sách item sau khi filter (Proxy cho Content module logic).
     */
    _getFilteredItems() {
      const { assets, orphans, broken } = _state.registry;
      if (_state.filter === 'active') return assets.map(i => ({ ...i, type: 'active' }));
      if (_state.filter === 'orphan') return orphans.map(i => ({ ...i, type: 'orphan' }));
      if (_state.filter === 'broken') return broken.map(i => ({ ...i, type: 'broken' }));
      
      return [
        ...broken.map(i => ({ ...i, type: 'broken' })),
        ...assets.map(i => ({ ...i, type: 'active' })),
        ...orphans.map(i => ({ ...i, type: 'orphan' }))
      ];
    },

    _bindGlobalEvents() {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && _isVisible) {
          this.close();
        }
      });
    }
  };

  return AssetPanel;
})();
