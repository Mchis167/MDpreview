# [Asset Drag-Drop & UX Refinement] Session Log — 2026-05-17

## 🔗 Liên kết (Links)
- **Log trước**: Không có (Task mới)
- **Log kế tiếp**: Đang thực hiện...

## 📝 Tổng quan (Overview)
Session này tập trung vào việc hoàn thiện tính năng Drag & Drop Asset vào Monaco Editor, đồng thời xử lý các vấn đề phát sinh về UI Layer và lỗi logic nghiêm trọng trong Search Palette liên quan đến việc thực thi sai lệnh phím tắt.

## ✅ Đã hoàn thành
- [04:45] **Drag & Drop Asset**: Triển khai HTML5 D&D cho Asset Panel (Card & List view) với Custom MIME type `application/mdpreview-assets`.
- [04:55] **Fix Layer Blockade**: Xử lý vấn đề Overlay của Drawer chặn sự kiện `drop` bằng class `.is-dragging` và `pointer-events: none`.
- [05:00] **Gia cố D&D**:
    - Thêm **Global Fail-safe**: Listener `dragend` tại `window` để dọn dẹp class `is-dragging` trong mọi trường hợp (bao gồm cả khi nhấn ESC).
    - Thêm **Guard Clause**: Chặn kéo asset khi đang mở Modal hoặc Search Palette để tránh xung đột UI.
    - **UX Polish**: Cập nhật CSS để triệt tiêu hiện tượng nháy con trỏ (flickering) khi di chuyển qua ranh giới Panel/Overlay.
- [05:05] **Fix Search Palette Index Mismatch**: 
    - Phát hiện và sửa lỗi "Click cái này ra cái kia": Khi có mục "Recently Used", index của UI và mảng `_results` bị lệch nhau.
    - Giải pháp: Tự động rebuild mảng `_results` ngay trong hàm `_renderResults` để đảm bảo thứ tự data luôn khớp 100% với thứ tự hiển thị.
- [05:07] **Home Page Optimization**:
    - Thêm metadata `requireFile: true` cho các shortcut/action chỉ dùng khi có file mở.
    - Cập nhật `ShortcutService` và `SearchService` để tự động chặn/lọc các hành động này khi người dùng đang ở trang Home (`AppState.currentFile === null`).
- [05:19] **Command Palette Update**: Đổi tên lệnh "Open Asset Manager" thành "Open Asset Panel" và bổ sung tag để tăng khả năng tìm kiếm nhanh.
- [05:22] **Slash Command Update**: Thêm lệnh `/panel` vào `QuickCommandPalette` (Editor slash menu) để mở Asset Panel trực tiếp khi đang soạn thảo.

## ⚠️ Quyết định quan trọng
- **Global `dragend` vs Local**: Sử dụng listener tại `window` thay vì trên từng item vì sự kiện `dragend` của Browser rất đặc biệt — nó luôn bắn ra ngay cả khi element gốc bị xóa hoặc thao tác bị hủy. Đây là cách an toàn nhất để đảm bảo UI không bị "kẹt" (Sticky state).
- **Rebuild `_results` trong Search Palette**: Thay vì cố gắng tính toán offset phức tạp cho index, việc rebuild lại mảng kết quả theo đúng thứ tự render (Recent -> Groups) là giải pháp triệt để và dễ bảo trì nhất, giúp loại bỏ hoàn toàn rủi ro lệch index.

## 🐛 Vấn đề đã gặp & cách giải quyết
- **Lỗi Index Mismatch**: Người dùng click "Open Asset Manager" nhưng hệ thống thực thi "Toggle Fullscreen". 
    - **Nguyên nhân**: `itemIndex` tăng dần khi render nhưng mảng `_results` đứng yên.
    - **Fix**: Đồng bộ mảng `_results` với `newResults` ngay sau khi render xong các section.

## ✅ Đã hoàn thành (Session tiếp theo — cùng ngày)

- **[Sau 05:22] Drop-into-Monaco — End-to-End Implementation**:
    - **Fix Overlay Blockade (CSS)**: Thêm rule `visibility: hidden` cho `.ds-asset-drawer.is-dragging .ds-asset-drawer-overlay` → overlay không còn che phủ vùng editor khi đang kéo.
    - **Visual Feedback (CSS)**: Thêm class `#monaco-editor-container.is-drop-target` với `box-shadow` và `background-color` accent → người dùng thấy rõ vùng drop.
    - **Debug & Root Cause Discovery**: Phát hiện tất cả drop events bị Monaco Service intercept qua `capture=true` + `stopPropagation()` → listeners thêm vào `editor.js` không bao giờ fire (dead code).
    - **Fix thực sự tại `attachment-service.js`**:
        - Fix path format: `assets/${name}` → `/assets/${encodeURIComponent(name)}` (thêm leading `/` và encode tên file).
        - Thêm hàm `_insertLinkAtPositionSmart()`: check text trước drop position, nếu có nội dung → prefix `\n` để xuống dòng tự động.
    - **Visual Feedback (JS)**: Hook `.is-drop-target` class vào đúng chỗ — `handleDrag` trong `monaco-service.js`, chỉ áp dụng khi MIME type là `application/mdpreview-assets`.
    - **Cleanup**: Xóa toàn bộ dead code drag-drop listeners trong `editor.js`.

## ⚠️ Quyết định quan trọng (bổ sung)
- **Monaco capture=true là "trọng tài" duy nhất**: Mọi drag event đều đi qua Monaco Service's capture-phase handler trước. Không thể intercept từ container bên ngoài. Fix phải nằm trong `AttachmentService.handleDrop()` hoặc `monaco-service.js`.
- **`_insertLinkAtPositionSmart` vs `_insertLinkAtPosition`**: Giữ lại hàm cũ để không break các caller khác (paste, pick from dialog). Hàm smart chỉ dùng cho drag-drop path.
- **Heuristic "text before drop position"**: Thay vì regex phức tạp (dễ bug với unicode, backtracking), dùng `lineContent.substring(0, pos.column - 1).trim().length > 0` — đơn giản, an toàn, đúng 100% use case.

## 🐛 Vấn đề đã gặp & cách giải quyết (bổ sung)
- **Dead Code trong editor.js**: Thêm listeners vào `#monaco-editor-container` nhưng không bao giờ fire vì Monaco domNode intercepts với `capture=true` + `stopPropagation()`. Phát hiện qua `grep -n "dragover\|drop" monaco-service.js`.
- **Path format sai**: `assets/${name}` thiếu `/` ở đầu → browser resolve relative path sai → ảnh không hiển thị. Fix thành `/assets/${encodeURIComponent(name)}`.
- **Regex backtracking nguy hiểm**: Đề xuất ban đầu dùng `matchAll()` trên cả dòng để detect image pattern → nguy cơ CPU spike với dòng nhiều images. Đổi sang heuristic đơn giản hơn.

## 🔄 Session kết thúc
- Tính năng Drag & Drop Asset vào Monaco Editor hoàn chỉnh end-to-end.
- Files đã thay đổi: `asset-panel.css`, `monaco-editor.css`, `monaco-service.js`, `attachment-service.js`, `editor.js`.
- Không còn task dở dang từ flow này. Session tiếp theo có thể bắt đầu feature mới.
