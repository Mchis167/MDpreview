# Markdown Viewer Component (`renderer/js/components/organisms/markdown-viewer-component.js`)

> Component trung tâm của màn hình chính. Quản lý chuyển đổi giữa các mode và render sub-component tương ứng.

---

## Kiến trúc

```
MarkdownViewerComponent (mount point: #md-viewer-mount)
├── MarkdownEmptyState     — khi chưa mở file nào
├── MarkdownPreview        — read mode
├── MarkdownEditor         — edit mode
├── CommentsView           — comment mode (delegate sang CommentsModule)
└── CollectView            — collect mode (delegate sang CollectModule)
```

---

## Kiến trúc Layered Viewport

Kể từ phiên bản 2026-04-28, `MarkdownViewer` chuyển sang kiến trúc phân lớp để hỗ trợ các Overlay (như TOC):
- **Scroll Container (`.md-viewer-viewport`)**: Là lớp duy nhất có thuộc tính `overflow-y: auto`. Tất cả nội dung Markdown (Preview/Editor) đều nằm trong lớp này.
- **Fixed Overlays**: Các thành phần như TOC Panel và Scroll-to-Top được mount trực tiếp vào `#md-viewer-mount` với vị trí `absolute`, giúp chúng không bị cuộn theo nội dung văn bản.

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
3. Nếu đổi mode → Toggle hiển thị (`display: none/flex`) giữa Preview và Editor container (Persistent DOM). Không destroy component để bảo toàn scroll position và TOC state.
4. Nếu đổi file → Gọi `reset()` trên các component liên quan và render lại nội dung mới.

### `render()`
Tạo sub-component phù hợp dựa trên `state.mode` và mount vào DOM.

### `_renderFloatingActions()`
Tạo nhóm các nút hành động nổi (Floating Action Group). Bao gồm:
- **Smart Copy (Combo Button)**: Nút "Copy" tích hợp nhiều tùy chọn (Markdown, GDoc, File, Path).
- **TOC Toggle**: Nút mở mục lục.
- **Project Map Toggle**: Nút mở bản đồ tài liệu.

Nhóm này được mount vào `#md-viewer-mount` dưới dạng overlay.

### `_renderFloatingScrollTop()`
Tạo nút "↑ Scroll to top" floating. Hiển thị khi scroll > 300px, ẩn khi gần top.

---

## Smart Copy System

Hệ thống copy nâng cao hỗ trợ xuất nội dung sang các ứng dụng khác:

### 📋 Các tùy chọn Copy
- **Copy Markdown (Main Action)**: Copy nội dung thô (raw content) vào clipboard.
- **Copy for Google Docs**: Chuyển đổi HTML sang định dạng Rich Text có kèm style nhúng (inline) và biểu đồ rasterized chất lượng cao (2x scale). Hỗ trợ hiển thị Progress Bar trong quá trình xử lý.
- **Copy as File**: Sao chép trực tiếp file vật lý vào clipboard (chỉ Electron).
- **Copy File Path**: Sao chép đường dẫn tuyệt đối của file.

### 🔄 Quy trình Copy for Google Docs
1. Trích xuất HTML từ DOM (`.md-content-inner`) để lấy nội dung đã xử lý.
2. Hiển thị **Progress Toast** với định danh `gdoc-copy` để thông báo trạng thái cho người dùng.
3. Gọi `GDocUtil.transform(html, mountNode)` để:
   - Inline CSS cho Table, Code, Quote.
   - Rasterize SVGs (Mermaid) thành ảnh PNG (Retina scale 2.0) một cách tuần tự.
4. Ghi vào Clipboard dưới 2 định dạng: `text/html` (rich text) và `text/plain` (markdown fallback).
5. Sử dụng `window.electronAPI.writeClipboardAdvanced` trên Desktop để vượt qua giới hạn của Browser API.

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
[EditToolbarComponent] ← Managed independently (Organism)
[Textarea]             ← Fixed height, scrollable
```

Gọi `EditorModule.bindToElement(textarea)` sau khi mount. `EditToolbarComponent` được kích hoạt thông qua `MarkdownViewer._setupToolbar()`.

### `activate()` / `deactivate()`
Dùng để kích hoạt hoặc tạm dừng logic Editor khi container được hiển thị/ẩn (Persistent DOM). `activate()` thực hiện bind phím tắt và khôi phục focus.

### `destroy()`
Dọn dẹp triệt để event listeners khi file bị đóng hoàn toàn.

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
SyncService.syncPosition(oldMode, newMode)  ← Đồng bộ scroll/cursor thông minh
        ↓
ScrollModule.savePosition()  ← lưu scroll dự phòng
        ↓
Render new sub-component (if file changed) or Toggle Visibility
        ↓
ScrollModule.restorePosition()  ← khôi phục scroll (nếu cần)
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

*Document — 2026-04-29*
