# Google Docs Copy Rasterization Strategy

**Date:** 2026-04-29
**Status:** accepted
**Author:** session 2026-04-29

---

## Bối cảnh

Tính năng "Copy for Google Docs" cần chuyển đổi tài liệu Markdown (bao gồm cả biểu đồ Mermaid SVG) sang định dạng Rich Text mà Google Docs có thể hiểu. 
Trước đây, ứng dụng sử dụng cơ chế render SVG sang PNG thông qua IPC của Electron (Native Image), nhưng gặp các vấn đề nghiêm trọng:
1. **Lỗi Render**: Các biểu đồ Mermaid phức tạp bị mất style, mất màu hoặc lỗi font do môi trường Native không có quyền truy cập vào CSS/Layout engine của trình duyệt.
2. **Lỗi Bảo mật**: Trình duyệt chặn việc xuất ảnh từ Canvas khi SVG chứa dữ liệu nhạy cảm (Tainted Canvas).
3. **Hiển thị**: Chữ trong các box biểu đồ bị cắt (clipping) do sai lệch font metrics giữa môi trường render và môi trường hiển thị.

---

## Các lựa chọn đã cân nhắc

### Option 1: Native Electron Rasterization (IPC)
- **Ưu:** Tận dụng thư viện hình ảnh của hệ điều hành, không chặn UI thread.
- **Nhược:** Không thể render chính xác Mermaid SVG vì thiếu context CSS/Fonts của trình duyệt. Dễ bị crash khi SVG quá lớn.

### Option 2: Renderer-side Canvas Rasterization (Xử lý tuần tự)
- **Ưu:** Render chính xác 100% vì sử dụng chính engine của trình duyệt. Cho phép nhúng style chọn lọc và hiển thị Progress Bar tiến trình.
- **Nhược:** Chạy trên UI thread (Renderer), có thể gây giật lag nếu xử lý quá nhiều ảnh cùng lúc.

---

## Quyết định

**Chọn: Option 2 — Renderer-side Canvas Rasterization (Xử lý tuần tự)**

Vì mục tiêu tối thượng là "Độ chính xác và Sự tin cậy" cho người dùng cuối khi copy tài liệu chuyên môn. Chúng ta chấp nhận xử lý tuần tự (Sequential) thay vì song song để:
1. Tránh treo Tab (UI Hang) khi có quá nhiều biểu đồ.
2. Đảm bảo Clipboard không bị tranh chấp dữ liệu.
3. Cho phép hiển thị phản hồi tiến trình (Progress Toast) giúp người dùng biết app đang làm việc.

---

## Hệ quả

**Tích cực:**
- Biểu đồ dán vào Google Docs có độ sắc nét Retina (scale 2.0).
- Chữ không bị cắt nhờ chiến lược ép font an toàn (Arial fallback) và `white-space: pre`.
- Hệ thống ổn định, không còn lỗi "Native image load failed".

**Tiêu cực / Trade-off:**
- Thời gian copy lâu hơn xử lý song song (khoảng 200-500ms mỗi biểu đồ).
- Tốn bộ nhớ Clipboard hơn do dùng Base64 data trong quá trình trung gian.

**Constraint tương lai:**
- Tuyệt đối KHÔNG đưa thuộc tính `transform` vào danh sách inline styles của SVG để tránh lỗi double transform.
- Luôn sử dụng kỹ thuật Unicode-safe Base64 encoding cho dữ liệu SVG trước khi nạp vào `Image()` để tránh lỗi Tainted Canvas.
