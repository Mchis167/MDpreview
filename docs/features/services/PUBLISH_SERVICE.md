# Publish Service (`renderer/js/services/publish-service.js`)

> Service trung tâm quản lý logic xuất bản tài liệu lên Cloudflare Workers và Handoff.host.

---

## Mục đích

Giải quyết bài toán đưa tài liệu Markdown từ môi trường local lên Web công khai. Service hỗ trợ hai luồng chính:
1. **Cloudflare Worker (Ưu tiên)**: Xuất bản tự lưu trữ (Self-hosted) với khả năng tùy chỉnh Slug, bảo mật bằng mật khẩu và quản lý vòng đời bài viết.
2. **Legacy Handoff**: Xuất bản lên hạ tầng Handoff.host thông qua API Token.

---

## Architecture (v1.2.0+)

**Phase 2.1 Refactor** giới thiệu kiến trúc modular hóa với các thành phần sau:

```
PublishService (Public API)
  ├─ PublishOrchestrator (Strategy selection)
  │  ├─ WorkerPublishAdapter (Cloudflare Workers strategy)
  │  └─ LegacyHandoffAdapter (Legacy Handoff strategy)
  ├─ DesignTokenProvider (Auto-generated CSS from tokens)
  ├─ PublishUtils (Slug validation, asset gathering, HTML escaping)
  ├─ RetryStrategy (Exponential backoff with jitter)
  └─ PublishingErrorTypes (Structured error handling)
```

**Benefits**:
- ✅ Decoupled strategy pattern (easy to add new adapters)
- ✅ Design tokens auto-generated (no hardcoded CSS)
- ✅ Comprehensive asset bundling (images, fonts, SVGs)
- ✅ Robust retry logic with exponential backoff
- ✅ Structured error types for better debugging

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

### `PublishUtils.slugify(text)`
Tạo Slug sạch và chuẩn SEO từ một chuỗi văn bản (tên file, tiêu đề).
- **Hành vi**: Chuyển chữ thường, xóa ký tự đặc biệt, gộp dấu gạch ngang, và quan trọng nhất là loại bỏ dấu gạch ngang/gạch dưới ở đầu và cuối chuỗi (xử lý triệt để các file nháp dạng `__DRAFT_`).
- **Giới hạn**: Tối đa 50 ký tự.

---

## Tiêu chuẩn Visual Parity (Độ trung thực hiển thị)

Dự án cam kết độ trung thực 100% giữa Editor và bản xuất bản (Live/Offline):
1. **DOM Hierarchy**: Phải tuân thủ nghiêm ngặt cấu trúc `#md-content > .md-content > .md-content-inner`.
2. **Atomic Blocks**: Mọi đoạn văn bản phải nằm trong `.md-block > .md-line`.
3. **Premium Blocks**: Các thành phần đặc biệt (Code, Table, Mermaid) sử dụng hệ thống Glassmorphism (`backdrop-filter`, `transparent background`).
4. **Mermaid Zoom**: Tích hợp thanh điều khiển Zoom và khả năng tương tác mượt mà trên bản Publish, đồng bộ 1:1 với Project Map trong app.
5. **Anchor Sync (TOC)**: Tự động tiêm ID chuẩn SEO (hỗ trợ Tiếng Việt và Unicode) vào các thẻ Heading thông qua cơ chế **Hybrid Injection**, đảm bảo mục lục (Table of Contents) luôn hoạt động chính xác.

**CSS & Asset Pipeline (Phase 2.3)**: Toàn bộ CSS và JS của Worker được **auto-generated** và đồng bộ thông qua `npm run build:publish-assets`.
- **CSS**: Bundle từ Design Tokens + shared components (Tab Bar, Zoom Modal).
- **JS**: Đồng bộ hóa `zoom.js` và `code-blocks.js` để đảm bảo tính năng tương tác đồng nhất.

---

## Architecture (Phase 2.3 Updates)

### Dynamic Shell Injection
Dự án đã chuyển đổi từ mô hình "Full Bake" (lưu cả file HTML vào KV) sang mô hình **Dynamic Shell Injection**:
1. **Publishing**: `WorkerPublishAdapter` giờ đây chỉ gửi phần Body đã render của Markdown tới Worker.
2. **Storage**: KV chỉ lưu trữ nội dung Body, giúp tiết kiệm không gian và tách biệt dữ liệu khỏi giao diện.
3. **Serving**: Tại thời điểm Runtime, Worker sẽ lấy Body và nhúng nó vào một **Shell HTML** (template) mới nhất.
4. **Benefit**: Cho phép cập nhật giao diện, sửa lỗi CSS/JS hoặc thêm tính năng (như Zoom) cho **tất cả** tài liệu đã xuất bản ngay lập tức mà không cần re-publish.

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

## Security Considerations

### Password Protection
- Passwords are transmitted in request body (not URL parameters) to prevent exposure via referrer headers or browser history
- Server-side: Use salted hashing (PBKDF2/bcrypt) for storage — SHA-256 without salt is vulnerable to rainbow table attacks
- Client-side: Passwords are never logged to console or stored in localStorage

### Input Validation & UX
- **Slug Format (Error)**: Kiểm tra định dạng cục bộ trước khi gọi API. Nếu sai định dạng, hiển thị trạng thái `error` (đỏ) và khóa nút Publish.
- **Availability (Warning)**: Nếu định dạng đúng nhưng Slug đã tồn tại, hiển thị trạng thái `warning` (vàng). Người dùng vẫn có thể ghi đè nếu muốn.
- Asset size limits enforced: 5MB per asset, 20MB total

### Mermaid Security
- Published documents use `securityLevel: 'antiscript'` to block inline scripts while allowing HTML formatting
- Prevents XSS attacks through diagram definitions

### Recommended Deployment Settings
- Enable HSTS headers on worker domain (enforce HTTPS)
- Implement per-user rate limiting (10 publishes/hour)
- Monitor and log all publish attempts
- See [`docs/decisions/20260502-publish-security-hardening.md`](../decisions/20260502-publish-security-hardening.md) for detailed security hardening strategy

---

## Error Handling

The service uses structured error types for better debugging:
- `ValidationError` — Invalid input (slug format, missing config)
- `AuthenticationError` — Missing/invalid credentials
- `NetworkError` — Transient network failures (retryable)
- `TimeoutError` — Request timeout (retryable)
- `WorkerError` — Server-side worker errors
- `SlugConflictError` — Slug already exists

All errors are logged with timestamp and context. Retry logic uses exponential backoff for transient failures.

---

## Debugging

- **Log Tag**: `[PublishService]`, `[PublishOrchestrator]`, `[WorkerPublishAdapter]`, `[RetryStrategy]`
- **Server Trace**: Kiểm tra log tại server Node.js cho các yêu cầu proxy `/api/worker-publish`
- **Console Inspection**: 
  ```javascript
  const tokens = PublishService.getDesignTokens();
  console.log(tokens); // View all design tokens
  ```

---

*Document — 2026-05-06 (v1.8.1 - Clean Slug Generation & Advanced Validation UX)*
