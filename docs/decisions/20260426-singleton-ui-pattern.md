# Singleton Pattern for Global UI Components

**Date:** 2026-04-26
**Status:** accepted
**Author:** session 2026-04-26

---

## Bối cảnh

Trong ứng dụng MDpreview, có nhiều thành phần giao diện ở cấp độ toàn cục (Global UI) như Settings, Shortcuts và các Menu nổi. Các thành phần này chỉ nên tồn tại duy nhất một instance đang mở tại một thời điểm để tránh xung đột giao diện và lãng phí tài nguyên.

Trước đây, trạng thái đóng/mở (`isOpen`) thường được quản lý bởi phía gọi (ví dụ: `toolbar.js`), dẫn đến việc trạng thái bị lệch (out-of-sync) khi người dùng đóng menu bằng cách click-outside hoặc phím Esc, gây ra các lỗi như "phải click 2 lần mới mở được popover".

---

## Các lựa chọn đã cân nhắc

### Option 1: Quản lý trạng thái tại phía gọi (Caller-managed)
- **Ưu:** Phía gọi biết rõ trạng thái để thực hiện các logic phụ trợ.
- **Nhược:** Dễ xảy ra lỗi đồng bộ. Mã nguồn bị phân tán và lặp lại ở nhiều nơi.

### Option 2: Singleton Pattern với phương thức tĩnh `toggle()`
- **Ưu:** Component tự chịu trách nhiệm về vòng đời của chính mình. Phía gọi chỉ cần gọi `Component.toggle()` mà không cần quan tâm trạng thái hiện tại. Đảm bảo 100% chỉ có một instance hoạt động.
- **Nhược:** Ít linh hoạt hơn nếu muốn mở nhiều cửa sổ cùng loại (tuy nhiên app hiện tại không có nhu cầu này).

---

## Quyết định

**Chọn: Option 2 — Singleton Pattern với phương thức tĩnh `toggle()`**

Mọi Global UI Component sẽ triển khai thuộc tính `static activeInstance` và phương thức `static toggle()`. Khi một instance được đóng (qua bất kỳ hình thức nào), nó phải nullify `activeInstance` thông qua callback `onClose`. Việc này giúp loại bỏ hoàn toàn các lỗi đồng bộ trạng thái và làm sạch API cho phía gọi.

---

## Hệ quả

**Tích cực:**
- Loại bỏ hoàn toàn lỗi "2-click" khi mở popover.
- Code ở các module điều khiển (Toolbar, Sidebar) trở nên cực kỳ đơn giản (chỉ 1 dòng lệnh).
- Dễ dàng quản lý việc "đóng cái này để mở cái kia" một cách tập trung.

**Tiêu cực / Trade-off:**
- Cần tuân thủ nghiêm ngặt việc dọn dẹp biến `activeInstance` trong logic `close()`.

**Constraint tương lai:**
- Tất cả các Component dạng Popover, Modal hoặc Menu Shield toàn cục **PHẢI** triển khai Singleton pattern này.
- Phía gọi **KHÔNG ĐƯỢC** tự lưu trữ biến trạng thái `isOpen` của các component này.
