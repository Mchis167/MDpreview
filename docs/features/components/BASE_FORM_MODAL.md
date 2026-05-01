# BaseFormModal (`renderer/js/components/organisms/base-form-modal.js`)

> Hệ thống khung mẫu (Template) chuẩn cho toàn bộ các modal dạng form trong ứng dụng. Đảm bảo tính nhất quán về thị giác, cấu trúc phân nhóm và quản lý không gian.

---

## Kiến trúc Layout

`BaseFormModal` sử dụng mô hình phân nhóm để quản lý padding và dividers hiệu quả:

```
ds-form-modal
├── ds-form-header    — (Icon, Title, Subtitle)
├── ds-form-divider   — (Full-width line)
├── ds-form-body      — (Fields & Content)
├── ds-form-divider   — (Full-width line)
└── ds-form-footer    — (Action Buttons)
```

### Quản lý Padding (Local Variables)
Component sử dụng biến CSS nội bộ `--_modal-px` (mặc định là `var(--ds-space-xl)`) để định nghĩa khoảng cách ngang đồng nhất cho tất cả các nhóm con. Điều này cho phép:
- Thay đổi lề ngang của toàn bộ modal chỉ tại một nơi.
- Các `ds-form-divider` có thể tràn hết 100% chiều ngang modal một cách tự nhiên.

---

## API Public

### `BaseFormModal.create(options)`
Khởi tạo cấu trúc DOM cho modal form.

**Options:**
- `iconHtml`: Chuỗi SVG icon (hiển thị trong vòng tròn accent ở trên cùng).
- `title`: Tiêu đề chính của modal.
- `subtitle`: Văn bản mô tả phụ dưới tiêu đề.
- `bodyContent`: HTMLElement hoặc chuỗi HTML chứa các trường nhập liệu.
- `actions`: Mảng các `HTMLElement` (thường là `ds-btn`) cho phần footer.

### `BaseFormModal.open(options)`
Mở modal form bên trong một `PopoverShield`.

**Options:**
- `width`: Chiều rộng modal (mặc định: `480px`).
- Tất cả các options của hàm `create()`.

---

## Các CSS Classes quan trọng

| Class | Mô tả |
|---|---|
| `.ds-form-fields` | Container cho các input, thiết lập flex column và khoảng cách. |
| `.ds-form-field-label` | Nhãn cho các trường nhập liệu (font code, uppercase, letter-spacing). |
| `.ds-form-actions` | Container cho footer buttons, mặc định căn lề phải (`justify-content: right`). |

---

## Ví dụ sử dụng

```javascript
const body = DesignSystem.createElement('div');
const input = DesignSystem.createInput({ placeholder: 'Enter name...' });
body.appendChild(input);

const modal = BaseFormModal.open({
    title: 'New Workspace',
    subtitle: 'Choose a name for your workspace.',
    bodyContent: body,
    actions: [
        DesignSystem.createButton({ label: 'Cancel', variant: 'ghost', onClick: () => modal.close() }),
        DesignSystem.createButton({ label: 'Create', variant: 'primary', onClick: () => handleCreate() })
    ]
});
```

---

## Lưu ý quan trọng

- **Divider Logic**: Các đường kẻ ngang được chèn tự động giữa các nhóm. Đừng thêm padding cho `.ds-form-modal` vì sẽ làm gãy hiệu ứng tràn viền của divider.
- **Header Icon**: Icon ở header được bọc trong một lớp layer mờ với hiệu ứng glow, tạo điểm nhấn premium cho modal.

---

*Document — 2026-04-29*
