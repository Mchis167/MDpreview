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
| `_searchMode` | `string` | Chế độ lọc hiện tại (`all`, `file`, `directory`, hoặc `shortcut`). |
| `_searchTimeout` | `number` | ID của timer dùng cho cơ chế Debounce. |

---

## Lifecycle

### `init()`
Khởi tạo cấu trúc DOM sử dụng các thành phần chuẩn từ `DesignSystem` (createElement, createButton). Đăng ký các phím tắt toàn cục (`Cmd+P`) và thiết lập các trình lắng nghe sự kiện.
- **Dynamic Search Placeholders**: Ô nhập liệu tự động cập nhật nội dung gợi ý (placeholder) dựa trên chế độ tìm kiếm hiện tại (`Search files and folders...`, `Search keyboard shortcuts...`, v.v.).
- **Floating Bar Suppression**: Khi bảng tìm kiếm mở, nó sẽ thêm class `is-searching` vào `body` để tạm ẩn các thanh công cụ nổi khác (`Mode Change Bar`, `Editor Toolbar`).
- **Dynamic Height Morphing**: Palette sử dụng cơ chế "biến hình" chiều cao mượt mà. Chiều cao mục tiêu (`--_target-h`) được tính toán động dựa trên nội dung thực tế để đảm bảo không bị khựng khi kết quả tìm kiếm thay đổi.

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
- **Slash Commands**: Hỗ trợ chuyển chế độ nhanh bằng cách nhập `/1 ` (Files & Folders), `/2 ` (Files), `/3 ` (Folders), hoặc `/4 ` (Shortcuts) ở đầu ô tìm kiếm.
- **Debounce**: Lệnh tìm kiếm chỉ thực thi sau 150ms kể từ lần gõ phím cuối cùng.
- **Empty Query**: Nếu query rỗng:
    - Chế độ Files/Folders: Hiển thị file/folder gần đây từ `RecentlyViewedService`.
    - Chế độ Shortcuts: Hiển thị danh sách tất cả phím tắt được phân nhóm.
- **Fuzzy Search**: Sử dụng `SearchService.search()` hoặc `SearchService.searchShortcuts()` tùy theo chế độ.

### `_renderResults()`
Render danh sách kết quả vào DOM:
- **Section Header**: Hiển thị tiêu đề ngữ cảnh ("Recent Files", "Recent Folders", v.v.) khi ô tìm kiếm trống, hoặc hiển thị chỉ báo số lượng kết quả khi đang tìm kiếm.
- **Shortcuts Rendering**: Ở chế độ Shortcuts, kết quả được hiển thị với icon riêng biệt cho từng lệnh, nhãn phím tắt (KBD) và hỗ trợ phân nhóm (Navigation, Editor, v.v.).
- **Smart Path**: Sử dụng `_formatSmartPath()` để rút gọn đường dẫn dài, chỉ giữ lại 3 cấp thư mục cuối cùng.
- **Highlighting**: Bôi đậm các ký tự khớp với từ khóa tìm kiếm.
- **Smart Scroll Mask**: Sử dụng `UIUtils.applySmartScrollMask` để tạo hiệu ứng mờ dần ở cạnh trên khi danh sách kết quả được cuộn.
- **Empty State**: Hiển thị thông điệp và icon chuyên biệt (ví dụ `search-x`) cho từng loại kết quả không tìm thấy.

### `_updateMorphHeight()`
Tính toán chiều cao mục tiêu bằng cách cộng dồn chiều cao của các thành phần con (`Header` + `Options` + `Results` + `Footer`) cộng thêm 2px bù cho border. Kết quả được gán vào biến CSS `--_target-h` để thực hiện transition mượt mà.

### `_formatSmartPath(path)`
Thuật toán rút gọn đường dẫn: nếu đường dẫn có nhiều hơn 3 cấp, nó sẽ được thay thế phần đầu bằng `.../`.

---

## Keyboard Shortcuts

| Shortcut | Hành động |
|---|---|
| ⌘P | Mở/Đóng nhanh bảng tìm kiếm (Chế độ Files & Folders). |
| ⌘/ | Mở nhanh bảng tìm kiếm ở chế độ **Shortcuts**. |
| ⌘F | (Trong Markdown Viewer) Mở bảng tìm kiếm. |
| Escape | Đóng bảng tìm kiếm. |
| Arrow Up/Down | Duyệt qua danh sách kết quả. |
| Enter | Mở file hoặc thực thi phím tắt đang được chọn. |
| `/1`, `/2`, `/3`, `/4` | (Khi focus vào input) Chuyển đổi nhanh giữa các chế độ Files & Folders, Files, Folders, và Shortcuts. |
| Backspace | (Khi input trống) Nhấn để xóa chế độ lọc hiện tại và quay về chế độ "All". |

---

## Giao diện (CSS)

Thành phần này sử dụng các Design Tokens và Atom chuẩn:
- **Lớp vỏ**: Glassmorphism (`--ds-surface-overlay`).
- **Phím tắt**: Sử dụng Atom `.ds-kbd` để hiển thị hướng dẫn bàn phím ở footer.
- **Animation**: Smooth fade-in/out cho bảng tìm kiếm và trượt thoát cho các thanh công cụ bị suppression.

---

*Document — 2026-04-27 22:33*
