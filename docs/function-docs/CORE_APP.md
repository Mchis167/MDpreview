# Core App (`renderer/js/core/app.js`)

> Điểm khởi động toàn bộ ứng dụng. Quản lý global state, file loading, theme, socket và boot sequence.

---

## AppState — Global State Object

`window.AppState` là nguồn sự thật duy nhất (single source of truth) của toàn app.

| Property | Type | Mô tả |
|---|---|---|
| `currentFile` | `string \| null` | Đường dẫn file đang mở |
| `currentWorkspace` | `object \| null` | Workspace đang active |
| `currentMode` | `string` | Mode hiện tại: `read`, `edit`, `comment`, `collect` |
| `commentMode` | `string` | Sub-mode cho comment: `view`, `add` |
| `settings` | `object` | Theme, font, zoom, các tùy chọn explorer |
| `forceSyncContext` | `object \| null` | Dữ liệu vị trí ép buộc dùng cho SyncService (dùng khi Edit Selection) |

### `AppState.loadPersistentState()`
Fetch state từ server (`GET /api/state`) và đồng bộ vào localStorage. Được gọi khi app khởi động.
Trong quá trình boot, app có cơ chế **Self-Healing** (Tự phục hồi): nếu dữ liệu cấu hình trong localStorage bị hỏng (parse JSON thất bại), app sẽ tự động fallback về cấu trúc mặc định an toàn thay vì crash.

### `AppState.savePersistentState()`
Debounced 500ms — POST toàn bộ state lên server. Được gọi sau mỗi thay đổi quan trọng.

### `AppState._getStorageKey(key)`
Delegate việc tìm kiếm storage key sang **`SettingsService.getStorageKey(key)`**. Đây là cơ chế duy nhất để xác định key lưu trữ, đảm bảo tính nhất quán giữa State và Persistence.

### `AppState.onModeChange(mode, targetId?)`
Xử lý chuyển mode với dirty check:
1. Nếu editor đang dirty → hiện dialog xác nhận
2. Nếu chuyển sang `edit` → tạo draft nếu chưa có
3. Cập nhật `AppState.currentMode` và re-render `MarkdownViewer`

### `AppState.getFileViewMode(path)` / `setFileViewMode(path, mode)`
Lưu/đọc mode riêng biệt cho từng file trong localStorage. Dùng để khôi phục mode khi mở lại file.

---

## `loadFile(filePath, options = {})`

Hàm trung tâm — được gọi mỗi khi người dùng mở một file.

**Flow:**
1. **Dirty check** — Nếu file hiện tại đang có chỉnh sửa chưa lưu → hỏi người dùng. **Quan trọng**: Bước này hiện được thực hiện trươc khi thay đổi bất kỳ trạng thái UI nào (như hiện skeleton).
2. **Race condition guard** — Dùng "ticket" để hủy load cũ nếu người dùng bấm file khác nhanh.
3. **Skeleton state** — Hiển thị loading skeleton trong khi fetch (trừ khi `options.silent = true`).
4. **Fetch content** — `GET /api/file?path=...`
5. **Draft check** — Nếu có draft → load draft thay vì file gốc.
6. **Render** — Gọi `MarkdownViewer.setState()` với content và mode.
7. **Side effects** — Load comments, collect items, highlight tree, cập nhật trạng thái Tab.

**Tham số `options`:**
- `silent`: Nếu `true`, bỏ qua việc hiển thị skeleton. Dùng cho các bản cập nhật nội dung ngầm (socket `file-changed`).
- `force`: Buộc tải lại ngay cả khi file đang active.

**Quan trọng:** Luôn dùng `loadFile()` thay vì gọi `MarkdownViewer.setState()` trực tiếp để đảm bảo dirty check và side effects chạy đúng.

---

## `initSocket()`

Kết nối Socket.IO tới server để nhận real-time events:

| Event | Hành động |
|---|---|
| `file-changed` | Reload file nếu đang mở (dùng silent load để tránh flash skeleton) |
| `tree-changed` | Reload file tree |
| `file-deleted` | Đóng tab nếu đang mở |
| `workspace-changed` | Đồng bộ workspace |

---

## `showToast(message, type, options = {})`

Hiển thị toast notification (mặc định tự ẩn sau 4 giây).
- `type`: `success`, `error`, `warn`, `info`.
- `options`:
    - `id`: Định danh để cập nhật nội dung toast đang hiển thị thay vì tạo mới.
    - `sticky`: Nếu `true`, toast sẽ không tự động ẩn.
    - `progress`: Giá trị từ 0-1 để hiển thị thanh tiến trình (progress bar).

---

## Global Keyboard Shortcuts (`ShortcutService`)

Các phím tắt toàn cục được quản lý tập trung qua `ShortcutService`. Tại `app.js`, ứng dụng định nghĩa các handler thực thi và đăng ký chúng với Service:

| Shortcut | ID Hành động | Logic thực thi |
|---|---|---|
| **Mod+,** | `open-settings` | `SettingsComponent.toggle()` |
| **Mod+/** | `keyboard-shortcuts` | `ShortcutsComponent.toggle()` |
| **Mod+P** | `focus-search` | `SearchPalette.show()` |
| **Mod+O** | `workspace-picker` | `WorkspaceModule.openPanel()` |
| **Mod+S** | `save-file` | `EditorModule.save()` |
| **Mod+B** | `toggle-sidebar` | `TabsModule.toggleSidebar()` |
| **Mod+W** | `close-active-tab` | `TabsModule.closeSelected()` |
| **Mod+A** | `select-all-tabs` | `TabsModule.selectAll()` |
| **1 / 2 / 3 / 4** | `mode-X` | `AppState.onModeChange(mode)` |
| **Mod+Alt+I** | `import-markdown` | Mở dialog chọn file để ghi đè nội dung hiện tại |
| **Mod+Alt+A** | `append-markdown` | Mở dialog chọn file để nối thêm vào cuối nội dung |

> **Cơ chế:** Phím tắt được đánh chặn sớm ở **Capture Phase**. Khi người dùng đang gõ văn bản, chỉ các phím kết hợp với `Mod` hoặc `Alt` mới được thực thi để tránh xung đột với việc nhập liệu. Xem [`SHORTCUT_SERVICE.md`](SHORTCUT_SERVICE.md).

---

## Boot Sequence (DOMContentLoaded)

Thứ tự khởi động nghiêm ngặt — **không thay đổi thứ tự**:

```
1. AppState.loadPersistentState()   — Load state từ server
2. SettingsService.applyTheme()      — Cập nhật CSS variables từ SettingsService
3. SearchPalette.init()              — Khởi tạo registry tìm kiếm (SearchPalette.js)
4. SidebarLeft.init()                — Khởi tạo sidebar trái
5. ChangeActionViewBar.init()        — Khởi tạo sync bar
6. RightSidebar.init()               — Khởi tạo sidebar phải
7. initSocket()                      — Kết nối socket
8. Mermaid.init()                    — Khởi tạo renderer diagram
9. DraftModule.init()                — Load drafts
10. MarkdownViewer.init()            — Khởi tạo viewer
11. ScrollModule.init()              — Khởi tạo scroll sync
12. TabPreview.init()                — Khởi tạo hover preview (molecules/tab-preview.js)
13. TabsModule.init()                — Khởi tạo tabs
14. setTimeout(0): Tree + Workspace  — Defer để DOM ổn định
```

---

*Document — 2026-04-29 (Updated showToast features)*
