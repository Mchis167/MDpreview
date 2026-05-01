# TOC Component (`renderer/js/components/organisms/toc-component.js`)

> Module quản lý mục lục nổi (Floating Table of Contents), hỗ trợ điều hướng nhanh và đồng bộ trạng thái cuộn.

---

## Kiến trúc

TOC Component hoạt động như một Overlay trên `MarkdownViewer`. Nó hỗ trợ hai chế độ hiển thị (View Modes):
- **Outline (Default)**: Hiển thị cấu trúc tiêu đề cây (Tree View).
- **Project Map**: Hiển thị bản đồ thu nhỏ phản chiếu trực quan tài liệu (Mini-map).

---

## State & Persistence

- `_activeView`: Lưu trữ chế độ hiển thị hiện tại (`outline` hoặc `map`).
- `_expandedState / _collapsedState`: Lưu trữ trạng thái đóng/mở của các nhánh tiêu đề để giữ tính nhất quán khi re-render.

---

## Các Function chính

### `init()`
Khởi tạo module và thiết lập trình điều khiển chuyển đổi (Segmented Control) giữa Outline và Map.

### `renderBody()`
Logic trung tâm để dựng nội dung bên trong bảng:
- **Outline Mode**: Xây dựng cây tiêu đề từ `_tree`.
- **Map Mode**: Gán class `.is-map` cho `.toc-body` để tối ưu không gian và gọi `ProjectMap.render()`.

### `update(headings)`
Cập nhật danh sách các tiêu đề và đồng bộ hóa nội dung Project Map nếu đang ở chế độ Map.

### `reset()`
Xóa toàn bộ state tạm thời, đưa mục lục về trạng thái **Skeleton Loading**. Được gọi khi người dùng chuyển sang một file mới.

### `show()`
Hiển thị bảng mục lục với hiệu ứng **Full Slide-in** từ biên phải.
- Kích hoạt trạng thái `.is-active` cho nút bấm.
- Đảm bảo thanh chỉ báo của **Segmented Control** được đồng bộ đúng vị trí (`updateActive`).
- Thêm class `.has-toc` cho viewer để dịch chuyển nội dung văn bản.

### `hide()`
Ẩn bảng mục lục và khôi phục layout văn bản về trạng thái ban đầu.

### `updateActiveHeading(container)`
Logic trung tâm để đồng bộ trạng thái cuộn:
- **Outline Sync**: Đánh dấu tiêu đề hiện tại (`is-active`), tự động mở rộng nhánh cha và cuộn danh sách mục lục. Ngưỡng nhận diện active là `SCROLL_OFFSET = 240px`.
- **Project Map Sync**: Gọi `ProjectMap.syncScroll()` để cập nhật vị trí vùng highlight trên bản đồ tương ứng với vị trí cuộn của viewer.

---

## Chuyển động (Animations)

Tất cả chuyển động được điều khiển bởi hệ thống **Semantic Tokens**:
- `--ds-transition-slow`: `0.5s` cho hiệu ứng trượt.
- `--ds-transition-spring`: `cubic-bezier(0.16, 1, 0.3, 1)` cho cảm giác mượt mà.

### Premium UI Enhancements
- **Smart Scroll Mask**: Sử dụng `UIUtils.applySmartScrollMask` để tạo hiệu ứng mờ dần (fade) ở hai đầu danh sách khi cuộn.
- **Scroll Snap**: Tự động "hít" (snap) về vị trí hiển thị padding khi người dùng cuộn kịch trần (CSS Scroll Snap).

---

## Lưu ý quan trọng

- TOC yêu cầu một container cha có `position: relative` (mặc định là `#md-viewer-mount`).
- Việc dịch chuyển nội dung văn bản (`padding-right`) được thực hiện thông qua class `.has-toc` trên viewer mount point.

---

*Document — 2026-04-28*
