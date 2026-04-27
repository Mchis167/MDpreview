# Optimized File Loading and UI Stability

**Date:** 2026-04-28
**Status:** accepted
**Author:** session 2026-04-28

---

## Bối cảnh

Trước đây, hệ thống gặp một số vấn đề về trải nghiệm người dùng (UX) liên quan đến việc load file:
1. **Lỗi Skeleton vô hạn**: Khi chuyển file lúc đang có thay đổi chưa lưu, hệ thống hiện Skeleton trước khi hỏi xác nhận. Nếu người dùng nhấn Cancel, Skeleton không bao giờ biến mất.
2. **Flash Skeleton khó chịu**: Mỗi khi click vào file đang mở hoặc sau khi lưu file, Skeleton hiện lên rồi biến mất rất nhanh, gây cảm giác giật lag.
3. **Sidebar re-render dư thừa**: Mỗi lần lưu file, toàn bộ cây thư mục bên trái bị tải lại từ server và vẽ lại, gây tốn tài nguyên và nhấp nháy giao diện.

---

## Các lựa chọn đã cân nhắc

### Option 1: Giữ nguyên logic cũ và thêm các lệnh xóa Skeleton thủ công
- **Ưu:** Ít thay đổi code hiện tại.
- **Nhược:** Khó quản lý, dễ sót các trường hợp rẽ nhánh, không giải quyết được vấn đề sidebar re-render.

### Option 2: Tái cấu trúc logic `loadFile` và tối ưu hóa Socket
- **Ưu:** Giải quyết tận gốc vấn đề logic (Dirty check trước UI), loại bỏ các tiến trình dư thừa.
- **Nhược:** Cần thay đổi các hàm core của ứng dụng.

---

## Quyết định

**Chọn: Option 2 — Tái cấu trúc logic `loadFile` và tối ưu hóa Socket**

Việc tách biệt giữa "Kiểm tra trạng thái" (Dirty check) và "Cập nhật giao diện" (UI update) là cần thiết để tránh các trạng thái treo giao diện. Đồng thời, việc loại bỏ reload sidebar khi chỉ thay đổi nội dung file là một bước tối ưu hóa logic hiển thị đúng đắn vì nội dung file không ảnh hưởng đến cấu trúc cây thư mục.

---

## Hệ quả

**Tích cực:**
- Loại bỏ hoàn toàn lỗi kẹt Skeleton khi hủy chuyển file.
- Trải nghiệm lưu file và chuyển file mượt mà, không còn hiện tượng nhấp nháy Skeleton.
- Giảm tải cho server và client khi không phải reload sidebar vô điều kiện.

**Tiêu cực / Trade-off:**
- Logic `loadFile` phức tạp hơn một chút với tham số `options.silent`.

**Constraint tương lai:**
- Khi cập nhật nội dung file (content change), không nên gọi `TreeModule.load()`. Chỉ gọi khi có thay đổi cấu trúc (add/delete/rename).
- Luôn thực hiện các check chặn (Dirty check) trước khi thay đổi trạng thái UI của Viewer.
