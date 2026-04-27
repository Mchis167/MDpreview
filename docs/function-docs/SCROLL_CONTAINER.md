# ScrollContainer (`renderer/js/components/molecules/scroll-container.js`)

> Molecule quản lý vùng cuộn thông minh với hiệu ứng mask-fade và vùng đệm an toàn (Safe Zone) tự động.

---

## Mục đích

Giải quyết vấn đề layout khi nội dung cuộn thay đổi động. Thay vì sử dụng `overflow: auto` đơn thuần, `ScrollContainer` bọc nội dung vào các lớp mask để tạo hiệu ứng mờ (fade) chuyên nghiệp và tự động quản lý khoảng trống ở cuối danh sách (Bottom Spacer) để tránh bị kẹt thao tác khi cuộn đến cuối.

---

## Cách sử dụng

```javascript
const contentEl = document.createElement('div');
// ... thêm nội dung vào contentEl ...

const scrollContainer = ScrollContainer.create(contentEl, {
  className: 'ds-scrollbar-thin', // Tùy chọn class cho thanh cuộn
  enableSafeZone: true,          // Bật/tắt vùng đệm 100px ở cuối
  enableFade: true,              // Bật/tắt hiệu ứng mờ top/bottom
  safeHeight: 100                // Chiều cao vùng đệm (pixel)
});

mountPoint.appendChild(scrollContainer);
```

---

## Kiến trúc nội bộ

`ScrollContainer` sử dụng cấu trúc DOM 3 lớp:
1. **Container (`.ds-scroll-container`)**: Lớp ngoài cùng quản lý `overflow` và `mask-image`.
2. **Wrapper (`.ds-scroll-content`)**: Chứa nội dung thực tế.
3. **Safe Zone (`.ds-scroll-safe-zone`)**: Khoảng trống ảo nằm cuối wrapper.

---

## Tính năng thông minh (ResizeObserver)

Module tích hợp `ResizeObserver` để tự động theo dõi kích thước nội dung:
- **`is-scrollable`**: Class này tự động được thêm vào container khi `scrollHeight > clientHeight`.
- **Dynamic Mask**: Hiệu ứng mờ chỉ xuất hiện khi container ở trạng thái `is-scrollable`.
- **Dynamic Safe Zone**: Vùng đệm 100px chỉ chiếm diện tích (display: block) khi nội dung thực sự cần cuộn.

---

## CSS Variables

| Biến | Mô tả | Mặc định |
|---|---|---|
| `--_fade-top` | Độ mờ ở đỉnh (được JS cập nhật khi cuộn) | `0px` |
| `--_fade-bottom` | Độ mờ ở đáy | `24px` |
| `--ds-scroll-safe-height` | Chiều cao vùng đệm an toàn | `100px` |

---

## Lưu ý quan trọng

- **Re-mount**: Khi sử dụng trong các module có render-loop (như Sidebar), cần đảm bảo container được gắn lại (append) vào DOM nếu mount point bị xóa.
- **Pointer Events**: Vùng Safe Zone có `pointer-events: none` để không chặn các click vào nền phía sau nếu cần thiết.

---

*Document — 2026-04-26*
