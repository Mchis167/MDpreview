# Quy chuẩn Luồng tải ảnh tập trung (Centralized Asset Upload Pipeline)

**Date:** 2026-05-14
**Status:** accepted
**Author:** session 2026-05-14

---

## Bối cảnh

Trong quá trình phát triển MDpreview, việc quản lý hình ảnh được thực hiện qua nhiều con đường: Kéo thả (Drag & Drop), Dán (Paste), và Menu ngữ cảnh. Tuy nhiên, mỗi luồng lại có cách xử lý riêng biệt, dẫn đến mã nguồn bị lặp lại và khó kiểm soát việc tối ưu hóa (nén ảnh, đặt tên, kiểm tra trùng lặp).

Người dùng cũng mong muốn có một cách chính thống để tải ảnh lên từ thanh lệnh (`/upload`) thay vì chỉ dùng kéo thả.

---

## Các lựa chọn đã cân nhắc

### Option 1: Xử lý riêng biệt tại mỗi module
- **Ưu:** Nhanh, không cần kiến trúc phức tạp.
- **Nhược:** Khó bảo trì, dễ xảy ra tình trạng nén ảnh không đồng nhất hoặc rác dữ liệu.

### Option 2: Xây dựng Pipeline tập trung trong AttachmentService (Chọn)
- **Ưu:** Đảm bảo mọi ảnh đi vào Vault đều qua cùng một quy trình kiểm soát chất lượng và đặt tên.
- **Nhược:** Cần refactor lại các module cũ để gọi chung một API.

---

## Quyết định

**Chọn: Option 2 — Xây dựng Pipeline tập trung trong AttachmentService**

Thiết lập hàm `processImageFiles` làm cửa ngõ duy nhất để đưa ảnh vào ứng dụng. Hàm này chịu trách nhiệm:
1. **Deduplication**: Kiểm tra vân tay ảnh để tránh lưu trùng.
2. **Optimization**: Gọi IPC `attachment:save-image` để nén ảnh sang định dạng JPEG/PNG tối ưu.
3. **Automated Linking**: Tự động chèn cú pháp Markdown tương ứng vào editor.

---

## Hệ quả

**Tích cực:**
- Thư mục `/assets` luôn gọn gàng, không có ảnh trùng lặp.
- Dễ dàng thêm các tính năng mới (như resize ảnh trước khi lưu) tại một nơi duy nhất.
- Hỗ trợ tốt cho cả Desktop (hộp thoại hệ thống) và Web (Input file).

**Tiêu cực / Trade-off:**
- Logic của `AttachmentService` trở nên phức tạp hơn do phải xử lý nhiều trường hợp (Multiple files, positions, deduplication).

**Constraint tương lai:**
- Mọi module mới (như Plugin upload ảnh lên cloud) PHẢI kế thừa hoặc tích hợp vào luồng xử lý của `AttachmentService` thay vì tự ghi file vào disk.
