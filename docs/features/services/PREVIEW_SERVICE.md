# Preview Service (`renderer/js/services/preview-service.js`)

> Quản lý trạng thái và đồng bộ hóa thời gian thực giữa Editor và cửa sổ Live Preview (Mirror Preview).

---

## Mục đích

`PreviewService` đảm bảo tính "phản chiếu" (Mirror) tuyệt đối giữa nội dung đang soạn thảo và cửa sổ xem trước độc lập. Nó hỗ trợ cả môi trường Electron (IPC) và trình duyệt Web (`postMessage`), với khả năng tự động khôi phục nội dung sau khi reload.

---

## Các tính năng chính

### 🔄 Cơ chế Bắt tay (Handshake)
Để giải quyết vấn đề mất dữ liệu khi reload cửa sổ Preview, Service triển khai giao thức bắt tay:
1. Cửa sổ Preview khởi động xong gửi tín hiệu `preview-ready`.
2. `PreviewService` nhận tín hiệu và lập tức đẩy toàn bộ nội dung + theme hiện tại sang.
3. (Web) Tự động khôi phục tham chiếu `webWindow` từ `event.source`.

### ⚡ Zero-Delay Mirroring
- **Debounce 20ms**: Cập nhật nội dung gần như tức thì khi gõ phím.
- **Request Sequencing**: Sử dụng `lastRequestId` để đảm bảo kết quả render cũ không ghi đè lên kết quả mới trong quá trình gõ nhanh.

### 🍱 Đa nguồn dữ liệu (Multi-source Fetching)
Khi thực hiện update, Service ưu tiên lấy dữ liệu theo thứ tự:
1. `EditorModule`: Nếu đang ở chế độ Chỉnh sửa (Live typing).
2. `MarkdownViewer Component`: Nếu đang ở chế độ Đọc hoặc vừa chuyển Tab (lấy HTML đã render sẵn).
3. `AppState`: Lấy thông tin tên file fallback.

---

## Key Functions

### `init()`
Thiết lập các bộ lắng nghe sự kiện:
- **Electron**: Lắng nghe `preview:ready` và `preview:closed` từ Main Process.
- **Web**: Lắng nghe `message` (type: `preview-ready`) từ cửa sổ con.

### `triggerUpdate(immediate = false)`
Hàm điều phối cập nhật nội dung. 
- **Flow**: Thu thập nội dung → Gửi lên server render (`/api/render-raw`) → Nhận HTML → Đẩy sang cửa sổ Preview.
- Nếu có sẵn `html` (từ Tab switch), nó sẽ gọi `updateContent()` ngay lập tức để bỏ qua bước render server.

### `updateContent(html, file)`
Đẩy trực tiếp HTML đã có sẵn sang Preview. Dùng cho việc chuyển Tab nhanh hoặc khi Editor không hoạt động.

### `syncScroll(scrollPct)`
Đồng bộ vị trí cuộn trang (0 đến 1) giữa hai cửa sổ.

---

## Kiến trúc truyền tin

| Môi trường | Kênh truyền | API sử dụng |
|---|---|---|
| **Electron** | IPC | `window.electronAPI.updatePreview` |
| **Web Browser** | PostMessage | `this.webWindow.postMessage` |

---

## Debugging
Service tích hợp hệ thống log chi tiết với tiền tố `[PreviewService]`.
- `Handshake RECEIVED`: Xác nhận kết nối thành công.
- `Updating preview for [file]`: Đang đẩy dữ liệu mới.
- `Render failed`: Lỗi khi gọi API render server.

---

*Document — 2026-05-04 (Mirror Preview & Web Handshake Support)*
