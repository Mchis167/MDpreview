# Tree Drag Manager (`renderer/js/services/tree-drag-manager.js`)

> Service điều phối toàn bộ logic kéo thả (Drag & Drop) trong Sidebar, hỗ trợ cả sắp xếp theo Alphabet và Custom Order (VIP Drag).

---

## Mục đích

Giải quyết bài toán kéo thả phức tạp trong Sidebar:
1.  **Sắp xếp lại file/folder** (Custom Order).
2.  **Di chuyển file** giữa các thư mục (Standard Drag).
3.  **Ẩn/Hiện file nhanh** bằng cách kéo thả vào vùng Hidden.
4.  **Vượt qua giới hạn DOM** (DOM Overlap) bằng kỹ thuật Deep Scan và Invisible Shield.

---

## Kiến trúc Engine

Service này chứa hai bộ máy kéo thả độc lập tùy theo chế độ sắp xếp hiện tại của `TreeModule`:

### 1. Standard Drag Engine (`initStandardDrag`)
Dùng cho các chế độ sắp xếp Alphabetical hoặc Time.
- **Highlight**: Chỉ highlight thư mục mục tiêu (`.drag-hover`) hoặc header của vùng Root (`.drag-hover-header`).
- **Logic**: Di chuyển file vật lý trên ổ đĩa thông qua `FileService.moveFile`.

### 2. VIP Drag Engine (`initVIPDrag`)
Dùng riêng cho chế độ **Custom Order**.
- **Spreading Animation**: Sử dụng `requestAnimationFrame` để tính toán và tạo khoảng trống (gap) giữa các item trong thời gian thực, cho biết vị trí file sẽ được chèn vào.
- **Visual Map**: Xây dựng một bản đồ tọa độ ảo của toàn bộ cây thư mục để tối ưu hiệu năng tính toán va chạm.

---

## Các kỹ thuật đặc biệt

### Deep Scan & Invisible Shield
Để giải quyết vấn đề vùng All Files che lấp vùng Hidden:
- **Invisible Shield**: Khi bắt đầu kéo, một lớp layer `.ds-drop-safe-zone` với `z-index: 9999` được chèn vào vùng Hidden để ưu tiên bắt các sự kiện chuột.
- **Deep Scan**: Sử dụng `document.elementsFromPoint(x, y)` để quét xuyên qua các lớp DOM trống, đảm bảo nhận diện được vùng thả ngay cả khi bị che khuất.

### Root Area Detection
Nhận diện khi người dùng thả file vào "vùng trống" của danh sách (không đè lên item nào):
- **All Files Root**: File sẽ được di chuyển về thư mục gốc của workspace.
- **Hidden Root**: File sẽ được thêm vào danh sách `hiddenPaths`.

### Bi-directional Unhide
Nếu một file đang ở danh sách Hidden được kéo ngược về vùng All Files:
- Hệ thống tự động gọi `handleBatchToggleHidden(false)` để hiện file đó lên ngay lập tức tại vị trí thả mới.

### Scroll Management
Hỗ trợ cuộn tự động khi kéo item đến gần mép trên/dưới của vùng chứa:
- **Detection**: Tự động nhận diện container cuộn thông qua class `.ds-scroll-container`.
- **Auto-scroll**: Cả Standard và VIP Engine đều hỗ trợ tự động cuộn (velocity-based) giúp việc di chuyển file giữa các thư mục ở xa trở nên dễ dàng.

---

## Key Functions

### `initStandardDrag(e, itemEl, node, context)`
Khởi tạo luồng kéo thả cơ bản. 
- **Context**: Nhận các hàm callback từ `TreeModule` để thực hiện reload hoặc toggle hidden.

### `initVIPDrag(e, itemEl, node, context)`
Khởi tạo luồng kéo thả nâng cao với hiệu ứng giãn cách item.

### `getIsDragging()`
Trả về `true` nếu có bất kỳ hành động kéo thả nào đang diễn ra (dùng để chặn các tiến trình background như auto-reload tree).

---

## CSS Classes liên quan

| Class | Mô tả |
|---|---|
| `.drag-hover-header` | Highlight nhẹ nhàng cho Header của vùng Root/Hidden |
| `.is-dragging` | Gán vào `body` để thay đổi cursor toàn cục |
| `.tree-item-placeholder` | Ẩn item gốc đang được kéo |
| `.ds-drop-safe-zone` | Lớp khiên bảo vệ độ nhạy cho vùng Hidden |

---

*Document — 2026-04-26*
