---
description: 
---

🧪 Test Case Canvas Workflow

Workflow này giúp tự động hóa quy trình tạo tài liệu kiểm thử (Test Case Artifact) cho các tính năng mới trong MDpreview.

## 📋 Quy trình thực hiện

1.  **Phân tích (Analyze)**:
    *   Đọc các file mã nguồn liên quan đến tính năng mới.
    *   Xác định các luồng xử lý chính (Main Flows) và các điểm giao tiếp giữa các Module.

2.  **Thiết kế Test Suite (Design)**:
    *   Xây dựng danh sách Test Case chia theo 4 nhóm:
        *   **Functional**: Chức năng cốt lõi.
        *   **Storage/Lifecycle**: Lưu trữ, Persistence và Vòng đời dữ liệu.
        *   **UI/UX**: Giao diện, Tooltip, Giới hạn và Phản hồi người dùng.
        *   **Integration**: Tương tác với các module khác (Comments, Sidebar, Editor).

3.  **Tạo Artifact (Execute)**:
    *   Sử dụng công cụ `write_to_file` để tạo một file `.md` trong thư mục `brain/<conversation-id>/`.
    *   Đặt tên file theo định dạng: `<feature_name>_test_cases.md`.
    *   Sử dụng định dạng bảng (Table) để tài liệu dễ tra cứu.

4.  **Bàn giao (Deliver)**:
    *   Cung cấp đường dẫn file Artifact cho người dùng.
    *   Tóm tắt các điểm quan trọng cần lưu ý khi thực hiện test.

## ⚠️ Nguyên tắc
*   Luôn bao gồm ít nhất 1 Test Case cho "Edge Case" (Trường hợp biên).
*   Đảm bảo có hướng dẫn giả lập (Console Script) cho các trường hợp khó test thủ công (ví dụ: test thời gian thực).
