# [Universal Zoom System] Session Log

## 📝 Tổng quan (Overview)
Hiện đại hóa hệ thống zoom từ một tiện ích dành riêng cho Mermaid (`zoom.js`) thành một hệ thống `ZoomSystem` dùng chung, hỗ trợ cả SVG và hình ảnh (Assets), tích hợp Design System và tối ưu hóa UI/UX.

## ✅ Đã hoàn thành
- [Session 1 - 2026-05-15]
  - [18:35] Refactor `zoom.js` sang IIFE module `window.ZoomSystem`.
  - [18:36] Thêm hỗ trợ zoom hình ảnh (`type: 'image'`) với logic đợi `onload` để lấy kích thước tự nhiên.
  - [18:36] Cập nhật `mermaid.js` để gọi API `ZoomSystem.open`.
  - [18:36] Cập nhật `AssetDetailPanel.js` để xem ảnh asset bằng `ZoomSystem`.
  - [18:36] Fix lỗi cú pháp (stray 'k') trong `design-system-icons.js`.
  - [18:38] Nâng cấp `z-index` của Zoom Modal lên `var(--ds-z-index-max)` (9999).
  - [18:40] Tái cấu trúc các nút điều khiển sử dụng Atomic Component `.ds-icon-action-btn`.
  - [18:41] Đồng nhất vị trí nút đóng (top-right) sử dụng lại hệ thống biến `--_` của atomic component.
  - [18:42] Cập nhật hệ thống Tooltip lên `z-index: 100000` để luôn nằm trên cùng.
  - [18:54] Bổ sung lệnh "View Full Image" vào Context Menu của Asset Panel để kích hoạt Zoom trực tiếp.

## ⚠️ Quyết định quan trọng
- **Tách biệt Content Loading**: Sử dụng `async/await` trong `open()` để đảm bảo kích thước tự nhiên của ảnh được tính toán chính xác trước khi thực hiện `fitZoom`.
- **Atomic Component Reuse**: Chuyển từ class tùy chỉnh `.zoom-ctrl-btn` sang `.ds-icon-action-btn` để giảm thiểu code CSS và duy trì tính nhất quán của Design System.
- **Z-Index Stratification**: Đặt Tooltip ở mức 100,000 (cao nhất) và Zoom Modal ở mức 9,999 để đảm bảo Tooltip vẫn hiển thị được khi người dùng tương tác trong modal zoom.

## 🐛 Vấn đề đã gặp & cách giải quyết
- **Lỗi linter trong app.js**: Khi khai báo `ZoomSystem` trong block `/* global */` nhưng chỉ gọi qua `window.ZoomSystem`, ESLint báo lỗi unused. Cách giải quyết: Gọi trực tiếp `ZoomSystem.init()` sau khi check `typeof`.
- **Xung đột Z-index**: Zoom Modal ban đầu bị che bởi drawer của Asset Management. Cách giải quyết: Sử dụng token `--ds-z-index-max`.

## 🔄 Đang dở / Session tiếp theo bắt đầu từ đây
- Đã hoàn thành 100% các yêu cầu cốt lõi của sub-task Zoom System.
- Sẵn sàng tích hợp thêm các tính năng nâng cao như: Download image trực tiếp từ zoom modal hoặc Rotate ảnh nếu cần.
