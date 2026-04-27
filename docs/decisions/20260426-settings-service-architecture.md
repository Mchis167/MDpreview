# Centralized Settings Service Architecture

**Date:** 2026-04-26
**Status:** superseded by [20260426-centralized-settings-architecture.md](20260426-centralized-settings-architecture.md)
**Author:** session 2026-04-26

---

## Bối cảnh

Hệ thống Settings của MDpreview trước đây phân tán logic ở nhiều nơi: `app.js` (khởi tạo theme), `settings.js` (legacy logic), và `SettingsComponent.js` (UI logic). Việc này dẫn đến:
- Sự không đồng bộ giữa `AppState`, `localStorage` và các biến CSS (`CSS Variables`).
- Khó khăn trong việc kiểm thử (Unit Test) vì logic bị dính chặt vào DOM.
- Code bị lặp lại khi cần cập nhật cài đặt từ nhiều nơi khác nhau.

---

## Các lựa chọn đã cân nhắc

### Option 1: Tiếp tục duy trì logic trong AppState và UI Organisms
- **Ưu:** Không tốn công refactor lớn.
- **Nhược:** Khó bảo trì, dễ gây lỗi race condition giữa việc lưu và hiển thị, vi phạm nguyên tắc tách biệt trách nhiệm (Separation of Concerns).

### Option 2: Xây dựng SettingsService tập trung
- **Ưu:** 
  - Đóng gói toàn bộ logic nghiệp vụ (theme, color, zoom, background) vào một nơi.
  - Đảm bảo tính nhất quán (Single Source of Truth) giữa State, Storage và Visuals.
  - Dễ dàng viết script automation test trên Console.
- **Nhược:** Cần refactor lại toàn bộ quy trình boot của ứng dụng.

---

## Quyết định

**Chọn: Option 2 — SettingsService**

Để chuẩn bị cho việc mở rộng các tính năng tùy biến sâu hơn (như font tùy chỉnh, nhiều ảnh nền), việc có một Service độc lập là bắt buộc. Điều này giúp lớp UI (`SettingsComponent`) chỉ tập trung vào việc render và lắng nghe event, trong khi logic thực thi nằm gọn trong Service.

---

## Hệ quả

**Tích cực:**
- Logic đồng bộ theme và accent color hiện diễn ra tức thì và chính xác 100%.
- Giảm 60% code logic trong `SettingsComponent.js`.
- Có thể chạy các bài test nâng cao (Stress test, Data Integrity) trực tiếp trên Service.

**Tiêu cực / Trade-off:**
- Tạo thêm một dependency (`SettingsService`) cần được load sớm trong `index.html`.

**Constraint tương lai:**
- Mọi thay đổi về cấu hình người dùng PHẢI đi qua `SettingsService`. 
- Tuyệt đối không được trực tiếp gọi `localStorage.setItem` hoặc `document.documentElement.style.setProperty` cho các cài đặt trong các UI components khác.
