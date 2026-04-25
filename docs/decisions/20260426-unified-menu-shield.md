# Unified Floating Menu Architecture (MenuShield)

**Date:** 2026-04-26
**Status:** accepted
**Author:** session 2026-04-26

---

## Bối cảnh

Ứng dụng MDpreview có nhiều loại menu nổi khác nhau: Menu ngữ cảnh (Context Menu - click chuột phải) và các Menu cài đặt nhanh (Trigger-based - như Explorer Preferences). 

Trước đây, mỗi loại menu tự quản lý "lớp vỏ" (shell), logic định vị và logic đóng/mở riêng lẻ. Điều này dẫn đến sự không nhất quán về mặt thị giác (độ dày viền, độ mờ nền khác nhau) và lặp lại mã nguồn đáng kể. Khi nhu cầu chuyển đổi từ các Popover nặng nề sang các menu dạng "Glass" nhẹ nhàng tăng lên, chúng ta cần một kiến trúc hợp nhất để quản lý các thành phần này.

---

## Các lựa chọn đã cân nhắc

### Option 1: Các thành phần độc lập (Status Quo)
- **Ưu:** Kiểm soát tuyệt đối hành vi riêng biệt cho từng loại menu.
- **Nhược:** Lặp lại code logic (định vị, click-outside, phím Escape). Khó duy trì sự đồng nhất về Design System (viền, đổ bóng).

### Option 2: Thành phần lớp vỏ hợp nhất (MenuShield Molecule)
- **Ưu:** Một nguồn chân lý duy nhất (Source of Truth) cho phong cách Glassmorphism. Hợp nhất thuật toán định vị thông minh (Smart Positioning). Quản lý trạng thái Singleton (chỉ một menu mở tại một thời điểm) một cách tự nhiên.
- **Nhược:** Cần một lớp trừu tượng để truyền nội dung vào, yêu cầu các component gọi phải tuân thủ chuẩn render.

---

## Quyết định

**Chọn: Option 2 — Thành phần lớp vỏ hợp nhất (MenuShield Molecule)**

Sự nhất quán là yếu tố then chốt cho một giao diện "Premium". Việc hợp nhất lớp vỏ đảm bảo mọi menu nổi trong ứng dụng đều chia sẻ chung một phong cách viền siêu mỏng (Ultra-thin), độ mờ nền và đổ bóng đồng nhất. Nó cũng giúp tách biệt hoàn toàn logic "trình bày" (vỏ) và logic "nội dung" (items/toggles).

---

## Hệ quả

**Tích cực:**
- Giảm đáng kể lượng CSS trùng lặp.
- Hành vi định vị thông minh (tự lật trên/dưới) được áp dụng tự động cho mọi menu.
- Dễ dàng triển khai các tính năng nâng cao như "Toggle thông minh" (đóng khi click lại nút kích hoạt).

**Tiêu cực / Trade-off:**
- Các component muốn hiển thị menu phải được bóc tách phần nội dung khỏi phần vỏ, đòi hỏi cấu trúc module hóa rõ ràng hơn.

**Constraint tương lai:**
- Tất cả các menu nổi mới (ngoại trừ Popover chính thống) **PHẢI** sử dụng `MenuShield` để hiển thị nội dung.
- Không được tự ý định nghĩa lại border hoặc shadow cho các container menu bên trong `MenuShield`.
