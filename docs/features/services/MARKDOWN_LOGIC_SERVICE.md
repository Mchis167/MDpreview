# Markdown Logic Service (`renderer/js/services/markdown-logic-service.js`)

> Headless service xử lý các thuật toán biến đổi văn bản Markdown, hiện đã được tối ưu hóa để làm việc với Monaco Editor.

---

## Mục đích

`MarkdownLogicService` đóng vai trò là bộ thư viện xử lý chuỗi Markdown. Trong kiến trúc mới, service này tập trung vào việc tính toán các thay đổi văn bản (text transformations) và để việc thực thi (apply) cho các service chuyên biệt của Monaco.

---

## Key Functions (Legacy & Core)

### `applyAction(textarea, action)`
**Lưu ý**: Hàm này hiện chủ yếu phục vụ cho các component cũ hoặc bản Web đơn giản vẫn dùng `textarea`. Đối với trình soạn thảo chính, vui lòng sử dụng `MonacoActionService`.

**Các loại Action:**
- **Wrap Toggle**: `b` (**bold**), `i` (*italic*), `c` (`code`), `s` (~~strike~~).
- **Line Toggle**: `q` (> quote), `ul` (* list), `ol` (1. list), `tl` (- [ ] task).
- **Header Toggle**: `h1` đến `h6`.

---

## Smart Typing Logic

Đây là phần quan trọng nhất của service, được `EditorModule` gọi khi người dùng tương tác bàn phím trong Monaco.

### `computeSmartEnter(value, selStart, selEnd)`
Xử lý sự kiện nhấn `Enter` để tự động hóa danh sách (Lists).
- **Hành vi**: Tự động chèn `- `, `* `, `1. ` hoặc `- [ ] ` vào dòng mới nếu dòng hiện tại là list item.
- **Auto Re-numbering**: Đối với Ordered List, tự động tăng số thứ tự và cập nhật lại toàn bộ danh sách phía dưới.
- **Multi-level support**: Hỗ trợ định dạng số đa cấp (ví dụ: `2.2.` -> `2.3.`).
- **Exit List**: Nhấn `Enter` trên một item rỗng sẽ xóa dấu bullet và kết thúc danh sách.

### `computeListIndent(value, selStart, selEnd, direction)`
Xử lý sự kiện `Tab` (indent) và `Shift+Tab` (outdent) cho danh sách.
- **Indent**: Tăng khoảng trắng (2 spaces) và giữ nguyên dấu bullet.
- **Outdent**: Giảm khoảng trắng và giữ nguyên dấu bullet.
- **Monaco Integration**: Được gọi từ `MonacoActionService` để tính toán text mới trước khi thực hiện `executeEdits`.

---

## Mối quan hệ với Monaco

Trong hệ thống mới:
1. **`MonacoActionService`**: Nhận yêu cầu từ UI, lấy vùng chọn từ Monaco, và gọi `MarkdownLogicService` để tính toán chuỗi kết quả.
2. **`MarkdownLogicService`**: Thực hiện các thuật toán Regex phức tạp (ví dụ: tìm điểm bắt đầu của list, tính toán số thứ tự tiếp theo).
3. **`MonacoActionService`**: Nhận chuỗi kết quả và dùng `editor.executeEdits()` để đưa vào Monaco, giúp duy trì Undo/Redo stack.

---

## Các thuật toán đặc biệt

### Smart Selection Logic
Khi áp dụng một action (như Bold), service không chỉ chèn `**text**` mà còn tính toán vùng chọn mới sao cho **chỉ bôi đen nội dung**, bỏ qua các ký tự Markdown. Điều này giúp người dùng có thể gõ đè nội dung mới ngay lập tức mà không làm hỏng định dạng.

### Ordered List Re-numbering
Thuật toán duyệt ngược lên trên để tìm số thứ tự gốc và duyệt xuôi xuống dưới để cập nhật lại toàn bộ các item bị ảnh hưởng bởi việc chèn/xóa dòng.

---

*Document — 2026-05-14 (Monaco-ready update)*
