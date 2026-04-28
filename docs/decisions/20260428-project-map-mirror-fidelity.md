# Chiến lược Phản chiếu (Mirroring) cho Project Map

**Date:** 2026-04-28
**Status:** accepted
**Author:** session 2026-04-28

---

## Bối cảnh

Project Map (Mini-map) cần cung cấp một cái nhìn tổng quan 1:1 về tài liệu đang xem. Các phương pháp truyền thống như clone DOM cục bộ thường gặp vấn đề nghiêm trọng về việc mất định dạng CSS, không đồng bộ được các thành phần render phức tạp (Mermaid, CodeBlocks) và bị vỡ layout khi chiều rộng sidebar thay đổi.

---

## Các lựa chọn đã cân nhắc

### Option 1: DOM Cloning (Legacy)
- **Ưu:** Nhanh, không cần request server.
- **Nhược:** Dễ vỡ layout, khó xử lý các plugin render bên thứ ba, tốn tài nguyên DOM nếu tài liệu lớn.

### Option 2: SSR Mirroring (True Mirror)
- **Ưu:** Độ trung thực 100%, tái sử dụng hoàn toàn logic render của server, đảm bảo tính nhất quán tuyệt đối.
- **Nhược:** Tốn thêm 1 request render (đã được tối ưu bằng debounce).

---

## Quyết định

**Chọn: Option 2 — SSR Mirroring (True Mirror)**

Chúng tôi quyết định sử dụng chiến lược "Optical Mirror". Thay vì để nội dung tự co giãn (reflow), chúng tôi ép nội dung bên trong Mirror luôn có chiều rộng **800px** (khớp với Viewer chính) và sử dụng `transform: scale()` để thu nhỏ toàn bộ khối. Điều này đảm bảo việc ngắt dòng và bố cục trong Map luôn khớp từng pixel với những gì người dùng thấy ở Viewer chính.

---

## Hệ quả

**Tích cực:**
- Layout Map luôn chuẩn xác 1:1.
- Hỗ trợ đầy đủ Mermaid, CodeBlocks và các hiệu ứng phức tạp.
- Tận dụng được các Design Tokens hiện có của Viewer.

**Tiêu cực / Trade-off:**
- Có độ trễ nhỏ khi cập nhật (do debounce và server render).

**Constraint tương lai:**
- Mọi thay đổi về chiều rộng chuẩn của Viewer (`max-width: 800px`) phải được cập nhật đồng thời vào `ProjectMap.CONFIG.baseWidth`.
