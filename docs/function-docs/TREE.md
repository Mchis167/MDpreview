# Tree Module (`renderer/js/modules/tree.js`)

> Quản lý file tree: render, sort, search, drag-and-drop, và các file operations.

---

## Lifecycle

### `init()`
Khởi tạo header của tree với các nút (add file, add folder, sort, search) và đăng ký keyboard shortcuts.

### `load()`
Fetch cấu trúc thư mục từ `FileService` và gọi `render()`. Gọi lại mỗi khi workspace thay đổi hoặc có `tree-changed` socket event.

### `render(isQuickRender?)`
Render TreeViewComponent V2 với dữ liệu hiện tại. `isQuickRender = true` bỏ qua animation skeleton để tăng tốc.
- Áp dụng sort order hiện tại
- Áp dụng filter/search nếu đang trong search mode
- Khôi phục expansion state từ localStorage
- Highlight `AppState.currentFile`

### `clear()`
Xóa dữ liệu tree và DOM. Gọi khi switch workspace.

---

## File Operations

### `_createNewItem(parentPath, type)`
Tạo file hoặc folder mới. Hiển thị inline rename input ngay sau khi tạo.
- `type = 'file'` → tạo file `.md` mới
- `type = 'folder'` → tạo thư mục mới

### `_finishRename(node, newName, save)`
Hoàn tất rename sau khi user gõ tên mới và nhấn Enter:
1. Validate tên (không rỗng, không trùng)
2. Gọi `FileService.rename()` để đổi tên trên disk
3. Gọi `TabsModule.swap()` để cập nhật tab nếu file đang mở
4. Reload tree

### `_handleDuplicate()`
Nhân đôi file được chọn với tên `{name}-copy.md`.

### `_handleDelete()`
Xóa file/folder với confirmation dialog. Nếu file đang mở → đóng tab trước.

### `_handleBatchOp(type)`
Batch operation cho multi-select:
- `type = 'delete'` → xóa tất cả file đang chọn
- `type = 'move'` → di chuyển tất cả vào folder được chọn

### `_handleImportFromSystem()`
Mở OS file dialog để import file từ bên ngoài vào workspace.

### `_handleRevealInFinder()`
Mở Finder/Explorer tại vị trí file được chọn.

---

## Sort

### `_showSortMenu(e)`
Hiển thị dropdown menu sort với các tùy chọn:
- **Alphabetical (A→Z / Z→A)**
- **Modified time (mới nhất / cũ nhất)**
- **Custom order** — drag-and-drop

### `_sortNodesRecursively(nodes, sortType)`
Áp dụng sort lên toàn bộ cây (recursive). Custom order được persist vào localStorage.

---

## Search

### `search(q)`
Lọc tree theo query string. Sử dụng `_flattenAndFilter()` để flatten cây và hiển thị kết quả phẳng (không có thư mục cha).
- Query rỗng → thoát search mode, trở về tree bình thường
- Highlight text khớp trong tên file

---

## Selection

| Function | Trigger | Mô tả |
|---|---|---|
| `handleClick(path)` | Click thường | Open file |
| `toggleSelect(path)` | Ctrl/Cmd+click | Toggle chọn 1 file |
| `_selectRange(path)` | Shift+click | Chọn range từ last active |
| `deselectAll()` | Escape | Bỏ chọn tất cả |

---

## Keyboard Shortcuts (khi tree có focus)

| Shortcut | Hành động |
|---|---|
| ⌘N | Tạo file mới |
| ⇧⌘N | Tạo folder mới |
| ⌘D | Duplicate file |
| Enter / F2 | Rename node đang chọn |
| Delete / Backspace | Xóa node |

---

## Persistence

| Key localStorage | Nội dung |
|---|---|
| `mdpreview_tree_expanded_{workspaceId}` | Set các folder đang mở |
| `mdpreview_tree_sort_{workspaceId}` | Sort type hiện tại |
| `mdpreview_tree_custom_order_{workspaceId}` | Custom order array |

---

*Document — 2026-04-26*
