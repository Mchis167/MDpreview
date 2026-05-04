# Publishing Worker (`cf-publish-worker/`)

> Công cụ xuất bản tài liệu Markdown lên Edge (Cloudflare Workers) với hiệu ứng thị giác Premium.

---

## Kiến trúc Runtime (Phase 2.3)

Worker hoạt động dựa trên cơ chế **Dynamic Shell Injection**, cho phép cập nhật giao diện toàn cầu mà không cần re-publish tài liệu:

1. **Asset Router (`index.js`)**: 
    - Ưu tiên phục vụ các tài nguyên tĩnh từ thư mục `./public` (ví dụ: `publish.css`, `zoom.js`, `code-blocks.js`).
2. **Serving Logic (`serve.js`)**: 
    - **Legacy Detection**: Tự động nhận diện các tài liệu cũ đã được "Full Bake" (chứa thẻ `<html>` hoặc `<!DOCTYPE`). Nếu phát hiện, Worker sẽ trả về trực tiếp nội dung đó để đảm bảo tính tương thích ngược.
    - **Dynamic Injection**: Đối với tài liệu mới (chỉ chứa Body), Worker sẽ nhúng nội dung vào Shell HTML mới nhất được tạo ra bởi `shell.js`.
3. **Shell Generator (`shell.js`)**: 
    - Cung cấp khung HTML chuẩn, nạp các Design Tokens và JS Utilities.
    - **Asynchronous Initialization**: Đảm bảo Mermaid và Zoom logic chỉ khởi chạy sau khi DOM đã sẵn sàng, hỗ trợ cả sơ đồ đã render sẵn (pre-rendered) và sơ đồ động.

---

## Asset & CSS Pipeline

Để giữ giao diện Publish luôn đồng bộ 100% với App, dự án sử dụng script build tập trung:

```bash
# Sau khi sửa tokens.css, component CSS hoặc JS utilities
npm run build:publish-assets
```

Script này thực hiện:
1. **CSS Bundling**: Kết hợp `tokens.css` + Shared Components (`tab-bar.css`, `zoom-modal.css`) + `publish-styles.css`.
2. **JS Syncing**: Đồng bộ hóa bản mới nhất của `zoom.js` và `code-blocks.js` vào thư mục `public/` của Worker.

---

## Visual Parity & Interactions

Ngoài việc đồng bộ Style, bản Publish hiện đã hỗ trợ đầy đủ các tương tác cao cấp:

### 1. Mermaid Dynamic Zoom
Tích hợp hệ thống Zoom tương tác đồng bộ 1:1 với Project Map của App:
- Hiển thị thanh điều khiển (`zoom-controls-bar`) với các phím tắt và chỉ báo phần trăm.
- Hỗ trợ Pan/Zoom mượt mà trên cả máy tính và thiết bị di động.
- Tự động gán sự kiện click cho các sơ đồ Mermaid ngay khi trang được tải.

### 2. Interactive Code Blocks
Sử dụng `CodeBlockModule` chia sẻ để cung cấp:
- Nút Copy thông minh với phản hồi "Copied!".
- Badge ngôn ngữ lập trình.
- Hiệu ứng Glassmorphism và Scrollbar premium.

### 3. TOC & Side-Panel Layout
Tối ưu hóa khả năng điều hướng và cấu trúc tài liệu thông qua mô hình Side-Panel hiện đại:
- **Side-Panel Layout**: Thay thế giao diện Floating cũ bằng layout hai cột: Sidebar cố định (300px) và Nội dung chính (850px), giúp tách biệt rõ ràng luồng điều hướng và nội dung đọc.
- **Active Indicator**: Tích hợp thanh chỉ báo màu cam (ds-accent) cho mọi cấp độ tiêu đề (h2-h6) trong TOC, giúp người dùng luôn xác định được vị trí đang đọc trong tài liệu.
- **Hybrid ID Injection**: Tự động chèn thuộc tính `id` vào các thẻ Heading (`h2-h6`) ở cả tầng Renderer (chuyển đổi Markdown) và tầng Shell Builder (quét HTML đã render).
- **Vietnamese Slugification**: Thuật toán chuẩn hóa Unicode tạo ID không dấu, chuẩn SEO cho tiêu đề Tiếng Việt.
- **Enhanced Scroll Synchronization**: Đồng bộ vị trí cuộn với offset **200px**, giúp TOC highlight section mới sớm hơn và tự nhiên hơn khi đọc.

---
...
*Document — 2026-05-04 (Updated for Side-Panel Layout & TOC UX)*
