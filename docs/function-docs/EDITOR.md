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

## Keyboard Shortcuts (trong edit mode)

| Shortcut | Hành động |
|---|---|
| Mod+S | `save()` |
| Mod+Z | `undo()` |
| Mod+Shift+Z | `redo()` |

---

## Lưu ý quan trọng

- `bindToElement()` và `unbind()` **phải được gọi đúng cặp** — `MarkdownEditor` component lo việc này khi render/destroy
- Dirty state được check bởi `loadFile()` và `WorkspaceModule.switchTo()` trước khi chuyển file/workspace
- Undo stack **không persist** qua session — mỗi lần mở file là stack mới

---

*Document — 2026-04-27*
