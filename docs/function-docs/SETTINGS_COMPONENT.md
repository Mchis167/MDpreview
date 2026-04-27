# Settings Component (`renderer/js/components/organisms/settings-component.js`)

> Giao diện bảng điều khiển cài đặt toàn cục, sử dụng kiến trúc Atomic Design (được xây dựng từ các Molecule như `SettingRow` và `PopoverShield`).

---

## Kiến trúc

```
SettingsComponent (Organism)
├── PopoverShield (Molecule)       — Vỏ bọc, quản lý đóng/mở
│   └── Body Container
│       ├── Group "Appearance"     — Chứa các cấu hình giao diện
│       │   ├── SettingRow (Zoom)
│       │   ├── SettingRow (Font)
│       │   └── SettingRow (Color)
│       └── Group "Background"     — Chứa các cấu hình ảnh nền
│           ├── SettingRow (Toggle)
│           └── Background Grid    — Quản lý danh sách ảnh
```

---

## Lifecycle & Singleton Pattern

Bảng Settings tuân thủ chặt chẽ pattern **Singleton** thông qua thuộc tính tĩnh `activeInstance`. Điều này ngăn chặn việc mở nhiều bảng cài đặt chồng chéo lên nhau.

### `static toggle()`
Tự động đóng nếu đã mở, hoặc tạo mới nếu chưa mở.

### `static open()`
1. Kiểm tra `activeInstance`. Nếu có thì trả về ngay (early return).
2. Gọi `new SettingsComponent().render()` để tạo nội dung DOM.
3. Bọc nội dung bằng `DesignSystem.createPopoverShield()`.
4. Lắng nghe event `onClose` từ Popover để gán `SettingsComponent.activeInstance = null`.
5. Lưu trữ instance và trả về.

---

## Rendering Logic

### `render()`
Hàm chính chịu trách nhiệm xây dựng giao diện bảng cài đặt. Trả về một `div` container chứa tất cả các group.

### Phương thức Helper (`_createGroup`, `_createColorSelector`, v.v.)
- `_createGroup(title, elements)`: Bọc các phân tử (elements) vào một `ds-popover-group`.
- `_createColorSelector(currentHex)`: Xây dựng mảng các ô màu bo tròn (color pills). Lắng nghe sự kiện click để kích hoạt `SettingsService.update('accentColor', color)`.
- `_createZoomSlider(label, type, value, min, max)`: Trả về một `SettingRow` chứa một thanh trượt. Kết nối sự kiện `oninput` với `SettingsService.update('textZoom' | 'codeZoom', value)`.
- `_createFontSelect(type, label, currentFont)`: Trả về một `SettingRow` chứa `select` dropdown, gọi `SettingsService.update('fontText' | 'fontCode', value)` khi thay đổi.

---

## Background Image System

Đây là cụm logic phức tạp nhất trong component, xử lý việc quản lý và lưu trữ ảnh nền tùy chỉnh của người dùng.

### Tính năng
1. Hiển thị lưới 3x3 ảnh nền có sẵn + ảnh tùy chỉnh.
2. Tắt mở tính năng ảnh nền.
3. Upload ảnh mới (Base64).

### `_createBackgroundGridWrapper()`
Khởi tạo container cho lưới ảnh nền. Dựa vào `AppState.settings.bgEnabled` để quyết định hiển thị (`display: block`) hoặc ẩn. Cụm lưới này được load lại bởi `_refreshGrid()` mỗi khi có thay đổi.

### `_refreshGrid(container)`
Xóa sạch grid hiện tại và render lại:
1. Nút "Add Image".
2. Danh sách ảnh tùy chỉnh (Custom BGs - lấy thông qua `SettingsService.getCustomBackgrounds()`).
3. Danh sách ảnh mặc định (Default BGs).

### `_renderImageItems(container, items, isCustom)`
- Duyệt qua mảng URL/Base64.
- Tạo DOM cho từng ảnh.
- Nhấn chọn: Gọi `SettingsService.update('bgImage', src)`.

### `_handleUpload(e)`
1. Đọc file qua `FileReader` dưới định dạng `DataURL` (Base64).
2. Gọi `SettingsService.addCustomBackground(base64)`. 
3. Nếu thành công (không quá quota 5 ảnh) -> `_refreshGrid`.

---

## Lưu ý quan trọng

- Tất cả các cập nhật state/cấu hình từ component này đều không thực thi trực tiếp mà được truyền qua `SettingsService`.
- Việc tải ảnh Base64 vào `localStorage` là giải pháp an toàn trong Electron nhưng bị giới hạn về dung lượng, do đó `_getCustomBgs()` và `_saveCustomBgs()` luôn có kiểm tra `length <= 5`.

---

*Document — 2026-04-26*
