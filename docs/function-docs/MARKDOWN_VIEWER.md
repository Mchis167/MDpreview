# Markdown Viewer Component (`renderer/js/components/organisms/markdown-viewer-component.js`)

> Component trung tâm của màn hình chính. Quản lý chuyển đổi giữa các mode và render sub-component tương ứng.

---

## Kiến trúc

```
MarkdownViewerComponent (container)
├── MarkdownEmptyState     — khi chưa mở file nào
├── MarkdownPreview        — read mode
├── MarkdownEditor         — edit mode
├── CommentsView           — comment mode (delegate sang CommentsModule)
└── CollectView            — collect mode (delegate sang CollectModule)
```

---

## MarkdownViewerComponent

### `setState(newState)`
Hàm chính — được gọi để thay đổi file hoặc mode đang hiển thị.

```js
MarkdownViewer.setState({
  file: '/path/to/file.md',
  mode: 'read',         // 'read' | 'edit' | 'comment' | 'collect'
  content: '...',       // raw markdown
  html: '...',          // rendered HTML
})
```

Logic bên trong:
1. So sánh `newState` với state cũ để detect thay đổi
2. Nếu chỉ thay đổi content (không đổi mode/file) → gọi `update()` để patch DOM thay vì render lại toàn bộ
3. Nếu đổi mode hoặc file → destroy component cũ → render component mới
4. Lưu scroll position trước khi destroy (qua ScrollModule)

### `render()`
Tạo sub-component phù hợp dựa trên `state.mode` và mount vào DOM.

### `_renderFloatingScrollTop()`
Tạo nút "↑ Scroll to top" floating. Hiển thị khi scroll > 300px, ẩn khi gần top.

---

## MarkdownPreview (read mode)

### `render()`
Render HTML preview:
1. Set `innerHTML` với HTML đã được render từ server
2. Chạy Mermaid.init() cho các diagram block
3. Highlight syntax code block (Prism/highlight.js)
4. Wrap table để hỗ trợ horizontal scroll
5. Khôi phục scroll position từ ScrollModule

Tất cả post-processing (mermaid, code) chạy trong `requestAnimationFrame` để tránh layout thrashing.

### `update({ html })`
Patch HTML khi content thay đổi mà không đổi mode — tránh re-mount và mất scroll position.

---

## MarkdownEditor (edit mode)

### `render()`
Render editor layout:
```
[Toolbar]
[Textarea]
[Save] [Cancel]
```

Gọi `EditorModule.bindToElement(textarea)` sau khi mount.

### `_createToolbar()`
Tạo toolbar với các group:
- **Typography**: heading, bold, italic, strikethrough
- **Content**: link, image, quote, divider
- **Lists**: bullet list, numbered list, checkbox
- **Advanced**: code inline, code block, table
- **Actions**: markdown helper, word count

### `destroy()`
Gọi `EditorModule.unbind()` để dọn dẹp event listeners trước khi component bị remove.

---

## Mode Switching Flow

```
User clicks mode button
        ↓
AppState.onModeChange(newMode)
        ↓
   Dirty check (EditorModule.isDirty())
        ↓ (pass)
AppState.currentMode = newMode
        ↓
MarkdownViewer.setState({ mode: newMode })
        ↓
ScrollModule.savePosition()  ← lưu scroll trước khi switch
        ↓
Destroy old sub-component
        ↓
Render new sub-component
        ↓
ScrollModule.restorePosition()  ← khôi phục scroll
```

---

## Singleton Pattern cho Global UI Components

`ShortcutsComponent` và `SettingsComponent` — được hiển thị từ Sidebar footer — đều triển khai Singleton Pattern:

```js
// Entry point duy nhất từ bên ngoài:
ShortcutsComponent.toggle()   // mở hoặc đóng
SettingsComponent.toggle()    // mở hoặc đóng

// Kiểm tra đang mở không:
ShortcutsComponent.activeInstance  // → instance | null
SettingsComponent.activeInstance   // → instance | null
```

Mỗi component tự nullify `activeInstance` qua `onClose` callback khi bị đóng — bằng bất kỳ cách nào (Escape, click-outside, gọi lại toggle). Phía gọi (Toolbar, Sidebar) **không được** tự lưu biến `isOpen`.

> Xem [`docs/decisions/20260426-singleton-ui-pattern.md`](../decisions/20260426-singleton-ui-pattern.md)

---

## Lưu ý quan trọng

- **Không gọi `setState()` trực tiếp** từ bên ngoài — luôn dùng `loadFile()` hoặc `AppState.onModeChange()` để đảm bảo dirty check chạy
- Mermaid render là **async** — scroll position có thể bị lệch sau khi diagram render xong (xem `docs/Bug hanofff/markdown_sync_handoff.md`)
- `isRendering` flag được set trong lúc render để suppress scroll events nhiễu

---

*Document — 2026-04-26*
