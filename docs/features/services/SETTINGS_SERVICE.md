# Settings Service (`renderer/js/services/settings-service.js`)

> Service tập trung để quản lý toàn bộ cấu hình hiển thị (theme, màu sắc, font, độ thu phóng, hình nền) và đồng bộ hóa với hệ thống lưu trữ.

---

## Mục đích

Giải quyết vấn đề phân mảnh logic cấu hình giữa UI và State. `SettingsService` đóng vai trò là "Single Source of Truth", đảm bảo mọi thay đổi cấu hình đều được:
1. Lưu vào `AppState`
2. Lưu vào `localStorage`
3. Cập nhật ngay lập tức lên giao diện thông qua CSS Variables hoặc DOM Manipulation

---

## Key Functions

### `applyTheme()`
**Input:** Không có (đọc từ `AppState.settings`)
**Output:** Thay đổi CSS Variables trên `:root`.

**Flow:**
1. Cập nhật `accentColor` và `accent-rgb`.
2. Áp dụng `fontText` và `fontCode` qua CSS variables.
3. Cập nhật `textZoom` và `codeZoom` (`--preview-zoom`, `--code-zoom`).
4. Cập nhật SVG data-uri cho mũi tên thả xuống (`--select-arrow`).
5. Đồng bộ hiển thị lớp nền (`_updateBackgroundLayer`).

---

### `update(key, value)`
**Entry point duy nhất để thay đổi bất kỳ cấu hình nào.**

**Input:** 
- `key`: Key trong `AppState.settings` (vd: `'accentColor'`, `'showHidden'`, `'hiddenPaths'`).
- `value`: Giá trị mới.

**Flow:**
1. Kiểm tra key hợp lệ trong `SETTINGS_CONFIG`.
2. Cập nhật `AppState.settings[key]`.
3. Tự động tìm `storageKey` tương ứng và lưu vào `localStorage`. Sử dụng `JSON.stringify` cho các giá trị không phải string (vd: mảng `hiddenPaths`).
4. Kích hoạt hiệu ứng phụ dựa trên `type` của setting:
    - `theme`: Gọi `applyTheme()` để cập nhật UI/CSS.
    - `explorer`: Gọi `TreeModule.load()` để cập nhật danh sách file.
5. Gọi `AppState.savePersistentState()` để đồng bộ server.

---

### Cấu trúc `SETTINGS_CONFIG`
Registry trung tâm định nghĩa cách mỗi cấu hình được lưu và phản hồi:
- `theme`: Các giá trị ảnh hưởng đến giao diện (màu, font, background).
- `explorer`: Các giá trị ảnh hưởng đến thanh bên trái (showHidden, flatView, hiddenPaths). Dữ liệu này tự động trigger `TreeModule.load()` khi thay đổi.

---

### Quản lý Ảnh nền (Background Management)

#### `getCustomBackgrounds()`
Trả về mảng các chuỗi Base64 ảnh nền tùy chỉnh đã lưu trong `localStorage`.

#### `addCustomBackground(base64)`
Thêm ảnh mới vào danh sách tùy chỉnh. Giới hạn tối đa **5 ảnh** để bảo vệ quota `localStorage`.

---

---

## Các phương thức Helper nội bộ

### `hexToRgb(hex)`
**Input:** `hex` (chuỗi hex 3 hoặc 6 ký tự)
**Output:** Chuỗi giá trị RGB cách nhau bởi dấu phẩy (vd: `255, 0, 0`).
Hỗ trợ tự động chuẩn hóa các chuỗi hex rút gọn như `#F00`.

---

## Lưu ý quan trọng

- `SettingsService` PHẢI được khởi tạo và chạy `applyTheme()` trong `app.js` boot sequence trước khi bất kỳ UI Component nào được render.
- Không được trực tiếp thay đổi `AppState.settings` để can thiệp giao diện nếu không thông qua Service này, vì như vậy sẽ làm vỡ tính đồng bộ CSS.

---

*Document — 2026-04-26*
