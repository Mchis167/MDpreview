# Viewer Persistent DOM Architecture

**Date:** 2026-04-28
**Status:** accepted
**Author:** session 2026-04-28

---

## Bối cảnh

Trong các phiên bản trước, `MarkdownViewerComponent` thực hiện hủy (destroy) và tạo mới (re-render) hoàn toàn các phần tử DOM mỗi khi người dùng chuyển đổi giữa các chế độ (Read, Edit, Comment, Collect).
Việc này dẫn đến:
1. Mất trạng thái cuộn (scroll position).
2. Mất trạng thái giao diện của các component phụ trợ (như Table of Contents bị đóng lại hoặc mất vị trí).
3. Độ trễ thị giác (flickering) khi trình duyệt phải render lại toàn bộ nội dung lớn.

---

## Các lựa chọn đã cân nhắc

### Option 1: Render-on-demand (Legacy)
- **Ưu:** Tiết kiệm bộ nhớ (chỉ có 1 instance DOM tại một thời điểm).
- **Nhược:** Trải nghiệm chuyển mode chậm, mất trạng thái UI, code quản lý lifecycle phức tạp hơn.

### Option 2: Persistent DOM (Visibility Toggle)
- **Ưu:** Chuyển mode tức thì, bảo toàn 100% trạng thái UI (scroll, TOC expansion), code sạch hơn.
- **Nhược:** Tốn bộ nhớ hơn một chút (giữ cả Preview và Editor trong DOM).

---

## Quyết định

**Chọn: Option 2 — Persistent DOM (Visibility Toggle)**

Với ứng dụng Desktop như MDpreview, trải nghiệm mượt mà và việc bảo toàn trạng thái khi chuyển từ "đọc" sang "sửa" là cực kỳ quan trọng. Tài nguyên bộ nhớ trên Desktop đủ để duy trì hai instance DOM cho một file đang mở.

---

## Hệ quả

**Tích cực:**
- Chuyển đổi giữa Read/Edit/Comment/Collect diễn ra mượt mà không có độ trễ render.
- Người dùng có thể quay lại đúng vị trí đang đọc/sửa sau khi chuyển mode.

**Tiêu cực / Trade-off:**
- Cần quản lý cẩn thận việc Activate/Deactivate các module (như Editor) để tránh việc xử lý logic chạy ngầm khi container đang bị ẩn (`display: none`).

**Constraint tương lai:**
- Các mode mới được thêm vào `MarkdownViewerComponent` phải tuân thủ pattern `display: none/flex` thay vì xóa DOM.
- Các component con phải hỗ trợ phương thức `activate()`/`deactivate()` để tối ưu hiệu năng khi ẩn/hiện.
