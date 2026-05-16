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
- [19:15] Hoàn thành Tích hợp WASM Image Compression (jSquash):
    - Đã cài đặt và cấu hình bộ codec jSquash (WebP, MozJPEG, OxiPNG).
    - Xây dựng hệ thống Web Worker đa luồng (Worker Pool) để nén ảnh không gây lag UI.
    - Chuyển đổi sang kiến trúc **Hybrid Pipeline**: Resize (Canvas) -> Encode (WASM Worker).
    - Cập nhật `ImageProcessorUtil.js` hỗ trợ cả 3 định dạng với chất lượng nén tối ưu.
    - Đã kiểm chứng thực tế với asset ngẫu nhiên trong workspace (Giảm size từ 537KB xuống 45KB ~ 91%).


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

- **Hybrid Compression Strategy:** Quyết định dùng Canvas để **Resize** (tận dụng tốc độ GPU) và dùng WASM trong **Web Worker** để **Encode** (tận dụng chất lượng nén của MozJPEG/WebP).
- **Bundling Strategy:** Sử dụng `esbuild` để đóng gói Worker và dependencies thành 1 file bundle duy nhất nhằm giải quyết vấn đề "bare module imports" của jSquash trong môi trường không có bundler mặc định.
- **WASM Deployment:** Đặt các binary WASM tại `renderer/js/lib/jsquash/wasm/` để đảm bảo chúng được phục vụ bởi route `/js/` đã có sẵn, tránh lỗi 404/shadowing của hệ thống assets workspace mà không cần khởi động lại server.
- **Initialization:** Sử dụng `WebAssembly.compile()` một cách chủ động trong Worker để tạo `Module` trước khi truyền vào jSquash, giúp tránh các lỗi không tương thích định dạng buffer (đặc biệt là MozJPEG).

## 🐛 Vấn đề đã gặp & cách giải quyết
- **Lỗi `nativeImage is undefined` trên Web App**: Giải quyết bằng cách nén tại Frontend.
- **Lỗi link ảnh 404 sau khi publish**: Giải quyết bằng DOM-based replacement.
- **Lỗi fetch 404 trên Web App**: Giải quyết bằng logic resolve đường dẫn thông minh.
- **Lỗi 404 cho file .wasm**: Do route `/assets/` ưu tiên tìm trong workspace. -> **Fix**: Di chuyển WASM vào thư mục con của `/js/` (lib/jsquash/wasm).
- **Lỗi `Failed to execute 'postMessage'`**: Do truyền nhầm `.buffer` của một `ArrayBuffer`. -> **Fix**: Truyền trực tiếp `ArrayBuffer` vào transfer list.
- **Lỗi `expected magic word` (HTML returned instead of WASM)**: Do server trả về trang 404 thay vì file binary. -> **Fix**: Đổi sang route tĩnh tin cậy.
- **Lỗi `simd is not defined` (Bare module import)**: Các thư viện jSquash dùng ESM bare imports không chạy được trên browser. -> **Fix**: Dùng `esbuild` đóng gói Worker.

## 🔄 Đang dở / Session tiếp theo bắt đầu từ đây
- [ ] Tích hợp UI hiển thị tiến độ nén ảnh (Progress bar) khi publish tài liệu có nhiều ảnh lớn.
- [ ] Triển khai cơ chế Cache cho ảnh đã nén để tránh nén lại cùng một ảnh nhiều lần (Content Hash based).
- [ ] Nghiên cứu hỗ trợ nén định dạng AVIF (đang chờ jSquash update ổn định hơn).
- [19:30] **TASK WASM COMPRESSION HOÀN THÀNH** — Hệ thống đã đạt hiệu năng và độ ổn định cao.
