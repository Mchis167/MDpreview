# File Service (`renderer/js/services/file-service.js`)

> High-level service wrapper cho các thao tác file và thư mục. Tích hợp cả Electron IPC (Desktop) và Fetch API (Server/Web).

---

## Mục đích

`FileService` đóng vai trò là lớp trừu tượng (abstraction layer) duy nhất để giao tiếp với hệ thống tệp tin. Nó ẩn đi sự phức tạp của việc phân biệt giữa môi trường Browser (gọi API server) và môi trường Electron (gọi IPC trực tiếp).

---

## Key Functions

### `fetchFiles(options)`
Lấy cấu trúc cây thư mục từ server.
**Options:** `{ showHidden: boolean, hideEmpty: boolean, flat: boolean }`.

### `createFile(absPath, content)`
Tạo file mới tại đường dẫn tuyệt đối được chỉ định.
- **Desktop:** Gọi `window.electronAPI.createFile`.
- **Phản hồi:** Hiển thị Toast thông báo thành công/thất bại.

### `saveFile(absPath, content)`
Lưu nội dung vào một file đã tồn tại. 
- **Cơ chế:** Sử dụng `POST /api/file/save`.
- **Sử dụng:** Được dùng bởi `EditorModule` để lưu bản nháp và `MarkdownViewer` để lưu trạng thái checkbox.

### `deleteFile(absPath)`
Xóa file hoặc thư mục (xóa vĩnh viễn hoặc đưa vào thùng rác tùy cấu hình Electron).

### `renameFile(oldAbs, newAbs)`
Đổi tên hoặc di chuyển file/thư mục.

### `duplicateFile(absPath)`
Tạo một bản sao của file/thư mục tại cùng vị trí.

### `revealInFinder(absPath)`
Mở thư mục chứa file trong Finder (macOS) hoặc Explorer (Windows).

### `openFolder()` / `openFiles()`
Kích hoạt hộp thoại chọn file/thư mục hệ thống (Native Dialog).

---

## Kiến trúc nội bộ

`FileService` được triển khai theo pattern **IIFE** và export ra biến toàn cục `window.FileService`. 

Các hàm được thiết kế dạng `async/await` để xử lý các thao tác I/O bất đồng bộ một cách mượt mà.

---

## Debugging

Sử dụng tag `[DEBUG]` trong console để theo dõi các luồng lưu file:
- `FileService.saveFile calling /api/file/save...`
- `FileService.saveFile response status: ...`

---

*Document — 2026-05-05*
