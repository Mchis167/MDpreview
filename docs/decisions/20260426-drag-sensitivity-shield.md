# Drag Sensitivity via Invisible Shield and Deep Scan

**Date:** 2026-04-26
**Status:** accepted
**Author:** session 2026-04-26

---

## Bối cảnh

Trong cấu trúc Sidebar hiện tại, vùng All Files (`flex: 1`) thường chiếm trọn không gian trống phía trên vùng Hidden Items (`flex: 0 1 auto`). Về mặt vật lý, container cuộn của All Files phủ lên trên vùng Hidden, khiến các sự kiện chuột (Mouse Events) tiêu chuẩn không thể chạm tới vùng Hidden khi kéo thả, dẫn đến hiện tượng "kém nhạy" hoặc không thể thả file vào danh sách ẩn.

---

## Các lựa chọn đã cân nhắc

### Option 1: Tăng chiều cao vùng Hidden khi kéo (Min-height)
- **Ưu:** Dễ triển khai bằng CSS.
- **Nhược:** Gây hiện tượng nhảy Layout (Layout Shift) rất khó chịu khi bắt đầu kéo, làm mất dấu vị trí chuột của người dùng.

### Option 2: Kiểm tra tọa độ biên (Magnetic Boundary)
- **Ưu:** Không phụ thuộc vào DOM.
- **Nhược:** Khó xử lý chính xác khi danh sách All Files dài quá màn hình hoặc khi người dùng muốn sắp xếp lại file ở sát cạnh dưới.

### Option 3: Invisible Shield + Deep Scan
- **Ưu:** Độ chính xác 100%, không gây nhảy Layout, cảm giác kéo thả mượt mà.
- **Nhược:** Cần quản lý vòng đời của Shield (tự hủy khi thả chuột) và dùng API `elementsFromPoint` tốn hiệu năng hơn một chút so với event thông thường.

---

## Quyết định

**Chọn: Option 3 — Invisible Shield + Deep Scan**

Chúng ta ưu tiên trải nghiệm người dùng không bị gián đoạn bởi Layout Shift. Việc chèn một lớp `.ds-drop-safe-zone` (z-index: 9999) vào vùng Hidden khi đang kéo giúp "bẫy" chuột ngay lập tức khi di chuyển vào khu vực đó. Kết hợp với `document.elementsFromPoint` để quét xuyên qua các lớp DOM bị chồng lấn.

---

## Hệ quả

**Tích cực:**
- Độ nhạy kéo thả vào vùng Hidden đạt mức tối đa.
- Không có hiện tượng nhảy giao diện khi kéo.

**Tiêu cực / Trade-off:**
- Logic trong `TreeDragManager` trở nên phức tạp hơn khi phải quản lý thêm các thành phần DOM tạm thời.

**Constraint tương lai:**
- Khi thêm các section mới vào Sidebar, cần đảm bảo chúng cũng được tích hợp cơ chế "Drop Shield" nếu nằm ở vị trí có nguy cơ bị chồng lấn DOM.
