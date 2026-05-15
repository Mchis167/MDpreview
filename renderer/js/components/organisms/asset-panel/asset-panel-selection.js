/**
 * AssetPanelSelection - Logic for multiple selection in AssetPanel.
 */
window.AssetPanelSelection = (() => {
  'use strict';

  const _state = window.AssetPanelState;

  return {
    /**
     * Quản lý trạng thái chọn nhiều (Multiple Selection).
     */
    toggleSelection(itemName, isShiftKey, items) {
      const itemNames = items.map(i => i.name);
      const currentIndex = itemNames.indexOf(itemName);

      if (isShiftKey && _state.lastSelectedIndex !== -1) {
        // Range selection
        const start = Math.min(_state.lastSelectedIndex, currentIndex);
        const end = Math.max(_state.lastSelectedIndex, currentIndex);
        
        for (let i = start; i <= end; i++) {
          _state.selected.add(itemNames[i]);
        }
      } else {
        // Single toggle
        if (_state.selected.has(itemName)) {
          _state.selected.delete(itemName);
        } else {
          _state.selected.add(itemName);
        }
      }

      _state.lastSelectedIndex = currentIndex;
      this.syncSelectionUI();
    },

    /**
     * Đồng bộ UI khi trạng thái chọn thay đổi mà không re-render toàn bộ.
     */
    syncSelectionUI() {
      const mount = document.getElementById('asset-panel-mount');
      const content = mount ? mount.querySelector('.ds-asset-content-wrapper') : null;
      if (!content) return;

      // 1. Cập nhật các card/row đang hiển thị
      const items = content.querySelectorAll('.ds-asset-card, .ds-asset-list-row');
      items.forEach(el => {
        const name = el.getAttribute('data-name');
        const selected = _state.selected.has(name);
        el.classList.toggle('is-selected', selected);
        
        const cb = el.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = selected;
      });

      // 2. Cập nhật Selection Bar
      const panel = content.querySelector('.ds-asset-panel');
      if (!panel) return;

      // Đồng bộ trạng thái Selection Mode
      panel.classList.toggle('is-selection-mode', _state.selected.size > 0);

      const existingBar = panel.querySelector('.ds-asset-selection-bar');
      if (_state.selected.size > 0) {
        const newBar = this.renderSelectionBar();
        if (existingBar) {
          existingBar.replaceWith(newBar);
        } else {
          panel.appendChild(newBar);
        }
      } else if (existingBar) {
        existingBar.remove();
      }
    },

    renderSelectionBar() {
      const bar = DesignSystem.createElement('div', 'ds-asset-selection-bar');
      
      const left = DesignSystem.createElement('div', 'ds-asset-selection-left');
      
      const count = DesignSystem.createElement('span', 'ds-asset-selection-count', {
        text: `${_state.selected.size} items selected`
      });
      
      const clearBtn = DesignSystem.createButton({
        variant: 'ghost',
        label: 'Clear',
        onClick: () => this.deselectAll()
      });
      
      const divider = DesignSystem.createElement('div', 'ds-asset-selection-divider');
      
      left.appendChild(count);
      left.appendChild(divider);
      left.appendChild(clearBtn);

      const right = DesignSystem.createElement('div', 'ds-asset-selection-right');
      
      const deleteBtn = DesignSystem.createButton({
        variant: 'danger',
        leadingIcon: 'trash-2',
        label: 'Delete',
        onClick: () => {
          if (window.AssetPanelActions) window.AssetPanelActions.handleBatchDelete();
        }
      });

      right.appendChild(deleteBtn);

      bar.appendChild(left);
      bar.appendChild(right);

      return bar;
    },

    selectAll(items) {
      items.forEach(i => _state.selected.add(i.name));
      this.syncSelectionUI();
    },

    deselectAll() {
      _state.selected.clear();
      _state.lastSelectedIndex = -1;
      this.syncSelectionUI();
    }
  };
})();
