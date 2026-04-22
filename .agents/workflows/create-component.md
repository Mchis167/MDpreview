# Workflow: Tạo Component Design System (Atomic Design)

Workflow này hướng dẫn Agent tạo mới một component tuân thủ hệ thống thiết kế Atomic của MDPreview.

## 1. Phân tích & Phân cấp (Research)
- Xác định component thuộc cấp độ nào:
    - **Atom**: Button, Icon, Divider, Label.
    - **Molecule**: SearchBar, TabItem, ToggleGroup.
    - **Organism**: Header, Toolbar, Sidebar, Modal.
- Kiểm tra các token màu sắc/khoảng cách cần thiết trong `renderer/css/design-system/tokens.css`.

## 2. Thiết lập Styles (CSS)
- Tạo file CSS tại `renderer/css/design-system/<level>/<name>.css`.
- Quy tắc:
    - Sử dụng class `.ds-<name>`.
    - Sử dụng biến `var(--ds-*)`.
- Import file vừa tạo vào `renderer/css/design-system.css`.

## 3. Thiết lập Logic (JS)
- Tạo file JS tại `renderer/js/components/<level>/<name>.js`.
- Cấu trúc file:
    ```javascript
    const ComponentName = (() => {
      function init(options) {
        // Logic khởi tạo
      }
      return { init };
    })();
    ```
- Đăng ký script trong `renderer/index.html` trước `js/app.js`.

## 4. Tích hợp & Kiểm tra (Integration)
- Khởi tạo component trong `renderer/js/app.js` (DOMContentLoaded).
- Đảm bảo component có khả năng tương tác với `AppState` nếu cần.
- Sử dụng `DesignSystem.createElement` để tạo DOM động thay vì hardcode HTML trong `index.html` nếu component đó là dynamic.

## 5. Tài liệu hóa (Verification)
- Cập nhật file `renderer/testing/component_preview.html` (nếu có) để demo component mới.
- Kiểm tra hiển thị trên các màn hình khác nhau (Responsive).

---
*Lưu ý: Luôn ưu tiên tái sử dụng các Atom hiện có để xây dựng Molecule và Organism.*
