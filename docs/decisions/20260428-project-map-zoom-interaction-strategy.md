# Chiến lược Tương tác và Zoom cho Project Map

**Date:** 2026-04-28
**Status:** accepted
**Author:** session 2026-04-28

---

## Bối cảnh

Project Map ban đầu có tỉ lệ scale cố định dựa trên chiều rộng sidebar. Tuy nhiên, với các tài liệu cực dài, người dùng cần khả năng thu nhỏ (Zoom Out) để bao quát toàn bộ cấu trúc. Đồng thời, việc đặt các nút điều khiển trôi nổi (floating) bên trong vùng cuộn gây ra vấn đề về sự ổn định (bị che khuất khi cuộn) và hiệu năng (gọi lại server render mỗi lần thay đổi).

---

## Các lựa chọn đã cân nhắc

### Option 1: Floating Sticky Controls
- **Ưu:** Tiết kiệm diện tích.
- **Nhược:** Dễ bị vỡ layout khi nội dung cuộn phức tạp, cản trở việc click vào vùng nội dung dưới nút bấm.

### Option 2: Dedicated Footer Bar (Flexbox Architecture)
- **Ưu:** Tách biệt hoàn toàn logic cuộn (Body) và điều khiển (Footer). Các nút bấm luôn cố định và dễ truy cập. Cho phép hiển thị thêm thông tin (tỉ lệ % zoom).
- **Nhược:** Tốn một khoảng diện tích nhỏ ở dưới cùng thanh bên.

---

## Quyết định

**Chọn: Option 2 — Dedicated Footer Bar & Instant Zoom**

Chúng tôi quyết định cấu trúc lại Project Map thành một flex container với `__body` cuộn và `__footer` cố định. Đồng thời, thay đổi cơ chế Zoom sang **"Instant Zoom"** — chỉ cập nhật `transform: scale` và `height` của container cục bộ tại trình duyệt, loại bỏ hoàn toàn việc gọi lại API `/api/render-raw` khi chỉ thay đổi tỉ lệ.

---

## Hệ quả

**Tích cực:**
- Zoom mượt mà, phản hồi ngay lập tức (0ms latency).
- Giao diện chuyên nghiệp hơn với thông số % zoom rõ ràng.
- Tương tác click/drag không bị cản trở bởi các nút điều khiển.

**Tiêu cực / Trade-off:**
- Mất khoảng 36px diện tích ở dưới cùng thanh bên cho thanh footer.

**Constraint tương lai:**
- Tuyệt đối không gọi `update()` (fetch HTML) khi chỉ thay đổi `_zoomFactor`. Sử dụng `_applyZoom()` để tối ưu hiệu năng.
- Phải sử dụng các Atom chuẩn (`.ds-btn.ds-btn-off-label`) để tận dụng trạng thái `disabled` của hệ thống.
