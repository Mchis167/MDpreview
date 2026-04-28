# MenuShield (`renderer/js/components/molecules/menu-shield.js`)

> Lớp vỏ hợp nhất (Unified Glass Shell) cho tất cả floating menu trong ứng dụng — xử lý positioning, sử dụng hệ thống `surface-overlay`, và singleton lifecycle.

> **Quyết định thiết kế:** Xem [`docs/decisions/20260426-unified-menu-shield.md`](../decisions/20260426-unified-menu-shield.md)

---

## Kiến trúc

MenuShield là **module singleton** — chỉ có một menu được mở tại một thời điểm. Mở menu mới sẽ tự động đóng menu cũ.

```
MenuShield.open({ content, anchor/event, title? })
    ↓
Đóng instance cũ (nếu có)
    ↓
Tạo .ds-menu-shield container + header + content
    ↓
_calculatePosition() — smart positioning
    ↓
Gắn listeners: mousedown outside → close, Escape → close
    ↓
Lưu vào _activeInstance
```

---

## API

### `MenuShield.open(options)`

Mở một menu shield mới. Trả về instance object `{ element, close }`.

| Option | Type | Mô tả |
|---|---|---|
| `content` | `HTMLElement` | **Bắt buộc** — DOM element hiển thị bên trong shield |
| `title` | `string` | Tiêu đề hiển thị ở header (optional) |
| `event` | `MouseEvent` | Dùng để định vị theo vị trí con trỏ (context menu) |
| `anchor` | `HTMLElement` | Dùng để định vị theo button kích hoạt (dropdown menu) |
| `align` | `string` | `left` | `right` (chỉ dùng với `anchor`). Mặc định là `left`. |
| `className` | `string` | Class CSS thêm vào shield để identify |
| `onClose` | `function` | Callback khi shield bị đóng |

**Chỉ truyền một trong hai:** `event` (context menu) hoặc `anchor` (dropdown). Nếu cả hai đều thiếu, shield xuất hiện ở góc trên trái.

### `MenuShield.close()`

Đóng menu đang mở (nếu có). An toàn khi gọi dù không có menu nào đang mở.

### `MenuShield.active`

Getter — trả về instance hiện tại `{ element, close }` hoặc `null` nếu không có menu nào mở.

```js
if (MenuShield.active) {
  MenuShield.close();
}
// hoặc kiểm tra instance cụ thể:
if (MenuShield.active?.element.classList.contains('ds-explorer-settings-shield')) {
  // đây là ExplorerSettings đang mở
}
```

---

## Smart Positioning (`_calculatePosition`)

Thuật toán sử dụng `requestAnimationFrame` để đảm bảo đo đạc kích thước thật sau khi render, ưu tiên theo thứ tự:

1. **`position`** — override thủ công (x, y tuyệt đối)
2. **`event`** — đặt tại vị trí con trỏ chuột (context menu)
3. **`anchor`** — đặt dưới hoặc trên anchor button:
   - **Anchored (align: right)**: Sử dụng `right` và `bottom` của CSS thay vì `left/top`. Điều này giúp menu luôn bám sát cạnh phải của nút bấm bất kể chiều rộng của menu là bao nhiêu.
   - **Cân nhắc không gian**: Nếu không đủ chỗ phía dưới → lật lên trên.
4. **Screen bounds check** — luôn clamp vào viewport với `--ds-space-md` padding

Các giá trị margin/padding được chuẩn hóa: khoảng cách dropdown là `4px` (`--ds-space-2xs`).

---

## Pattern sử dụng

### Mở context menu (theo con trỏ)
```js
ContextMenuComponent.open({
  event: mouseEvent,
  items: [...],
});
// → ContextMenuComponent gọi MenuShield.open({ event, content })
```

### Mở dropdown gắn với button
```js
DesignSystem.createMenu(buttonEl, [...], { align: 'right' });
// → MenuShield.open({ anchor, content, align: 'right' })
```

---

## Lifecycle & Cleanup

Mỗi instance tự dọn dẹp khi đóng:
- Gỡ `mousedown` và `keydown` listeners khỏi `window`
- Xóa DOM node khỏi `document.body`
- Gọi `onClose` callback
- Nullify `_activeInstance`

Outside-click listener được đăng ký sau 10ms (qua deferred execution) để tránh đóng ngay lập tức do click trigger.

---

## Constraint (từ Decision)

- Tất cả floating menu mới **PHẢI** dùng `MenuShield` — không tự tạo container/positioning riêng
- Không override `border` hoặc `box-shadow` bên trong `.ds-menu-shield`
- Dùng `className` để identify instance khi cần check `MenuShield.active`

---

*Document — 2026-05-01*
