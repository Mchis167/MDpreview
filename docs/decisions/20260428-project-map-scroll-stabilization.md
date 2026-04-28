# Chiến lược Ổn định Thanh cuộn và Đồng bộ Viewport cho Project Map

**Date:** 2026-04-28
**Status:** accepted
**Author:** session 2026-04-28

---

## Bối cảnh

Khi tài liệu dài, Project Map cần tự động cuộn để giữ vùng highlight (Viewport Indicator) luôn nằm trong tầm mắt người dùng. Tuy nhiên, do đặc tính của Flexbox và `transform: scale()`, container của bản đồ thường bị giãn nở quá mức (Layout Overflow), làm mất khả năng cuộn của phần tử (clientHeight = scrollHeight), khiến lệnh `scrollTop` bị vô hiệu hóa.

---

## Các lựa chọn đã cân nhắc

### Option 1: CSS-only constraints (overflow: hidden/auto)
- **Ưu:** Sạch sẽ, đúng chuẩn.
- **Nhược:** Dễ bị phá vỡ bởi cấu trúc flex phức tạp hoặc padding của các phần tử cha trong hệ thống UI hiện tại.

### Option 2: JS Height Enforcement (The JS Hack)
- **Ưu:** Cực kỳ ổn định, "kháng" được các lỗi giãn nở layout từ cấp cha, đảm bảo thanh cuộn luôn hoạt động.
- **Nhược:** Can thiệp trực tiếp vào `style` của DOM qua JS.

---

## Quyết định

**Chọn: Option 2 — JS Height Enforcement**

Chúng tôi quyết định sử dụng JS để ép chiều cao của Project Map phải khớp với chiều cao thực tế của vùng nhìn thấy (`parentElement.clientHeight`) tại mỗi nhịp cuộn. Đồng thời, thay đổi hệ quy chiếu tính toán cuộn sang phần tử cha để đảm bảo tính chính xác ngay cả khi layout bị biến động.

---

## Hệ quả

**Tích cực:**
- Giải quyết triệt để lỗi "mất dấu" Viewport Indicator trên các tài liệu dài.
- Tự động thích ứng với việc thay đổi kích thước sidebar mà không cần cấu hình CSS phức tạp.

**Tiêu cực / Trade-off:**
- Tạo ra một phụ thuộc nhỏ vào `clientHeight` của phần tử cha trong logic JS.

**Constraint tương lai:**
- Không được gỡ bỏ logic ép chiều cao trong `ProjectMap._updateViewportIndicator` trừ khi toàn bộ chuỗi Layout (TOC Panel -> Body) được thiết kế lại với các ràng buộc tĩnh (static constraints).
