# Unified Sidebar Structural Molecule

**Date:** 2026-04-26
**Status:** accepted
**Author:** session 2026-04-26

---

## Bối cảnh

Ứng dụng MDpreview sử dụng hệ thống 3 cột (Sidebar Trái | Main View | Sidebar Phải). Cả hai Sidebar (Trái và Phải) đều chia sẻ chung một phong cách thiết kế Glassmorphism đặc thù: độ mờ nền (blur), màu nền layer (layer-sidebar), bo góc và cấu trúc flex.

Trước đây, mỗi Sidebar tự định nghĩa các thuộc tính này trong file CSS riêng (`sidebar-left.css` và `right-sidebar.css`). Việc này dẫn đến:
1. Lặp lại mã nguồn (Code duplication).
2. Nguy cơ không nhất quán (Inconsistency) khi cập nhật thiết kế (ví dụ: đổi độ blur ở bên trái nhưng quên bên phải).

---

## Các lựa chọn đã cân nhắc

### Option 1: Duy trì CSS độc lập cho từng Sidebar
- **Ưu:** Tùy biến tối đa cho từng bên mà không ảnh hưởng lẫn nhau.
- **Nhược:** Khó bảo trì, vi phạm nguyên tắc DRY (Don't Repeat Yourself).

### Option 2: Trích xuất thành phân tử dùng chung (SidebarBase Molecule)
- **Ưu:** Một nguồn chân lý duy nhất cho phong cách Glassmorphism của các bảng điều khiển. Giảm đáng kể lượng mã CSS. Đảm bảo 100% sự đồng nhất về thị giác.
- **Nhược:** Cần thêm một lớp class CSS (`ds-sidebar-base`) vào cấu trúc DOM.

---

## Quyết định

**Chọn: Option 2 — Trích xuất thành phân tử dùng chung (SidebarBase Molecule)**

Dựa trên định hướng "Atomic Design System" của dự án, các thành phần có tính chất cấu trúc lặp lại cao nên được đóng gói thành Molecule. Việc này giúp việc quản lý thiết kế "Glass" của toàn bộ ứng dụng trở nên tập trung và chuyên nghiệp hơn.

---

## Hệ quả

**Tích cực:**
- Giảm ~40% mã CSS liên quan đến cấu trúc sidebar.
- Dễ dàng thay đổi giao diện đồng loạt (ví dụ: đổi từ Glass sang Flat) chỉ bằng cách sửa một file duy nhất.

**Tiêu cực / Trade-off:**
- Các Organism (SidebarLeft, RightSidebar) giờ đây phụ thuộc vào sự tồn tại của Molecule này.

**Constraint tương lai:**
- Tất cả các panel dạng sidebar mới PHẢI kế thừa từ `.ds-sidebar-base`.
- Không được định nghĩa lại các thuộc tính cốt lõi (blur, background, radius) trong các file CSS riêng của sidebar trừ khi có lý do đặc biệt (override có chủ đích).
