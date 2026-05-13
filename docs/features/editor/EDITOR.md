# Editor Module (`renderer/js/modules/editor.js`)

> Quản lý trạng thái và tương tác của trình soạn thảo Monaco Editor: lưu trữ, theo dõi thay đổi (dirty tracking), và thực thi các lệnh định dạng.

---

## Lifecycle

### `bind()`
Kết nối EditorModule với phiên bản Monaco Editor đang hoạt động.
- Đăng ký lắng nghe sự kiện thay đổi nội dung để thực hiện dirty tracking.
- Tự động gọi `TabsModule.setDirty()` để cập nhật trạng thái trên Tab Bar.

### `unbind()`
Gỡ bỏ tất cả các listener (change, cursor, keydown) để tránh rò rỉ bộ nhớ. Gọi khi component soạn thảo bị destroy hoặc chuyển workspace.

---

## Undo / Redo

Các thay đổi trong Monaco được quản lý bởi `MonacoService` sử dụng stack nội bộ của Monaco, thay vì quản lý thủ công trong EditorModule như trước đây.

---

## Content Injection

### `insertContent(text, mode)`
Chèn nội dung văn bản vào editor. Tự động chụp snapshot để hỗ trợ Undo/Redo.
- **`mode === 'replace'`**: Thay thế toàn bộ nội dung hiện tại bằng `text`.
- **`mode === 'append'`**: Thêm `text` vào cuối tài liệu.

---

## Save & Dirty Tracking

### `save()`
Lưu nội dung Monaco Editor:
- Nếu file là **draft** → lưu qua DraftModule
- Nếu là **file thật** → POST `/api/file` hoặc gọi Electron API
- Sau khi save → gọi `setOriginalContent()` để reset dirty flag và thông báo cho `TabsModule`.

### `isDirty()`
So sánh nội dung hiện tại với `originalContent`. Trả về `true` nếu có thay đổi chưa lưu.

### `setOriginalContent(text)`
Cập nhật baseline. Gọi sau khi load file hoặc sau khi save thành công.

### `setDirty(isDirty)`
Đánh dấu dirty/clean thủ công — dùng khi cần override dirty detection (ví dụ: sau auto-save).

### `revert()`
Khôi phục editor về `originalContent`, xóa toàn bộ undo/redo stacks và thông báo "clean" cho `TabsModule`.

---

## Safety Guards

Để đảm bảo an toàn dữ liệu tuyệt đối trong môi trường bất đồng bộ, `EditorModule` triển khai các cơ chế bảo vệ sau:

### 1. Internal ID Locking
Mỗi yêu cầu lưu file được gắn với một ID nội bộ của tab hiện tại. 
- Nếu người dùng chuyển tab cực nhanh trong khi lệnh save đang thực thi, hệ thống sẽ đối chiếu ID.
- Nếu ID không khớp (đã chuyển sang file khác) → lệnh save sẽ bị hủy bỏ để ngăn việc ghi đè nội dung của file mới vào file cũ (hoặc ngược lại).

### 2. Safe-Save Guard
Cơ chế bảo vệ chống lại race condition khiến editor bị rỗng:
- Trước khi thực hiện lệnh save, hệ thống kiểm tra: Nếu nội dung Monaco hiện tại rỗng (`""`) NHƯNG `originalContent` (dữ liệu từ file nguồn) lại có dữ liệu → Chặn lệnh save và ghi log cảnh báo.
- Điều này ngăn chặn việc vô tình xóa sạch nội dung file do lỗi khởi tạo Monaco chậm.

---

## Command Dispatcher

### `applyAction(action)`
Cửa ngõ duy nhất để thực thi các lệnh từ UI (Toolbar, Command Palette, Context Menu).

**1. System Commands (Lệnh hệ thống):**
- **`img-upload`**: Kích hoạt `AttachmentService.pickAndInsertImage()` để tải ảnh lên assets.
- **`global-shortcuts-search`**: Mở bảng tra cứu phím tắt ứng dụng.

**2. Formatting Commands (Lệnh định dạng):**
- Delegate xuống `MonacoActionService` để xử lý các thẻ Markdown (Bold, Italic, Link, etc.).

### `focusWithContext(context)`
Focus vào Monaco Editor và đồng bộ con trỏ với read view — dùng khi chuyển từ read mode sang edit mode để giữ vị trí cuộn.

---

## Slash Commands

Hỗ trợ hệ thống lệnh nhanh (Slash Commands) giúp định dạng Markdown trực tiếp mà không cần dùng chuột hoặc phím tắt phức tạp.

### Kích hoạt Slash Mode
Khi gõ ký tự `/` ở đầu dòng hoặc sau một dấu cách/xuống dòng:
1. `EditorModule` chuyển sang **Slash Mode** (`_isSlashMode = true`).
2. Gọi `QuickCommandPalette.show()` ở chế độ ẩn input (`hideInput: true`).
3. Vị trí con trỏ bắt đầu dấu `/` được lưu lại (`_slashStartPos`).

### Tương tác trong Slash Mode
- **Gõ chữ**: Văn bản sau dấu `/` được gửi xuống `QuickCommandPalette.updateQuery()` để lọc lệnh theo thời gian thực.
- **Phím mũi tên (Up/Down)**: Được đánh chặn và gửi xuống `QuickCommandPalette.navigate()` để di chuyển vùng chọn trong danh sách lệnh.
- **Phím Space/Enter**:
    - Nếu có lệnh đang được chọn: Áp dụng lệnh và thoát Slash Mode.
    - Nếu không có lệnh nào khớp: Thoát Slash Mode (giữ nguyên text đã gõ).
- **Xóa lùi (Backspace)**: Slash Mode vẫn tiếp tục cho đến khi dấu `/` tại vị trí bắt đầu bị xóa.

---

## Keyboard Shortcuts (Edit Mode)

| Shortcut | Hành động |
|---|---|
| Mod + S | `save()` |
| / | Kích hoạt Slash Mode |
| Mod + / | Mở Quick Command Palette (Toàn bộ danh sách) |
| Mod + Shift + / | Mở bảng tra cứu phím tắt (Global Shortcut Search) |

---

## Lưu ý quan trọng

- `bindToElement()` và `unbind()` **phải được gọi đúng cặp** — `MarkdownEditor` component lo việc này khi render/destroy
- Sau khi áp dụng lệnh qua Slash Mode, `EditorModule` phối hợp với `MarkdownLogicService` để thực hiện **Smart Selection** (chỉ bôi đen nội dung cần sửa, bỏ qua ký tự Markdown).
- Dirty state được check bởi `loadFile()` và `WorkspaceModule.switchTo()` trước khi chuyển file/workspace
- Undo stack **không persist** qua session — mỗi lần mở file là stack mới

---

*Document — 2026-05-14*
