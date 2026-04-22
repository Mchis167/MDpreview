---
description: Cập nhật lịch sử thay đổi (Changelog) theo tiêu chuẩn chuyên nghiệp.
---

# 📜 Changelog Workflow

Workflow này đảm bảo mọi thay đổi trong dự án đều được ghi lại một cách minh bạch, có tổ chức trong file `CHANGELOG.md`.

## 📋 Các bước thực hiện

1.  **Xác định thay đổi (Identify Changes)**:
    *   Sau khi hoàn thành một task hoặc một phiên làm việc, tổng hợp các thay đổi đã thực hiện.
    *   Phân loại các thay đổi vào một trong các nhóm sau: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.

2.  **Cập nhật file (Update CHANGELOG.md)**:
    *   **Nguyên tắc chèn (Prepend)**: Luôn chèn bản ghi mới lên **đầu** danh sách các phần tử trong `CHANGELOG.md` (dưới mô tả chung). **TUYỆT ĐỐI KHÔNG GHI ĐÈ LÊN CÁC BẢN GHI CŨ.**
    *   **Thời gian chi tiết**: Sử dụng định dạng `YYYY-MM-DD HH:mm` (ví dụ: `## [Not Commited] — 2026-04-23 00:20`).
    *   Sử dụng gạch đầu dòng (`-`) cho mỗi thay đổi.
    *   Bôi đậm tên module hoặc tính năng quan trọng.

3.  **Kiểm tra tính nhất quán (Consistency Check)**:
    *   Đảm bảo duy trì toàn vẹn lịch sử cũ của file.

## ⚠️ Nguyên tắc quan trọng
> [!IMPORTANT]
> **MANDATORY**: Luôn luôn sử dụng tag `[Not Commited]` cho các bản ghi mới nhất. Tuyệt đối không tự ý gán số version (như 1.1.0) khi các thay đổi chưa được commit và release chính thức.

*   **Không ghi đè**: Mọi phần mới phải được thêm vào như một block mới hoặc append vào block `[Not Commited]` hiện có mà không làm mất dữ liệu trước đó.
*   **Ngôn ngữ**: Sử dụng ngôn ngữ thống nhất (Tiếng Anh hoặc Tiếng Việt).


---
> [!TIP]
> Sử dụng lệnh `/changelog` để nhắc AI thực hiện việc tổng kết và cập nhật lịch sử thay đổi sau mỗi phiên làm việc lớn.
