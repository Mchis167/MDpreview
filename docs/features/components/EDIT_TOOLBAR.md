# Edit Toolbar Component (`renderer/js/components/organisms/edit-toolbar-component.js`)

> Cung cấp thanh công cụ chuẩn hóa cho việc soạn thảo Markdown, hỗ trợ các phím tắt định dạng và các hành động Save/Cancel.

---

## Kiến trúc

```
EditToolbarComponent
├── IconActionButton (Atom)  — Các nút công cụ (B, I, H1-H6...)
├── ds-edit-toolbar-spacer   — Tạo khoảng trống dàn trải
└── ds-btn (Atoms)           — Nút hành động Save/Cancel
```

---

## API Public

### `init(mount)`
Khởi tạo Singleton instance và mount vào DOM.
- `mount`: DOM element hoặc ID (mặc định: `edit-toolbar-mount`).

### `show(options)`
Hiển thị toolbar và đăng ký các callback.
- `options.onAction`: Callback khi nhấn các nút công cụ (nhận vào string `action`).
- `options.onSave`: Callback khi nhấn nút Save.
- `options.onCancel`: Callback khi nhấn nút Cancel.
- `options.onHelp`: Callback khi nhấn nút Trợ giúp.

### `hide()`
Ẩn toolbar và làm sạch các callback.

---

## Cấu trúc Layout (Evolution)

Toolbar sử dụng layout dàn trải (**Spread Layout**) để tối ưu hóa không gian và phân cấp thị giác:

1.  **Tool Groups (Bên trái)**: Chứa các nhóm công cụ định dạng (Headings, Typography, Content, Lists, Advanced).
2.  **Spacer**: Sử dụng `flex: 1` để đẩy các thành phần tiếp theo về bên phải.
3.  **Action Group (Bên phải)**: Chứa các nút hành động quan trọng (Cancel, Save).

**Phân nhóm công cụ:**
- `headings`: H1 đến H6 (Lucide icons).
- `typography`: Bold, Italic, Strikethrough.
- `content`: Quote, Link, Image, Divider.
- `lists`: Unordered, Ordered, Task List.
- `advanced`: Inline Code, Code Block, Table.
- `help`: Nút gọi Markdown Help.

---

## Lưu ý quan trọng

- **Focus Persistence**: Toàn bộ các nút công cụ sử dụng `e.preventDefault()` trong `onmousedown` để ngăn trình duyệt làm mất focus/selection khỏi trình soạn thảo.
- **Icon Scaling**: Sử dụng kích thước icon mặc định (16px) thay vì `isLarge` để đảm bảo thanh công cụ thanh thoát và chuyên nghiệp.
- **Concentric Radius**: Toolbar kế thừa hệ thống bo góc đồng tâm của Design System.

---

*Document — 2026-04-28*
