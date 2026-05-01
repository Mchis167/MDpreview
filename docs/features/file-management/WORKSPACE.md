# Workspace Module (`renderer/js/modules/workspace.js`)

> Quản lý CRUD workspaces, chuyển đổi workspace, và đồng bộ với Electron main process.

---

## Khái niệm

**Workspace** = một folder gốc + tên hiển thị. Mỗi workspace có danh sách tab và draft riêng, lưu theo key `mdpreview_tabs_{id}` và `mdpreview_drafts_{id}` trong localStorage.

---

## Functions

### `init()`
Load workspaces từ main process và render workspace switcher trong sidebar.

### `load()`
Fetch danh sách workspaces qua `window.electronAPI.getWorkspaces()`, lưu vào state, gọi `_renderSwitcher()`.

### `switchTo(id)`
Chuyển sang workspace khác:
1. **Dirty check** — Nếu editor đang dirty → hỏi người dùng
2. Đóng tất cả tab của workspace cũ
3. Gọi `_proceedSwitch(id)`

### `_proceedSwitch(id)` *(internal)*
Thực hiện chuyển workspace sau khi dirty check pass:
1. Cập nhật `AppState.currentWorkspace`
2. Gọi `window.electronAPI.setActiveWorkspace(id)`
3. Reload file tree với folder mới
4. Load lại danh sách tab của workspace mới
5. Gọi `CommentsModule.clear()` để xóa comments cũ

### `add(name, folderPath)`
Tạo workspace mới:
1. Tạo object workspace với `id` = timestamp
2. Save qua `window.electronAPI.saveWorkspace()`
3. Tự động switch sang workspace mới

### `rename(id, newName)`
Đổi tên workspace và sync lên main process. Cập nhật UI ngay lập tức.

### `remove(id)`
Xóa workspace với confirmation dialog:
- Xóa localStorage keys liên quan (`tabs`, `drafts`)
- Nếu là workspace active → switch sang workspace đầu tiên còn lại
- Nếu chỉ còn 1 workspace → không cho phép xóa

---

## UI

### `openPanel()`
Mở popover workspace picker với danh sách workspaces và các action (thêm, sửa, xóa).

### `_openModal(wsToEdit?, onAfterConfirm?)`
Mở form modal để tạo mới hoặc chỉnh sửa workspace. `wsToEdit = null` → tạo mới.

### `_renderSwitcher()`
Cập nhật tên workspace hiển thị trong sidebar trái.

---

## Electron API Calls

| Hàm | Mô tả |
|---|---|
| `getWorkspaces()` | Đọc danh sách workspaces từ file config |
| `setActiveWorkspace(id)` | Lưu workspace active |
| `saveWorkspace(ws)` | Tạo mới hoặc update workspace |
| `deleteWorkspace(id)` | Xóa workspace khỏi config |

---

## Cleanup khi xóa Workspace

Khi remove workspace, các keys localStorage bị xóa:
- `mdpreview_tabs_{id}`
- `mdpreview_drafts_{id}`
- `mdpreview_filemode_{id}_*`

---

*Document — 2026-04-26*
