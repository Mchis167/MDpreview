# Tabs Module (`renderer/js/modules/tabs.js`)

> Quản lý danh sách tab đang mở, trạng thái active, multi-select và các batch operation.

---

## State

| Property | Mô tả |
|---|---|
| `openFiles` | Mảng đường dẫn các file đang mở |
| `pinnedFiles` | Mảng các file đã được ghim (Pin) |
| `dirtyFiles` | Mảng các file đang có thay đổi chưa lưu |
| `activeFile` | File đang được xem |
| `selectedFiles` | Set các file đang được chọn (multi-select) |

State được persist vào localStorage, phân biệt theo workspace ID.

---

## Functions

### `init()`
Khởi tạo TabBar component (`TabBarComponent.js`), đăng ký các keyboard shortcuts và event listeners:
- **Escape** — Deselect tất cả tab
- **Mod+A** — Chọn tất cả tab (chỉ khi không focus vào input)
- **Mod+W** — Đóng tab active hoặc các tab đang chọn
- **Mod+Shift+W** — Đóng tất cả tab
- **Mod+Shift+P** — Bật/Tắt ghim (Pin/Unpin) tab active

### `open(filePath)`
Mở file trong tab. Nếu file đã có tab thì chỉ switch sang, không mở thêm. Sau đó gọi `loadFile()`.

### `remove(filePath, skipConfirm?)`
Đóng tab. Nếu file có draft chưa save sẽ hiện dialog xác nhận trừ khi `skipConfirm = true`.
- Khi đóng tab active → tự động switch sang tab gần nhất
- Khi đóng tab cuối → gọi `setNoFile()`

### `swap(oldPath, newPath)`
Thay thế path trong tab list — dùng sau khi rename file để tab không bị mất.

### `reorder(oldIndex, newIndex)`
Đổi thứ tự tab sau khi drag-and-drop. Logic tự động phân tách nhóm: các tab Pinned luôn nằm ở đầu và chỉ hoán đổi với nhau, các tab thường chỉ hoán đổi trong vùng Unpinned.

### `pin(path)` / `unpin(path)` / `togglePin(path)`
Ghim hoặc bỏ ghim một tab. Các tab đã ghim được chuyển lên đầu hàng và được bảo vệ khỏi lệnh `closeAll()`. Hàm `togglePin` tự động đảo ngược trạng thái ghim hiện tại.

### `setDirty(path, isDirty)`
Đánh dấu một file có thay đổi chưa lưu để hiển thị chỉ báo "Dirty dot". Thường được gọi từ `EditorModule`.

### `switchWorkspace(workspaceId)`
Load lại danh sách tab và trạng thái ghim đã lưu cho workspace mới từ localStorage.

---

## Multi-Select

| Function | Hành động |
|---|---|
| `selectAll()` | Chọn tất cả tab đang mở |
| `deselectAll()` | Bỏ chọn tất cả |
| `toggleSelect(path)` | Toggle chọn/bỏ chọn một tab (Ctrl+click) |
| `selectRange(path)` | Chọn range từ tab active đến tab được click (Shift+click) — luôn khớp với thứ tự hiển thị trực quan trên màn hình |

---

## Batch Operations

### `closeAll()`
Đóng tất cả tab KHÔNG ĐƯỢC GHIM. Nếu có draft chưa save → hiện xác nhận.

### `closeOthers(path)`
Đóng tất cả tab trừ `path` và trừ các tab đang được ghim.

### `closeSelected()`
Đóng tất cả tab đang được chọn. Tương đương Mod+W khi có multi-select. **Lưu ý:** Lệnh này sẽ đóng cả các tab đang được ghim nếu người dùng đã chủ động chọn chúng.

---

## Persistence

### `saveToStorage()`
Lưu `openFiles` vào localStorage với key `mdpreview_tabs_{workspaceId}`. Được gọi sau mỗi thay đổi.

### `render()`
Sync trạng thái sang TabBar component và highlight file active trong tree sidebar.

---

## Getters

```js
TabsModule.getActive()        // → string | null
TabsModule.getOpenFiles()     // → string[]
TabsModule.getSelectedFiles() // → string[]
```

---

*Document — 2026-04-27 (updated selection logic & pinned closure strategy)*
