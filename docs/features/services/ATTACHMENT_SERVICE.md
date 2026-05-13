# AttachmentService (`renderer/js/services/attachment-service.js`)

> Quản lý toàn bộ luồng xử lý tệp tin đính kèm (chủ yếu là hình ảnh): tải lên, nén, lưu trữ và chèn vào văn bản Markdown.

---

## Mục đích

Cung cấp một giải pháp tập trung để quản lý các tài sản (assets) trong vault. Đảm bảo tính duy nhất (deduplication), hiệu năng (compression) và tính nhất quán khi người dùng thao tác với hình ảnh qua nhiều kênh khác nhau (Kéo thả, Dán, hoặc Upload trực tiếp).

---

## Key Functions

### `processImageFiles(imageFiles, pos, vaultPath)`
Hàm cốt lõi xử lý danh sách các tệp ảnh.
- **imageFiles**: Mảng các đối tượng `File`.
- **pos**: Vị trí chèn (dòng, cột) hoặc `null` để chèn tại con trỏ hiện tại.
- **vaultPath**: Đường dẫn tuyệt đối đến workspace hiện tại.

**Quy trình xử lý:**
1. **Deduplication**: Kiểm tra vân tay ảnh (tên, kích thước, hoặc đường dẫn tuyệt đối) để xem ảnh đã tồn tại trong thư mục `/assets` chưa.
2. **Save & Compress**: Nếu là ảnh mới, gọi IPC `attachment:save-image` để lưu vào đĩa và nén ảnh (JPEG 85%).
3. **Insert Link**: Tự động chèn cú pháp `![image](/assets/...)` vào trình soạn thảo Monaco tại vị trí chỉ định.

### `pickAndInsertImage()`
Kích hoạt trình chọn file của hệ thống (Desktop hoặc Browser).
- Sau khi người dùng chọn ảnh, hàm này sẽ gọi `processImageFiles` để thực hiện quy trình tải lên và chèn link.
- **Desktop**: Sử dụng `window.electronAPI.openFiles`.
- **Browser**: Sử dụng thẻ `<input type="file">` ẩn.

### `pickAndReplaceImage(range)`
Dùng cho việc thay thế một đường dẫn ảnh có sẵn trong văn bản bằng một ảnh mới từ thiết bị.
- **range**: Vùng chọn của link ảnh cũ trong editor.

### `handlePaste(e, vaultPath)` / `handleDrop(e, pos, vaultPath)`
Xử lý sự kiện dán từ clipboard hoặc kéo thả file từ Finder/Explorer vào editor.

---

## Cấu trúc lưu trữ

- Mọi tệp đính kèm được lưu vào thư mục `/assets` nằm ở gốc của Vault.
- Tên file được đặt theo định dạng: `image-[timestamp].[ext]` (ví dụ: `image-1715654321000.jpg`).

---

## Lưu ý quan trọng

- **Deduplication**: Trên môi trường Browser (Web), do không thể truy cập đường dẫn tuyệt đối của file nguồn, hệ thống sử dụng "metadata fingerprinting" (kết hợp tên file, kích thước và ngày sửa đổi) để nhận diện ảnh trùng lặp.
- **Compression**: Quá trình nén được thực hiện tại Main Process (Node.js) sử dụng thư viện `nativeImage` của Electron để đảm bảo hiệu năng và chất lượng ảnh tối ưu.

---

*Document — 2026-05-14*
