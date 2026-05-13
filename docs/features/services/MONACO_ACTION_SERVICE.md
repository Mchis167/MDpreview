# Monaco Action Service (`renderer/js/services/monaco-action-service.js`)

> Service thực thi các lệnh định dạng Markdown (Bold, Italic, Lists, etc.) trực tiếp trên trình soạn thảo Monaco.

---

## Mục đích

`MonacoActionService` tách biệt logic định dạng Markdown khỏi module Editor chính. Nó sử dụng `MonacoService` để tương tác với model văn bản, đảm bảo các thay đổi được thực hiện thông qua `executeEdits` để bảo toàn lịch sử Undo/Redo.

---

## Key Functions

### `applyAction(monacoService, action)`
Cửa ngõ duy nhất để thực thi định dạng.
- **`monacoService`**: Instance của MonacoService.
- **`action`**: ID hành động (ví dụ: `'b'`, `'h1'`, `'ul'`, `'l'`).

---

## Các nhóm lệnh hỗ trợ

### 1. Wrap Toggles (`b`, `i`, `bi`, `s`, `c`)
- **Smart Toggle**: Tự động nhận diện nếu văn bản đã được định dạng để "gỡ" (unwrap) thay vì chèn thêm.
- **Selection Handling**: Nếu không có vùng chọn, service sẽ chèn placeholder (ví dụ: `**bold text**`) và tự động highlight phần text bên trong.

### 2. Line Toggles (`q`, `ul`, `ol`, `tl`)
- **Multi-line support**: Hỗ trợ áp dụng (hoặc gỡ bỏ) định dạng cho nhiều dòng cùng lúc.
- **Prefix Matching**: Kiểm tra tất cả các dòng được chọn, nếu tất cả đều có prefix → thực hiện gỡ bỏ; ngược lại → áp dụng prefix cho tất cả.

### 3. Header Toggles (`h1` - `h6`)
- **Cycle Strategy**: Nếu dòng đã là Heading cấp N, và bạn chọn Heading cấp N → gỡ bỏ định dạng heading. Nếu chọn cấp khác → chuyển đổi sang cấp mới.
- **Smart Selection**: Sau khi chuyển đổi, chỉ bôi đen nội dung tiêu đề, bỏ qua ký tự `#`.

### 4. Insertion Commands (`l`, `img`, `hr`, `cb`, `tb`)
- **Link/Image**: Tự động nhận diện nếu vùng chọn là URL để điền vào phần đường dẫn của cú pháp Markdown.
- **Code Block (`cb`)**: Bao bọc vùng chọn bằng dấu nháy ngược và đặt con trỏ vào vị trí soạn thảo code.
- **Table (`tb`)**: Chèn một khung bảng Markdown chuẩn 2x2.

---

## Smart Selection Logic

Một đặc điểm nổi bật của service này là việc quản lý vùng chọn sau khi thực thi lệnh:
- Luôn ưu tiên đưa con trỏ về trạng thái sẵn sàng nhập liệu (chỉ bôi đen phần text nội dung).
- Đảm bảo người dùng không bao giờ vô tình xóa mất các ký tự Markdown (`**`, `#`, `[]`) khi đang chỉnh sửa nhanh.

---

## Quy trình thực thi

1. Nhận lệnh từ `EditorModule` (Toolbar hoặc Slash Command).
2. Lấy vùng chọn hiện tại (`selection`) từ Monaco.
3. Tính toán văn bản mới và phạm vi (`range`) cần thay thế.
4. Gọi `monacoService.executeEdit()` để áp dụng thay đổi.
5. Cập nhật vùng chọn mới (`setSelection`) để mang lại trải nghiệm mượt mà nhất.

---

*Document — 2026-05-14*
