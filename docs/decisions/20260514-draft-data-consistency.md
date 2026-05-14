# Draft Data Persistence and Garbage Collection Strategy

**Date:** 2026-05-14
**Status:** accepted
**Author:** session 2026-05-14

---

## Bối cảnh

Hệ thống quản lý bản nháp (Drafts) trong MDpreview gặp phải tình trạng không nhất quán giữa **Danh sách Tab** (được đồng bộ với server) và **Dữ liệu Draft** (chỉ lưu cục bộ qua `localStorage`). 

Vấn đề nảy sinh khi danh sách tab bị xóa hoặc bị thay thế bởi trạng thái cũ từ server, trong khi dữ liệu nháp cục bộ vẫn còn tồn tại. Điều này dẫn đến:
1. **Lỗi đặt tên:** Các bản nháp cũ ("ghost drafts") chiếm chỗ các số thứ tự (Draft 1, 2...), khiến bản nháp mới tạo bị nhảy vọt lên số cao (ví dụ: Draft 7) dù thanh tab đang trống.
2. **Mất dữ liệu:** Nội dung bản nháp không được đồng bộ lên server, khiến người dùng mất dữ liệu khi chuyển máy hoặc dùng trình duyệt ẩn danh.

---

## Các lựa chọn đã cân nhắc

### Option 1: Không làm gì (Giữ nguyên hiện trạng)
- **Ưu:** Không tốn tài nguyên server, code đơn giản.
- **Nhược:** Trải nghiệm người dùng kém (lỗi số thứ tự, mất dữ liệu).

### Option 2: Chỉ dọn dẹp bộ nhớ cục bộ (Local Pruning)
- **Ưu:** Giải quyết được lỗi số thứ tự ("Draft 7").
- **Nhược:** Vẫn mất dữ liệu khi chuyển thiết bị.

### Option 3: Dọn dẹp tự động (Pruning) kết hợp Đồng bộ hóa Server (Chosen)
- **Ưu:** Giải quyết triệt để cả lỗi số thứ tự và vấn đề mất dữ liệu. Đảm bảo trải nghiệm "Draft chỉ tồn tại khi có Tab" một cách nhất quán.
- **Nhược:** Tăng nhẹ kích thước payload khi đồng bộ trạng thái với server (do lưu thêm nội dung text của draft).

---

## Quyết định

**Chọn: Option 3 — Pruning + Server Sync**

Chúng tôi quyết định áp dụng cơ chế "Garbage Collection" (Dọn dẹp rác) dựa trên tab: bất kỳ dữ liệu nháp nào không có tab tương ứng trong `TabsModule` sẽ bị coi là rác và bị xóa bỏ khi nạp Workspace. Đồng thời, đưa toàn bộ dữ liệu `drafts_v2_` vào danh sách các key được `AppState` đồng bộ với server để bảo toàn nội dung cho người dùng.

---

## Hệ quả

**Tích cực:**
- Số thứ tự bản nháp luôn chính xác (bắt đầu từ 1 nếu không có draft nào đang mở).
- Nội dung bản nháp được bảo toàn xuyên suốt các thiết bị và phiên làm việc.
- Giải phóng dung lượng `localStorage` cục bộ khỏi các bản nháp đã đóng.

**Tiêu cực / Trade-off:**
- Server sẽ lưu trữ thêm dữ liệu nháp (dạng text). Tuy nhiên, do draft thường là văn bản Markdown nên dung lượng tăng thêm là không đáng kể so với lợi ích mang lại.

**Constraint tương lai:**
- Mọi module quản lý tab hoặc workspace sau này PHẢI gọi hàm `DraftModule.pruneOrphans()` sau khi danh sách tab đã được xác định để duy trì tính sạch sẽ của dữ liệu.
- Các module mới muốn lưu trữ dữ liệu bền vững phải đăng ký key với `AppState` để được đồng bộ tự động.
