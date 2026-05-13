# ADR: Monaco Editor Migration

**Date:** 2026-05-14
**Status:** accepted (supersedes all legacy Textarea decisions)
**Author:** Antigravity

---

## Bối cảnh

Hệ thống soạn thảo cũ dựa trên thẻ `<textarea>` HTML thông thường đã đạt tới giới hạn về khả năng mở rộng. Các vấn đề chính bao gồm:
1. Thiếu tính năng IDE chuyên sâu (Undo/Redo stack tin cậy, đa con trỏ, tìm kiếm phức tạp).
2. Hiệu năng giảm sút khi xử lý file Markdown có hàng chục nghìn dòng.
3. Khó khăn trong việc triển khai các tính năng như Sticky Scroll, Code Folding và High-fidelity syntax highlighting.

Chúng ta cần một engine soạn thảo mạnh mẽ hơn để đưa MDpreview lên tầm cao mới của một IDE chuyên nghiệp.

---

## Các lựa chọn đã cân nhắc

### Option 1: Nâng cấp Textarea với các thư viện bổ trợ
- **Ưu:** Nhẹ, giữ nguyên cấu trúc hiện tại.
- **Nhược:** Không giải quyết được gốc rễ vấn đề về hiệu năng và tính năng IDE.

### Option 2: Sử dụng CodeMirror 6
- **Ưu:** Nhẹ hơn Monaco, thiết kế module tốt.
- **Nhược:** Cần nhiều công sức cấu hình để đạt được trải nghiệm "chuẩn IDE" như Monaco.

### Option 3: Sử dụng Monaco Editor (Engine của VS Code) (Chọn)
- **Ưu:** Trải nghiệm IDE tốt nhất thế giới, hiệu năng cực cao với Virtual Scrolling, cộng đồng hỗ trợ lớn.
- **Nhược:** Dung lượng lớn (~5MB), cấu hình phức tạp trong môi trường Electron (AMD loader).

---

## Quyết định

**Chọn: Option 3 — Monaco Editor**

Chúng ta thực hiện di cư toàn bộ hệ thống soạn thảo sang Monaco Editor. Quyết định này đi kèm với việc tái cấu trúc các module liên quan:
1. **`MonacoService`**: Quản lý vòng đời và instance của editor.
2. **`MonacoActionService`**: Thay thế logic định dạng trực tiếp trên textarea.
3. **`MonacoSyncService`**: Đảm bảo đồng bộ hóa vị trí với Read Mode.

---

## Hệ quả

**Tích cực:**
- Trải nghiệm soạn thảo mượt mà, chuyên nghiệp (Premium IDE Feel).
- Hỗ trợ các tính năng cao cấp: Sticky Scroll, Minimap (tương lai), Multi-cursor.
- Hệ thống Undo/Redo cực kỳ ổn định.

**Tiêu cực / Trade-off:**
- Thời gian khởi động tăng nhẹ do nạp library Monaco.
- Kiến trúc phức tạp hơn do phải quản lý AMD loader và Worker của Monaco.

**Constraint tương lai:**
- Tuyệt đối không can thiệp trực tiếp vào DOM của Monaco; mọi thay đổi văn bản phải qua `executeEdits`.
- Luôn sử dụng Design Tokens để build theme cho Monaco nhằm đảm bảo tính nhất quán.

---

*Supersedes: Mọi quyết định liên quan đến lifecycle của textarea cũ.*
