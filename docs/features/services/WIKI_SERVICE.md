# Wiki Service (Indexer & Graph)

**Module:** `server/services/wiki-indexer.js` & `server/routes/wiki.js`  
**Status:** Alpha (Phase 1 Complete)  
**Last Updated:** 2026-05-10

---

## 1. Tổng quan

Wiki Service chịu trách nhiệm xây dựng và quản lý đồ thị quan hệ (Relationship Graph) giữa các tài liệu Markdown trong một Workspace. Nó cho phép ứng dụng hiểu được "file này trỏ đến đâu" và "file này được nhắc đến ở đâu" một cách tự động.

## 2. WikiIndexer Logic (Server-side)

Lớp `WikiIndexer` thực hiện quét tài liệu theo quy trình 3 bước (3-Pass Indexing):

### Pass 1: Định danh (ID & Relations)
Sử dụng `gray-matter` để bóc tách Frontmatter.
-   Lấy `id` của file.
-   Lấy các liên kết khai báo thủ công: `related-flows`, `referenced-functions`, `governed-by`.

### Pass 2: Trích xuất nội dung (Mentions)
Phân tích nội dung Markdown (đã loại bỏ frontmatter):
-   **Backtick Mentions**: Tìm pattern `` `ID` ``. Nếu `ID` tồn tại trong hệ thống, nó được tính là một liên kết.
-   **Relative Links**: Tìm các liên kết Markdown `[text](./path.md)`. Resolve đường dẫn và chuyển đổi sang ID nếu tìm thấy.

### Pass 3: Liên kết ngược (Backlinks)
Đảo ngược đồ thị từ bước 1 & 2 để xác định danh sách các file đang trỏ đến một ID cụ thể.

## 3. Data Integrity & Safety

Để đảm bảo an toàn dữ liệu, Service sử dụng cơ chế **Atomic Write**:
1.  Ghi dữ liệu mới vào `.wiki-index.json.tmp`.
2.  Đổi tên file hiện tại thành `.wiki-index.json.bak` (nếu có).
3.  Đổi tên file `.tmp` thành file chính thức `.wiki-index.json`.

## 4. API Endpoints (`/api/wiki/*`)

| Endpoint | Method | Mô tả |
|---|---|---|
| `/status` | GET | Trả về trạng thái hiện tại (`off`, `scanning`, `active`, `error`). |
| `/index` | GET | Trả về toàn bộ file JSON của Relationship Graph. |
| `/enable` | POST | Kích hoạt quét Wiki cho workspace hiện tại. |
| `/disable` | POST | Tạm dừng hoạt động của Wiki Scanner. |
| `/rescan` | POST | Kích hoạt quét lại toàn bộ tài liệu ngay lập tức. |
| `/remove` | POST | Xóa bỏ dữ liệu Index và dừng hoạt động Wiki. |

## 5. Tự động hóa (Auto-reindex)

Service được tích hợp vào nhân Server (`server/index.js`):
-   **Watcher**: Lắng nghe sự kiện thay đổi trên các file `.md`.
-   **Debounce**: Trì hoãn việc re-index 1.5 giây sau khi lưu file cuối cùng để tối ưu hiệu năng.
-   **Event**: Emit sự kiện `wiki-index-updated` qua Socket.io khi hoàn tất.

---
*Document — 2026-05-10*
