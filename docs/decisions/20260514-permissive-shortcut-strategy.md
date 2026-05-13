# Chiến lược Phím tắt Xuyên thấu (Permissive Shortcut Strategy)

**Date:** 2026-05-14
**Status:** accepted
**Author:** session 2026-05-14

---

## Bối cảnh

MDpreview đã chuyển đổi sang sử dụng Monaco Editor làm trình soạn thảo chính. Trước đây, hệ thống phím tắt (`ShortcutService`) sử dụng mô hình "Whitelist" rất nghiêm ngặt (chỉ cho phép một vài phím gõ trong ô nhập liệu) và sử dụng `capture: true` để chặn sự kiện keydown trước khi nó đến được phần tử tiêu điểm.

Tuy nhiên, Monaco là một editor phức tạp cần quyền kiểm soát nhiều tổ hợp phím (ví dụ `Cmd+D`, `Cmd+F`). Đồng thời, người dùng mong muốn các phím tắt điều hướng toàn cục của ứng dụng (như `Cmd+B` để ẩn Sidebar, `Cmd+P` để tìm file) vẫn phải hoạt động mượt mà ngay cả khi đang soạn thảo.

---

## Các lựa chọn đã cân nhắc

### Option 1: Duy trì Whitelist nghiêm ngặt (Status quo)
- **Ưu:** Tránh tuyệt đối xung đột phím tắt giữa Editor và App.
- **Nhược:** Làm "liệt" các tính năng điều hướng toàn cục khi đang soạn thảo, gây trải nghiệm đứt gãy.

### Option 2: Ưu tiên tuyệt đối cho Editor (Bỏ chặn hoàn toàn)
- **Ưu:** Tận dụng 100% tính năng của Monaco.
- **Nhược:** Các phím tắt của App (như Sidebar, Settings) sẽ không hoạt động được nếu Monaco cũng đăng ký phím đó.

### Option 3: Mô hình "Pass-through with Blacklist" (Chọn)
- **Ưu:** Cân bằng giữa khả năng điều hướng toàn cục và tính năng soạn thảo chuyên sâu.
- **Nhược:** Cần quản lý danh sách "phím cấm" (blacklist) một cách cẩn thận.

---

## Quyết định

**Chọn: Option 3 — Mô hình "Pass-through with Blacklist"**

Chúng ta cho phép tất cả các tổ hợp phím có sử dụng phím bổ trợ (`Cmd`, `Ctrl`, `Alt`) đi xuyên qua lớp chặn của `ShortcutService` để thực hiện các lệnh toàn cục, **TRỪ KHI** phím đó nằm trong danh sách đen (Blacklist).

Danh sách đen bao gồm các phím soạn thảo cốt lõi mà Monaco (hoặc trình duyệt) phải xử lý: `a, c, v, x, z, y` (Copy/Paste/Undo) và `d, f, g, h` (Multi-cursor/Find/Replace).

---

## Hệ quả

**Tích cực:**
- Người dùng có thể đóng/mở Sidebar, mở Settings, chuyển Mode, hoặc tìm kiếm file nhanh (`Cmd+P`) mà không cần click chuột ra ngoài editor.
- Trình soạn thảo Monaco vẫn giữ được các tính năng IDE-grade quan trọng nhất.

**Tiêu cực / Trade-off:**
- Một số lệnh Markdown truyền thống (như `Cmd+B` cho Bold) có thể bị ứng dụng chiếm dụng (Sidebar). Người dùng sẽ cần làm quen với việc dùng phím tắt khác hoặc dùng Bảng lệnh (Slash commands).

**Constraint tương lai:**
- Khi thêm phím tắt toàn cục mới, phải kiểm tra xem nó có trùng với các phím soạn thảo phổ biến không. Nếu có, phải cân nhắc đưa vào Blacklist trong `shortcut-service.js`.
