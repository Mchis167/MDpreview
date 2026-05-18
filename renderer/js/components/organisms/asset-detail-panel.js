/* global DesignSystem */
/**
 * AssetDetailPanel - Organism (Singleton UI)
 * Hiển thị thông tin chi tiết và danh sách tham chiếu của một Asset.
 */
window.AssetDetailPanel = (function() {
  'use strict';

  let _mount = null;
  let _panel = null;
  let _isVisible = false;
  let _currentItem = null;

  const AssetDetailPanel = {
    /**
     * Khởi tạo mount point.
     */
    init() {
      _mount = document.getElementById('asset-detail-mount');
      if (!_mount) {
        _mount = document.createElement('div');
        _mount.id = 'asset-detail-mount';
        // Gắn ngay trước asset-panel-mount để đảm bảo z-index và layout
        const assetPanelMount = document.getElementById('asset-panel-mount');
        if (assetPanelMount) {
          assetPanelMount.parentNode.insertBefore(_mount, assetPanelMount);
        } else {
          document.body.appendChild(_mount);
        }
        _mount.classList.add('ds-asset-detail-mask');
      }

      // Initialize persistent panel container for smooth transitions
      if (!_panel) {
        _panel = DesignSystem.createElement('div', 'ds-asset-detail-panel');
        _mount.appendChild(_panel);
      }
    },

    /**
     * Hiển thị chi tiết một Asset.
     */
    show(item) {
      _currentItem = item;
      _isVisible = true;
      this.render();
    },

    /**
     * Đóng panel chi tiết.
     */
    close() {
      _isVisible = false;
      _currentItem = null;
      this.render();
    },

    /**
     * Trả về item hiện tại đang hiển thị.
     */
    getCurrentItem() {
      return _currentItem;
    },

    /**
     * Trả về trạng thái hiển thị.
     */
    isVisible() {
      return _isVisible;
    },

    /**
     * Render nội dung panel.
     */
    render() {
      if (!_panel) return;

      const isPanelOpen = window.AssetPanel && window.AssetPanel.isOpen();
      
      // Update mask and panel classes
      _mount.classList.toggle('has-panel', isPanelOpen);
      
      // Delayed animation for is-open to ensure DOM state is ready
      if (_isVisible) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (_panel) _panel.classList.add('is-open');
          });
        });
      } else {
        _panel.classList.remove('is-open');
      }
      
      // Clear previous content
      _panel.innerHTML = '';
      
      if (!_currentItem) return;

      // 1. Header
      const header = DesignSystem.createElement('div', 'ds-asset-detail-header');
      const title = DesignSystem.createElement('div', 'ds-asset-detail-title', { text: 'Asset Details' });
      
      const closeBtn = DesignSystem.createButton({
        variant: 'subtitle',
        leadingIcon: 'x',
        offLabel: true,
        onClick: () => this.close()
      });

      header.appendChild(title);
      header.appendChild(closeBtn);

      // 2. Preview
      const preview = DesignSystem.createElement('div', 'ds-asset-detail-preview');
      if (_currentItem.type === 'broken') {
        const banIcon = DesignSystem.createElement('div', 'ds-asset-broken-icon');
        banIcon.innerHTML = DesignSystem.getIcon('ban', { width: 64, height: 64 });
        preview.appendChild(banIcon);
      } else {
        const img = document.createElement('img');
        img.src = `/_md-workspace-assets/${encodeURIComponent(_currentItem.name)}`;
        img.onclick = () => {
          if (window.ZoomSystem) window.ZoomSystem.open(img.src, 'image');
        };
        preview.appendChild(img);
      }

      // 3. Content
      const content = DesignSystem.createElement('div', 'ds-asset-detail-content');

      // Meta Section
      const meta = DesignSystem.createElement('div', 'ds-asset-detail-meta');
      const nameRow = DesignSystem.createElement('div', 'ds-asset-detail-name-row');
      const name = DesignSystem.createElement('div', 'ds-asset-detail-name', { text: _currentItem.name });
      
      const type = _currentItem.type;
      const statusColor = type === 'active' ? 'var(--ds-status-success)' : (type === 'orphan' ? 'var(--ds-status-warning)' : 'var(--ds-status-danger)');
      
      const dot = DesignSystem.createElement('div', 'ds-asset-detail-status-dot', {
        style: `background: ${statusColor}`
      });

      nameRow.appendChild(name);
      nameRow.appendChild(dot);

      const stats = DesignSystem.createElement('div', 'ds-asset-detail-stats');
      const sizeInfo = DesignSystem.createElement('div', null, { 
        text: type === 'broken' ? 'File missing' : `${this._formatSize(_currentItem.size)}` 
      });
      const usageInfo = DesignSystem.createElement('div', null, { 
        text: `Used in ${_currentItem.refs.length} files • ${_currentItem.refCount} references` 
      });

      stats.appendChild(sizeInfo);
      stats.appendChild(usageInfo);

      meta.appendChild(nameRow);
      meta.appendChild(stats);

      // Usage Section
      const usage = DesignSystem.createElement('div', 'ds-asset-detail-usage');
      const sectionTitle = DesignSystem.createElement('div', 'ds-asset-detail-section-title', { text: 'Used in' });
      usage.appendChild(sectionTitle);

      if (_currentItem.refs && _currentItem.refs.length > 0) {
        _currentItem.refs.forEach(ref => {
          usage.appendChild(this._renderFileGroup(ref));
        });
      } else {
        const noUsage = DesignSystem.createElement('div', 'ds-asset-empty-text', { 
          text: 'This asset is not being used in any Markdown files.'
        });
        usage.appendChild(noUsage);
      }

      // Divider
      const divider = DesignSystem.createElement('div', 'ds-asset-detail-divider');

      content.appendChild(meta);
      content.appendChild(divider);
      content.appendChild(usage);

      _panel.appendChild(header);
      _panel.appendChild(preview);
      _panel.appendChild(content);
    },

    /**
     * Render một nhóm tham chiếu theo file.
     */
    _renderFileGroup(ref) {
      // Fallback cho dữ liệu cũ (ref là string) hoặc thiếu occurrences
      const occurrences = ref.occurrences || [];
      const filePath = typeof ref === 'string' ? ref : ref.path;

      const group = DesignSystem.createElement('div', 'ds-asset-detail-file-group');
      
      const header = DesignSystem.createElement('div', 'ds-asset-detail-file-header');
      const icon = DesignSystem.createElement('div', 'ds-asset-detail-file-icon');
      icon.innerHTML = DesignSystem.getIcon('file-text', { width: 14, height: 14 });
      
      const fileName = DesignSystem.createElement('div', 'ds-asset-detail-file-name', { text: filePath });
      const badge = DesignSystem.createElement('div', 'ds-asset-detail-file-badge', { text: `${occurrences.length} Ref` });

      header.onclick = () => {
        if (window.loadFile) window.loadFile(filePath);
      };

      header.appendChild(icon);
      header.appendChild(fileName);
      header.appendChild(badge);

      const occurrencesList = DesignSystem.createElement('div', 'ds-asset-detail-occurrence');
      occurrences.forEach(occ => {
        const item = DesignSystem.createElement('div', 'ds-asset-detail-occ-item');
        const arrow = DesignSystem.createElement('div', 'ds-asset-detail-occ-arrow', { text: '↳' });
        const line = DesignSystem.createElement('div', 'ds-asset-detail-occ-line', { text: `Line ${occ.line}` });
        const code = DesignSystem.createElement('div', 'ds-asset-detail-occ-code', { text: occ.content });

        item.onclick = (e) => {
          e.stopPropagation();
          this._navigateToLine(filePath, occ.line);
        };

        item.appendChild(arrow);
        item.appendChild(line);
        item.appendChild(code);
        occurrencesList.appendChild(item);
      });

      group.appendChild(header);
      group.appendChild(occurrencesList);
      return group;
    },

    /**
     * Điều hướng đến dòng code trong Editor.
     */
    async _navigateToLine(filePath, line) {
      if (window.loadFile) {
        // Force edit mode for this file in this session
        if (window.AppState && AppState.setFileViewMode) {
          AppState.setFileViewMode(filePath, 'edit');
        }

        await window.loadFile(filePath);
        // Wait for editor to be ready and content loaded
        setTimeout(() => {
          if (window.EditorModule && window.EditorModule.revealLine) {
            window.EditorModule.revealLine(line);
          }
        }, 400);
      }
    },

    _formatSize(bytes) {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
  };

  return AssetDetailPanel;
})();
