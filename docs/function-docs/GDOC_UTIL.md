# GDocUtil (`renderer/js/utils/gdoc-util.js`)

> Utility hỗ trợ chuyển đổi nội dung HTML sang định dạng thân thiện với Google Docs bằng cách nhúng Style (Inlining) và Rasterize biểu đồ.

---

## Mục đích

Google Docs không hỗ trợ CSS bên ngoài (External CSS) và các thẻ SVG động. `GDocUtil` giúp chuẩn hóa nội dung để khi paste vào GDoc, định dạng bảng, màu sắc code và biểu đồ Mermaid vẫn được giữ nguyên.

---

## Key Functions

### `transform(html, mountNode?)`
Chuyển đổi toàn bộ HTML sang định dạng Rich Text. Quá trình xử lý các biểu đồ được thực hiện **tuần tự (Sequential)** để đảm bảo độ ổn định của Clipboard và hỗ trợ hiển thị Progress Bar.

**Flow:**
1. **Tables**: Thiết lập `border-collapse: collapse`, thêm thuộc tính `border="1"`, và gán màu nền cho thẻ `TH`.
2. **Code Blocks**: Inline phong cách cho thẻ `pre` và `code` (background xám nhạt, font monospace). Nhúng trực tiếp màu sắc cho các class syntax highlight (`hljs-*`).
3. **Blockquotes**: Thêm thanh dọc (`border-left`) và màu chữ xám để phân biệt trích dẫn.
4. **SVG Rasterization**: Tìm tất cả các biểu đồ Mermaid (SVG), thực hiện chuyển đổi sang ảnh PNG.
   - Hiển thị **Progress Toast** nếu `mountNode` được cung cấp.
   - Sử dụng cơ chế xử lý lỗi độc lập cho từng biểu đồ (Timeout 5s).

---

## Xử lý Biểu đồ (SVG to PNG)

### `_svgToPng(svgElement)`
Thuật toán chuyển đổi SVG sang PNG chất lượng cao, giải quyết các vấn đề về hiển thị trên Google Docs:

1. **Inline Styles**: Sao chép `computedStyle` vào thuộc tính `style` trực tiếp. Mở rộng danh sách thuộc tính bao gồm `text-anchor`, `dominant-baseline`, `letter-spacing` để giữ đúng vị trí văn bản.
2. **Renderer-side Canvas Rasterization**: Thực hiện render hoàn toàn tại Renderer process (thay vì Native IPC) để bảo toàn đầy đủ các style CSS phức tạp của Mermaid.
   - **Retina Scale**: Render ở tỉ lệ x2 để đảm bảo độ sắc nét.
   - **Font Handling**: Ép font `Arial, sans-serif` và `white-space: pre` cho các phần tử văn bản để tránh lỗi cắt chữ (clipping) do sai lệch metrics.
3. **Unicode-safe Base64**: Sử dụng encoding an toàn cho dữ liệu SVG để tránh lỗi bảo mật "Tainted Canvas" khi xuất ra PNG.
4. **Dark Mode Background**: Tự động thêm nền `#1e1e1e` cho ảnh PNG để đảm bảo các sơ đồ thiết kế cho Dark Mode hiển thị rõ nét trên nền văn bản trắng.

---

## Logging & Debugging

Hệ thống cung cấp log chi tiết trong Console (`[GDOC DEBUG]`) về trạng thái xử lý từng biểu đồ (`[✓] Success` / `[✗] Failed`) kèm theo thời gian thực thi, giúp dễ dàng chẩn đoán lỗi tài liệu.

---

*Document — 2026-04-29 (Sequential rendering & High-fidelity rasterization)*
