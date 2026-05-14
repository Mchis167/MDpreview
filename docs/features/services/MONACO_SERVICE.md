# Monaco Service (`renderer/js/services/monaco-service.js`)

> Singleton service quản lý vòng đời và cấu hình của Monaco Editor trong MDpreview.

---

## Mục đích

`MonacoService` đóng vai trò là lớp vỏ bọc (wrapper) cho Monaco Editor API. Nó chịu trách nhiệm khởi tạo editor, thiết lập theme dựa trên Design Tokens, quản lý các model văn bản và cung cấp các helper methods để các module khác tương tác với trình soạn thảo mà không cần gọi trực tiếp Monaco API phức tạp.

---

## Lifecycle

### `init()`
Nạp các script cần thiết của Monaco thông qua AMD loader (`require`). Hàm này trả về một `Promise` và đảm bảo Monaco chỉ được nạp một lần duy nhất.

### `mount(containerEl, options)`
Khởi tạo và gắn một instance của Monaco Editor vào phần tử DOM.
- **Theme Injection**: Tự động chuyển đổi các Design Tokens (`tokens.css`) thành định dạng Hex màu mà Monaco hiểu được.
- **Config**: Thiết lập các thông số IDE-grade như `wordWrap`, `lineNumbers`, `smoothScrolling`, và vô hiệu hóa các gợi ý mặc định (IntelliSense) để giữ giao diện tối giản.
- **Custom Commands**: Đăng ký các phím tắt Xcode-style (Alt + Up/Down) và các trình xử lý sự kiện kéo thả.

### `dispose()`
Dọn dẹp instance của editor khi không còn sử dụng. 
- **Gia cố**: Swallowing các lỗi "Canceled" không mong muốn của Monaco trong môi trường Electron.

---

## Key Functions

| Hàm | Mô tả |
|---|---|
| `getValue()` / `setValue()` | Lấy hoặc cập nhật toàn bộ nội dung của editor. |
| `getCursorPosition()` | Trả về `{ lineNumber, column }` của con trỏ hiện tại. |
| `setSelectionByOffsets(start, end)` | Tạo vùng chọn dựa trên vị trí ký tự tuyệt đối (Character Offset). |
| `executeEdit(range, text)` | Thực thi một thay đổi văn bản (hỗ trợ Undo stack). |
| `revealLine(lineNumber)` | Cuộn editor để đưa dòng chỉ định ra giữa màn hình. |
| `onContentChange(callback)` | Đăng ký lắng nghe sự kiện thay đổi nội dung (dùng cho dirty tracking). |

---

## Cấu trúc Theme (`mdpreview-dark`)

Theme được xây dựng động từ hệ thống Design Tokens:
- **Editor Background**: Luôn trong suốt để tận dụng hiệu ứng Glassmorphism của ứng dụng.
- **Syntax Highlighting**: Sử dụng palette màu lấy cảm hứng từ One Dark / Xcode.
- **Line Highlight**: Chỉ hiển thị khi editor có tiêu điểm (focus) để tránh gây xao nhãng.
- **Find Widget UI**: Thanh tìm kiếm được tùy biến hoàn toàn với vị trí trung tâm phía trên, hiệu ứng Glassmorphism và layout 480px cố định để không che khuất toolbar.

---

## Tích hợp đặc biệt

1. **Attachment Integration**: Lắng nghe sự kiện `drop` và chuyển hướng xử lý tới `AttachmentService` kèm theo tọa độ dòng/cột chính xác nơi file được thả.
2. **Image Context Menu**: Tự động nhận diện nếu cursor đang nằm trên một link ảnh Markdown và hiển thị menu chuột phải chuyên dụng (Upload, Open in Finder).
3. **Layout Guard**: Tự động gọi `editor.layout()` sau khi mount để đảm bảo kích thước editor khớp chính xác với container trong môi trường trình duyệt.
4. **UI Cleanup**: Tự động ẩn các thành phần dư thừa như resizable sashes (`.monaco-sash`) để giữ giao diện sạch sẽ.

---

*Document — 2026-05-14*
