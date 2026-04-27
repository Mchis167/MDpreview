# Search Palette Component (`renderer/js/components/organisms/search-palette.js`)

> Thành phần tìm kiếm nhanh (Quick Open) toàn cục, hỗ trợ điều hướng file nhanh chóng bằng bàn phím.

---

## Kiến trúc

`SearchPalette` hoạt động như một Singleton UI component (sử dụng `MenuShield` làm lớp vỏ). Nó kết hợp dữ liệu từ `FileService` (để tìm kiếm file trong workspace) và `RecentlyViewedService` (để hiển thị lịch sử truy cập).

---

## State

| Property | Type | Mô tả |
|---|---|---|
| `_isOpen` | `boolean` | Trạng thái hiển thị của bảng tìm kiếm. |
| `_results` | `Array` | Danh sách kết quả tìm kiếm hoặc file gần đây hiện tại. |
| `_selectedIndex` | `number` | Chỉ số của item đang được chọn (-1 nếu không có item nào được chọn). |
| `_searchTimeout` | `number` | ID của timer dùng cho cơ chế Debounce. |

---

## Lifecycle

### `init()`
Khởi tạo cấu trúc DOM, đăng ký các phím tắt toàn cục (`Cmd+P`) và thiết lập các trình lắng nghe sự kiện.
- **Floating Bar Suppression**: Khi bảng tìm kiếm mở, nó sẽ thêm class `is-searching` vào `body` để tạm ẩn các thanh công cụ nổi khác (`Mode Change Bar`, `Editor Toolbar`).

---

## Key Functions

### `show()`
Mở bảng tìm kiếm.
1. Khôi phục trạng thái ban đầu.
2. Tự động lấy danh sách file gần đây nếu ô tìm kiếm trống.
3. Tập trung tiêu điểm (focus) vào ô nhập liệu.

### `hide()`
Đóng bảng tìm kiếm, xóa tiêu điểm và reset vị trí cuộn của danh sách kết quả về đầu trang.

### `_onSearch(query)`
Thực hiện tìm kiếm file:
- **Debounce**: Lệnh tìm kiếm chỉ thực thi sau 150ms kể từ lần gõ phím cuối cùng.
- **Empty Query**: Nếu query rỗng, hiển thị file gần đây từ `RecentlyViewedService`.
- **Fuzzy Search**: Sử dụng `FileService.searchFiles()` để tìm kiếm file theo tên và đường dẫn.

### `_renderResults()`
Render danh sách kết quả vào DOM:
- **Smart Path**: Sử dụng `_formatSmartPath()` để rút gọn đường dẫn dài, chỉ giữ lại 3 cấp thư mục cuối cùng (ví dụ: `.../folder/file.md`).
- **Highlighting**: Bôi đậm các ký tự khớp với từ khóa tìm kiếm.
- **Empty State**: Hiển thị icon `file-search-corner` và thông điệp hướng dẫn nếu không có kết quả.

### `_formatSmartPath(path)`
Thuật toán rút gọn đường dẫn: nếu đường dẫn có nhiều hơn 3 cấp, nó sẽ được thay thế phần đầu bằng `.../`.

---

## Keyboard Shortcuts

| Shortcut | Hành động |
|---|---|
| ⌘P | Mở/Đóng nhanh bảng tìm kiếm. |
| ⌘F | (Trong Markdown Viewer) Mở bảng tìm kiếm. |
| Escape | Đóng bảng tìm kiếm. |
| Arrow Up/Down | Duyệt qua danh sách kết quả. |
| Enter | Mở file đang được chọn (sử dụng `TreeModule.openFile`). |

---

## Giao diện (CSS)

Thành phần này sử dụng các Design Tokens và Atom chuẩn:
- **Lớp vỏ**: Glassmorphism (`--ds-bg-blur`, `--ds-bg-surface`).
- **Phím tắt**: Sử dụng Atom `.ds-kbd` để hiển thị hướng dẫn bàn phím ở footer.
- **Animation**: Smooth fade-in/out cho bảng tìm kiếm và trượt thoát cho các thanh công cụ bị suppression.

---

*Document — 2026-04-27*
