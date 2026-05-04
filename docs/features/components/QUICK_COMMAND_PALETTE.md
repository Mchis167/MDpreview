# QuickCommandPalette (`renderer/js/components/molecules/quick-command-palette.js`)

> Thành phần UI dạng Palette giúp kích hoạt nhanh các lệnh định dạng Markdown ngay tại vị trí soạn thảo.

---

## Mục đích

`QuickCommandPalette` cung cấp một giao diện tập trung và tối giản để thực hiện 22+ hành động Markdown phổ biến. Nó được thiết kế để hoạt động mượt mà với cả chuột và bàn phím (đặc biệt là qua hệ thống Slash Command).

---

## Chế độ hoạt động

Component hỗ trợ 2 chế độ hiển thị chính:

1. **Standard Mode (Input-based)**:
   - Được kích hoạt qua phím tắt (ví dụ: `Mod+/`).
   - Hiển thị thanh nhập liệu (`palette-input`) để người dùng gõ tìm kiếm lệnh.
   - Tự động focus vào ô input khi mở.

2. **Slash Mode (Input-less)**:
   - Được kích hoạt khi người dùng gõ `/` trong `EditorModule`.
   - Thanh nhập liệu bị ẩn đi (`hideInput: true`).
   - Lắng nghe dữ liệu truy vấn trực tiếp từ trình soạn thảo thông qua `updateQuery()`.
   - Cho phép người dùng vừa gõ nội dung trong Editor vừa thấy danh sách lệnh được lọc tương ứng.

---

## Key Functions

### `show(x, y, callback, options)`
Hiển thị Palette tại tọa độ xác định.
- **`x, y`**: Tọa độ pixel (thường là tọa độ con trỏ chuột hoặc caret).
- **`callback`**: Hàm được gọi khi người dùng chọn một lệnh (nhận vào `commandId`).
- **`options.hideInput`**: Nếu `true`, thanh nhập liệu sẽ bị ẩn.

### `updateQuery(query)`
Cập nhật chuỗi tìm kiếm và render lại danh sách kết quả. 
- Trong Slash Mode, `query` là đoạn văn bản đứng sau dấu `/` mà người dùng đang gõ trong Editor.

### `navigate(direction)`
Di chuyển vùng chọn trong danh sách kết quả.
- **`direction`**: `'up'` hoặc `'down'`.
- Hàm này cho phép `EditorModule` điều khiển Palette ngay cả khi tiêu điểm bàn phím vẫn nằm ở Textarea.

### `getSelectedCommandId()`
Trả về `id` của lệnh đang được highlight trong danh sách. Trả về `null` nếu không có lệnh nào được chọn hoặc Palette đang đóng.

### `hide()`
Ẩn Palette và reset trạng thái tìm kiếm.

---

## Danh sách Lệnh (Commands)

Mỗi lệnh trong Palette bao gồm:
- **`label`**: Tên hiển thị (ví dụ: "Heading 1").
- **`icon`**: Icon định danh từ `DesignSystem`.
- **`hint`**: Gợi ý phím tắt hoặc cú pháp `/`.
- **`tags`**: Danh sách từ khóa tìm kiếm (hỗ trợ cả Tiếng Anh và Tiếng Việt không dấu).

---

## Kiến trúc UI

- **Glassmorphism**: Sử dụng `backdrop-filter: blur(100px)` và màu nền `var(--ds-black-a60)` để tạo cảm giác cao cấp.
- **Parity**: Thiết kế bám sát chuẩn `ContextMenu` để duy trì tính nhất quán của ứng dụng.
- **Boundary Check**: Tự động tính toán vị trí để Palette không bị tràn ra ngoài cửa sổ trình duyệt.

---

*Document — 2026-05-04*
