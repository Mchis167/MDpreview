# ADR: Increased Server Payload Limit for Large Files

**Date:** 2026-04-27
**Status:** accepted
**Author:** session 2026-04-27 09:55

---

## Bối cảnh

MDpreview là trình soạn thảo local, người dùng thường xuyên làm việc với các file Markdown lớn hoặc lưu các bản nháp (drafts) có nội dung dài. Express.js mặc định giới hạn body payload ở mức **100KB**, dẫn đến lỗi `413 Payload Too Large` khi thực hiện render hoặc lưu file có dung lượng trung bình trở lên.

## Các lựa chọn đã cân nhắc

### Option 1: Incremental Updates (Gửi từng phần)
- **Ưu**: Tiết kiệm băng thông.
- **Nhược**: Phức tạp hóa logic cả frontend và backend (cần cơ chế diff/patch).

### Option 2: Nâng giới hạn Payload (Large Limit)
- **Ưu**: Đơn giản, giải quyết triệt để lỗi 413, phù hợp với ứng dụng chạy local (không lo ngại về tấn công DDoS/Dung lượng mạng quá lớn).
- **Nhược**: Tốn bộ nhớ RAM tạm thời trên server khi xử lý request cực lớn.

## Quyết định

**Chọn: Option 2 — Nâng giới hạn Payload lên 50MB**

Cấu hình lại Middleware của Express:
1.  `express.json({ limit: '50mb' })`
2.  `express.urlencoded({ limit: '50mb', extended: true })`

## Hệ quả

- **Tích cực**: Người dùng có thể làm việc với các file văn bản cực lớn (lên tới hàng triệu ký tự) mà không gặp gián đoạn.
- **Tích cực**: Đảm bảo tính ổn định cho tính năng Auto-save và Render Preview.
- **Lưu ý**: Cần theo dõi mức độ tiêu thụ RAM nếu ứng dụng được triển khai trên môi trường có tài nguyên hạn chế.
