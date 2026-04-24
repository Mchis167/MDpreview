---
description: 
---

🚀 Workflow: Atomic Component Generator (`/atomic-gen`)

Workflow này tự động hóa quy trình tạo và đăng ký một Component mới vào hệ thống Design System của MDPreview.

## 📥 Input Requirements
Khi thực hiện workflow này, Agent cần xác định:
- **Name**: Tên component (ví dụ: `button`, `search-input`).
- **Level**: `atoms`, `molecules`, hoặc `organisms`.
- **HasLogic**: `true` nếu cần file JS, `false` nếu chỉ cần CSS.

---

## 🛠️ Execution Steps (Dành cho Agent)

### Bước 1: Khởi tạo File (Scaffolding)
Sử dụng `write_to_file` để tạo các file theo mẫu sau:

**1. CSS File** (`renderer/css/design-system/<level>/<name>.css`):
```css
/* ── Design System: <Name> (<Level>) ── */
.ds-<name> {
  /* Layout */
  display: flex;
  
  /* Styling (Use tokens) */
  background: var(--ds-bg-base);
  border-radius: var(--ds-radius-md);
  
  /* Transitions */
  transition: all var(--ds-transition-smooth);
}
```

**2. JS File** (nếu cần - `renderer/js/components/<level>/<name>.js`):
```javascript
const <PascalName> = (() => {
  const SELECTORS = {
    self: '.ds-<name>',
  };

  function init() {
    const elements = document.querySelectorAll(SELECTORS.self);
    elements.forEach(el => {
      // Logic khởi tạo cho từng element
    });
  }

  return { init };
})();
```

### Bước 2: Đăng ký Hệ thống (Registration)

1.  **CSS Entry**: Thêm `@import url('design-system/<level>/<name>.css');` vào cuối file `renderer/css/design-system.css`.
2.  **HTML Registry**: Thêm thẻ `<script src="js/components/<level>/<name>.js"></script>` vào `renderer/index.html`.
    *   *Vị trí*: Chèn trước các file module chính (`tree.js`, `app.js`).

### Bước 3: Kích hoạt (Booting)
1.  Tìm hàm khởi tạo trong `renderer/js/app.js` (thường trong `DOMContentLoaded`).
2.  Thêm lệnh gọi `<PascalName>.init();` vào đúng nhóm component.

---

## 🧪 Verification Checklist
- [ ] File CSS đã được import và không bị ghi đè bởi style khác.
- [ ] Script JS đã load thành công (Kiểm tra Console không có lỗi ReferenceError).
- [ ] Component hiển thị đúng với các CSS Tokens.

---
*Ghi chú: Luôn sử dụng `ds-` prefix cho class để tránh xung đột với legacy code.*
