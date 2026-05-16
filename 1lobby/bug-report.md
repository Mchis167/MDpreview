#New block typing bug
---

## Hiện tượng
Vấn đề block typing của monaco lại quay trở lại, biểu hiện của lần bug này được hình dưng như sau
- user load page
- tạo một tài liệu mới (new file)
- mở file -> file trắng
- chuyển sang type edit 
- typing : lúc này typing bị block, không thể gõ được
- thử tạo một draft mới và gõ -> không bị block
- mở một tài liệu khác (đã có content từ trước) -> chuyển sang edit -> gõ bình thường
- quay lại tab của tài liệu mới (rỗng) -> vẫn không gõ được
- paste một nội dung từ bên ngoài vào -> typing lại hoạt động

## Bug cũ tương tự đã fixed
/Users/mchisdo/MDpreview/.agents/session-logs/completed-session/session-log-editor-block-typing-debug-2026-05-15.md

## Logs