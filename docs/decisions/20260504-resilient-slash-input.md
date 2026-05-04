# Resilient Slash Input Handling

**Date:** 2026-05-04
**Status:** accepted
**Author:** session 2026-05-04

---

## Bối cảnh

Trong quá trình phát triển Slash Command, chúng ta phát hiện ra các hệ điều hành (như macOS) tự động chèn các ký tự trắng không tiêu chuẩn (ví dụ: `\u202F` - Narrow No-Break Space) khi người dùng gõ nhanh hoặc dùng bộ gõ tiếng Việt. Điều này làm cho regex kiểm tra dấu cách thông thường thất bại, dẫn đến Palette bị đóng đột ngột.

---

## Các lựa chọn đã cân nhắc

### Option 1: Regex nghiêm ngặt (`/\s/`)
- **Ưu:** Tuân thủ đúng lý thuyết "dấu cách là kết thúc lệnh".
- **Nhược:** Bị crash bởi các ký tự trắng ẩn của OS.

### Option 2: Xử lý dựa trên phím cứng (`keydown`)
- **Ưu:** Không phụ thuộc vào nội dung Textarea.
- **Nhược:** Không xử lý được các trường hợp text được paste vào hoặc auto-correct của OS thay đổi nội dung sau khi phím được nhấn.

### Option 3: Resilience Filtering + Hard Termination
- **Ưu:** Kết hợp kiểm tra nội dung thực tế (lọc bỏ ký tự ẩn) và chỉ đóng khi có sự kiện ngắt dòng thực sự.
- **Nhược:** Code xử lý chuỗi phức tạp hơn.

---

## Quyết định

**Chọn: Option 3 — Resilience Filtering + Hard Termination**

Chúng ta quyết định Palette chỉ đóng khi:
1. Người dùng xóa mất dấu `/` kích hoạt.
2. Người dùng nhấn `Enter` hoặc `Space` mà không có lệnh nào khớp (đóng cứng).
3. Trong sự kiện `input`, chúng ta lọc sạch các ký tự trắng không tiêu chuẩn trước khi gửi query xuống Palette để đảm bảo tính ổn định.

---

## Hệ quả

**Tích cực:**
- Hệ thống cực kỳ ổn định, không bị "glitch" khi gõ nhanh hoặc dùng bộ gõ tiếng Việt.

**Tiêu cực / Trade-off:**
- Logic check vị trí Slash phải chạy liên tục trong sự kiện `input`.

**Constraint tương lai:**
- Luôn sử dụng regex `[^\S\r\n]` hoặc tương đương để xử lý "invisible whitespace" nếu cần kiểm tra tính toàn vẹn của lệnh.
