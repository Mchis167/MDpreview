# Sync Service (`renderer/js/services/sync-service.js` & `monaco-sync-service.js`)

> Headless service quản lý việc đồng bộ hóa vị trí (scroll và cursor) giữa chế độ xem (Read Mode) và chế độ chỉnh sửa (Edit Mode) dựa trên cơ chế Absolute Character Offset.

---

## Mục đích

Giải quyết bài toán "Line Parity" với độ chính xác tuyệt đối. Khi người dùng chuyển đổi giữa Read và Edit, ứng dụng đảm bảo nội dung đang hiển thị (hoặc văn bản đang chọn) sẽ được định vị chính xác tại trung tâm màn hình ở chế độ mới, loại bỏ hoàn toàn hiện tượng lệch dòng thường thấy ở các trình soạn thảo Markdown thông thường.

---

## Cơ chế cốt lõi: Absolute Sync Engine

Thay vì dựa trên số dòng (Line Number) vốn dễ bị sai lệch do quá trình render HTML (gộp dòng, bóc tách code block, bảng), hệ thống sử dụng **Character Offset** (vị trí ký tự tuyệt đối trong file nguồn).

### 1. Phía Server / Render
Trong quá trình render Markdown sang HTML, server (hoặc worker) sẽ inject metadata vào từng phần tử DOM:
- **`data-src-start`**: Vị trí ký tự bắt đầu của block/inline element trong file Markdown gốc.
- **`data-src-end`**: Vị trí ký tự kết thúc.
- **`data-line`**: (Fallback) Số dòng tương ứng.

### 2. Phía Read Mode (`captureReadViewSyncData`)
Khi người dùng chuyển sang Edit mode:
1. **Nếu có vùng chọn (Selection)**: Lấy phần tử cha gần nhất có `data-src-start`. Kết hợp với `window.getSelection()` để xác định dải ký tự (`srcStart` và `srcEnd`).
2. **Nếu không có vùng chọn**: Tìm phần tử nằm tại tọa độ trung tâm Viewport (Center Element) và lấy `data-src-start` của nó.
3. Trả về metadata: `{ srcStart, srcEnd, selectionText, isRealSelection }`.

### 3. Phía Edit Mode (`monaco-sync-service.js`)
Khi nhận metadata từ Read mode:
1. **Absolute Match (Stage 0)**: Nếu có `srcStart`, Monaco Service sẽ gọi `model.getPositionAt(srcStart)` để lấy tọa độ (line, column) chính xác và cuộn tới đó.
2. **Fuzzy Match (Stage 1)**: Nếu không có offset (ví dụ: load từ bản cũ), service sử dụng "Sandwich Strategy" để tìm kiếm chuỗi văn bản (`selectionText`) trong model Monaco.
3. **Line Fallback (Stage 2)**: Cuối cùng mới sử dụng số dòng làm phương án dự phòng.

---

## Key Functions

### `SyncService.captureReadViewSyncData()`
Quét DOM để thu thập ngữ cảnh đồng bộ. Ưu tiên cao nhất cho `data-src-start`.

### `SyncService.syncReadView(context)`
Được gọi khi chuyển từ Edit sang Read.
- Duyệt tất cả phần tử có `data-src-start` để tìm phần tử bao phủ vị trí cursor.
- **Smart Open**: Tự động mở các khối `<details>` nếu mục tiêu nằm bên trong.
- **Proportional Scroll**: Nếu block quá lớn (như một code block dài), service sẽ tính toán tỷ lệ % vị trí ký tự để cuộn chính xác phần nội dung bên trong block ra giữa màn hình.

### `MonacoSyncService.syncCursor(monacoService, context)`
Cầu nối xử lý logic đồng bộ phía Monaco. Thực hiện các bước từ Stage 0 đến Stage 3 (Reveal & Selection).

---

## Kiến trúc nội bộ

- **`data-src-start` Anchoring**: Đây là "nguồn sự thật" duy nhất. Mọi thành phần render (Table, List, Mermaid) đều phải tuân thủ việc inject các attributes này.
- **Race Condition Handling**: Khi chuyển sang Read mode, `SyncService` sẽ thực hiện tối đa 10 lần thử (`maxAttempts`) qua `requestAnimationFrame` để đợi layout ổn định (sau khi ảnh hoặc Mermaid render xong) trước khi thực hiện cú cuộn cuối cùng.
- **Scroll Suppression**: Sử dụng `window._suppressScrollSync = true` để tạm dừng các listener cuộn tự động, tránh hiện tượng phản hồi ngược (feedback loops) gây rung giật màn hình.

---

## Lưu ý quan trọng

- **Precision**: Độ chính xác hiện đạt mức 1:1 cho mọi loại nội dung.
- **Large Elements**: Với các khối văn bản cực lớn, thuật toán Proportional Scroll đảm bảo bạn không chỉ thấy đầu block mà thấy đúng đoạn văn bản đang viết.
- **Legacy Support**: Vẫn duy trì code xử lý `data-line` và `textarea` (trong logic fallback) để đảm bảo tính tương thích ngược trong quá trình chuyển đổi hoàn toàn sang Monaco.

---

*Document — 2026-05-14 (Absolute character-offset sync update)*
