# Function Documentation Index

Tài liệu các module và function quan trọng của MDpreview.

> Xem thêm: `docs/Bug hanofff/markdown_sync_handoff.md` — scroll sync architecture

---

## Modules

| File | Mô tả |
|---|---|
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Centralized UI factory (Buttons, Segmented Control, Radius logic) |
| [CORE_APP.md](CORE_APP.md) | Global state (AppState), loadFile, boot sequence, theme, socket |
| [TABS.md](TABS.md) | Tab management, multi-select, batch close |
| [EDITOR.md](EDITOR.md) | Textarea editor, undo/redo, dirty tracking, save |
| [WORKSPACE.md](WORKSPACE.md) | Workspace CRUD, switching, Electron API integration |
| [TREE.md](TREE.md) | File tree render, sort, search, drag-and-drop, file operations |
| [SHORTCUT_SERVICE.md](SHORTCUT_SERVICE.md) | Hệ thống quản lý phím tắt tập trung (Service) |
| [SHORTCUTS_COMPONENT.md](SHORTCUTS_COMPONENT.md) | Registry định nghĩa toàn bộ phím tắt và hành động |
| [MARKDOWN_VIEWER.md](MARKDOWN_VIEWER.md) | Mode switching (read/edit/comment/collect), sub-component lifecycle |
| [MENU_SHIELD.md](MENU_SHIELD.md) | Unified floating menu shell — positioning, glassmorphism, singleton |
| [WORKSPACE_SWITCHER.md](WORKSPACE_SWITCHER.md) | Workspace name display molecule trong Sidebar header |
| [EXPLORER_SETTINGS.md](EXPLORER_SETTINGS.md) | Explorer preferences floating menu (show hidden, flat view...) |
| [SETTINGS_SERVICE.md](SETTINGS_SERVICE.md) | Quản lý cài đặt tập trung |
| [SHORTCUTS.md](SHORTCUTS.md) | Quản lý và thực thi phím tắt toàn cục |
| [TREE_DRAG_MANAGER.md](TREE_DRAG_MANAGER.md) | Engine kéo thả Sidebar (Alphabet & VIP) |
| [SETTINGS_COMPONENT.md](SETTINGS_COMPONENT.md) | Bảng giao diện cài đặt toàn cục dạng Floating Popover |
| [SIDEBAR_LEFT.md](SIDEBAR_LEFT.md) | Organism quản lý khung giao diện thanh bên trái (Explorer, Search, Footer) |
| [SCROLL_CONTAINER.md](SCROLL_CONTAINER.md) | Molecule quản lý vùng cuộn thông minh với mask-fade và dynamic safe zone |
| [RECENTLY_VIEWED.md](RECENTLY_VIEWED.md) | Quản lý lịch sử tập tin vừa mở và hiển thị indicator ẩn |
| [SEARCH_PALETTE.md](SEARCH_PALETTE.md) | Tìm kiếm nhanh toàn cục (Quick Open) với Debounce, Smart Path và Recent Files |
| [SEARCH_SERVICE.md](SEARCH_SERVICE.md) | Bộ não fuzzy search và scoring engine hỗ trợ tìm kiếm file/folder |
| [TAB_BAR_COMPONENT.md](TAB_BAR_COMPONENT.md) | Organism quản lý thanh Tab (drag & drop, context menu) |
| [TAB_PREVIEW.md](TAB_PREVIEW.md) | Hover Preview với Render Window strategy và Glassmorphism |
| [EDIT_TOOLBAR.md](EDIT_TOOLBAR.md) | Thanh công cụ soạn thảo dàn trải với phân cấp Header H1-H6 |

---

## Luồng dữ liệu chính

```
User action
    ↓
keyboard shortcut / click
    ↓
Module function (Tabs, Tree, Workspace...)
    ↓
AppState update
    ↓
loadFile() hoặc onModeChange()
    ↓
MarkdownViewer.setState()
    ↓
Sub-component render
```

---

## Dirty Check Pattern

Trước bất kỳ thao tác nào có thể mất dữ liệu (đổi file, đổi workspace), hệ thống luôn check:

```js
if (EditorModule.isDirty()) {
  // hiện dialog → user chọn Save / Discard / Cancel
}
```

Áp dụng tại: `loadFile()`, `WorkspaceModule.switchTo()`, `TabsModule.remove()`, `AppState.onModeChange()`.
