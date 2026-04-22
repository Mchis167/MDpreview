---
description: Lập kế hoạch chi tiết trước khi thực hiện bất kỳ thay đổi mã nguồn nào.
---

# 📝 Plan-First Workflow

Workflow này bắt buộc AI phải phân tích kỹ lưỡng và lập kế hoạch thực hiện (Implementation Plan) trước khi bắt đầu viết code thật.

## 📋 Quy trình thực hiện

1.  **Phân tích yêu cầu (Analyze)**:
    *   Đọc kỹ yêu cầu của người dùng.
    *   Khám phá cấu trúc thư mục và các file liên quan bằng `list_dir` và `grep_search`.
    *   Xem nội dung các file quan trọng bằng `view_file`.

2.  **Tạo bản kế hoạch (Create Plan)**:
    *   Sử dụng công cụ `write_to_file` để tạo một artifact `implementation_plan`.
    *   Kế hoạch phải bao gồm:
        *   **Mục tiêu**: Những gì cần đạt được.
        *   **Các file sẽ thay đổi**: Danh sách các file và lý do.
        *   **Các bước thực hiện**: Thứ tự logic để triển khai.
        *   **Rủi ro/Lưu ý**: Các vấn đề tiềm ẩn hoặc ràng buộc kiến trúc.
    *   Đặt `RequestFeedback: true` trong metadata của artifact để chờ người dùng phê duyệt.

3.  **Chờ xác nhận (Wait for Approval)**:
    *   Dừng lại và hỏi người dùng: "Bạn có đồng ý với kế hoạch này không? Tôi có cần điều chỉnh gì trước khi bắt đầu thực hiện không?"
    *   **KHÔNG** được thực hiện bất kỳ thay đổi code nào (write/replace) cho đến khi người dùng xác nhận.

4.  **Thực thi (Execute)**:
    *   Sau khi nhận được sự đồng ý, chuyển sang sử dụng `/smart-edit` hoặc các công cụ chỉnh sửa để thực hiện theo đúng kế hoạch.

## ⚠️ Nguyên tắc quan trọng
*   Luôn tạo artifact kế hoạch trước.
*   Tuyệt đối không viết code "nháp" hoặc code "thật" vào project khi chưa có kế hoạch được phê duyệt.
*   Nếu kế hoạch thay đổi trong quá trình làm, hãy cập nhật lại artifact kế hoạch.

---
> [!IMPORTANT]
> Kích hoạt bằng lệnh `/plan` để đảm bảo mọi thay đổi phức tạp đều được chuẩn bị kỹ lưỡng.
