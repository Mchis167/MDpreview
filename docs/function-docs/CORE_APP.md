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

## `loadFile(filePath)`

Hàm trung tâm — được gọi mỗi khi người dùng mở một file.

**Flow:**
1. **Dirty check** — Nếu file hiện tại đang có chỉnh sửa chưa lưu → hỏi người dùng
2. **Race condition guard** — Dùng "ticket" để hủy load cũ nếu người dùng bấm file khác nhanh
3. **Skeleton state** — Hiển thị loading skeleton trong khi fetch
4. **Fetch content** — `GET /api/file?path=...`
5. **Draft check** — Nếu có draft → load draft thay vì file gốc
6. **Render** — Gọi `MarkdownViewer.setState()` với content và mode
7. **Side effects** — Load comments, collect items, cập nhật toolbar, highlight tree

**Quan trọng:** Luôn dùng `loadFile()` thay vì gọi `MarkdownViewer.setState()` trực tiếp để đảm bảo dirty check và side effects chạy đúng.

---

## `initSocket()`

Kết nối Socket.IO tới server để nhận real-time events:

| Event | Hành động |
|---|---|
| `file-changed` | Reload file nếu đang mở |
| `tree-changed` | Reload file tree |
| `file-deleted` | Đóng tab nếu đang mở |
| `workspace-changed` | Đồng bộ workspace |

---

## `showToast(message, type)`

Hiển thị toast notification tự ẩn sau 4 giây. `type` có thể là `success`, `error`, `info`.

---

## Global Keyboard Shortcuts (`toolbar.js` — `initGlobalShortcuts()`)

Các shortcut ở cấp app được đăng ký tập trung tại `toolbar.js`. Sau refactor, toolbar **không còn tự quản lý state** của Settings/Shortcuts — chỉ delegate sang component tương ứng:

| Shortcut | Hành động |
|---|---|
| **Mod+,** | `SettingsComponent.toggle()` |
| **Mod+/** | `ShortcutsComponent.toggle()` |
| **Mod+F** | Focus search |
| **Mod+O** | `WorkspaceModule.openPanel()` |
| **Mod+S** | Save file |
| **Mod+B** | Toggle left sidebar |
| **Mod+W** | Đóng tab active / selected |
| **Mod+Shift+W** | Đóng tất cả tab |
| **Mod+A** | Select all tabs |
| **Mod+↑/↓** | Scroll to top/bottom |
| **1/2/3/4** | Chuyển mode read/edit/comment/collect |
| **Mod+[** | Collapse All Folders (Sidebar) |
| **Shift+Mod+[** | Collapse Other Folders (Sidebar) |
| **F11 / Cmd+Ctrl+F** | Fullscreen toggle |

> Phía gọi (toolbar) không được tự lưu biến `isOpen` cho Settings hay Shortcuts — toàn bộ state do component tự quản lý qua Singleton Pattern. Xem [`docs/decisions/20260426-singleton-ui-pattern.md`](../decisions/20260426-singleton-ui-pattern.md).

---

## Boot Sequence (DOMContentLoaded)

Thứ tự khởi động nghiêm ngặt — **không thay đổi thứ tự**:

```
1. AppState.loadPersistentState()   — Load state từ server
2. SettingsService.applyTheme()      — Cập nhật CSS variables từ SettingsService
3. SidebarLeft.init()                — Khởi tạo sidebar trái
4. ChangeActionViewBar.init()        — Khởi tạo sync bar
5. RightSidebar.init()               — Khởi tạo sidebar phải
6. initSocket()                      — Kết nối socket
7. Mermaid.init()                    — Khởi tạo renderer diagram
8. DraftModule.init()                — Load drafts
9. MarkdownViewer.init()            — Khởi tạo viewer
10. ScrollModule.init()              — Khởi tạo scroll sync
11. TabPreview.init()                — Khởi tạo hover preview (molecules/tab-preview.js)
12. TabsModule.init()                — Khởi tạo tabs
13. setTimeout(0): Tree + Workspace  — Defer để DOM ổn định
```

---

*Document — 2026-04-27*
