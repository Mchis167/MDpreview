# Shortcuts Component (`renderer/js/components/organisms/shortcuts-component.js`)

> Thành phần quản lý và hiển thị danh sách các phím tắt toàn cục của ứng dụng.

---

## Kiến trúc

`ShortcutsComponent` hoạt động như một **Headless Engine**:
1.  **Data Provider**: Cung cấp dữ liệu tĩnh cho `SearchPalette` (bao gồm `tags` và `icon`) thông qua các hàm static.
2.  **Execution Engine**: Trung tâm xử lý và thực thi các hành động tương ứng với phím tắt.
3.  **UI Logic**: Đã được loại bỏ và hợp nhất hoàn toàn vào `SearchPalette` để đảm bảo tính tập trung.

---

## Key Functions (Static)

### `getShortcutData(isMac)`
Trả về danh sách các phím tắt được phân nhóm (Navigation, Editor, File, v.v.).
- **Schema**: Mỗi item bao gồm `id`, `label`, `keys`, `icon` và mảng `tags` (từ khóa đồng nghĩa).
- **isMac**: Boolean để quyết định hiển thị ký hiệu `⌘` (Mac) hay `Ctrl` (Windows).

### `executeAction(id)`
Thực thi hành động dựa trên `id` của phím tắt.
- Chức năng: Tìm kiếm phần tử UI tương ứng (ví dụ: nút Save, nút Toggle Sidebar) và giả lập sự kiện `click`.
- Được sử dụng bởi: `SearchPalette` khi người dùng nhấn `Enter` vào một kết quả phím tắt.

---

## Các nhóm phím tắt chính

1.  **Navigation**: Điều hướng sidebar, chuyển đổi view.
2.  **Editor**: Thao tác văn bản, lưu file, tìm kiếm nội dung.
3.  **File Operations**: Tạo mới, xóa, đổi tên file/folder.
4.  **Interface**: Zoom, chế độ hiển thị, đóng/mở panel.

---

## Cách sử dụng trong Search Palette

```javascript
// Lấy dữ liệu để search
const data = ShortcutsComponent.getShortcutData(true);

// Thực thi khi chọn
ShortcutsComponent.executeAction('toggle-sidebar');
```

---

*Document — 2026-04-27 22:35*
