# Tab Management Strategy (Pinning, Dragging, and Sizing)

**Date:** 2026-04-27
**Status:** accepted
**Author:** session 2026-04-27

---

## Bối cảnh

MDpreview đang phát triển hệ thống quản lý Tab để hỗ trợ quy trình làm việc đa nhiệm. Khi số lượng tab tăng lên, nảy sinh các vấn đề về:
1. Độ ổn định của các tài liệu quan trọng (dễ bị đóng nhầm).
2. Sự xáo trộn thứ tự khi kéo thả giữa các nhóm tab khác nhau.
3. Hiệu năng và tính thẩm mỹ của thanh Tab bar khi có nhiều file tên dài hoặc ngắn khác nhau.
4. Nhu cầu xem thông tin chi tiết (metadata) của file ngay khi hover mà không làm nặng State của ứng dụng.

---

## Các lựa chọn đã cân nhắc

### Option 1: Fixed Tabs & Global Reordering
- **Ưu:** Đơn giản trong việc triển khai CSS và JS.
- **Nhược:** Tab bị chiếm dụng không gian cố định kể cả khi tên ngắn; không có khái niệm ghim (pin) khiến các file quan trọng dễ bị mất dấu.

### Option 2: Full State Caching
- **Ưu:** Hiển thị thông tin Preview (mtime, size) tức thì vì dữ liệu đã có sẵn trong bộ nhớ.
- **Nhược:** Tốn bộ nhớ (Memory footprint) khi mở Workspace có hàng nghìn file; dữ liệu dễ bị cũ (stale) nếu file thay đổi từ bên ngoài.

### Option 3: Resilience, Partitioning & Elastic UI (Lựa chọn hiện tại)
- **Ưu:** Bảo vệ tab quan trọng, phân vùng kéo thả rõ ràng, UI co giãn thông minh và fetch metadata theo nhu cầu (Lazy fetching).
- **Nhược:** Logic kéo thả và quản lý State phức tạp hơn.

---

## Quyết định

**Chọn: Option 3 — Resilience, Partitioning & Elastic UI**

Chúng ta chọn phương án này để tạo ra một trải nghiệm "Premium IDE" thực thụ:
- **Resilience**: Pin tab không bị ảnh hưởng bởi lệnh đóng hàng loạt.
- **Partitioning**: Giới hạn phạm vi kéo thả theo nhóm (Ghim vs Thường) để giữ trật tự.
- **Lazy Metadata**: Fetch metadata qua API `/api/file/meta` khi hover để tối ưu bộ nhớ.
- **Elastic Width**: Sử dụng `fit-content` (max 280px) để tối ưu không gian hiển thị.

---

## Hệ quả

**Tích cực:**
- Tab Bar chuyên nghiệp, trực quan và cực kỳ linh hoạt.
- Hiệu năng ổn định dù mở nhiều tab nhờ cơ chế Lazy Fetching.
- Tận dụng tối đa diện tích màn hình cho nút "+" và các tab quan trọng.

**Tiêu cực / Trade-off:**
- Logic `TabsModule` và `TabBarComponent` trở nên phức tạp hơn (cần xử lý lệch index khi drag-and-drop).
- Cần server route hỗ trợ (`/api/file/meta`).

**Constraint tương lai:**
- Mọi thao tác đóng tab hàng loạt PHẢI kiểm tra thuộc tính `isPinned`.
- Logic kéo thả mới PHẢI tôn trọng ranh giới giữa nhóm Pinned và Unpinned.
- Metadata hiển thị trên UI nên ưu tiên lấy từ server thay vì cache lâu dài trong State.
