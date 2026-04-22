---
description: Workflow này tự động hóa quy trình đẩy code dựa trên nội dung trong `CHANGELOG.md` và tự động tăng số phiên bản.
---

🚀 Smart GitHub Automation Workflow

Workflow này tự động hóa quy trình đẩy code dựa trên nội dung trong `CHANGELOG.md` và tự động tăng số phiên bản.

## 📋 Quy trình thực hiện

1.  **Đọc Changelog**: Tìm tất cả các mục nằm trong phần `## [Unreleased]`.
2.  **Tổng hợp nội dung**: Sử dụng các mục `Unreleased` đó để tạo nội dung cho commit message (ví dụ: "Deploy: [Tính năng A], [Sửa lỗi B]").
3.  **Xác định phiên bản mới**:
    *   Tìm phiên bản gần nhất trong `CHANGELOG.md` (ví dụ: `[1.1.0]`).
    *   Tự động tăng số phiên bản (ví dụ: `1.1.0` -> `1.2.0` hoặc theo yêu cầu).
4.  **Thực hiện Git**:
    *   // turbo
    *   `git add .`
    *   // turbo
    *   `git commit -m "🚀 Release [Version]: [Nội dung tổng hợp]"`
    *   // turbo
    *   `git push origin main`
5.  **Chốt phiên bản**:
    *   Sau khi push thành công, quay lại `CHANGELOG.md`.
    *   Thay thế `## [Unreleased]` bằng `## [vMới] — YYYY-MM-DD HH:mm`.

## ⚠️ Nguyên tắc
*   Chỉ push khi có nội dung trong phần `Unreleased`.
*   Luôn giữ định dạng chuẩn của Changelog để không làm hỏng lịch sử.

---
> [!TIP]
> Gõ `/github` để AI tự động phân tích và "lên sàn" phiên bản mới.
