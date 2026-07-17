/* ══════════════════════════════════════════════════
   ShortcutsComponent.js — Keyboard Guide Organism
   Atomic Design System (Organism)
   ════════════════════════════════════════════════════ */

class ShortcutsComponent {
  constructor() {
    this.isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform) || (navigator.userAgentData && navigator.userAgentData.platform === 'macOS');
  }

  /**
   * Main render function that returns the content element
   */
  /**
   * Static source of truth for all shortcuts
   */
  /**
   * Static source of truth for all shortcuts
   */
  static getShortcutData(isMac) {
    const data = [
      {
        title: 'Navigation',
        items: [
          { id: 'mode-read', label: 'Switch to Read mode', keys: ['1'], icon: 'book-open', requireFile: true, tags: ['view', 'preview', 'display', 'xem'] },
          { id: 'mode-edit', label: 'Switch to Edit mode', keys: ['2'], icon: 'pen-line', requireFile: true, tags: ['write', 'editor', 'sửa'] },
          { id: 'mode-comment', label: 'Switch to Comment mode', keys: ['3'], icon: 'message-circle', requireFile: true, tags: ['feedback', 'review', 'chú thích', 'góp ý'] },
          { id: 'mode-collect', label: 'Switch to Collect mode', keys: ['4'], icon: 'bookmark', requireFile: true, tags: ['save', 'bookmark', 'favorite', 'thu thập'] },
          { id: 'back-to-home', label: 'Back to Home', keys: ['Mod', 'Shift', 'H'], icon: 'house', tags: ['home', 'house', 'start', 'welcome', 'index', 'trang chủ', 'về trang chủ', 'thoát file'] },
          { id: 'open-asset-manager', label: 'Open Asset Manager', keys: ['Mod', 'Shift', 'A'], icon: 'images', tags: ['assets', 'images', 'gallery', 'media', 'files', 'quản lý tài sản', 'quản lý file', 'hình ảnh'] },
          { id: 'toggle-sidebar', label: 'Toggle Sidebar', keys: ['Mod', 'B'], icon: 'panel-left', tags: ['navigation', 'panel', 'thanh bên'] },
          { id: 'focus-search', label: 'Focus Search', keys: ['Mod', 'P'], icon: 'search', tags: ['find', 'palette', 'tìm kiếm'] },
          { id: 'scroll-top', label: 'Scroll to Top', keys: ['Mod', '↑'], icon: 'arrow-up', requireFile: true, tags: ['up', 'start', 'lên đầu'] },
          { id: 'scroll-bottom', label: 'Scroll to Bottom', keys: ['Mod', '↓'], icon: 'arrow-down', requireFile: true, tags: ['down', 'end', 'xuống cuối'] },
          { id: 'toggle-fullscreen', label: 'Toggle Fullscreen', keys: isMac ? ['Mod', 'Control', 'F'] : ['F11'], icon: 'maximize', tags: ['window', 'expand', 'toàn màn hình'] },
          { id: 'toggle-toc', label: 'Toggle Table of Contents', keys: ['Mod', 'Alt', 'T'], icon: 'list-tree', requireFile: true, tags: ['outline', 'navigation', 'mục lục'] },
          { id: 'toggle-map', label: 'Toggle Project Map', keys: ['Mod', 'Alt', 'M'], icon: 'map', requireFile: true, tags: ['mini-map', 'overview', 'bản đồ'] }
        ]
      },
      {
        title: 'Publishing',
        items: [
          { id: 'toggle-publish', label: 'Publish Configuration', keys: ['Mod', 'Alt', 'P'], icon: 'globe', requireFile: true, tags: ['live', 'deploy', 'xuất bản'] },
          { id: 'view-live', label: 'View Live Page', keys: ['Mod', 'Alt', 'L'], icon: 'external-link', requireFile: true, tags: ['browser', 'public', 'xem bản live'] },
          { id: 'export-pdf', label: 'Export as PDF', keys: ['Mod', 'Alt', 'D'], icon: 'download', requireFile: true, tags: ['export', 'print', 'xuất pdf'] },
          { id: 'export-html', label: 'Export as HTML', keys: ['Mod', 'Alt', 'H'], icon: 'download', requireFile: true, tags: ['export', 'standalone', 'xuất html'] }
        ]
      },
      {
        title: 'Smart Copy',
        items: [
          { id: 'copy-markdown', label: 'Copy Markdown (Entire File)', keys: ['Mod', 'Shift', 'C'], icon: 'copy', requireFile: true, tags: ['markdown', 'raw', 'sao chép'] },
          { id: 'copy-as-file', label: 'Copy as File', keys: ['Mod', 'Alt', 'C'], icon: 'file-stack', requireFile: true, tags: ['export', 'clip', 'sao chép file'] },
          { id: 'copy-gdocs', label: 'Copy for Google Docs', keys: ['Mod', 'Alt', 'G'], icon: 'file-text', requireFile: true, tags: ['gdoc', 'rich text', 'sao chép gdoc'] }
        ]
      },
      {
        title: 'Editor Actions',
        items: [
          { id: 'import-markdown', label: 'Import Markdown', keys: ['Mod', 'Alt', 'I'], icon: 'folder-input', requireFile: true, tags: ['import', 'load', 'nhập file'] },
          { id: 'append-markdown', label: 'Append Markdown', keys: ['Mod', 'Alt', 'A'], icon: 'plus', requireFile: true, tags: ['append', 'add', 'thêm file'] }
        ]
      },
      {
        title: 'Editor',
        items: [
          { id: 'save-file', label: 'Save File', keys: ['Mod', 'S'], icon: 'save', requireFile: true, tags: ['persist', 'store', 'write', 'lưu'] },
          { id: 'undo', label: 'Undo', keys: ['Mod', 'Z'], icon: 'undo', requireFile: true, tags: ['back', 'reverse', 'quay lại'] },
          { id: 'redo', label: 'Redo', keys: isMac ? ['Mod', 'Shift', 'Z'] : ['Mod', 'Y'], icon: 'redo', requireFile: true, tags: ['forward', 'làm lại'] },
          { id: 'markdown-helper', label: 'Markdown Helper', keys: ['Mod', 'Alt', 'H'], icon: 'help-circle', requireFile: true, tags: ['guide', 'syntax', 'trợ giúp'] }
        ]
      },
      {
        title: 'Tab Management',
        items: [
          { id: 'select-all-tabs', label: 'Select All Tabs', keys: ['Mod', 'A'], icon: 'check-square', tags: ['everything', 'chọn tất cả'] },
          { id: 'close-active-tab', label: 'Close Active Tab', keys: ['Mod', 'W'], icon: 'x', requireFile: true, tags: ['exit', 'remove', 'đóng tab'] },
          { id: 'close-all-tabs', label: 'Close All Tabs', keys: ['Mod', 'Shift', 'W'], icon: 'x', tags: ['exit all', 'clear', 'đóng tất cả'] },
          { id: 'toggle-pin-tab', label: 'Toggle Pin Tab', keys: ['Mod', 'Shift', 'P'], icon: 'pin', requireFile: true, tags: ['sticky', 'keep', 'ghim tab'] },
          { id: 'deselect-tabs', label: 'Deselect Tabs', keys: ['Esc'], icon: 'x', tags: ['clear selection', 'bỏ chọn'] },
          { id: 'range-selection', label: 'Range Selection', keys: ['Shift', 'Click'], isInformative: true, icon: 'mouse-pointer', tags: ['multi', 'bulk'] },
          { id: 'multi-selection', label: 'Multi-selection', keys: ['Mod', 'Click'], isInformative: true, icon: 'mouse-pointer', tags: ['individual', 'bulk'] }
        ]
      },
      {
        title: 'Sidebar & Workspace',
        items: [
          { id: 'new-file', label: 'New File', keys: ['Mod', 'N'], icon: 'file-plus', tags: ['create', 'add', 'tạo file'] },
          { id: 'new-folder', label: 'New Folder', keys: ['Mod', 'Shift', 'N'], icon: 'folder-plus', tags: ['create directory', 'tạo thư mục'] },
          { id: 'rename-selected', label: 'Rename Selected', keys: ['Enter'], icon: 'edit', tags: ['change name', 'đổi tên'] },
          { id: 'duplicate-file', label: 'Duplicate File', keys: ['Mod', 'D'], icon: 'copy', tags: ['clone', 'copy', 'nhân bản'] },
          { id: 'delete-selected', label: 'Delete Selected', keys: isMac ? ['Mod', 'Backspace'] : ['Delete'], icon: 'trash', tags: ['remove', 'bin', 'trash', 'xóa'] },
          { id: 'workspace-picker', label: 'Workspace Picker', keys: ['Mod', 'O'], icon: 'briefcase', tags: ['project', 'folder', 'dự án'] },
          { id: 'hide-unhide', label: 'Hide / Unhide', keys: ['Mod', 'Shift', '.'], icon: 'eye-off', tags: ['dotfiles', 'hidden files', 'ẩn hiện file'] },
          { id: 'collapse-all', label: 'Collapse All Folders', keys: ['Mod', '['], icon: 'chevrons-down-up', tags: ['tidy', 'close all', 'thu gọn'] },
          { id: 'collapse-others', label: 'Collapse Other Folders', keys: ['Mod', 'Shift', '['], icon: 'chevrons-down-up', tags: ['focus', 'thu gọn khác'] }
        ]
      },
      {
        title: 'General',
        items: [
          { id: 'keyboard-shortcuts', label: 'Command Palette', keys: ['Mod', '/'], icon: 'command', requireEditor: true, tags: ['help', 'commands', 'phím tắt'] },
          { id: 'global-shortcuts-search-fallback', label: 'Search App Shortcuts', keys: ['Mod', '/'], icon: 'keyboard', requireNonEditor: true, tags: ['help', 'all shortcuts', 'tìm phím tắt'] },
          { id: 'global-shortcuts-search', label: 'Search App Shortcuts', keys: ['Mod', 'Shift', '/'], icon: 'keyboard', tags: ['help', 'all shortcuts', 'tìm phím tắt'] },
          { id: 'open-settings', label: 'Open Settings', keys: ['Mod', ','], icon: 'settings', tags: ['preferences', 'config', 'cài đặt'] },
          { id: 'close-cancel', label: 'Close / Cancel', keys: ['Esc'], icon: 'x', tags: ['exit', 'hide', 'thoát'] }
        ]
      }
    ];

    // Map 'Mod' to 'Ctrl' or 'Cmd' for display if needed
    // Actually, ShortcutService handles the mapping.
    return data;
  }

  /**
   * Execute a command by ID
   * Delegates to ShortcutService
   */
  static executeAction(id) {
    if (window.ShortcutService) {
      return window.ShortcutService.execute(id);
    }
    return false;
  }

}

// Export for Design System
window.ShortcutsComponent = ShortcutsComponent;
