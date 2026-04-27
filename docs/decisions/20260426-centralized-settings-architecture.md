# Centralized Settings Architecture

**Date:** 2026-04-26
**Status:** accepted
**Author:** session 2026-04-26

---

## Bối cảnh

Trước khi có quyết định này, hệ thống cài đặt (Settings) của MDpreview bị phân mảnh ở nhiều nơi:
1.  `app.js` giữ bản đồ mapping phím tắt bộ nhớ (Storage Keys).
2.  `SettingsService.js` xử lý logic cho theme nhưng chỉ giới hạn ở một số thuộc tính.
3.  `ExplorerSettingsComponent.js` tự xử lý việc lưu trữ và nạp lại cây thư mục.

Sự phân mảnh này gây ra việc lặp lại mã nguồn (logic lưu localStorage), khó bảo trì và rủi ro cao khi thêm các cài đặt mới vì phải cập nhật đồng thời nhiều file.

---

## Các lựa chọn đã cân nhắc

### Option 1: Duy trì mô hình phân mảnh (Status Quo)
- **Ưu:** Mỗi component tự quản lý logic của mình, không cần phụ thuộc vào một service trung tâm.
- **Nhược:** Trùng lặp code cực lớn, dễ dẫn đến lỗi "mất đồng bộ" giữa UI, State và Persistence.

### Option 2: Tập trung hóa qua SettingsService (Registry Pattern)
- **Ưu:** 
    - Có một nguồn chân lý duy nhất (Single Source of Truth).
    - Loại bỏ 100% sự trùng lặp Mapping.
    - Giúp các Component trở thành "Pure UI", chỉ làm nhiệm vụ hiển thị.
    - Dễ dàng mở rộng: thêm setting mới chỉ cần thêm 1 dòng config.
- **Nhược:** `SettingsService` trở thành một "God Service" nắm giữ quá nhiều trách nhiệm.

---

## Quyết định

**Chọn: Option 2 — Tập trung hóa qua SettingsService (Registry Pattern)**

Chúng tôi quyết định xây dựng một `SETTINGS_CONFIG` registry bên trong `SettingsService`. Mọi thay đổi về state, lưu trữ (localStorage), hiệu ứng phụ (applyTheme, loadTree) và đồng bộ server sẽ được điều phối duy nhất qua phương thức `SettingsService.update(key, value)`.

---

## Hệ quả

**Tích cực:**
- Mã nguồn sạch hơn, dễ đọc và bảo trì hơn.
- Không còn lỗi gõ nhầm key localStorage ở các file khác nhau.
- Các component UI cực kỳ gọn nhẹ vì không còn logic xử lý dữ liệu thô.

**Tiêu cực / Trade-off:**
- `SettingsService` trở thành module quan trọng nhất, nếu file này lỗi sẽ ảnh hưởng đến toàn bộ ứng dụng.

**Constraint tương lai:**
- Mọi cài đặt mới **PHẢI** được đăng ký trong `SETTINGS_CONFIG` của `SettingsService`.
- Tuyệt đối **KHÔNG** được gọi `localStorage.setItem` trực tiếp cho các cài đặt bên trong các component.
- `app.js` phải ủy quyền hoàn toàn việc lấy Storage Key cho `SettingsService`.
