# TOC Component (`renderer/js/components/organisms/toc-component.js`)

> Module quản lý mục lục nổi (Floating Table of Contents), hỗ trợ điều hướng nhanh và đồng bộ trạng thái cuộn.

---

## Kiến trúc

TOC Component hoạt động như một Overlay trên `MarkdownViewer`. Nó bao gồm:
- **TOC Trigger**: Nút bấm nổi để đóng/mở.
- **TOC Panel**: Bảng hiển thị danh sách các tiêu đề (Headings).

---

## State & Persistence

Module này không lưu trữ state bền vững (persistence). Trạng thái hiển thị (`_isVisible`) được quản lý cục bộ trong phiên làm việc.

---

## Các Function chính

### `init()`
Khởi tạo module, đăng ký các event listeners (scroll, click) và thiết lập cấu trúc DOM ban đầu.

### `update(headings)`
Cập nhật danh sách các tiêu đề từ nội dung Markdown hiện tại.
- **Lưu ý**: Tự động loại bỏ thẻ `H1` để giữ cho mục lục gọn gàng. Nếu không tìm thấy Heading nào, module sẽ hiển thị **Empty State** với icon `list-tree`.

### `reset()`
Xóa toàn bộ state tạm thời, đưa mục lục về trạng thái **Skeleton Loading**. Được gọi khi người dùng chuyển sang một file mới.

### `show()`
Hiển thị bảng mục lục với hiệu ứng **Full Slide-in** từ biên phải.
- Kích hoạt trạng thái `.is-active` cho nút bấm.
- Thêm class `.has-toc` cho viewer để dịch chuyển nội dung văn bản.

### `hide()`
Ẩn bảng mục lục và khôi phục layout văn bản về trạng thái ban đầu.

### `updateActiveHeading(container)`
Logic trung tâm để đồng bộ trạng thái cuộn:
- **Threshold**: Sử dụng hằng số `SCROLL_OFFSET = 240px` làm ngưỡng nhận diện active.
- **Sync**: Khi người dùng click vào một mục trong TOC, trang web sẽ cuộn sao cho heading đó dừng lại ở vị trí `230px` (ngay trên ngưỡng active 10px) để đảm bảo highlight ngay lập tức.
- **Auto-expansion**: Tự động mở rộng (expand) các nhánh cha nếu tiêu đề đang active nằm trong nhóm con.

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
