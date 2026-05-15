/**
 * AssetPanelState - Shared state for AssetPanel modules.
 */
window.AssetPanelState = (() => {
  'use strict';

  return {
    viewMode: localStorage.getItem('mdpreview_asset_view_mode') || 'grid', // 'grid' | 'list'
    filter: 'all', // 'all' | 'active' | 'orphan' | 'broken'
    registry: { assets: [], orphans: [], broken: [] },
    observer: null,
    isOpening: false,
    renamingItemName: null,
    selected: new Set(),
    lastSelectedIndex: -1
  };
})();
