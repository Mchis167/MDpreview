# Hybrid ID Injection for TOC Navigation

**Date:** 2026-05-04
**Status:** accepted
**Author:** session 2026-05-04

---

## Bối cảnh

Tính năng Table of Contents (TOC) trên bản publish dựa vào các liên kết mỏ neo (`#id`). Tuy nhiên, HTML được gửi đến Cloudflare Worker có thể đến từ hai nguồn:
1. **Render tại Worker**: Markdown thô được gửi lên và Worker dùng `marked` để render.
2. **Render tại Local App**: HTML đã render sẵn được gửi lên (để đảm bảo tính đồng nhất 100% với editor).

Vấn đề là bộ render mặc định (cả ở server và app) không tự động sinh ID cho các thẻ heading. Nếu không có ID, TOC sidebar sẽ có các liên kết rỗng và không thể điều hướng hoặc highlight mục đang xem.

---

## Các lựa chọn đã cân nhắc

### Option 1: Chỉ sửa bộ Renderer của Worker
- **Ưu:** Hiệu năng tốt, sinh ID ngay lúc parse.
- **Nhược:** Không giải quyết được trường hợp HTML được gửi lên từ App Local (vốn đã mất ID từ trước).

### Option 2: Patch HTML bằng Regex trong Shell Builder
- **Ưu:** Bao phủ được mọi nguồn HTML (cả local và remote).
- **Nhược:** Regex replace trên chuỗi HTML lớn có rủi ro về edge case và hiệu năng nếu làm không khéo.

### Option 3: Hybrid Injection (Lựa chọn hiện tại)
- **Ưu:** Kết hợp cả hai: Sinh ID tại nguồn (Renderer) để tối ưu và "vá" ID tại Shell (Regex) để đảm bảo an toàn tuyệt đối.

---

## Quyết định

**Chọn: Option 3 — Hybrid ID Injection**

Chúng ta triển khai tiêm ID ở cả hai nơi:
1. **Renderer level**: Override `marked.Renderer` để sinh ID chuẩn ngay khi render.
2. **Shell level**: Cập nhật `extractHeadingsSSR` để vừa đọc heading vừa thực hiện `replace` các thẻ thiếu ID bằng phiên bản đã tiêm ID.

Lý do chọn: Đảm bảo TOC **luôn luôn hoạt động** bất kể nguồn dữ liệu HTML đến từ đâu, đồng thời giữ cho logic của Worker độc lập với backend cũ.

---

## Hệ quả

**Tích cực:**
- TOC hoạt động ổn định 100% trên bản live.
- Anchor links (`#slug`) hoạt động ngay cả khi copy link trực tiếp.
- Highlight active section chính xác nhờ ID đồng bộ.

**Tiêu cực / Trade-off:**
- Chi phí xử lý Regex tăng nhẹ khi render trang (không đáng kể với document thông thường).

**Constraint tương lai:**
- Mọi thay đổi về cách sinh ID (Slugify) phải được đồng bộ giữa Renderer và Shell để tránh lệch ID.
