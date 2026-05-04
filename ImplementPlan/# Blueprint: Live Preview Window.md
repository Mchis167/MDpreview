# Blueprint: Live Preview Window

***

## Tổng quan kiến trúc

```
Main Window (Editor)          Preview Window
┌─────────────────────┐       ┌──────────────────────┐
│ EditorModule        │──IPC──▶ preview.html           │
│ SyncService         │◀──IPC─│ PreviewBridge (mini)  │
│ PreviewService(new) │       │ TOCComponent (reuse)  │
└─────────────────────┘       └──────────────────────┘
        │
   main.js (Electron)
   PreviewWindow (new)
```

***

## Các file cần tạo mới

| File | Vai trò |
|---|---|
| `renderer/js/services/preview-service.js` | Singleton điều phối: debounce, gửi IPC, quản lý state |
| `electron/ipc/preview.js` | IPC handlers phía main process |
| `renderer/preview.html` | HTML shell cho preview window |
| `renderer/js/preview-bridge.js` | Logic nhỏ chạy trong preview window: nhận IPC, render, scroll |

***

## Phase 1 — Core: Live HTML Sync

**`PreviewService`** (main window side):
- Expose `open()`, `close()`, `isOpen()`, `sendUpdate({ html, scrollPct, currentLine, file })`
- Debounce 300ms trước khi gửi
- Lắng nghe `EditorModule.onChange` → trigger `sendUpdate`
- Khi file thay đổi → gửi luôn không debounce

**`electron/ipc/preview.js`**:
- `preview:open` → tạo `BrowserWindow`, nhớ position/size qua `electron-store`
- `preview:close` → destroy window
- `preview:update` → `previewWin.webContents.send('preview:update', data)`
- `preview:from-preview` → nhận data từ preview window, forward về main window

**`preview.html`**:
- Load lại toàn bộ CSS của read mode (`markdown-content.css`, `tokens.css`, `toc-panel.css`…)
- Có một toolbar nhỏ ở trên: tên file, toggle scroll sync, nút close
- Mount point `#md-content` và `#toc-mount`

**`PreviewBridge`** (preview window side):
- Nhận `preview:update` → set `innerHTML` của `#md-content`
- Re-init TOCComponent sau mỗi update
- Nếu scroll sync đang bật → `scrollTo(scrollPct * scrollHeight)`

***

## Phase 2 — Scroll Sync + Typing Highlight

**Scroll sync (Editor → Preview)**:
- `EditorModule` on scroll → `PreviewService.sendScrollUpdate({ scrollPct, currentLine })`
- Tách riêng channel `preview:scroll` để không lẫn với HTML update
- Toggle state lưu trong `PreviewService.scrollSyncEnabled` (persist `electron-store`)

**Typing line highlight**:
- `EditorModule` on cursor move → gửi `preview:highlight-line({ line })`
- `PreviewBridge` nhận → tìm `[data-line="${line}"]` → add class `is-preview-active`
- CSS: `.is-preview-active { background: var(--highlight-subtle); transition: background 0.2s }`
- Remove class cũ trước khi add mới

***

## Phase 3 — Bidirectional Context Actions

**"Show in Preview" (Editor → Preview)**:
- Thêm item vào context menu của `MarkdownViewerComponent` khi edit mode + `PreviewService.isOpen()`
- Lấy selection qua `SyncService.captureEditorSyncData()`
- Gửi `preview:scroll-to({ line, selectionText })`
- `PreviewBridge` nhận → scroll + flash highlight đoạn đó

**"Show in Editor" (Preview → Editor)**:
- `PreviewBridge` lắng nghe `mouseup` → lấy selection text + tìm `data-line` gần nhất
- Hiện context menu nhỏ (native hoặc custom) với "Show in Editor"
- Gửi `preview:from-preview` với `{ selectionText, line }`
- Main window nhận → nếu đang edit mode: `EditorModule.focusWithContext({ line, selectionText })`
- Nếu đang read mode: switch sang edit rồi focus (dùng flow `SyncService` hiện có)

***

## State & Edge Cases cần xử lý

| Case | Xử lý |
|---|---|
| Preview window bị user đóng tay | Lắng nghe `closed` event → `PreviewService.onWindowClosed()` |
| Switch file trong khi preview đang mở | Gửi update ngay lập tức kèm tên file mới cho toolbar |
| App đóng trong khi preview còn mở | `BrowserWindow` tự destroy theo main window |
| Chưa mở preview, trigger "Show in Preview" | `PreviewService.open()` trước → chờ `did-finish-load` → rồi mới gửi scroll |
| Web mode (không có Electron) | `PreviewService` dùng `window.open()` + `BroadcastChannel` thay vì IPC |

***

## Thứ tự implement

1. **Phase 1** — `PreviewWindow` + IPC + `preview.html` + live HTML sync
2. **Scroll sync toggle** — thêm vào Phase 1 ngay vì rất nhỏ
3. **Typing highlight** — 1 buổi, làm sau Phase 1
4. **"Show in Preview"** — wire vào context menu hiện có
5. **"Show in Editor"** — làm cuối, cần test kỹ IPC ngược chiều