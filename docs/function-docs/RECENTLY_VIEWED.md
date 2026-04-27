# Recently Viewed Service (`renderer/js/services/recently-viewed-service.js`)

> Quản lý và hiển thị danh sách các tập tin vừa truy cập gần đây trên Sidebar.

---

## Mục đích

Cung cấp khả năng truy cập nhanh vào các tập tin người dùng thường xuyên làm việc. Dữ liệu được lưu trữ cục bộ theo từng workspace.

---

## Key Functions

### `add(path)`
Thêm một đường dẫn file vào danh sách gần đây.
- Đưa file lên đầu danh sách nếu đã tồn tại.
- Giới hạn tối đa 10 item (mặc định).
- Tự động gọi `render()` để cập nhật UI.

### `remove(path)`
Xóa một file khỏi danh sách lịch sử.

### `render()`
Render danh sách sử dụng `TreeViewComponent`. 
- **Hidden Awareness**: Kiểm tra trạng thái ẩn của từng file thông qua `AppState.settings.hiddenPaths`. 
- **Visual Indicator**: Nếu file đang bị ẩn, nó sẽ được gắn cờ `isHidden: true`, khiến `TreeViewComponent` render với độ mờ (opacity) 50%.

### `getRecentFiles()`
Trả về mảng các đường dẫn file gần đây từ `localStorage` của workspace hiện tại. Được sử dụng bởi Search Palette để hiển thị gợi ý khi chưa nhập từ khóa.

---

## Persistence

| Key localStorage | Nội dung |
|---|---|
| `mdpreview_recent_files_{workspaceId}` | Mảng các đường dẫn file gần đây |

---

## Lưu ý quan trọng

- Service này sử dụng một instance nội bộ của `TreeViewComponent` để đảm bảo giao diện thống nhất với Explorer chính.
- Khác với Explorer, danh sách này chỉ hiển thị file, không hiển thị folder.

---

*Document — 2026-04-27*
