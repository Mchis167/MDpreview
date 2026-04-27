# Search Palette Quick Open Strategy

**Date:** 2026-04-27
**Status:** accepted
**Author:** session 2026-04-27

---

## Bối cảnh

MDpreview cần một cơ chế điều hướng file nhanh (Quick Open) tương tự các IDE hiện đại để tăng hiệu suất làm việc. Khi triển khai tính năng này, có hai thách thức chính:
1. **Hiệu năng**: Với các project có hàng ngàn file, việc tìm kiếm fuzzy match trên mỗi phím bấm có thể gây lag.
2. **UX**: Làm thế nào để hiển thị đường dẫn file một cách hữu ích nhất khi không gian chiều ngang bị hạn chế?

---

## Các lựa chọn đã cân nhắc

### Option 1: Tìm kiếm tức thì và hiển thị Full Path
- **Ưu:** Kết quả hiện ra ngay lập tức, thông tin đường dẫn đầy đủ.
- **Nhược:** Gây áp lực CPU lớn khi gõ nhanh. Đường dẫn dài bị cắt đuôi (ellipsis) khiến người dùng không biết file nằm trong folder cụ thể nào.

### Option 2: Tìm kiếm có Debounce và hiển thị Smart Path
- **Ưu:**
    - **Debounce (150ms)**: Giảm thiểu số lần tính toán vô ích, giúp giao diện mượt mà hơn.
    - **Smart Path**: Chỉ hiển thị 3 cấp thư mục cuối cùng (ví dụ: `.../folder/folder/file.md`), giúp người dùng nhận diện vị trí file cực nhanh.
    - **Recent Files**: Hiển thị lịch sử file khi ô tìm kiếm trống thay vì để trống giao diện.
- **Nhược:** Kết quả có độ trễ cực nhỏ (150ms) sau khi dừng gõ.

---

## Quyết định

**Chọn: Option 2 — Tìm kiếm có Debounce và hiển thị Smart Path**

Đây là sự cân bằng tốt nhất giữa hiệu năng kỹ thuật và trải nghiệm người dùng thực tế. Việc tích hợp file mở gần đây vào trạng thái ban đầu giúp Search Palette không chỉ là công cụ tìm kiếm mà còn là trung tâm điều hướng chính.

---

## Hệ quả

**Tích cực:**
- Hiệu năng search ổn định trên các project lớn.
- Giao diện kết quả trực quan, dễ định vị file nhờ rút gọn đường dẫn thông minh.
- Người dùng có thể quay lại file vừa mở ngay lập tức mà không cần gõ chữ.

**Tiêu cực / Trade-off:**
- Mất đi thông tin root folder của project trong chuỗi path hiển thị.

**Constraint tương lai:**
- Các logic tìm kiếm phức tạp trong tương lai (ví dụ content search) cũng nên áp dụng cơ chế Debounce tương tự để bảo vệ main thread.
