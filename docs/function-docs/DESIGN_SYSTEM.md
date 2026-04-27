# Design System Utility (`renderer/js/components/design-system.js`)

> Centralized UI factory cho MDpreview. Cung cấp bộ công cụ tạo Atoms và Molecules đồng nhất, đảm bảo tính thẩm mỹ (glassmorphism) và hành vi (radius) trên toàn bộ ứng dụng.

---

## Nguyên tắc thiết kế

### 1. 3-Tier Token System
Mọi component đều sử dụng hệ thống token 3 lớp:
- **Tier 1 (Primitives)**: Giá trị thô (màu, khoảng cách).
- **Tier 2 (Alpha)**: Các biến thể độ mờ.
- **Tier 3 (Semantic)**: Biến theo mục đích sử dụng (Subtle, Accent, Surface...).

### 2. Adaptive & Concentric Radius
Hệ thống sử dụng cơ chế bo góc đồng tâm (concentricity). Khi một component con nằm trong container có padding, radius của con được tính toán để song song hoàn hảo với đường cong của cha:
`Inner Radius = Outer Radius - Padding`

Sử dụng biến local `--_radius` để cho phép ghi đè (override) động từ code JS.

---

## API Public

### `createElement(tag, classes, options)`
Utility tạo element nhanh với class và nội dung.
- `tag`: Tên thẻ (div, span...).
- `classes`: String hoặc mảng các class.
- `options`: `{ text, html, id, ...attributes }`.

### `createButton(options)`
Tạo button chuẩn (`ds-btn`) với nhiều biến thể.
- `variant`: `primary` | `ghost` | `subtle-light` | `subtle-dark` | `subtitle`.
- `label`: Nội dung text.
- `radius`: (Init: `var(--ds-radius-widget)`) Bo góc tùy chỉnh.
- `offLabel`: `true` để chỉ hiển thị icon.

### `createSegmentedControl(options)`
Tạo bộ điều khiển phân đoạn (`ds-segmented-control`) với chỉ báo trượt.
- `items`: Danh sách các item `{ id, icon, title }`.
- `activeId`: ID item đang active.
- `radius`: (Init: `var(--ds-radius-panel)`) Bo góc tùy chỉnh.
- `onChange`: Callback khi chọn item mới.

Trả về: `{ el, indicator, updateActive(id) }`.

### `createPopoverShield(onClose)`
Tạo lớp chắn bảo vệ (shield) cho các menu nổi, hỗ trợ click-outside và Escape để đóng.

---

## Icon Registry

Design System quản lý một bộ thư viện icon tập trung (SVG strings) thông qua `DesignSystem.ICONS`.

### `getIcon(name)`
Trả về chuỗi SVG của icon tương ứng.

**Các icon mới bổ sung:**
- `heading-1` đến `heading-6`: Icon tiêu đề chuẩn Lucide (stroke 2.5).
- `save`, `help-circle`, `terminal`, `code`, `table`.

---

## Pattern Kế thừa Radius (Concentric Logic)

Để đảm bảo đồng tâm trong các Organism phức tạp, chúng ta sử dụng biến local `--_bar-radius` làm gốc:

```css
/* Trong CSS của Organism */
.organism {
  --_bar-radius: var(--ds-radius-shell);
  border-radius: var(--_bar-radius);
}
.child-container {
  --_child-radius: calc(var(--_bar-radius) - 5px);
}
```

```js
/* Trong JS của Organism */
DesignSystem.createSegmentedControl({
  radius: 'var(--_child-radius)' // Kế thừa động
});
```

> Xem chi tiết tại [`docs/decisions/20260428-adaptive-concentric-radius.md`](../decisions/20260428-adaptive-concentric-radius.md)

---

*Document — 2026-04-28*
