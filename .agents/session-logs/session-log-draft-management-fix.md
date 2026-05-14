# Draft Management & Persistence Fix Session Log

## 📝 Tổng quan (Overview)
Khắc phục các bug nhỏ và cải thiện tính nhất quán cho hệ thống Tab Bar và quản lý bản nháp (Drafts).

## ✅ Đã hoàn thành
- [2026-05-14 14:22]
  - Triển khai cơ chế **Garbage Collection** cho Drafts: Thêm `DraftModule.pruneOrphans()` để dọn dẹp các bản nháp không có tab tương ứng.
  - Tích hợp việc dọn dẹp vào `TabsModule.switchWorkspace()`: Đảm bảo dữ liệu "sạch" mỗi khi nạp workspace.
  - Đồng bộ hóa Server: Cập nhật `AppState` để lưu và nạp key `drafts_v2_` từ `/api/state`, bảo toàn nội dung nháp khi dùng ẩn danh hoặc chuyển máy.
  - Cập nhật Documentation: Cập nhật `CORE_APP.md`, `TABS.md` và tạo mới `DRAFT_SERVICE.md`.

## ⚠️ Quyết định quan trọng
- **Mô hình "Draft đi đôi với Tab":** Quyết định coi bất kỳ dữ liệu nháp nào không nằm trong danh sách tab đang mở là "rác" và tự động xóa bỏ. Điều này giúp hệ thống luôn gọn gàng và tránh được lỗi logic đếm số thứ tự.
- **Đồng bộ hóa toàn bộ `drafts_v2_`:** Chấp nhận tăng nhẹ kích thước payload khi sync state để đổi lấy sự tin cậy tuyệt đối về dữ liệu cho người dùng.

## 🐛 Vấn đề đã gặp & cách giải quyết
- **Lỗi Draft 7:** Nguyên nhân là do dữ liệu nháp cũ bị kẹt trong `localStorage` cục bộ trong khi danh sách tab (được sync từ server) đã bị xóa hoặc thay đổi. Hệ thống đếm cũ quét toàn bộ bộ nhớ cục bộ nên bị sai số.
- **Fix:** Dùng `pruneOrphans` để đối soát và xóa các bản nháp "ma" ngay khi mở workspace.

## 🔄 Đang dở / Session tiếp theo bắt đầu từ đây
- Task hiện tại đã hoàn thành 100%. 
- Định hướng tương lai: Nếu phát triển tính năng "Bản nháp đã đóng gần đây" (Draft History), cần sửa lại logic pruning để không xóa ngay lập tức mà chuyển vào một vùng đệm (buffer). Hiện tại không cần thiết.
