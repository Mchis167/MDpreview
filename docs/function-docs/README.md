# Function Documentation Index

Tài liệu các module và function quan trọng của MDpreview.

> Xem thêm: `docs/Bug hanofff/markdown_sync_handoff.md` — scroll sync architecture

---

## Modules

| File | Mô tả |
|---|---|
| [CORE_APP.md](CORE_APP.md) | Global state (AppState), loadFile, boot sequence, theme, socket |
| [TABS.md](TABS.md) | Tab management, multi-select, batch close |
| [EDITOR.md](EDITOR.md) | Textarea editor, undo/redo, dirty tracking, save |
| [WORKSPACE.md](WORKSPACE.md) | Workspace CRUD, switching, Electron API integration |
| [TREE.md](TREE.md) | File tree render, sort, search, drag-and-drop, file operations |
| [MARKDOWN_VIEWER.md](MARKDOWN_VIEWER.md) | Mode switching (read/edit/comment/collect), sub-component lifecycle |
| [MENU_SHIELD.md](MENU_SHIELD.md) | Unified floating menu shell — positioning, glassmorphism, singleton |
| [WORKSPACE_SWITCHER.md](WORKSPACE_SWITCHER.md) | Workspace name display molecule trong Sidebar header |
| [EXPLORER_SETTINGS.md](EXPLORER_SETTINGS.md) | Explorer preferences floating menu (show hidden, flat view...) |

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
