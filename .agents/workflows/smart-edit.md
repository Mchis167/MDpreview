---
description: Chỉnh sửa mã nguồn thông minh, chỉ thay đổi những phần cần thiết (Surgical Edits)
---

# 🛠️ Smart Edit Workflow

Workflow này đảm bảo rằng các thay đổi mã nguồn được thực hiện một cách chính xác, tối giản (minimal diffs) và không ghi đè toàn bộ nội dung file một cách lãng phí.

## 📋 Quy trình thực hiện

1.  **Xác định vị trí (Locate)**:
    *   Sử dụng `view_file` với các tham số `StartLine` và `EndLine` để xem chính xác đoạn code cần sửa.
    *   Xác định số dòng chính xác để tránh sai sót khi thay đổi.

2.  **Lập kế hoạch chỉnh sửa (Plan)**:
    *   Chỉ xác định những dòng thực sự cần thay đổi.
    *   Nếu có nhiều phần không liên tục cần sửa trong cùng một file, hãy chuẩn bị sử dụng `multi_replace_file_content`.

3.  **Thực thi chỉnh sửa (Execute)**:
    *   🚫 **Hạn chế tối đa** việc dùng `write_to_file` cho các file đã tồn tại.
    *   ✅ **Ưu tiên** dùng `replace_file_content` cho một khối code duy nhất.
    *   ✅ **Ưu tiên** dùng `multi_replace_file_content` khi cần sửa nhiều vị trí khác nhau trong file.
    *   Đảm bảo `TargetContent` khớp hoàn toàn với nội dung hiện có (bao gồm cả khoảng trắng).

4.  **Kiểm tra (Verify)**:
    *   Sau khi sửa, sử dụng `view_file` tại khu vực vừa sửa để đảm bảo code mới đã được áp dụng đúng và không làm hỏng cấu trúc xung quanh.

## ⚠️ Nguyên tắc quan trọng
*   Không bao giờ thay thế toàn bộ file nếu chỉ cần sửa một vài dòng.
*   Giữ nguyên các comment và cấu trúc code không liên quan đến thay đổi.
*   Luôn kiểm tra lại số dòng trước khi thực hiện lệnh replace.

---
> [!TIP]
> Kích hoạt bằng lệnh `/smart-edit` hoặc `/edit` để yêu cầu sửa đổi mã nguồn một cách tối ưu nhất.
