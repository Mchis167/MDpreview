# MDPreview Design System — Atomic Design Guide

Hệ thống thiết kế của MDPreview được xây dựng theo nguyên lý **Atomic Design**, giúp chia nhỏ UI thành các thành phần có thể tái sử dụng, dễ bảo trì và mở rộng.

## 🏗️ Kiến trúc thư mục

### CSS (`renderer/css/design-system/`)
Tất cả styles của hệ thống thiết kế nằm trong thư mục này và được quản lý bởi file entry `renderer/css/design-system.css`.

- `tokens.css`: Chứa các biến CSS (Colors, Spacing, Radius, Transitions).
- `atoms/`: Các thành phần cơ bản nhất (Button, Icon, Link, Divider).
- `molecules/`: Nhóm các atom (Search input, Tab item, Button group).
- `organisms/`: Các khối UI phức tạp (Toolbar, Sidebar, Modal, Card).

### JavaScript (`renderer/js/components/`)
Logic điều khiển được chia theo cấp độ tương ứng với CSS.

- `design-system.js`: Các utility functions dùng chung.
- `atoms/`, `molecules/`, `organisms/`: Chứa logic JS cho từng component.

---

## 🎨 Quy tắc đặt tên (Naming Conventions)

### 1. CSS Classes
- Luôn sử dụng tiền tố **`.ds-`** cho các thành phần thuộc Design System.
- Ví dụ: `.ds-btn`, `.ds-btn-primary`, `.ds-secondary-toolbar`.
- Sử dụng **BEM** (Block Element Modifier) nếu cần: `.ds-card__title--active`.

### 2. CSS Variables (Tokens)
- Luôn sử dụng tiền tố **`--ds-`**.
- Ví dụ: `var(--ds-accent-orange)`, `var(--ds-space-md)`.
- Tuyệt đối không hardcode mã màu trong các file component.

### 3. JavaScript Modules
- Sử dụng **PascalCase** cho tên Module: `SecondaryToolbar`, `SwitchToggle`.
- Đóng gói trong IIFE để tránh ô nhiễm global namespace.

---

## 🛠️ Quy trình tạo mới Component

### Bước 1: Xác định cấp độ (Atomic Level)
- **Atom**: Chỉ là UI đơn giản hoặc element đơn lẻ.
- **Molecule**: Có sự kết hợp của 2-3 atom.
- **Organism**: Một khu vực chức năng hoàn chỉnh.

### Bước 2: Viết CSS
Tạo file trong thư mục tương ứng (ví dụ: `renderer/css/design-system/atoms/my-btn.css`).
Import file này vào `renderer/css/design-system.css`.

### Bước 3: Viết JS (Nếu có)
Tạo file trong thư mục tương ứng (ví dụ: `renderer/js/components/atoms/my-btn.js`).
Đăng ký script trong `renderer/index.html` (trước `app.js`).

### Bước 4: Đóng gói (Packaging)
Component nên tự quản lý DOM của nó (sử dụng `DesignSystem.createElement`) hoặc hook vào DOM hiện có một cách tường minh.

### Bước 5: Khởi tạo
Khởi tạo component trong chu kỳ `DOMContentLoaded` của `app.js` hoặc gọi từ component cha.

---

## 📜 Ví dụ mẫu Component (Organism)

```javascript
const MyComponent = (() => {
  function init() {
    const el = DesignSystem.createElement('div', 'ds-my-comp', {
      text: 'Hello World'
    });
    document.body.appendChild(el);
  }
  return { init };
})();
```

```css
.ds-my-comp {
  background: var(--ds-bg-toolbar);
  padding: var(--ds-space-md);
  border-radius: var(--ds-radius-lg);
}
```
