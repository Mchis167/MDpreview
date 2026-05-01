# ShortcutsComponent (`renderer/js/components/organisms/shortcuts-component.js`)

> Định nghĩa tập trung toàn bộ dữ liệu phím tắt và các hành động (actions) của hệ thống MDpreview.

---

## Kiến trúc

`ShortcutsComponent` hiện đã được chuyển đổi từ một UI Component thuần túy sang một **Static Registry Module**. Nó cung cấp dữ liệu cho:
1. **ShortcutService**: Để đăng ký các trình lắng nghe phím.
2. **SearchPalette**: Để hiển thị danh sách lệnh khi tìm kiếm.
3. **UI Help**: Hiển thị bảng hướng dẫn phím tắt cho người dùng.

---

## Key Functions

### `static getShortcutData(isMac)`
Trả về cấu trúc phân cấp các nhóm phím tắt của ứng dụng.
- **isMac**: Boolean để xác định hiển thị `Cmd` vs `Ctrl` hoặc các phím đặc thù của MacOS.

**Cấu trúc một Item:**
```js
{
  id: 'mode-read',        // ID hành động (khớp với handler trong app.js)
  label: 'Switch to Read mode', 
  keys: ['1'],            // Mảng các phím (Mod, Shift, Alt, v.v.)
  icon: 'book-open',      // Tên icon Lucide
  tags: ['view', 'xem'],  // Từ khóa dùng cho tìm kiếm ngữ nghĩa
  isInformative: false    // Nếu true, đây chỉ là chỉ dẫn (ví dụ: Shift+Click)
}
```

### `static executeAction(id)`
Một hàm bridge (cầu nối) để gọi thực thi hành động qua `ShortcutService.execute(id)`.

---

## Nhóm Phím tắt chính

1. **Navigation**: Chuyển chế độ xem, ẩn hiện sidebar, tìm kiếm nhanh, cuộn trang.
2. **Editor**: Lưu file, Undo, Redo, Markdown Helper.
3. **Tab Management**: Đóng tab, ghim tab, chọn nhiều tab.
4. **Sidebar & Workspace**: Tạo mới, đổi tên, xóa, chuyển workspace, ẩn hiện file.
5. **General**: Mở bảng cài đặt, bảng phím tắt.

---

## Lưu ý cho Developer

- Khi thêm một tính năng mới có phím tắt:
    1. Đăng ký item vào `getShortcutData()` trong file này.
    2. Đăng ký handler tương ứng trong `app.js` (phần `ShortcutService.registerGroups`).
- Các phím đặc biệt dùng trong mảng `keys`:
    - `Mod`: Tương ứng `Cmd` (Mac) hoặc `Ctrl` (Win).
    - `↑`, `↓`, `←`, `→`: Các phím mũi tên.
    - `Esc`, `Enter`, `Backspace`, `Delete`.

---

*Document — 2026-04-29 (Updated Editor shortcuts)*
