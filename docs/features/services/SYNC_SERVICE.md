# Sync Service (`renderer/js/services/sync-service.js`)

> Headless service quản lý việc đồng bộ hóa vị trí (scroll và cursor) giữa chế độ xem (Read Mode) và chế độ chỉnh sửa (Edit Mode).

---

## Mục đích

Giải quyết bài toán "Line Parity" — đảm bảo khi người dùng chuyển từ Read sang Edit (hoặc ngược lại), nội dung đang hiển thị tại vị trí cũ sẽ tiếp tục được hiển thị tại vị trí mới, giảm thiểu sự xao nhãng và mất dấu dòng đang đọc/viết.

---

## Key Functions

### `syncPosition(fromMode, toMode, options)`
Hàm chính điều phối việc lưu và khôi phục vị trí.

**Flow:**
1. **Lưu (Save)**: Lấy metadata vị trí từ `fromMode`.
   - Nếu `read` -> `edit`: Gọi `_getReadMetadata()` để lấy dòng trên cùng đang hiển thị.
   - Nếu `edit` -> `read`: Gọi `_getEditMetadata()` để lấy dòng chứa con trỏ (cursor).
2. **Khôi phục (Restore)**: Áp dụng metadata vào `toMode`.
   - Chuyển sang `edit`: Cuộn textarea tới dòng đã lưu và set cursor.
   - Chuyển sang `read`: Sử dụng `MarkdownLogicService` để tìm phần tử DOM tương ứng và cuộn tới đó.

### `_getReadMetadata()`
Quét Viewport để tìm dòng văn bản (paragraph, heading, v.v.) đang nằm ở cạnh trên của màn hình.

### `_getEditMetadata()`
Lấy chỉ số dòng (line number) hiện tại của con trỏ trong trình soạn thảo.

---

## Kiến trúc nội bộ

Service này hoạt động như một Bridge giữa:
- **MarkdownViewer**: Cung cấp truy cập tới DOM elements (textarea, preview mount).
- **MarkdownLogicService**: Cung cấp thuật toán tìm kiếm dòng tương ứng trong HTML rendered.
- **AppState**: Cung cấp thông tin về mode hiện tại.

Sử dụng `window._suppressScrollSync` (token) để tạm dừng các listener cuộn tự động trong quá trình thực hiện đồng bộ, tránh hiện tượng "vòng lặp cuộn" (scroll loops).

Service này cũng hỗ trợ **Forced Sync Context** thông qua `AppState.forceSyncContext`. Nếu thuộc tính này tồn tại, `ChangeActionViewBar` sẽ bỏ qua việc tự chụp vị trí mà dùng trực tiếp dữ liệu này để đồng bộ, giúp bảo toàn vùng chọn khi bôi đen và Edit.

---

## Lưu ý quan trọng

- **Race Condition**: Khi chuyển sang Read Mode, việc cuộn có thể thất bại nếu nội dung (như Mermaid) chưa render xong. Service tích hợp cơ chế `requestAnimationFrame` và check `isRendering` flag của Viewer.
- **Precision**: Độ chính xác của việc đồng bộ phụ thuộc vào thuật toán Sandwich Strategy trong `MarkdownLogicService`.

---

*Document — 2026-04-29 (Updated Forced Sync mechanism)*
