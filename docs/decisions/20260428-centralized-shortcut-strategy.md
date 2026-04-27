# Chiến lược Phím tắt Tập trung và Đánh chặn Toàn cục

**Date:** 2026-04-28
**Status:** accepted
**Author:** session 2026-04-28

---

## Bối cảnh

Trước đây, phím tắt trong MDpreview bị phân tán trong nhiều module khác nhau, dẫn đến:
1. **Xung đột**: Nhiều module cùng lắng nghe một phím gây ra hành vi không xác định.
2. **Kém ổn định**: Phím tắt dựa trên việc giả lập click chuột (`.click()`) vào UI, dẫn đến thất bại nếu UI chưa render hoặc bị ẩn.
3. **Bị chặn (Hijacking)**: Các ô nhập liệu (`input`, `textarea`) và trình duyệt thường "nuốt" mất phím tắt trước khi ứng dụng kịp xử lý.

---

## Các lựa chọn đã cân nhắc

### Option 1: Duy trì listener phân tán (Status quo)
- **Ưu:** Code tại chỗ, dễ viết nhanh.
- **Nhược:** Khó quản lý, dễ xung đột, không có giải pháp cho lỗi "nuốt phím" trong input.

### Option 2: Trung tâm hóa + Giả lập Click UI
- **Ưu:** Dễ quản lý phím tắt tại một nơi.
- **Nhược:** Vẫn bị lỗi nếu UI thay đổi ID hoặc đang bị ẩn.

### Option 3: Trung tâm hóa + Gọi API trực tiếp + Capture Phase Interception
- **Ưu:** Ổn định tuyệt đối, không phụ thuộc UI, chặn được phím tắt trước khi vào input/textarea.
- **Nhược:** Đòi hỏi các module phải phơi ra (expose) các hàm API công khai.

---

## Quyết định

**Chọn: Option 3 — Trung tâm hóa + Gọi API trực tiếp + Capture Phase Interception**

Đây là giải pháp chuyên nghiệp nhất, giúp tách biệt hoàn toàn Logic (Phím tắt) khỏi View (UI). Việc dùng `capture: true` giúp ứng dụng giành quyền xử lý phím trước khi trình duyệt hoặc các ô soạn thảo chiếm mất.

---

## Hệ quả

**Tích cực:**
- Hệ thống phím tắt hoạt động 100% ổn định trong mọi trạng thái ứng dụng.
- Dễ dàng mở rộng phím tắt mới hoặc thay đổi phím cũ tại `ShortcutsComponent`.
- Hỗ trợ phím tắt chuyển Mode linh hoạt ngay cả khi đang gõ văn bản.

**Tiêu cực / Trade-off:**
- Cần viết thêm API cho các module (ví dụ `TabsModule.toggleSidebar()`) thay vì chỉ gọi click nút.

**Constraint tương lai:**
- **TUYỆT ĐỐI KHÔNG** đăng ký thêm `keydown` listener độc lập trong các module mới. Mọi phím tắt phải được đăng ký qua `ShortcutService`.
- Ưu tiên gọi hàm xử lý trực tiếp thay vì giả lập hành vi click trên giao diện.
