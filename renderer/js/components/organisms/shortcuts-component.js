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
  static getShortcutData(isMac) {
    return [
      {
        title: 'Navigation',
        items: [
          { id: 'mode-read', label: 'Switch to Read mode', keys: ['1'], icon: 'book-open', tags: ['view', 'preview', 'display', 'xem'] },
          { id: 'mode-edit', label: 'Switch to Edit mode', keys: ['2'], icon: 'pen-line', tags: ['write', 'editor', 'sửa'] },
          { id: 'mode-comment', label: 'Switch to Comment mode', keys: ['3'], icon: 'message-circle', tags: ['feedback', 'review', 'chú thích', 'góp ý'] },
          { id: 'mode-collect', label: 'Switch to Collect mode', keys: ['4'], icon: 'bookmark', tags: ['save', 'bookmark', 'favorite', 'thu thập'] },
          { id: 'toggle-sidebar', label: 'Toggle Sidebar', keys: ['Ctrl', 'B'], icon: 'sidebar', tags: ['menu', 'folders', 'explorer', 'ẩn hiện'] },
          { id: 'focus-search', label: 'Focus Search', keys: ['Ctrl', 'F'], icon: 'search', tags: ['find', 'palette', 'tìm kiếm'] },
          { id: 'scroll-top', label: 'Scroll to Top', keys: ['Ctrl', '↑'], icon: 'arrow-up', tags: ['up', 'start', 'lên đầu'] },
          { id: 'scroll-bottom', label: 'Scroll to Bottom', keys: ['Ctrl', '↓'], icon: 'arrow-down', tags: ['down', 'end', 'xuống cuối'] },
          { id: 'toggle-fullscreen', label: 'Toggle Fullscreen', keys: isMac ? ['Ctrl', 'Shift', 'F'] : ['F11'], icon: 'maximize', tags: ['window', 'expand', 'toàn màn hình'] }
        ]
      },
      {
        title: 'Editor',
        items: [
          { id: 'save-file', label: 'Save File', keys: ['Ctrl', 'S'], icon: 'save', tags: ['persist', 'store', 'write', 'lưu'] },
          { id: 'undo', label: 'Undo', keys: ['Ctrl', 'Z'], icon: 'undo', tags: ['back', 'reverse', 'quay lại'] },
          { id: 'redo', label: 'Redo', keys: ['Ctrl', 'Y'], icon: 'redo', tags: ['forward', 'làm lại'] },
          { id: 'markdown-helper', label: 'Markdown Helper', keys: ['Ctrl', 'H'], icon: 'help-circle', tags: ['guide', 'syntax', 'trợ giúp'] }
        ]
      },
      {
        title: 'Tab Management',
        items: [
           { id: 'select-all-tabs', label: 'Select All Tabs', keys: ['Ctrl', 'A'], icon: 'check-square', tags: ['everything', 'chọn tất cả'] },
           { id: 'close-active-tab', label: 'Close Active Tab', keys: ['Ctrl', 'W'], icon: 'x', tags: ['exit', 'remove', 'đóng tab'] },
           { id: 'close-all-tabs', label: 'Close All Tabs', keys: ['Ctrl', 'Shift', 'W'], icon: 'x', tags: ['exit all', 'clear', 'đóng tất cả'] },
           { id: 'toggle-pin-tab', label: 'Toggle Pin Tab', keys: ['Ctrl', 'Shift', 'P'], icon: 'pin', tags: ['sticky', 'keep', 'ghim tab'] },
           { id: 'deselect-tabs', label: 'Deselect Tabs', keys: ['Esc'], icon: 'x', tags: ['clear selection', 'bỏ chọn'] },
           { id: 'range-selection', label: 'Range Selection', keys: ['Shift', 'Click'], isInformative: true, icon: 'mouse-pointer', tags: ['multi', 'bulk'] },
           { id: 'multi-selection', label: 'Multi-selection', keys: ['Ctrl', 'Click'], isInformative: true, icon: 'mouse-pointer', tags: ['individual', 'bulk'] }
         ]
       },
      {
        title: 'Sidebar & Workspace',
        items: [
          { id: 'new-file', label: 'New File', keys: ['Ctrl', 'N'], icon: 'file-plus', tags: ['create', 'add', 'tạo file'] },
          { id: 'new-folder', label: 'New Folder', keys: ['Ctrl', 'Shift', 'N'], icon: 'folder-plus', tags: ['create directory', 'tạo thư mục'] },
          { id: 'rename-selected', label: 'Rename Selected', keys: ['Enter'], icon: 'edit', tags: ['change name', 'đổi tên'] },
          { id: 'duplicate-file', label: 'Duplicate File', keys: ['Ctrl', 'D'], icon: 'copy', tags: ['clone', 'copy', 'nhân bản'] },
          { id: 'delete-selected', label: 'Delete Selected', keys: isMac ? ['Ctrl', 'Backspace'] : ['Delete'], icon: 'trash', tags: ['remove', 'bin', 'trash', 'xóa'] },
           { id: 'workspace-picker', label: 'Workspace Picker', keys: ['Ctrl', 'O'], icon: 'briefcase', tags: ['project', 'folder', 'dự án'] },
           { id: 'hide-unhide', label: 'Hide / Unhide', keys: ['Ctrl', 'Shift', 'H'], icon: 'eye-off', tags: ['dotfiles', 'hidden files', 'ẩn hiện file'] },
           { id: 'collapse-all', label: 'Collapse All Folders', keys: ['Ctrl', '['], icon: 'chevrons-down-up', tags: ['tidy', 'close all', 'thu gọn'] },
           { id: 'collapse-others', label: 'Collapse Other Folders', keys: ['Ctrl', 'Shift', '['], icon: 'chevrons-down-up', tags: ['focus', 'thu gọn khác'] }
         ]
       },
      {
        title: 'General',
        items: [
          { id: 'keyboard-shortcuts', label: 'Keyboard Shortcuts', keys: ['Ctrl', '/'], icon: 'keyboard', tags: ['help', 'commands', 'phím tắt'] },
          { id: 'open-settings', label: 'Open Settings', keys: ['Ctrl', ','], icon: 'settings', tags: ['preferences', 'config', 'cài đặt'] },
          { id: 'close-cancel', label: 'Close / Cancel', keys: ['Esc'], icon: 'x', tags: ['exit', 'hide', 'thoát'] }
        ]
      }
    ];
  }


  /**
   * Execute a command by ID
   */
  static executeAction(id) {
    if (!id) return;
    
    // Mapping IDs to actual actions
    const actions = {
      'mode-read': () => document.querySelector('.ds-segment-item[data-mode="read"]')?.click(),
      'mode-edit': () => document.querySelector('.ds-segment-item[data-mode="edit"]')?.click(),
      'mode-comment': () => document.querySelector('.ds-segment-item[data-mode="comment"]')?.click(),
      'mode-collect': () => document.querySelector('.ds-segment-item[data-mode="collect"]')?.click(),
      'toggle-sidebar': () => document.getElementById('sidebar-toggle-btn')?.click(),
      'focus-search': () => window.SearchPalette?.show(),
      'scroll-top': () => document.getElementById('md-viewer-mount')?.scrollTo({ top: 0, behavior: 'smooth' }),
      'scroll-bottom': () => {
        const v = document.getElementById('md-viewer-mount');
        if (v) v.scrollTo({ top: v.scrollHeight, behavior: 'smooth' });
      },
      'toggle-fullscreen': () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
      },
      'save-file': () => window.EditorModule?.save(),
      'undo': () => {
        // Assume Monaco or textarea undo - for now we trigger a dummy save to ensure consistency
        // but real undo depends on focused element
        document.execCommand('undo');
      },
      'redo': () => document.execCommand('redo'),
      'markdown-helper': () => window.MarkdownHelperComponent?.open(),
      'select-all-tabs': () => window.TabsModule?.selectAll(),
      'close-active-tab': () => {
        const active = window.TabsModule?.getActive();
        if (active) window.TabsModule.remove(active);
      },
      'close-all-tabs': () => window.TabsModule?.closeAll(),
      'toggle-pin-tab': () => {
        const active = window.TabsModule?.getActive();
        if (active) window.TabsModule.togglePin(active);
      },
      'deselect-tabs': () => window.TabsModule?.deselectAll(),
      'new-file': () => {
        const btn = document.querySelector('[data-action-id="new-file"]');
        if (btn) btn.click();
        else {
           // Fallback if button not found, use TreeModule directly if available
           if (window.TreeModule) window.TreeModule.createNewFile();
        }
      },
      'new-folder': () => {
         if (window.TreeModule) window.TreeModule.createNewFolder();
      },
      'rename-selected': () => {
         // This usually happens on Enter in tree, hard to trigger without selection
      },
      'duplicate-file': () => {
         // Logic for duplicate
      },
      'delete-selected': () => {
         if (window.TreeModule) window.TreeModule.deleteSelected();
      },
      'workspace-picker': () => document.getElementById('workspace-switcher')?.click(),
      'hide-unhide': () => {
         if (window.TreeModule) window.TreeModule.toggleHiddenItems();
      },
      'collapse-all': () => {
         if (window.TreeModule) window.TreeModule.collapseAll();
      },
      'collapse-others': () => {
         if (window.TreeModule) window.TreeModule.collapseOthers();
      },
      'keyboard-shortcuts': () => window.SearchPalette?.show('shortcut'),
      'open-settings': () => window.SettingsComponent?.toggle(),
      'close-cancel': () => {
         if (window.SearchPalette) window.SearchPalette.hide();
         if (window.SettingsComponent) window.SettingsComponent.hide();
      }
    };

    if (actions[id]) {
      actions[id]();
      return true;
    }
    return false;
  }

}

// Export for Design System
window.ShortcutsComponent = ShortcutsComponent;
