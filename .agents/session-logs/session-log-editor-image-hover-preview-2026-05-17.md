# [Editor Image Hover Preview] Session Log — 2026-05-17

## 🔗 Liên kết (Links)
- **Log trước**: Không có (Khởi tạo task mới)
- **Log kế tiếp**: [Chưa có]

## 📝 Tổng quan (Overview)
Nâng cấp trải nghiệm người dùng trong editor bằng cách hiển thị khung preview ảnh khi di chuột (hover) qua các đường dẫn ảnh (Markdown hoặc HTML). Mục tiêu là tạo ra một UI cao cấp, mượt mà và hoạt động tin cậy trong môi trường Monaco Editor.

## ✅ Đã hoàn thành
- [06:05] Tạo Implementation Plan và Service cơ sở `MonacoHoverService`.
- [06:06] Đăng ký Service vào `index.html` và khởi tạo trong `app.js`.
- [06:09] Cải thiện UI Hover mặc định của Monaco (thêm header, footer, CSS styling).
- [06:11] Nhận thấy Monaco Hover Provider mặc định có hạn chế về hiển thị ảnh (thường bị strip thẻ img) và vị trí (không ép buộc được nằm dưới con trỏ).
- [06:12] Chuyển đổi sang kiến trúc **Custom Molecule**:
    - Tạo `MonacoImagePreviewComponent` (Molecule) với UI glassmorphism.
    - Rewrite `MonacoHoverService` để sử dụng `onMouseMove` và tính toán tọa độ viewport thủ công.
    - Tích hợp vòng đời Service vào `EditorModule` (activate/deactivate).
- [06:13] Kiểm tra Linting đạt 0 lỗi, 0 cảnh báo.

## ⚠️ Quyết định quan trọng
- **Approach Change**: Từ bỏ `monaco.languages.registerHoverProvider` để chuyển sang Manual Mouse Tracking. Lý do: Monaco mặc định không cho phép kiểm soát vị trí tooltip (thường lệch sang phải) và có cơ chế bảo mật nghiêm ngặt đối với nội dung HTML/Image trong Hover content, dẫn đến việc ảnh không hiển thị được.
- **Sử dụng `MonacoImagePreviewComponent`**: Thay vì dùng Monaco Overlay Widget, ta dùng một `fixed div` (Molecule) để dễ dàng quản lý layer và hiệu ứng CSS premium (backdrop-blur, shadow).

## 🐛 Vấn đề đã gặp & cách giải quyết
- **Lỗi không hiển thị ảnh**: Do Monaco Hover nội bộ không render tốt thẻ `<img>`. Giải quyết bằng cách dùng `MonacoImagePreviewComponent` chứa thẻ `<img>` thật của DOM.
- **Vị trí không chính xác**: Monaco tự động nhảy vị trí Hover. Giải quyết bằng cách dùng `editor.getScrolledVisiblePosition` để lấy tọa độ pixel của link và ép khung preview nằm ngay bên dưới.

## 🔄 Đang dở / Session tiếp theo bắt đầu từ đây
- **BUG**: Hiện tại tính năng vẫn được báo cáo là "không hoạt động" dù code logic đã đầy đủ.
- **Nghi vấn**: 
    1.  Tọa độ `rect` trả về từ `getScrolledVisiblePosition` có thể đang bị lệch do viewport scaling hoặc editor container offset.
    2.  `getTargetAtClientPoint` có thể không trả về `position` chính xác khi mouse di chuyển nhanh.
    3.  `MonacoImagePreviewComponent` có thể đang bị các layer khác che khuất (`z-index`).
- **Hướng đi tiếp theo**: Đặt [DIAG] logs tại `_handleMouseMove` để kiểm tra tọa độ thực tế và kiểm tra xem component có thực sự được gắn vào DOM và có thuộc tính `visible` không.
