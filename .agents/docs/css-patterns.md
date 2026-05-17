# CSS Patterns & Naming Convention

> Đọc file này trước khi viết BẤT KỲ CSS nào. Check `tokens.css` để lấy đúng token.

---

## Naming Convention

**Pattern:** `.ds-[component]` → `.ds-[component]-[element]` → modifier/state

```
.ds-[component]              ← block gốc
.ds-[component]-[element]    ← child element (flat, KHÔNG dùng __)
.ds-[component]--[modifier]  ← modifier (double dash)
.is-[state]                  ← state classes (is-active, is-visible, is-danger...)
.pos-[position]              ← vị trí (pos-top, pos-bottom...)
```

### ✅ Đúng
```css
.ds-inline-message { }
.ds-inline-message-icon { }
.ds-inline-message-text { }
.ds-inline-message--warning { }
.ds-inline-message--warning .ds-inline-message-icon { }
.ds-btn.is-active { }
.ds-tooltip.pos-top { }
```

### ❌ Sai — lỗi phổ biến
```css
/* SAI: prefix sai — KHÔNG dùng md-, app-, ui-... */
.md-carousel { }
.app-button { }

/* SAI: BEM double underscore */
.ds-card__title { }

/* SAI: camelCase */
.dsInlineMessage { }

/* SAI: không có ds- prefix */
.carousel-track { }
.sidebar-item { }
```

---

## Token Usage

**Luôn check `renderer/css/design-system/tokens.css` trước** — không guess.

### ✅ Đúng
```css
.ds-card {
  --_bg: var(--ds-bg-base);
  background: var(--_bg);
  padding: var(--ds-space-lg);
  border-radius: var(--ds-radius-md);
  transition: all var(--ds-transition-smooth);
  color: var(--ds-text-primary);
}

.ds-card--elevated {
  --_bg: var(--ds-bg-elevated);   /* chỉ override biến thay đổi */
}
```

### ❌ Sai — hardcode
```css
/* SAI: hardcode màu */
.ds-card { background: #1a1a1a; color: #fff; }

/* SAI: hardcode spacing */
.ds-card { padding: 16px; border-radius: 8px; }

/* SAI: hardcode transition */
.ds-card { transition: all 0.3s ease; }

/* SAI: hardcode shadow */
.ds-card { box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
```

### Token categories hay dùng
| Category | Prefix | Ví dụ |
|----------|--------|-------|
| Background | `--ds-bg-*` | `--ds-bg-base`, `--ds-bg-elevated` |
| Text | `--ds-text-*` | `--ds-text-primary`, `--ds-text-muted` |
| Border | `--ds-border-*` | `--ds-border-default`, `--ds-border-focus` |
| Spacing | `--ds-space-*` | `--ds-space-sm`, `--ds-space-lg` |
| Radius | `--ds-radius-*` | `--ds-radius-md`, `--ds-radius-panel` |
| Transition | `--ds-transition-*` | `--ds-transition-smooth`, `--ds-transition-fast` |
| Z-index | `--ds-z-index-*` | `--ds-z-index-overlay`, `--ds-z-index-max` |

---

## Inline Style trong JS

**Chỉ dùng `element.style.*` cho giá trị dynamic tính toán lúc runtime** (vị trí pixel, kích thước động).

### ✅ Chấp nhận được (dynamic positioning)
```js
el.style.left = `${x}px`;
el.style.top = `${y}px`;
el.style.width = `${calculatedWidth}px`;
```

### ❌ Tuyệt đối không (static style)
```js
/* SAI: style tĩnh — dùng CSS class */
el.style.display = 'flex';
el.style.color = '#fff';
el.style.padding = '16px';
el.style.opacity = '0';
el.style.background = 'rgba(0,0,0,0.5)';

/* ĐÚNG: dùng class thay thế */
el.classList.add('is-visible');
el.classList.toggle('is-active', condition);
```

---

## File Structure

```
renderer/css/design-system/
├── tokens.css           ← NGUỒN DUY NHẤT, đọc trước khi viết CSS
├── atoms/[name].css     ← single element components
├── molecules/[name].css ← composed components
└── organisms/[name].css ← full sections/layouts
```

Đăng ký trong `design-system.css` bằng `@import` — không viết CSS trực tiếp vào đó.
