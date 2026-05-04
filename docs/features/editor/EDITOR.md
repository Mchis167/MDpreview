# Editor Module (`renderer/js/modules/editor.js`)

> Quản lý trạng thái textarea trong edit mode: undo/redo, dirty tracking, save, và markdown formatting.

---

## Lifecycle

### `bindToElement(el)`
Gắn editor logic vào `<textarea>`. Phải gọi trước khi dùng bất kỳ function nào khác.
- Khởi tạo undo/redo stacks với snapshot đầu tiên
- Đăng ký keyboard shortcuts: **Mod+S**, **Mod+Z**, **Mod+Shift+Z**
- Bắt đầu debounced snapshot (300ms) khi user gõ
- Tự động gọi `TabsModule.setDirty()` để cập nhật chỉ báo thay đổi trên Tab Bar

### `unbind()`
Gỡ bỏ tất cả event listeners và xóa stacks. Gọi khi chuyển khỏi edit mode.

---

## Undo / Redo

Mỗi snapshot lưu `{ value, selectionStart, selectionEnd }` để khôi phục cả nội dung lẫn vị trí cursor.

- Stack tối đa **200 snapshots** (cũ nhất bị xóa)
- Snapshot được tạo **debounced 300ms** khi user gõ, không phải mỗi keystroke
- Khi undo/redo → khôi phục cả selection → không bị mất vị trí con trỏ

### `undo()`
Di chuyển về snapshot trước. Cập nhật textarea value và selection.

### `redo()`
Di chuyển tới snapshot sau (nếu đã undo trước đó). Snapshot mới sẽ xóa redo branch.

---

## Content Injection

### `insertContent(text, mode)`
Chèn nội dung văn bản vào editor. Tự động chụp snapshot để hỗ trợ Undo/Redo.
- **`mode === 'replace'`**: Thay thế toàn bộ nội dung hiện tại bằng `text`.
- **`mode === 'append'`**: Thêm `text` vào cuối tài liệu.

---

## Save & Dirty Tracking

### `save()`
Lưu nội dung textarea:
- Nếu file là **draft** → lưu qua DraftModule
- Nếu là **file thật** → POST `/api/file` hoặc gọi Electron API
- Sau khi save → gọi `setOriginalContent()` để reset dirty flag và thông báo cho `TabsModule`.

### `isDirty()`
So sánh nội dung hiện tại với `originalContent`. Trả về `true` nếu có thay đổi chưa lưu.

### `setOriginalContent(text)`
Cập nhật baseline. Gọi sau khi load file hoặc sau khi save thành công.

### `setDirty(isDirty)`
Đánh dấu dirty/clean thủ công — dùng khi cần override dirty detection (ví dụ: sau auto-save).

### `revert()`
Khôi phục textarea về `originalContent`, xóa toàn bộ undo/redo stacks và thông báo "clean" cho `TabsModule`.

---

## Markdown Formatting

### `applyAction(action)`
Áp dụng markdown formatting lên text đang chọn trong textarea. Delegate xuống `MarkdownLogicService`.

Các action phổ biến: `bold`, `italic`, `heading`, `link`, `image`, `code`, `quote`, `list-bullet`, `list-numbered`, `table`, `divider`.

### `focusWithContext(context)`
Focus vào textarea và đồng bộ con trỏ với read view — dùng khi chuyển từ read mode sang edit mode để giữ vị trí cuộn.

---

## Slash Commands

Hỗ trợ hệ thống lệnh nhanh (Slash Commands) giúp định dạng Markdown trực tiếp mà không cần dùng chuột hoặc phím tắt phức tạp.

### Kích hoạt Slash Mode
Khi gõ ký tự `/` ở đầu dòng hoặc sau một dấu cách/xuống dòng:
1. `EditorModule` chuyển sang **Slash Mode** (`_isSlashMode = true`).
2. Gọi `QuickCommandPalette.show()` ở chế độ ẩn input (`hideInput: true`).
3. Vị trí con trỏ bắt đầu dấu `/` được lưu lại (`_slashStartPos`).

### Tương tác trong Slash Mode
- **Gõ chữ**: Văn bản sau dấu `/` được gửi xuống `QuickCommandPalette.updateQuery()` để lọc lệnh theo thời gian thực.
- **Phím mũi tên (Up/Down)**: Được đánh chặn và gửi xuống `QuickCommandPalette.navigate()` để di chuyển vùng chọn trong danh sách lệnh.
- **Phím Space/Enter**:
    - Nếu có lệnh đang được chọn: Áp dụng lệnh và thoát Slash Mode.
    - Nếu không có lệnh nào khớp: Thoát Slash Mode (giữ nguyên text đã gõ).
- **Xóa lùi (Backspace)**: Slash Mode vẫn tiếp tục cho đến khi dấu `/` tại vị trí bắt đầu bị xóa.

---

## Keyboard Shortcuts (trong edit mode)

| Shortcut | Hành động |
|---|---|
| Mod+S | `save()` |
| Mod+Z | `undo()` |
| Mod+Shift+Z | `redo()` |
| `/` | Kích hoạt Slash Mode (ở đầu dòng/sau dấu cách) |
| Mod+/ | Mở Quick Command Palette (toàn bộ danh sách) |

---

## Lưu ý quan trọng

- `bindToElement()` và `unbind()` **phải được gọi đúng cặp** — `MarkdownEditor` component lo việc này khi render/destroy
- Sau khi áp dụng lệnh qua Slash Mode, `EditorModule` phối hợp với `MarkdownLogicService` để thực hiện **Smart Selection** (chỉ bôi đen nội dung cần sửa, bỏ qua ký tự Markdown).
- Dirty state được check bởi `loadFile()` và `WorkspaceModule.switchTo()` trước khi chuyển file/workspace
- Undo stack **không persist** qua session — mỗi lần mở file là stack mới

---

*Document — 2026-05-04*
