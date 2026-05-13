# QuickCommandPalette (`renderer/js/components/molecules/quick-command-palette.js`)

> Thành phần UI dạng Palette giúp kích hoạt nhanh các lệnh định dạng Markdown và lệnh hệ thống ngay tại vị trí soạn thảo.

---

## Mục đích

`QuickCommandPalette` cung cấp một giao diện tập trung để thực hiện 22+ hành động Markdown và các tác vụ hệ thống (như Upload ảnh, Tra cứu phím tắt). Nó được tối ưu hóa cho tốc độ phản hồi IDE-grade và hỗ trợ tìm kiếm mờ thông minh.

---

## Chế độ hoạt động

Component hỗ trợ 2 chế độ hiển thị chính:

1. **Standard Mode (Input-based)**:
   - Kích hoạt qua `Mod + /`.
   - Hiển thị thanh nhập liệu để tìm kiếm lệnh.
   - Dùng cho việc duyệt toàn bộ danh sách lệnh.

2. **Slash Mode (Input-less)**:
   - Kích hoạt khi gõ `/` trong Monaco Editor.
   - Thanh nhập liệu bị ẩn, query được lấy trực tiếp từ text sau dấu `/` trong Editor.
   - Cho phép người dùng gõ lệnh mà không cần rời tay khỏi vùng soạn thảo.

---

## Thuật toán Tìm kiếm & Chấm điểm (Scoring)

Từ phiên bản v1.9.0, Palette sử dụng hệ thống chấm điểm nâng cao để đưa các lệnh phù hợp nhất lên đầu:

- **Exact Match**: Khớp hoàn toàn từ khóa (ví dụ: gõ `h1` cho Heading 1) được ưu tiên tuyệt đối.
- **Fuzzy Search**: Hỗ trợ tìm kiếm không dấu và sai sót ký tự nhẹ.
- **Prefix Priority**: Các lệnh bắt đầu bằng chuỗi truy vấn (ví dụ: `up` cho **Up**load Image) có điểm cao hơn.
- **Usage Tracking**: Hệ thống ghi nhớ các lệnh bạn thường dùng nhất để đẩy chúng lên vị trí ưu tiên trong các lần gõ sau.

---

## Key Functions

### `updateQuery(query)`
Cập nhật chuỗi tìm kiếm. Thực hiện lọc danh sách lệnh, tính toán điểm số và render lại UI.
- Trong Slash Mode, hàm này được `EditorModule` gọi liên tục khi người dùng gõ.

### `navigate(direction)`
Di chuyển vùng chọn (`highlight`) trong danh sách kết quả.
- Hỗ trợ phím mũi tên `Up/Down`. Trong Slash Mode, Monaco sẽ đánh chặn phím và chuyển hướng tới hàm này.

### `executeSelected()`
Thực thi lệnh đang được chọn. Nếu đang ở Slash Mode, nó sẽ tự động xóa dấu `/` và nội dung query trong Editor trước khi thực hiện lệnh.

---

## Danh sách Lệnh (Commands)

Mỗi lệnh bao gồm:
- **`label`**: Tên (Heading 1, Bold, ...).
- **`hint`**: Gợi ý phím tắt hoặc cú pháp nhanh.
- **`tags`**: Từ khóa tìm kiếm (hỗ trợ Tiếng Việt không dấu).
- **`action`**: ID hành động gửi về `EditorModule`.

---

## Tích hợp Monaco

Palette được thiết kế để "nổi" trên layer của Monaco Editor:
- **Định vị**: Tự động tính toán tọa độ Caret của Monaco để hiển thị Palette ngay dưới dòng đang gõ.
- **Boundary Check**: Nếu gõ ở cuối màn hình, Palette tự động nhảy lên phía trên con trỏ để không bị che khuất.
- **Focus Management**: Focus vẫn được giữ tại Monaco trong suốt quá trình Slash Mode để người dùng có thể gõ liên tục.

---

## Kiến trúc UI

- **Glassmorphism**: Hiệu ứng mờ nền sâu (`100px blur`) tạo cảm giác cao cấp.
- **Adaptive Layout**: Chiều cao tự động điều chỉnh dựa trên số lượng kết quả (tối đa 5-7 items).

---

*Document — 2026-05-14 (Fuzzy scoring & Monaco integration update)*
