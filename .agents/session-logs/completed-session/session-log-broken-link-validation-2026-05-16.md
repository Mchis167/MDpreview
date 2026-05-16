# [Broken Link Validation] Session Log — 2026-05-16

## 🔗 Liên kết (Links)
- **Log trước**: Không có (Bắt đầu task mới trong session này)

## 📝 Tổng quan (Overview)
Xây dựng hệ thống phát hiện và cảnh báo ảnh bị lỗi (broken link) ngay trong lúc người dùng đang soạn thảo (real-time). Hệ thống đối soát link ảnh với danh sách file thực tế trên đĩa (White-list) và sử dụng bộ Tokenizer của Monaco để phân biệt ngữ cảnh (bỏ qua Code Blocks/Comments).

Hiện tại, mặc dù logic lõi đã vượt qua Automation Tests (5/5 PASS), hệ thống vẫn gặp vấn đề khi vận hành trên UI thực tế. Các nguyên nhân tiềm năng cần điều tra là sai lệch tên Token (`type`) giữa môi trường Mock và Browser, cùng với các race-condition trong vòng đời nạp dữ liệu của `AssetManager`.

## ✅ Đã hoàn thành
- [05:00] Triển khai `MonacoValidationService` (Regex + deltaDecorations).
- [05:20] Chuyển đổi sang Real-time Disk Check (assets + orphans) để hỗ trợ Draft mode.
- [05:30] Sửa lỗi Race Condition khởi tạo (Listener `workspace-changed`).
- [05:40] Triển khai logic loại trừ nội dung đặc biệt (Code blocks, Inline code, Comments) sử dụng `monaco.editor.tokenize`.
- [05:50] Cập nhật Automation Test Suite (5/5 PASS), đảm bảo logic cốt lõi đúng trên lý thuyết.

## ⚠️ Quyết định quan trọng
- **Token-based Exclusion**: Sử dụng bộ Tokenizer của Monaco để xác định ngữ cảnh thay vì dùng Regex phức tạp. Điều này giúp đồng bộ với Syntax Highlighting của Editor.
- **Empty Registry Guard**: Tạm dừng validation nếu `AssetManager` chưa có dữ liệu để tránh báo lỗi giả hàng loạt khi ứng dụng vừa khởi động.

## 🐛 Vấn đề đã gặp & cách giải quyết
- **Lỗi: Báo đỏ toàn bộ**: Do workspace chưa load xong. Giải quyết bằng cách đợi sự kiện `workspace-changed`.
- **Lỗi: Vẫn báo đỏ trong Code Block (thực tế)**: Mặc dù Test Pass, nhưng có thể tên Token trong môi trường thực tế khác với Mock (ví dụ: `markup.fenced_code.block.markdown` thay vì `variable.source`).
- **ESLint no-undef**: Các global `monaco`, `MonacoService` cần được khai báo `/* global */` ở đầu file.

## ✅ Đã hoàn thành (Tiếp tục)
- [05:30] Triển khai Full Content Tokenization cho `MonacoValidationService` để xử lý chính xác ngữ cảnh đa dòng (multi-line).
- [05:40] Mở rộng danh sách Exclusion List (`pre`, `code`, `script`, `style`, `metatag`) để đồng bộ với `AssetService`.
- [05:45] Xác minh bằng Automation Tests (5/5 PASS) và Lint (0 errors/warnings).
- [05:55] Nâng cấp tính năng **Surgical Suppression**: Chỉ ẩn cảnh báo lỗi của duy nhất link đang được chỉnh sửa, giữ nguyên các cảnh báo cho các link khác trong file.

## ⚠️ Quyết định quan trọng
- **Full Content Tokenization**: Chọn phương pháp tokenize toàn bộ nội dung trong mỗi lần validation pass (đã được debounce) để đảm bảo độ chính xác tuyệt đối về ngữ cảnh mà không làm giảm đáng kể hiệu năng.
- **Surgical Tracking**: Lưu trữ ánh xạ chi tiết giữa `Range`, `DecorationId` và `Marker` để thực hiện các thao tác xóa chọn lọc chính xác tại vị trí con trỏ mà không làm ảnh hưởng đến trạng thái chung của editor.

## 🔄 Đang dở / Session tiếp theo bắt đầu từ đây
- **Hành động tiếp theo**: Quan sát phản hồi thực tế từ UI để xem còn trường hợp nào bị "False Red" không.
- **Hành động tiếp theo**: Xem xét việc tối ưu hóa hiệu năng nếu file Markdown trở nên cực lớn (ví dụ: chỉ tokenize các dòng trong viewport).
