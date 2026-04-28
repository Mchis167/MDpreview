# Project Map (`renderer/js/components/molecules/project-map.js`)

> Thành phần bản đồ thu nhỏ (Mini-map) cung cấp cái nhìn tổng quan 1:1 và điều hướng nhanh cho tài liệu Markdown.

---

Project Map sử dụng chiến lược **True Optical Mirror** với cấu trúc phân lớp:
- **Body (.ds-project-map__body)**: Vùng cuộn chính, được ép chiều cao bằng JS để chống giãn nở layout.
- **Track (.ds-project-map__track)**: Lớp nền quản lý tổng chiều cao vật lý của bản đồ (tương đương `viewer.scrollHeight * _scale`).
- **Mirror (.ds-project-map__mirror)**: Chứa nội dung HTML unscaled, dùng `transform: scale()` để thu nhỏ.
- **Interaction Layer (.ds-project-map__overlay)**: Lớp phủ bắt sự kiện click/drag.
- **Footer (.ds-project-map__footer)**: Thanh điều khiển Zoom cố định ở dưới cùng.

---

## State & Cấu hình

| Thuộc tính | Loại | Mô tả |
|---|---|---|
| `_scale` | `number` | Tỉ lệ thu nhỏ cuối cùng (Base Scale * Zoom Factor). |
| `_zoomFactor` | `number` | Hệ số phóng đại người dùng chọn (0.2 - 1.0). |
| `_currentContent` | `string` | Hash nội dung hiện tại để tránh render lại. |

---

## Các thành phần chính

### `render(container, viewportEl)`
Khởi tạo bản đồ vào một container.
- **Input**: `container`, `viewportEl` (viewer chính).
- **Mới**: Tạo cấu trúc Flexbox (Body + Footer) và các nút Zoom.

### `_applyZoom(mapEl)`
Cập nhật tỉ lệ và chiều cao container cục bộ mà không cần render lại HTML.
- **Instant Response**: Phản hồi tức thì khi người dùng nhấn `+` hoặc `-`.
- **Logic**: Tính toán lại `_scale` và cập nhật biến CSS `--_scale`.

### `update(mapEl, viewportEl)`
Cập nhật nội dung bản đồ khi tài liệu thay đổi.
- Tính toán `scrollHeight` của nội dung unscaled.
- Cập nhật chiều cao `track` (scaled) và `mirror` (unscaled).

### `syncScroll(mapEl)`
Đồng bộ vị trí của vùng highlight (Viewport Indicator) theo Viewer chính.
- **Auto-centering**: Tự động cuộn bản đồ để giữ vùng highlight ở trung tâm panel.

---

## Tương tác người dùng

- **Click (Single Click)**: Cuộn mượt (`smooth`) Viewer chính đến vị trí tương ứng.
- **Drag (Kéo chuột)**: Cuộn tức thời (`auto`) theo tay người dùng để duyệt nhanh.
- **Zoom Controls**: Tăng/giảm tỉ lệ bản đồ qua nút `+` và `-`. Nút tự động vô hiệu hóa (disabled) khi đạt giới hạn (100% hoặc 20%).

---

## Lưu ý quan trọng

- **JS Height Enforcement**: Bắt buộc ép chiều cao `mapEl` và `body` dựa trên `parentElement.clientHeight` để đảm bảo khả năng cuộn trên thanh bên.
- **Fixed Width (800px)**: Ép chiều rộng nội dung unscaled trong mirror là **800px** và giữ nguyên `padding` để đảm bảo tính đồng bộ layout và tọa độ cuộn 1:1 với viewer chính.
- **Design System Consistency**: Sử dụng `.ds-btn.ds-btn-off-label` cho các nút điều khiển để đồng bộ UI.
- **Performance**: Việc render lại nội dung được debounce 600ms. Các thao tác Zoom được xử lý cục bộ tại trình duyệt (0ms latency).

---

*Document — Updated 2026-04-28 (Session: Zoom & Footer Refactor)*
