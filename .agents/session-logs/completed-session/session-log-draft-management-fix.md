# Draft Management & Persistence Fix Session Log

## 📝 Tổng quan (Overview)
Khắc phục các bug nhỏ và cải thiện tính nhất quán cho hệ thống Tab Bar và quản lý bản nháp (Drafts).

## ✅ Đã hoàn thành
- [2026-05-14 14:22]
  - Triển khai cơ chế **Garbage Collection** cho Drafts: Thêm `DraftModule.pruneOrphans()` để dọn dẹp các bản nháp không có tab tương ứng.
  - Tích hợp việc dọn dẹp vào `TabsModule.switchWorkspace()`: Đảm bảo dữ liệu "sạch" mỗi khi nạp workspace.
  - Đồng bộ hóa Server: Cập nhật `AppState` để lưu và nạp key `drafts_v2_` từ `/api/state`, bảo toàn nội dung nháp khi dùng ẩn danh hoặc chuyển máy.
  - Cập nhật Documentation: Cập nhật `CORE_APP.md`, `TABS.md` và tạo mới `DRAFT_SERVICE.md`.
- [2026-05-15 09:00]
  - Khắc phục lỗi **Frozen Editor**: Khôi phục hiển thị văn bản bằng cách xóa `color: transparent !important` trong `monaco-editor.css`.
  - Củng cố Lifecycle: Thêm `MonacoService.focus()` vào `MarkdownEditor.activate()` để đảm bảo editor sẵn sàng ngay sau khi mount.
  - Bảo vệ dữ liệu khi gõ: Thêm **Sync Guard** vào `DraftModule.renderPreview` để không ghi đè nội dung cũ lên editor đang được chỉnh sửa.
  - Sửa lỗi logic: Di chuyển unreachable listener phím `/` trong `EditorModule.js`.

## ⚠️ Quyết định quan trọng
- **Mô hình "Draft đi đôi với Tab":** Quyết định coi bất kỳ dữ liệu nháp nào không nằm trong danh sách tab đang mở là "rác" và tự động xóa bỏ. Điều này giúp hệ thống luôn gọn gàng và tránh được lỗi logic đếm số thứ tự.
- **Đồng bộ hóa toàn bộ `drafts_v2_`:** Chấp nhận tăng nhẹ kích thước payload khi sync state để đổi lấy sự tin cậy tuyệt đối về dữ liệu cho người dùng.
- **Ưu tiên nội dung tại Editor (Sync Guard):** Quyết định coi nội dung đang được gõ tại Editor là nguồn sự thật duy nhất (Source of Truth) khi người dùng đang ở chế độ chỉnh sửa, bỏ qua các bản render nháp từ server để tránh hiện tượng mất ký tự (typing overwrite).

## 🐛 Vấn đề đã gặp & cách giải quyết
- **Lỗi Draft 7:** Nguyên nhân là do dữ liệu nháp cũ bị kẹt trong `localStorage` cục bộ trong khi danh sách tab (được sync từ server) đã bị xóa hoặc thay đổi. Hệ thống đếm cũ quét toàn bộ bộ nhớ cục bộ nên bị sai số.
- **Fix:** Dùng `pruneOrphans` để đối soát và xóa các bản nháp "ma" ngay khi mở workspace.
- **Lỗi Editor "Đóng băng":** Văn bản bị tàng hình do CSS `color: transparent !important` áp dụng quá đà lên lớp cha `.monaco-editor`.
- **Fix:** Xóa bỏ các thuộc tính gây tàng hình trong `monaco-editor.css`, khôi phục lại hiển thị mặc định của Monaco.

## 🔄 Đang dở / Session tiếp theo bắt đầu từ đây
- Task hiện tại đã hoàn thành 100%. 
- Toàn bộ lỗi liên quan đến đóng băng Editor và mất đồng bộ Draft đã được xử lý.
- Định hướng tương lai: Nếu phát triển tính năng "Bản nháp đã đóng gần đây" (Draft History), cần sửa lại logic pruning để không xóa ngay lập tức mà chuyển vào một vùng đệm (buffer). Hiện tại không cần thiết.
