# Dedicated Molecule for Settings Panel Layout

**Date:** 2026-04-26
**Status:** accepted
**Author:** session 2026-04-26

---

## Bối cảnh

Trong quá trình refactor hệ thống Settings, ban đầu chúng ta định tái sử dụng `SettingToggleItem` (một Molecule được thiết kế cho Menu nổi `MenuShield`). Tuy nhiên, bảng Settings chính (`SettingsComponent`) có yêu cầu về không gian và layout khác biệt:
- Cần cấu trúc "Label | Control" rộng rãi và cân đối.
- Cần hỗ trợ nhiều loại control khác nhau (Select, Slider, Color Picker) chứ không chỉ mỗi Toggle.
- Yêu cầu về padding và font size khác với các menu nhỏ gọn.

---

## Các lựa chọn đã cân nhắc

### Option 1: Sử dụng chung Molecule SettingToggleItem (với Variants)
- **Ưu:** Giảm số lượng component trong hệ thống.
- **Nhược:** CSS bị phình to vì các quy tắc override cho variant 'panel', code JS bị phức tạp hóa để xử lý nhiều loại control bên trong một component vốn dành cho toggle.

### Option 2: Tạo Molecule SettingRow chuyên biệt cho Panel
- **Ưu:** 
  - Tách biệt hoàn toàn phong cách thiết kế giữa "Menu" (nhỏ, hover-based) và "Panel" (rộng, static-based).
  - Linh hoạt trong việc truyền bất kỳ element nào làm `control`.
  - Tuân thủ chặt chẽ Atomic Design: mỗi phân tử giải quyết một bài toán layout cụ thể.
- **Nhược:** Thêm file JS/CSS cần quản lý.

---

## Quyết định

**Chọn: Option 2 — SettingRow Molecule**

Việc tách biệt giúp hệ thống thiết kế (Design System) trở nên rõ ràng hơn. `SettingToggleItem` sẽ chỉ dành cho các menu chức năng nhanh (như Explorer Preferences), trong khi `SettingRow` là tiêu chuẩn cho mọi bảng cài đặt dạng popover lớn sau này.

---

## Hệ quả

**Tích cực:**
- Giao diện Settings chuyên nghiệp, spacing chuẩn và không bị xung đột style với các menu khác.
- Dễ dàng thêm các loại cài đặt mới (như Slider cho Zoom) mà không làm hỏng layout.

**Tiêu cực / Trade-off:**
- Tăng số lượng file trong thư mục `molecules`.

**Constraint tương lai:**
- Mọi bảng cài đặt dạng Popover/Modal lớn PHẢI sử dụng `SettingRow` để đảm bảo tính nhất quán của layout "Label | Control".
