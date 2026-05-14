# Draft Service (`renderer/js/modules/draft.js`)

> Quản lý vòng đời, nội dung và đồng bộ hóa các bản nháp (Drafts) — các tài liệu tạm thời chưa được lưu thành file vật lý.

---

## Architecture

Drafts được lưu trữ trong một object tập trung (`drafts`) và được persist vào `localStorage` dưới key `drafts_v2_{workspaceId}`. Khác với file hệ thống, Drafts được định danh bằng prefix `__DRAFT_` theo sau là timestamp (ví dụ: `__DRAFT_1715671234567`).

Hệ thống Draft được đồng bộ hóa với server qua `AppState.savePersistentState()`, cho phép người dùng duy trì nội dung nháp trên nhiều thiết bị.

---

## Core Functions

### `init()`
Khởi tạo module, nạp dữ liệu từ storage và thiết lập footer/header preview.

### `createDraft(id)`
Khởi tạo một bản nháp mới với các giá trị mặc định (content rỗng, viewMode 'edit'). Tự động gán tên hiển thị (Draft 1, Draft 2...) qua `ensureDraftMeta`.

### `getDisplayName(path)`
Trả về tên hiển thị của bản nháp (ví dụ: "DRAFT 1"). Nếu bản nháp chưa có meta, hàm sẽ tự động tạo mới.

### `pruneOrphans(activeIds)`
**Cơ chế Garbage Collection:** Xóa bỏ tất cả các bản nháp trong bộ nhớ mà không có ID tương ứng trong danh sách `activeIds` (thanh tab). 
- Giúp giải phóng bộ nhớ.
- Đảm bảo việc đánh số thứ tự Draft luôn chính xác và không bị "kẹt" bởi các bản nháp cũ đã đóng.

### `clear(id)`
Xóa vĩnh viễn một bản nháp khỏi bộ nhớ và storage. Gọi khi tab bị đóng.

---

## Data Management

### `setDraftContent(id, content)`
Cập nhật nội dung thô (Markdown) của bản nháp và tự động lưu vào storage.

### `getDraftContent(id)`
Trả về nội dung Markdown hiện tại của bản nháp.

### `setDraftViewMode(id, mode)`
Lưu trạng thái chế độ xem (read/edit) riêng cho từng bản nháp.

---

## Persistence

### `saveToStorage()`
Lưu đối tượng `drafts` hiện tại vào `localStorage`. Hàm này cũng kích hoạt `AppState.savePersistentState()` để đẩy dữ liệu lên server.

### `loadFromStorage(workspaceId)`
Nạp dữ liệu nháp của workspace cụ thể. 
- Nếu `workspaceId` là null -> xóa sạch bộ nhớ nháp.
- Hỗ trợ migration từ định dạng cũ (`__DRAFT_LEGACY_`).

---

## Integration

- **`EditorModule`**: Sử dụng `getDraftContent` và `setDraftContent` khi làm việc với file có prefix `__DRAFT_`.
- **`TabsModule`**: Gọi `pruneOrphans` khi chuyển workspace để đảm bảo tính nhất quán.
- **`AppState`**: Tự động đồng bộ `drafts_v2_` lên server.

---

*Document — 2026-05-14 (initial version)*
