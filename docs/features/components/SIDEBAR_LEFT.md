# SidebarLeftComponent (`renderer/js/components/organisms/sidebar-left.js`)

> Organism quản lý toàn bộ giao diện và bố cục của thanh bên trái (Left Sidebar), bao gồm Workspace Switcher, File Explorer, Search và Footer.

---

## Kiến trúc

```text
SidebarLeftComponent
├── WorkspaceSwitcherComponent  — Chọn workspace
├── Explorer View
│   ├── Recently Viewed Section (Fixed height)
│   └── Main Trees Container (#sidebar-main-trees)
│       ├── File Explorer Section (Flex: 1)
│       └── Hidden Items Section (Flex: 0 1 auto, Max-height: 50%)
├── Search View
│   └── Search Results Section
└── Footer
    ├── Settings Button
    ├── Shortcuts Button
    └── Explorer Settings Button
```

---

## State

| Property | Type | Mô tả |
|---|---|---|
| `currentView` | `string` | View hiện tại: `explorer` hoặc `search` |
| `width` | `number` | Chiều rộng sidebar (px), lưu tại `mdpreview_sidebar_left_width` |

---

## Lifecycle

### `init()`
Tự động lấy `width` từ localStorage, gọi `render()` và khởi tạo bộ Resizer.

### `render()`
Tạo cấu trúc DOM tĩnh cho thanh bên trái, bao gồm các mount point cho các component con và các section. 
Khởi tạo `WorkspaceSwitcherComponent` và các nút chức năng ở Footer.

---

## Views Management

### `switchView(viewName)`
Chuyển đổi giữa chế độ hiển thị Explorer và Search.
**Flow:**
1. Ẩn toàn bộ view hiện tại và các đường phân cách (`sidebar-divider`).
2. Hiện view tương ứng dựa trên `viewName`.
3. Cập nhật `state.currentView`.

---

## Resizer Logic

### `_initResizer()`
Gắn sự kiện `mousedown`, `mousemove`, `mouseup` vào phần tử `.sidebar-resizer` để thay đổi chiều rộng sidebar (từ 256px đến 600px). 
Lưu lại kích thước mới vào `localStorage` và `AppState.settings.sidebarWidth`.

---

## Persistence

| Key localStorage | Nội dung |
|---|---|
| `mdpreview_sidebar_left_width` | Chiều rộng Sidebar (px) |

---

## Lưu ý quan trọng

- Component này chỉ tạo **khung (shell)** và các **điểm gắn kết (mount points)**. 
- **Cơ chế cuộn**: Các danh sách con (Explorer, Hidden Items, Search Results) được bọc trong `ScrollContainer` molecule để hỗ trợ hiệu ứng mờ và vùng đệm thông minh.
- **Phân bổ không gian**: `Main Trees Container` sử dụng Flexbox để cân bằng diện tích giữa Explorer và Hidden Items (tỷ lệ 50/50 khi cả hai đều đầy).
- Dùng `window.SidebarLeft.init()` để khởi tạo Singleton.

---

*Document — 2026-04-26*
