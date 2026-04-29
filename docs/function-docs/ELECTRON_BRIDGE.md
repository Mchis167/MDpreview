# Electron Bridge (`renderer/js/core/electron-bridge.js`)

> Cung cấp giao diện `window.electronAPI` thống nhất cho cả môi trường Desktop (Electron) và Web (Browser). Đảm bảo tính năng hoạt động xuyên suốt thông qua các cơ chế Polyfill và Fallback.

---

## Mục đích

`electron-bridge.js` đóng vai trò là lớp trừu tượng (Abstraction Layer). 
- Trong **Electron**: Nó nhường chỗ cho `preload.js` (native bridge).
- Trong **Trình duyệt**: Nó tự định nghĩa `window.electronAPI` bằng cách gọi các REST API của server Express hoặc sử dụng các Web API chuẩn.

---

## Hệ thống File (File System)

### `readFile(filePath)`
Đọc nội dung của một file văn bản (UTF-8).
- **Desktop**: Gọi IPC `read-file` để đọc trực tiếp từ disk (bỏ qua giới hạn bảo mật của server).
- **Web**: Kiểm tra trong `FILE_CACHE` trước. Nếu không có, gọi `/api/file/raw` (chỉ đọc được file trong Workspace).

### `openFiles(options)`
Mở hộp thoại chọn file của hệ thống.
- **Desktop**: Gọi IPC `open-file-dialog`. Trả về danh sách đường dẫn tuyệt đối.
- **Web**: Tạo một `<input type="file">` ẩn. Sau khi người dùng chọn, các đối tượng `File` sẽ được lưu vào `FILE_CACHE` nội bộ để `readFile` có thể truy cập sau đó.

### `FILE_CACHE` (Chỉ dành cho Web)
Một `Map` nội bộ lưu trữ các đối tượng `File` người dùng đã chọn. Điều này cho phép ứng dụng đọc nội dung file tại Frontend mà không cần gửi lên Server, giúp tránh lỗi bảo mật khi file nằm ngoài Workspace.

---

## Clipboard & Rasterization

### `copyFileToClipboard(filePath)`
- **Desktop**: Sử dụng `electron-clipboard-ex` để ghi đường dẫn file vật lý vào clipboard hệ thống.
- **Web**: Fallback bằng cách kích hoạt trình tải xuống (download) của trình duyệt.

### `rasterizeSVG(svg, width, height)`
Chuyển đổi code SVG sang ảnh PNG (Data URL).
- **Desktop**: Sử dụng `nativeImage.createFromBuffer` với scale factor 2.0 để đạt độ nét Retina.
- **Web**: Sử dụng `HTMLCanvasElement` để vẽ SVG và xuất ra PNG.

### `writeClipboardAdvanced(data)`
Ghi dữ liệu đa định dạng (HTML + Text) vào clipboard. Sử dụng `navigator.clipboard.write` trên trình duyệt và `clipboard.write` trên Electron.

---

## Các API khác

| Function | Mô tả |
|---|---|
| `openFolder()` | Mở hộp thoại chọn thư mục. |
| `getAbsolutePath(path)` | Chuyển đổi đường dẫn tương đối sang tuyệt đối. |
| `revealInFinder(path)` | Mở thư mục chứa file trong File Explorer (chỉ Desktop). |
| `startFileDrag(path)` | Kích hoạt hiệu ứng kéo thả file ra ngoài ứng dụng. |
| `rebuildApp()` | Yêu cầu đóng gói và khởi động lại ứng dụng (chỉ Desktop). |

---

## Lưu ý quan trọng

- **Security**: Server Express bị giới hạn bởi `watchDir`. Luôn ưu tiên dùng `electronAPI` khi cần thao tác với file nằm ngoài Workspace.
- **Persistence**: `FILE_CACHE` trên bản Web sẽ bị xóa khi tải lại trang (reload).

---

*Document — 2026-04-29*
