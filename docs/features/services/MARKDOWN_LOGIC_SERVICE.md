# MarkdownLogicService (`renderer/js/services/markdown-logic-service.js`)

> Headless service xử lý các thuật toán biến đổi văn bản Markdown và đồng bộ hóa vị trí con trỏ.

---

## Mục đích

`MarkdownLogicService` đóng vai trò là "bộ não" xử lý văn bản thuần túy, không phụ thuộc vào trạng thái UI phức tạp của Editor. Nó đảm bảo tính nhất quán khi áp dụng các định dạng Markdown và giúp người dùng không bị mất dấu vị trí khi chuyển đổi giữa các chế độ xem.

---

## Key Functions

### `applyAction(textarea, action)`
Áp dụng định dạng Markdown lên vùng chọn của textarea.

**Các loại Action:**
- **Wrap Toggle**: `b` (**bold**), `i` (*italic*), `c` (`code`), `s` (~~strike~~).
- **Line Toggle**: `q` (> quote), `ul` (* list), `ol` (1. list), `tl` (- [ ] task).
- **Header Toggle**: `h1` đến `h6`.
- **Insert**: `l` (link), `img` (image), `hr` (divider), `cb` (code block), `tb` (table).

**Smart Selection Logic:**
Khi áp dụng một action lên một dòng trống hoặc không có vùng chọn, service sẽ tự động:
1. Chèn văn bản giữ chỗ (placeholder) phù hợp (ví dụ: "Heading", "bold text").
2. **Chỉ bôi đen phần nội dung** cần sửa, bỏ qua các ký hiệu Markdown (như `### `, `**`).
3. Điều này cho phép người dùng gõ nội dung mới ngay lập tức mà không cần xóa ký hiệu Markdown bằng tay.

---

### `syncCursor(textarea, context)`
Đồng bộ hóa vị trí con trỏ và thanh cuộn của textarea dựa trên ngữ cảnh từ Read view.

**Thuật toán (3 giai đoạn):**
1. **Precise Selection Match**: Tìm kiếm chuỗi văn bản chính xác hoặc dùng thuật toán "Sandwich Fuzzy Match" để tìm đoạn văn bản tương ứng trong mã nguồn Markdown.
2. **Simple Line Fallback**: Nếu không tìm thấy văn bản, nhảy đến dòng (line number) được chỉ định.
3. **Scroll & Selection**: 
   - Sử dụng một "Mirror DIV" ẩn để tính toán tọa độ Pixel Y chính xác của ký tự trong textarea.
   - Cuộn textarea để đưa vị trí đó ra giữa màn hình.
   - Highlight vùng chọn nếu `isRealSelection` là true.

---

## Kiến trúc nội bộ

### Mirror DIV Technique
Do phần tử `<textarea>` của trình duyệt không cung cấp API để lấy tọa độ (X, Y) của một ký tự cụ thể, service tạo một thẻ `DIV` ẩn có cùng style (font, padding, width) để giả lập layout và đo đạc `offsetTop`.

### Fuzzy Match Strategy
Khi người dùng chọn văn bản ở bản Read (đã qua render HTML), số dòng có thể lệch so với bản gốc Markdown. Thuật toán Fuzzy Match sẽ:
- Tokenize văn bản thành các từ quan trọng.
- Xây dựng Regex "Sandwich" (đầu + cuối) để tìm đoạn khớp nhất.
- Sử dụng `_deltaCache` để ghi nhớ độ lệch dòng cho các lần gọi sau trên cùng một file.

---

*Document — 2026-05-04*
