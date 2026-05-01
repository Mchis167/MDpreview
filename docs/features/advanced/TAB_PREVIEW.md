# Tab Preview Module (`renderer/js/components/molecules/tab-preview.js`)

> Cung cấp tính năng xem trước nội dung file (Hover Preview) khi người dùng di chuột qua các tab, giúp định vị nhanh nội dung mà không cần switch file.

---

## Mục đích

Giải quyết bài toán "quên nội dung file" khi mở quá nhiều tab. Module cung cấp một khung nhìn Glassmorphism cao cấp, hiển thị nội dung render thực tế của file tại vị trí người dùng đang xem dở.

---

## Key Functions

### `init()`
Khởi tạo module và đăng ký event listener toàn cục:
- Lắng nghe `mouseover` trên toàn bộ document (Event Delegation).
- Phát hiện các phần tử có thuộc tính `data-path` (thanh Tab).

### `_showPreview(target, path)`
**Logic hiển thị:**
1. **Active Check**: Bỏ qua nếu là tab đang hoạt động.
2. **Debounce (300ms)**: Phản hồi nhanh nhưng vẫn tránh kích hoạt nhầm khi lướt nhanh.
3. **Cache Lookup**: Kiểm tra bộ nhớ đệm nội bộ để hiển thị ngay lập tức nếu nội dung chưa quá hạn (60s).
4. **Scroll Context**: Lấy vị trí cuộn chính xác từ `ScrollModule`.
5. **Mirror Strategy**: Gửi yêu cầu render với cửa sổ nội dung rộng (10,000 dòng) để đảm bảo layout trung thực.
6. **Positioning**: Hiển thị popover ngay dưới tab, căn giữa theo tab và giới hạn trong biên màn hình.

---

## Cơ chế Mirror Viewport
Để đạt độ trung thực 1:1, module sử dụng kỹ thuật "Gương thu nhỏ":
1. **Virtual Container**: Nội dung render được đặt trong một container cố định rộng **800px** (khớp với viewer chính).
2. **Scaling**: Toàn bộ nội dung được thu nhỏ bằng `transform: scale(0.38)` để vừa vặn trong khung preview (352px width).
3. **Scroll Parity**: Gán trực tiếp `scrollTop` của container preview khớp với viewer chính, đảm bảo không sai lệch vị trí.
4. **Caching**: Sử dụng Map làm bộ nhớ đệm, lưu trữ HTML đã render theo `path`. Cache tự động bị xóa sau 60 giây (TTL) để đảm bảo dữ liệu không bị cũ.

> Xem chi tiết quyết định thiết kế tại [`docs/decisions/20260427-tab-preview-mirror-strategy.md`](../decisions/20260427-tab-preview-mirror-strategy.md)

---

## Kiến trúc UI (Glassmorphism)

- **Blur**: Sử dụng `--ds-blur-lg` cho hiệu ứng kính mờ.
- **Background**: Sử dụng `--ds-bg-popover-glass` (nền alpha).
- **Radius**: Bo góc theo token `--ds-radius-surface`.
- **Metadata Footer**: Bổ sung thanh thông tin dưới cùng hiển thị:
    - **Filename**: Tên file đầy đủ.
    - **Last Edited Stats**: Thời gian chỉnh sửa cuối cùng lấy từ server (Lazy Fetching).
- **Interactivity**: Khung preview sẽ không tự đóng nếu người dùng di chuyển chuột từ tab vào bên trong khung preview.

---

## Lưu ý quan trọng

- Phụ thuộc chặt chẽ vào `ScrollModule` để biết file đang cuộn đến đâu.
- Yêu cầu Tab Bar item phải có thuộc tính `data-path`.
- Chỉ hỗ trợ preview cho các file thực tế trên đĩa (không hỗ trợ Draft ảo chưa lưu).

---

*Document — 2026-04-27 10:30*
