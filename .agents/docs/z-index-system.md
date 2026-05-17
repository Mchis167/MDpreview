# Z-Index System

> **Rule #1:** Luôn dùng token `var(--ds-z-index-*)` — không bao giờ hardcode số.

---

## Chọn token nào? (Decision tree)

```
Element cần z-index?
│
├── Nằm trong parent có `isolation: isolate`?
│   └── YES → dùng số nhỏ: 1, 2, 3 (local scope)
│
└── NO → chọn theo loại element:
    │
    ├── Monaco suggestions, command palette, search palette  → --ds-z-index-max     (9000)
    ├── Tab đang drag, drag ghost                           → --ds-z-index-drag     (6000)
    ├── Toast / notification                                → --ds-z-index-toast    (5000)
    ├── Dropdown, context menu, tooltip, popover            → --ds-z-index-popover  (4000)
    ├── Dialog, modal, confirm box                          → --ds-z-index-modal    (3000)
    ├── Asset panel, sidebar drawer                         → --ds-z-index-drawer   (2000)
    ├── Modal backdrop, dimming overlay                     → --ds-z-index-overlay  (1000)
    ├── Tab bar, toolbar, sticky header                     → --ds-z-index-toolbar  (100)
    ├── Hover float, floating label in-context              → --ds-z-index-elevated (10)
    └── Ordered children trong card/component               → --ds-z-index-base     (1)
```

---

## ✅ Đúng vs ❌ Sai

```css
/* ✅ */
.ds-asset-drawer   { z-index: var(--ds-z-index-drawer); }
.ds-modal          { z-index: var(--ds-z-index-modal); }
.ds-context-menu   { z-index: var(--ds-z-index-popover); }
.tab-bar           { z-index: var(--ds-z-index-toolbar); }

/* ❌ */
.ds-modal          { z-index: 3000; }           /* hardcode */
.ds-modal          { z-index: 9999 !important; } /* magic number */
.tab-bar           { z-index: calc(var(--ds-z-index-overlay) + 100); } /* calc không cần */
```

---

## Isolation pattern (parent + children)

```css
/* Parent: global token + isolation */
.ds-asset-drawer {
  position: fixed;
  z-index: var(--ds-z-index-drawer);  /* global */
  isolation: isolate;                  /* children dùng số local */
}

/* Children: số nhỏ, không dùng token */
.ds-asset-drawer-overlay { position: absolute; z-index: 1; }
.ds-asset-drawer-panel   { position: absolute; z-index: 2; }
.ds-asset-drawer-tooltip { position: absolute; z-index: 3; }
```

**Bẫy phổ biến:** Child dùng `z-index: 4000` trong isolated parent → vô nghĩa, bị cap bởi parent.

---

## Bug: element bị che khuất

**Checklist nhanh:**
1. Element có `position` không? (`static` = z-index bị ignore)
2. Parent có `isolation: isolate` / `transform` / `opacity < 1` không? → stacking context bị cap
3. Parent root có `z-index` tường minh không? (thiếu → default `auto` → DOM order quyết định)
4. Có `!important` conflict không? → `grep -n "z-index.*important" file.css`

---

## `!important` — khi nào hợp lệ

Chỉ dùng khi fight third-party CSS (Monaco tự thêm `!important` internally):
```css
/* ✅ Hợp lệ */
.monaco-editor .contentWidgets { z-index: var(--ds-z-index-max) !important; }

/* ❌ Không hợp lệ — chỉ để "chắc ăn" */
.tab-bar { z-index: 1100 !important; }
```

---

## Token definitions

- **CSS:** `renderer/css/design-system/tokens.css` (line ~275)
- **JS:** `renderer/js/services/design-token-provider.js` (line ~200)

## Migration (nếu gặp code cũ)

| Cũ | Mới |
|----|-----|
| `100000`, `9999`, `10000` | `--ds-z-index-max` |
| `3000` | `--ds-z-index-modal` |
| `2000`–`2100` | `--ds-z-index-drawer` hoặc `--ds-z-index-modal` |
| `1000`–`1300` | `--ds-z-index-overlay` |
| `100` | `--ds-z-index-toolbar` |
| `1`–`20` trong isolated | giữ nguyên |
