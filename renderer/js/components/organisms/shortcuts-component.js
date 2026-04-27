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
          { id: 'mode-read', label: 'Switch to Read mode', keys: ['1'], icon: 'book-open', tags: ['view', 'preview', 'display', 'xem'] },
          { id: 'mode-edit', label: 'Switch to Edit mode', keys: ['2'], icon: 'pen-line', tags: ['write', 'editor', 'sửa'] },
          { id: 'mode-comment', label: 'Switch to Comment mode', keys: ['3'], icon: 'message-circle', tags: ['feedback', 'review', 'chú thích', 'góp ý'] },
          { id: 'mode-collect', label: 'Switch to Collect mode', keys: ['4'], icon: 'bookmark', tags: ['save', 'bookmark', 'favorite', 'thu thập'] },
          { id: 'toggle-sidebar', label: 'Toggle Sidebar', keys: ['Mod', 'B'], icon: 'sidebar', tags: ['menu', 'folders', 'explorer', 'ẩn hiện'] },
          { id: 'focus-search', label: 'Focus Search', keys: ['Mod', 'P'], icon: 'search', tags: ['find', 'palette', 'tìm kiếm'] },
          { id: 'scroll-top', label: 'Scroll to Top', keys: ['Mod', '↑'], icon: 'arrow-up', tags: ['up', 'start', 'lên đầu'] },
          { id: 'scroll-bottom', label: 'Scroll to Bottom', keys: ['Mod', '↓'], icon: 'arrow-down', tags: ['down', 'end', 'xuống cuối'] },
          { id: 'toggle-fullscreen', label: 'Toggle Fullscreen', keys: isMac ? ['Mod', 'Shift', 'F'] : ['F11'], icon: 'maximize', tags: ['window', 'expand', 'toàn màn hình'] }
        ]
      },
      {
        title: 'Editor',
        items: [
          { id: 'save-file', label: 'Save File', keys: ['Mod', 'S'], icon: 'save', tags: ['persist', 'store', 'write', 'lưu'] },
          { id: 'undo', label: 'Undo', keys: ['Mod', 'Z'], icon: 'undo', tags: ['back', 'reverse', 'quay lại'] },
          { id: 'redo', label: 'Redo', keys: ['Mod', 'Y'], icon: 'redo', tags: ['forward', 'làm lại'] },
          { id: 'markdown-helper', label: 'Markdown Helper', keys: ['Mod', 'H'], icon: 'help-circle', tags: ['guide', 'syntax', 'trợ giúp'] }
        ]
      },
      {
        title: 'Tab Management',
        items: [
           { id: 'select-all-tabs', label: 'Select All Tabs', keys: ['Mod', 'A'], icon: 'check-square', tags: ['everything', 'chọn tất cả'] },
           { id: 'close-active-tab', label: 'Close Active Tab', keys: ['Mod', 'W'], icon: 'x', tags: ['exit', 'remove', 'đóng tab'] },
           { id: 'close-all-tabs', label: 'Close All Tabs', keys: ['Mod', 'Shift', 'W'], icon: 'x', tags: ['exit all', 'clear', 'đóng tất cả'] },
           { id: 'toggle-pin-tab', label: 'Toggle Pin Tab', keys: ['Mod', 'Shift', 'P'], icon: 'pin', tags: ['sticky', 'keep', 'ghim tab'] },
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
           { id: 'hide-unhide', label: 'Hide / Unhide', keys: ['Mod', 'Shift', 'H'], icon: 'eye-off', tags: ['dotfiles', 'hidden files', 'ẩn hiện file'] },
           { id: 'collapse-all', label: 'Collapse All Folders', keys: ['Mod', '['], icon: 'chevrons-down-up', tags: ['tidy', 'close all', 'thu gọn'] },
           { id: 'collapse-others', label: 'Collapse Other Folders', keys: ['Mod', 'Shift', '['], icon: 'chevrons-down-up', tags: ['focus', 'thu gọn khác'] }
         ]
       },
      {
        title: 'General',
        items: [
          { id: 'keyboard-shortcuts', label: 'Keyboard Shortcuts', keys: ['Mod', '/'], icon: 'keyboard', tags: ['help', 'commands', 'phím tắt'] },
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
