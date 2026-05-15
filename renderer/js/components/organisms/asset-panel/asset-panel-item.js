/* global DesignSystem, Checkbox */
/**
 * AssetPanelItem - Molecules for rendering individual assets.
 */
window.AssetPanelItem = (() => {
  'use strict';

  const _state = window.AssetPanelState;

  /**
   * Tự động load ảnh khi cuộn tới.
   */
  function _observeImage(img, contentArea) {
    if (!_state.observer) {
      _state.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const target = entry.target;
            target.src = target.dataset.src;
            target.onload = () => target.classList.add('is-loaded');
            _state.observer.unobserve(target);
          }
        });
      }, { 
        root: contentArea,
        rootMargin: '200px'
      });
    }
    _state.observer.observe(img);
  }

  function _formatSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function _showContextMenu(e, item, type) {
    const items = [
      { 
        label: 'View Full Image', 
        icon: 'maximize',
        disabled: type === 'broken',
        onClick: () => {
          const src = `/assets/${encodeURIComponent(item.name)}`;
          if (window.ZoomSystem) window.ZoomSystem.open(src, 'image');
        }
      },
      { divider: true },
      { 
        label: 'Reveal in Finder', 
        icon: 'external-link',
        disabled: type === 'broken',
        onClick: () => {
          if (window.AssetPanelActions) window.AssetPanelActions.revealInFinder(item.name);
        }
      },
      { divider: true },
      { 
        label: 'Rename', 
        icon: 'rename-cursor',
        disabled: type === 'broken',
        onClick: () => {
          if (window.AssetPanelActions) window.AssetPanelActions.handleRename(item);
        }
      },
      { 
        label: 'Delete', 
        icon: 'trash-2',
        variant: 'danger',
        onClick: () => {
          if (window.AssetPanelActions) window.AssetPanelActions.handleDelete(item, type);
        }
      }
    ];

    DesignSystem.createContextMenu(e, items);
  }

  return {
    renderCard(item, type, contentArea, onToggle) {
      const isSelected = _state.selected.has(item.name);
      const card = DesignSystem.createElement('div', `ds-asset-card ${isSelected ? 'is-selected' : ''}`);
      card.setAttribute('data-name', item.name);
      
      const preview = DesignSystem.createElement('div', 'ds-asset-preview');
      
      const checkbox = Checkbox.create({
        checked: _state.selected.has(item.name),
        className: 'ds-asset-card-checkbox'
      });
      checkbox.onclick = (e) => {
        e.stopPropagation();
        onToggle(item.name, e.shiftKey);
      };
      preview.appendChild(checkbox);

      if (type === 'broken') {
        const banIcon = DesignSystem.createElement('div', 'ds-asset-broken-icon');
        banIcon.innerHTML = DesignSystem.getIcon('ban', { width: 40, height: 40 });
        preview.appendChild(banIcon);
      } else {
        const img = document.createElement('img');
        const src = `/assets/${encodeURIComponent(item.name)}?thumbnail=true`;
        img.className = 'ds-asset-image-lazy';
        img.setAttribute('data-src', src);
        preview.appendChild(img);
        _observeImage(img, contentArea);
      }

      const statusColor = type === 'active' ? 'var(--ds-status-success)' : (type === 'orphan' ? 'var(--ds-status-warning)' : 'var(--ds-status-danger)');
      const dot = DesignSystem.createElement('div', 'ds-asset-card-status-dot', {
        style: `background: ${statusColor}`
      });

      if ((type === 'active' || type === 'broken') && item.refCount > 0) {
        const badge = DesignSystem.createElement('div', 'ds-asset-ref-badge', {
          text: `${item.refCount} Ref`
        });
        preview.appendChild(badge);
      }
      
      const meta = DesignSystem.createElement('div', 'ds-asset-card-meta');
      const nameRow = DesignSystem.createElement('div', 'ds-asset-card-name-row');
      
      if (_state.renamingItemName === item.name) {
        const input = DesignSystem.createElement('input', 'ds-asset-inline-input');
        input.value = item.name;
        input.onclick = (e) => e.stopPropagation();
        input.onkeydown = (e) => {
          if (e.key === 'Enter' && window.AssetPanelActions) window.AssetPanelActions.performRename(item, input.value);
          if (e.key === 'Escape') {
            _state.renamingItemName = null;
            if (window.AssetPanel) window.AssetPanel.render();
          }
        };
        input.onblur = () => {
          if (_state.renamingItemName === item.name && window.AssetPanelActions) {
            window.AssetPanelActions.performRename(item, input.value);
          }
        };
        nameRow.appendChild(input);
        setTimeout(() => {
          input.focus();
          const dotPos = item.name.lastIndexOf('.');
          input.setSelectionRange(0, dotPos > 0 ? dotPos : item.name.length);
        }, 0);
      } else {
        const name = DesignSystem.createElement('div', 'ds-asset-card-name', { text: item.name });
        nameRow.appendChild(name);
      }
      
      nameRow.appendChild(dot);

      const info = DesignSystem.createElement('div', 'ds-asset-card-info', { 
        text: type === 'broken' ? 'File missing' : _formatSize(item.size) 
      });
      
      meta.appendChild(nameRow);
      meta.appendChild(info);

      card.appendChild(preview);
      card.appendChild(meta);

      card.onclick = (e) => {
        if (_state.renamingItemName) return;
        if (e.shiftKey || _state.selected.size > 0) {
          onToggle(item.name, e.shiftKey);
        } else {
          if (window.AssetDetailPanel) window.AssetDetailPanel.show(item);
        }
      };

      card.oncontextmenu = (e) => _showContextMenu(e, item, type);

      return card;
    },

    renderListRow(item, contentArea, onToggle) {
      const isSelected = _state.selected.has(item.name);
      const row = DesignSystem.createElement('div', `ds-asset-list-row ${isSelected ? 'is-selected' : ''}`);
      row.setAttribute('data-name', item.name);
      
      const thumbCol = DesignSystem.createElement('div', 'ds-asset-list-col-thumb');
      const thumb = DesignSystem.createElement('div', 'ds-asset-list-thumb');
      if (item.type === 'broken') {
        thumb.innerHTML = DesignSystem.getIcon('ban', { width: 24, height: 24 });
      } else {
        const img = document.createElement('img');
        img.className = 'ds-asset-image-lazy';
        img.setAttribute('data-src', `/assets/${encodeURIComponent(item.name)}?thumbnail=true`);
        thumb.appendChild(img);
        _observeImage(img, contentArea);
      }
      thumbCol.appendChild(thumb);

      const nameCol = DesignSystem.createElement('div', 'ds-asset-list-col-name');
      if (_state.renamingItemName === item.name) {
        const input = DesignSystem.createElement('input', 'ds-asset-inline-input');
        input.value = item.name;
        input.onclick = (e) => e.stopPropagation();
        input.onkeydown = (e) => {
          if (e.key === 'Enter' && window.AssetPanelActions) window.AssetPanelActions.performRename(item, input.value);
          if (e.key === 'Escape') {
            _state.renamingItemName = null;
            if (window.AssetPanel) window.AssetPanel.render();
          }
        };
        input.onblur = () => {
          if (_state.renamingItemName === item.name && window.AssetPanelActions) {
            window.AssetPanelActions.performRename(item, input.value);
          }
        };
        nameCol.appendChild(input);
        setTimeout(() => {
          input.focus();
          const dotPos = item.name.lastIndexOf('.');
          input.setSelectionRange(0, dotPos > 0 ? dotPos : item.name.length);
        }, 0);
      } else {
        const name = DesignSystem.createElement('div', 'ds-asset-list-name', { text: item.name });
        nameCol.appendChild(name);
      }

      const refCol = DesignSystem.createElement('div', 'ds-asset-list-col-ref', { 
        text: (item.type === 'active' || item.type === 'broken') ? item.refCount : '-'
      });

      const sizeCol = DesignSystem.createElement('div', 'ds-asset-list-col-size', { 
        text: item.type === 'broken' ? '-' : _formatSize(item.size) 
      });

      const typeCol = DesignSystem.createElement('div', 'ds-asset-list-col-type');
      const statusColor = item.type === 'active' ? 'var(--ds-status-success)' : (item.type === 'orphan' ? 'var(--ds-status-warning)' : 'var(--ds-status-danger)');
      const dot = DesignSystem.createElement('div', 'ds-asset-card-status-dot', {
        style: `background: ${statusColor}`
      });
      typeCol.appendChild(dot);

      row.appendChild(thumbCol);
      row.appendChild(nameCol);
      row.appendChild(refCol);
      row.appendChild(sizeCol);
      row.appendChild(typeCol);

      row.onclick = (e) => {
        if (_state.renamingItemName) return;
        if (e.shiftKey || _state.selected.size > 0) {
          onToggle(item.name, e.shiftKey);
        } else {
          if (window.AssetDetailPanel) window.AssetDetailPanel.show(item);
        }
      };

      row.oncontextmenu = (e) => _showContextMenu(e, item, item.type);

      return row;
    }
  };
})();
