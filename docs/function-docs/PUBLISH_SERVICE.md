# Publish Service (`renderer/js/services/publish-service.js`)

> Service trung tâm quản lý logic xuất bản tài liệu lên Cloudflare Workers và Handoff.host.

---

## Mục đích

Giải quyết bài toán đưa tài liệu Markdown từ môi trường local lên Web công khai. Service hỗ trợ hai luồng chính:
1. **Cloudflare Worker (Ưu tiên)**: Xuất bản tự lưu trữ (Self-hosted) với khả năng tùy chỉnh Slug, bảo mật bằng mật khẩu và quản lý vòng đời bài viết.
2. **Legacy Handoff**: Xuất bản lên hạ tầng Handoff.host thông qua API Token.

---

## Key Functions

### `publish(options = {})`
Hàm thực thi xuất bản chính. Tự động nhận diện engine (Worker vs Legacy) dựa trên cấu hình trong `AppState.settings`.

**Logic luồng Worker:**
1. Đọc nội dung document (hỗ trợ cả Draft qua `DraftModule`).
2. Gửi payload tới Server Proxy (`POST /api/worker-publish`) kèm theo `Admin Secret`.
3. Nhận phản hồi và lưu thông tin trạng thái bài đăng vào `AppState.settings.publishData`.

### `checkSlugAvailability(slug)`
Kiểm tra xem một Slug đã tồn tại trên Worker KV hay chưa.
- **Return**: `Promise<boolean>` (true nếu Slug có sẵn/hợp lệ).
- **Flow**: Gọi trực tiếp tới endpoint `/check-slug` của Worker.

### `renameSlug(oldSlug, newSlug)`
Thay đổi URL của một tài liệu đã xuất bản.
1. Gọi `/rename` trên Worker để di chuyển dữ liệu KV.
2. Cập nhật lại toàn bộ `publishData` cục bộ để ánh xạ sang Slug mới.

### `unpublish(filePath)`
Gỡ bỏ tài liệu khỏi Web.
1. Gửi lệnh `DELETE` tới Worker để xóa dữ liệu trên KV.
2. Xóa trạng thái xuất bản cục bộ của file đó.

### `listAllPublished()`
Lấy danh sách tất cả các Slugs đang active trên Worker của người dùng.

### `copyAsHtml(fileName, html)`
Tạo và sao chép vào clipboard một bản HTML độc lập (**Standalone Bundle**).
- **Fidelity**: Tự động nhúng toàn bộ Design System Tokens và CSS của App vào file HTML.
- **Independence**: File xuất ra có khả năng hoạt động offline 100% với đầy đủ style cho Code Blocks, Tables và Mermaid.

---

## Tiêu chuẩn Visual Parity (Độ trung thực hiển thị)

Dự án cam kết độ trung thực 100% giữa Editor và bản xuất bản (Live/Offline):
1. **DOM Hierarchy**: Phải tuân thủ nghiêm ngặt cấu trúc `#md-content > .md-content > .md-content-inner`.
2. **Atomic Blocks**: Mọi đoạn văn bản phải nằm trong `.md-block > .md-line`.
3. **Premium Blocks**: Các thành phần đặc biệt (Code, Table, Mermaid) sử dụng hệ thống Glassmorphism (`backdrop-filter`, `transparent background`).
4. **Mermaid Visibility**: Ép chuẩn hiển thị văn bản màu trắng và nét vẽ mờ (white alpha) để tương thích với theme tối của web.

---

## Cấu trúc Dữ liệu (Publish Info)

Trạng thái xuất bản của mỗi file được lưu trong `AppState.settings.publishData` theo cấu trúc:
```js
{
  "/path/to/file.md": {
    "slug": "my-document",
    "url": "https://worker.dev/my-document",
    "updatedAt": "2026-05-01T...",
    "type": "worker" // hoặc "legacy"
  }
}
```

---

## Debugging

- **Log Tag**: `[PublishService]`
- **Server Trace**: Kiểm tra log tại server Node.js cho các yêu cầu proxy `/api/worker-publish`.

---

*Document — 2026-05-01*
