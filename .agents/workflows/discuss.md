---
description: Chế độ chỉ thảo luận, không chỉnh sửa mã nguồn
---

# 🗣️ Discuss Workflow

Sử dụng workflow này khi bạn chỉ muốn thảo luận về giải pháp, phân tích kiến trúc hoặc tìm hiểu mã nguồn mà không muốn Agent thực hiện bất kỳ thay đổi nào.

## 📋 Quy trình thực hiện

1.  **Phân tích (Research)**:
    *   Agent sẽ tìm kiếm và đọc các file liên quan để hiểu rõ vấn đề.
    *   Agent có thể sử dụng `grep_search`, `list_dir`, `view_file` để thu thập thông tin.

2.  **Đề xuất (Propose)**:
    *   Agent trình bày phân tích chi tiết về logic hiện tại.
    *   Đề xuất các thay đổi cần thiết hoặc giải pháp kiến trúc mới.
    *   Sử dụng các đoạn mã (code blocks) trong phản hồi để minh họa, thay vì áp dụng trực tiếp vào file.

3.  **Hạn chế (Constraints)**:
    *   🚫 **KHÔNG** sử dụng `write_to_file`.
    *   🚫 **KHÔNG** sử dụng `replace_file_content` hoặc `multi_replace_file_content`.
    *   🚫 **KHÔNG** chạy các command mang tính thay đổi hệ thống (`rm`, `mv`, v.v.).
    *   🚫 **KHÔNG** thực hiện `git commit` hoặc các thao tác thay đổi git state.

4.  **Kết thúc (Completion)**:
    *   Agent dừng lại sau khi đã giải thích xong và chờ hướng dẫn tiếp theo từ người dùng.
    *   Chỉ khi người dùng yêu cầu chuyển sang workflow thực thi (như `/fix` hoặc `/implement`), Agent mới được phép sửa code.

---
> [!TIP]
> Bạn có thể kích hoạt workflow này bằng cách gõ `/discuss` trong khung chat.
