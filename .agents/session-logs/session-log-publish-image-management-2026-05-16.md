# [Publish Image Management] Session Log — 2026-05-16

## 🔗 Liên kết (Links)
- **Log trước**: Không có (Task mới)
- **Log kế tiếp**: Đang chờ...

## 📝 Tổng quan (Overview)
Xây dựng hệ thống quản lý hình ảnh cho tính năng Publish. Mục tiêu là tự động tối ưu hóa hình ảnh (nén WebP, resize 1920px) tại local và upload lên Cloudflare R2 để hiển thị trên bản published của Worker.

## ✅ Đã hoàn thành
- [17:07] Đã tạo Master Implementation Plan tại `ImplementPlan/publish-image-management-2026-05-16.md`.
- [17:11] Đã chi tiết hóa Lượt thực hiện 1 (Infrastructure & Image Processor) tại `ImplementPlan/phase-1-infrastructure-and-processor.md`.
- [17:14] Hoàn thành Phase 1 & 2 (Lượt 1):
    - Worker: Đã config R2 binding, viết handler assets, cập nhật route index và delete logic.
    - Backend: Đã tạo module ImageProcessor (WebP + 1920px) và route proxy upload.
    - Đã fix lỗi lint tồn đọng trong project.
- [17:20] Hoàn thành Testing Lượt 1:
    - Đã chạy script test Electron thực tế cho `ImageProcessor`.
    - Xác nhận nén thành công (giảm size ~25% cho ảnh test).
    - Xác nhận logic fallback hoạt động tốt.

## ⚠️ Quyết định quan trọng
- **Storage:** Sử dụng Cloudflare R2 vì gói free 10GB và không tính phí egress.
- **Optimization:** Chỉ nén khi Publish để giữ bản local gốc chất lượng cao. Sử dụng định dạng **WebP** vì được Electron 28+ hỗ trợ native qua `nativeImage` và dung lượng cực thấp.
- **Scaling:** Giới hạn chiều rộng 1920px để cân bằng giữa chất lượng hiển thị và dung lượng lưu trữ.
- **Management:** Quản lý theo thư mục `{slug}` trên R2 để đồng bộ vòng đời với tài liệu (xóa slug = xóa hết ảnh liên quan). Không dùng hashing để tránh phức tạp và bug trong giai đoạn đầu.
- **Format Fallback:** Nếu môi trường Electron không hỗ trợ `toWebP`, module tự động chuyển sang `toJPEG (85)` để tránh crash và đảm bảo ảnh vẫn được nén.

## 🐛 Vấn đề đã gặp & cách giải quyết
- **Lỗi `toWebP is not a function`**: Phát hiện một số build Electron 28 không có sẵn codec WebP trong `nativeImage`. -> **Fix**: Thêm logic check feature và fallback sang JPEG.
- **Lỗi Lint `MonacoService is not defined`**: Xuất hiện trong `change-action-view-bar.js` (lỗi cũ của dự án). -> **Fix**: Cập nhật header `/* global ... */` cho file này.

- [17:36] Triển khai Worker thành công: R2 Bucket `mdpreview-publish-assets` đã live và được liên kết.
- [17:41] Phát hiện giới hạn hệ thống: `ImageProcessor` (Backend) phụ thuộc vào Electron `nativeImage`, do đó không nén được ảnh khi chạy ở chế độ Web App (`npm run serve`).

## ⚠️ Quyết định quan trọng
- **Portable Compression:** Quyết định chuyển logic nén ảnh từ Backend sang Renderer (Frontend) sử dụng HTML5 Canvas để hỗ trợ 100% cả Electron và Web App.

## 🐛 Vấn đề đã gặp & cách giải quyết
- **Lỗi `nativeImage is undefined` trên Web App**: Do chạy trên Node thuần không có Electron. -> **Giải pháp**: Sử dụng Canvas API trong trình duyệt để xử lý ảnh trước khi gửi dữ liệu lên proxy.

- [17:47] Hoàn thành Cross-platform Image Pipeline:
    - Đã tạo `ImageProcessorUtil.js` (Canvas-based) chạy được cả trên Browser và Electron.
    - Đã refactor `WorkerPublishAdapter.js` để thực hiện nén tại Frontend.
    - Đã cập nhật `server/routes/worker-publish.js` để nhận dữ liệu Base64 từ Frontend.
    - Xác nhận linting vượt qua 100%.
- [17:51] Sửa lỗi 404 link ảnh: Chuyển sang cơ chế thay thế bằng DOM (DOM manipulation) để đảm bảo độ chính xác tuyệt đối cho `src` và `xlink:href`.
- [17:55] Sửa lỗi fetch ảnh trên Web App: Xử lý triệt để vấn đề lặp tiền tố `/assets/` khi lấy dữ liệu ảnh từ server local.
- [18:02] Kiểm chứng thực tế: Hệ thống đã chạy mượt mà trên cả Electron và Web App.

## ⚠️ Quyết định quan trọng
- **Portable Compression:** Quyết định chuyển logic nén ảnh từ Backend sang Renderer (Frontend) sử dụng HTML5 Canvas để hỗ trợ 100% cả Electron và Web App.
- **Replacement Strategy:** Sử dụng DOM Parser thay vì Regex/String-split để tránh các lỗi liên quan đến đường dẫn tương đối và các ký tự đặc biệt trong HTML.

## 🐛 Vấn đề đã gặp & cách giải quyết
- **Lỗi `nativeImage is undefined` trên Web App**: Giải quyết bằng cách nén tại Frontend.
- **Lỗi link ảnh 404 sau khi publish**: Giải quyết bằng DOM-based replacement.
- **Lỗi fetch 404 trên Web App**: Giải quyết bằng logic resolve đường dẫn thông minh.

## 🔄 Đang dở / Session tiếp theo bắt đầu từ đây
- [ ] **Câu hỏi mở (Research Required):** Tìm kiếm và thử nghiệm các Engine nén ảnh mạnh hơn Browser Canvas API (ví dụ: `sharp` cho backend, hoặc các thư viện nén WebP/AVIF dựa trên WebAssembly - WASM) để tối ưu dung lượng ảnh hơn nữa.
- [ ] Task hiện tại đã hoàn thành về mặt chức năng (Functional complete), hệ thống đã sẵn sàng sử dụng.
