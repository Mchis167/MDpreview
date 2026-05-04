# Smart Content Selection Strategy

**Date:** 2026-05-04
**Status:** accepted
**Author:** session 2026-05-04

---

## Bối cảnh

Khi áp dụng các lệnh định dạng (ví dụ: Heading, Bold), hệ thống thường chèn các ký tự Markdown (`### `, `**`). Nếu chỉ để con trỏ ở cuối dòng, người dùng phải mất thêm thao tác xóa văn bản mặc định hoặc di chuyển con trỏ để sửa nội dung.

---

## Các lựa chọn đã cân nhắc

### Option 1: Để con trỏ ở cuối dòng
- **Ưu:** Đơn giản nhất.
- **Nhược:** Người dùng phải xóa placeholder hoặc chọn thủ công để sửa.

### Option 2: Chọn toàn bộ dòng (bao gồm cả ký hiệu Markdown)
- **Ưu:** Nhanh.
- **Nhược:** Nếu người dùng gõ đè, họ sẽ xóa mất cả ký hiệu Markdown (như dấu `#`), làm hỏng định dạng.

### Option 3: Smart Selection (Chỉ bôi đen nội dung)
- **Ưu:** Người dùng gõ đè sẽ chỉ thay thế nội dung, giữ nguyên định dạng Markdown.
- **Nhược:** Cần tính toán Range phức tạp hơn cho từng loại action.

---

## Quyết định

**Chọn: Option 3 — Smart Selection**

Chúng ta chọn tối ưu hóa cho hành động tiếp theo của người dùng: Sửa nội dung. Bằng cách tính toán `setSelectionRange` chính xác (bỏ qua prefix/suffix của Markdown), chúng ta giúp người dùng "gõ là ăn ngay".

---

## Hệ quả

**Tích cực:**
- Tốc độ soạn thảo tăng đáng kể.
- Giảm thiểu lỗi xóa nhầm cú pháp Markdown.

**Tiêu cực / Trade-off:**
- Logic trong `MarkdownLogicService` trở nên verbose hơn do phải xử lý range riêng cho từng action.

**Constraint tương lai:**
- Mọi action mới thêm vào `MarkdownLogicService` đều phải tuân thủ quy tắc Smart Selection nếu có chèn placeholder.
