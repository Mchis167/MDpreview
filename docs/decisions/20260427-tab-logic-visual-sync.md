# Tab Logic Visual Sync

**Date:** 2026-04-27
**Status:** accepted
**Author:** session 2026-04-27

---

## Bối cảnh

Trong hệ thống quản lý Tab của MDpreview, các tab được ghim (pinned) luôn được ưu tiên hiển thị ở đầu thanh Tab bar. Tuy nhiên, mảng dữ liệu nội bộ (`openFiles`) vẫn lưu trữ file theo thứ tự thời gian mở. 

Điều này dẫn đến sự sai lệch nghiêm trọng khi thực hiện các thao tác dựa trên dải (range) như `Shift+Click` để chọn nhiều tab. Code xử lý vùng chọn trước đây sử dụng index của mảng dữ liệu, dẫn đến việc chọn nhầm các file không nằm trong vùng nhìn thấy của người dùng.

---

## Các lựa chọn đã cân nhắc

### Option 1: Sắp xếp lại mảng `openFiles` mỗi khi Pin/Unpin
- **Ưu:** Logic chọn dải tab sẽ đơn giản vì dữ liệu và UI luôn khớp nhau.
- **Nhược:** Làm mất đi thông tin về thứ tự mở file nguyên bản (thứ tự mà người dùng có thể muốn khôi phục khi bỏ ghim); gây rủi ro cho các module khác đang phụ thuộc vào `openFiles`.

### Option 2: Tính toán index ảo (Virtual Index) tại chỗ mỗi khi cần
- **Ưu:** Giữ nguyên dữ liệu gốc.
- **Nhược:** Code bị lặp lại (boilerplate) ở nhiều nơi (`selectRange`, `reorder`, `render`), dễ dẫn đến sai sót và khó bảo trì.

### Option 3: Sử dụng hàm Helper `_getDisplayOrder` làm Single Source of Truth
- **Ưu:** Đảm bảo mọi tính toán logic (chọn tab, kéo thả, render) đều dựa trên một mảng ảo duy nhất phản ánh đúng thực tế màn hình.
- **Nhược:** Tốn thêm một chút chi phí tính toán (filter mảng) nhưng không đáng kể với số lượng tab thông thường.

---

## Quyết định

**Chọn: Option 3 — Sử dụng hàm Helper `_getDisplayOrder` làm Single Source of Truth**

Chúng ta chọn phương án này để đảm bảo tính nhất quán tuyệt đối giữa những gì người dùng nhìn thấy và những gì code xử lý. Việc tách biệt giữa "Dữ liệu lưu trữ" (`openFiles`) và "Thứ tự hiển thị" (`displayOrder`) giúp hệ thống linh hoạt hơn trong tương lai (ví dụ: hỗ trợ các kiểu sắp xếp khác nhau mà không làm hỏng dữ liệu gốc).

---

## Hệ quả

**Tích cực:**
- Loại bỏ hoàn toàn lỗi chọn sai dải tab khi có tab ghim.
- Code trong `TabsModule` sạch hơn nhờ tập trung logic tính toán thứ tự vào một chỗ.

**Tiêu cực / Trade-off:**
- Hiệu năng giảm nhẹ do phải chạy filter mỗi khi có thao tác chọn (tuy nhiên < 100 tabs thì không thể nhận thấy).

**Constraint tương lai:**
- Mọi logic liên quan đến "vị trí tương đối" của tab trên màn hình (Shift+Click, Drag-and-drop, Next/Prev Tab) **PHẢI** sử dụng `_getDisplayOrder()` thay vì truy cập trực tiếp vào `state.openFiles`.
