# Tree Module (`renderer/js/modules/tree.js`)

> Quản lý file tree: render, sort, search, drag-and-drop, và các file operations.

---

## Lifecycle

### `init()`
Khởi tạo header của tree với các nút (add file, add folder, sort, search) và đăng ký keyboard shortcuts.

### `load()`
Fetch cấu trúc thư mục từ `FileService` và gọi `render()`. Gọi lại mỗi khi workspace thay đổi hoặc có `tree-changed` socket event.

### `render(isQuickRender?)`
Render `TreeViewComponent` V2 với dữ liệu hiện tại. `isQuickRender = true` bỏ qua animation skeleton để tăng tốc.
- **Smart Re-mount**: Tự động nhận diện nếu mount point bị xóa (do Sidebar re-render) để khởi tạo lại component và bọc vào `ScrollContainer`.
- **Smart Hidden Section**: Tự động ẩn hoàn toàn `#hidden-items-section` và divider đi kèm nếu không có file nào bị ẩn.
- **Active-wins Priority**: Đảm bảo file đang active luôn giữ style `.active` (5% highlight) và không bị ghi đè bởi style `.selected` (5% highlight) ngay cả khi đang được chọn.
- Khôi phục expansion state từ localStorage và highlight file đang active.

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

### `_handleContextMenu(e, node)`
Hiển thị context menu (DesignSystem.createContextMenu) dựa trên trạng thái của node:
- **Normal Items**: Đầy đủ các thao tác (Rename, Duplicate, New File/Folder, Import, Reveal, Delete).
- **Hidden Items**: Chỉ hiển thị các thao tác quản lý (Rename, Reveal, Unhide, Delete). **Các tính năng tạo mới (New File/Folder) và Import bị chặn hoàn toàn tại vùng này.**
- **Multi-select**: Hiển thị các thao tác hàng loạt (Batch Delete, Batch Hide/Unhide, Copy Paths).

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

### `collapseAll()`
Thu gọn toàn bộ các thư mục đang mở trong cây. Xóa danh sách `expandedPaths` và cập nhật localStorage.

### `collapseOthers(targetPath)`
Thu gọn tất cả các thư mục ngoại trừ thư mục chứa `targetPath` và các thư mục cha của nó.
- Nếu `targetPath` là file, giữ nguyên các folder dẫn đến file đó.
- Thường được gọi khi nhấn vào file đang active hoặc folder cụ thể qua context menu.

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
- **Hidden Items**: File bị ẩn chỉ xuất hiện trong kết quả tìm kiếm nếu cài đặt `showHiddenInSearch` = `true` (và có `.is-hidden` class để làm mờ).

---

## Hidden from Tree

### `handleToggleHidden(node)`
Thay đổi trạng thái ẩn/hiện của một node. 
1. Gọi `_handleBatchToggleHidden` để xử lý nhất quán.
2. Cập nhật `AppState.settings.hiddenPaths` qua `SettingsService`.
3. Reload tree và hiển thị Toast notification.

### `handleBatchToggleHidden(hide, explicitPaths?, keepSelection?)`
Ẩn hoặc hiện hàng loạt (multi-select). 
1. **Tab Sync**: Tự động đóng tất cả Tab đang mở của các file bị ẩn (bao gồm cả đóng đệ quy cho toàn bộ file con nếu ẩn thư mục).
2. **Selection Persistence**: Nếu `keepSelection = true`, các item sẽ được giữ nguyên trạng thái highlight sau khi di chuyển giữa các vùng Explorer/Hidden.
3. Xử lý an toàn với event bubbling bằng cách nhận mảng `explicitPaths` từ context menu. 
4. Chạy bất đồng bộ (async) để tránh race condition khi cập nhật `SettingsService`.

### `testFlatten(nodes, q)`
API export riêng cho môi trường kiểm thử tự động, dùng để test thuật toán search và lọc file ẩn (`_flattenAndFilter`).

---

## Selection

| Function | Trigger | Mô tả |
|---|---|---|
| `_handleToggle(node)` | Click Chevron | Đóng/mở thư mục (thao tác trực tiếp trên `treeData` gốc) |
| `_handleClick(e, node)` | Click Label / API | Select item + Load file. Hỗ trợ **Null-safety**: có thể gọi từ API (Search Palette) bằng cách truyền `e = null`. **Tối ưu hóa**: Nếu file đang chọn đã là file active, bỏ qua việc gọi `loadFile` để tránh render dư thừa. |
| `deselectAll()` | Escape / Click Background | Bỏ chọn tất cả. Click vào vùng trống của bất kỳ danh sách nào trong Sidebar (Explorer, Hidden) sẽ kích hoạt hành động này. |

---

## Keyboard Shortcuts (khi tree có focus)

| Shortcut | Hành động |
|---|---|
| ⌘N | Tạo file mới (Tự động chuyển về Root nếu đang chọn item ẩn) |
| ⇧⌘N | Tạo folder mới (Tự động chuyển về Root nếu đang chọn item ẩn) |
| ⌘D | Duplicate file |
| ⇧⌘H | Toggle Hidden (Ẩn/Hiện nhanh các item đang chọn) |
| Enter / F2 | Rename node đang chọn (Hỗ trợ cả cây All Files và danh sách Hidden) |
| ⌘[ | Collapse All Folders (Thu gọn toàn bộ thư mục) |
| ⇧⌘[ | Collapse Other Folders (Thu gọn các thư mục khác) |
| Delete / Backspace | Xóa node |

---

## Persistence

| Key localStorage | Nội dung |
|---|---|
| `mdpreview_tree_expanded_{workspaceId}` | Set các folder đang mở |
| `mdpreview_tree_sort_{workspaceId}` | Sort type hiện tại |
| `mdpreview_tree_custom_order_{workspaceId}` | Custom order array |

### Cài đặt hiển thị (Explorer Preferences)
Các cài đặt như `showHidden`, `hideEmptyFolders`, `flatView` được quản lý tập trung bởi **`SettingsService`**. Khi các giá trị này thay đổi, service sẽ tự động gọi `TreeModule.load()` để cập nhật cây thư mục với các filter mới.

---

*Document — 2026-04-28 (Refactored: Removed SidebarModule, updated Search trigger)*
