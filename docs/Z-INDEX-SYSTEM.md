# Z-Index System Documentation

**Version:** 2.0  
**Last Updated:** 2026-05-17  
**Related:** `feedback_z_index_system.md` (memory rule)

---

## Overview

MDPreview uses a **semantic z-index token system** to manage stacking order across all UI layers. This prevents visual conflicts, makes code intent clear, and ensures maintainability as the app grows.

**Golden Rule:** Use token variables (`var(--ds-z-index-{layer})`) everywhere. Never hardcode magic numbers.

---

## Token Scale (Global Scope)

Z-index tokens are defined in:
- **CSS:** `renderer/css/design-system/tokens.css:275-295`
- **JS:** `renderer/js/services/design-token-provider.js:200-209`

| Token | Value | Use Case | Examples |
|-------|-------|----------|----------|
| `--ds-z-index-base` | 1 | Local stacking nội bộ component (relative positioning) | Ordered children within a card |
| `--ds-z-index-elevated` | 10 | Hover states, floating elements in-context | Card shadow on hover, floating label |
| `--ds-z-index-toolbar` | 100 | Fixed toolbars, sticky headers | Edit toolbar, tab bar, action bar |
| `--ds-z-index-overlay` | 1000 | Modal backdrops, dimming overlays | Dimming layer behind modal, content overlay |
| `--ds-z-index-drawer` | 2000 | Side panels, sliding drawers | Asset panel, wiki drawer, backlinks panel |
| `--ds-z-index-modal` | 3000 | Dialog boxes, focused modals | Confirm dialog, expanded textarea modal, focused comment form |
| `--ds-z-index-popover` | 4000 | Dropdowns, context menus, floating panels | TOC floating action group, menu shield, tooltip (atom-level) |
| `--ds-z-index-toast` | 5000 | Notifications, toasts (reserved for future) | Toast container at top-right |
| `--ds-z-index-drag` | 6000 | Drag ghost elements, dragging state | Tab being dragged, tree node drag proxy, drag-over highlight |
| `--ds-z-index-max` | 9000 | Emergency override for top-most elements | Monaco editor suggestions, quick command palette, search palette |

---

## Stacking Hierarchy Visualization

```
9000  ╔════════════════════════════════════════════╗
      ║ max: Monaco, Quick Command, Search Palette║
6000  ╠════════════════════════════════════════════╣
      ║ drag: Tab ghost, tree drag proxy          ║
5000  ╠════════════════════════════════════════════╣
      ║ toast: Notifications (if implemented)     ║
4000  ╠════════════════════════════════════════════╣
      ║ popover: TOC actions, menus, context menus║
3000  ╠════════════════════════════════════════════╣
      ║ modal: Dialogs, focused forms, modals     ║
2000  ╠════════════════════════════════════════════╣
      ║ drawer: Asset panel, wiki, backlinks      ║
1000  ╠════════════════════════════════════════════╣
      ║ overlay: Backdrop, dimming layer          ║
100   ╠════════════════════════════════════════════╣
      ║ toolbar: Tab bar, edit toolbar, headers   ║
10    ╠════════════════════════════════════════════╣
      ║ elevated: Hover states, floating in-doc   ║
1     ╚════════════════════════════════════════════╝
      base: Content, normal document flow
```

---

## Usage Rules

### 1. Global-Scope Elements

**When:** Element is positioned `fixed` or `absolute` and visible across multiple UI surfaces (main layout areas, panels, overlays).

**How:** Use token variables

```css
/* ✅ Correct */
.ds-asset-drawer {
  position: fixed;
  z-index: var(--ds-z-index-drawer);
  /* ... */
}

.modal-dialog {
  position: fixed;
  z-index: var(--ds-z-index-modal);
  /* ... */
}

/* ❌ Wrong */
.ds-asset-drawer {
  z-index: 2000;  /* magic number — can't maintain */
}

.modal-dialog {
  z-index: 9999 !important;  /* vague, unmaintainable */
}
```

### 2. Local-Scope Elements

**When:** Element is inside a container with `isolation: isolate`, ordering only within that context.

**How:** Use small integers (1, 2, 3, 5, 10)

```css
/* Parent isolates this subtree */
.ds-asset-drawer {
  isolation: isolate;
  z-index: var(--ds-z-index-drawer);  /* global */
}

/* Children use LOCAL ordering */
.ds-asset-drawer-overlay {
  position: absolute;
  z-index: 1;  /* 1 = lowest within isolated context */
}

.ds-asset-drawer-panel {
  position: absolute;
  z-index: 2;  /* 2 = above overlay, within isolated context */
}

.ds-asset-drawer-tooltip {
  position: absolute;
  z-index: 3;  /* 3 = highest within isolated context */
}
```

**Why:** With `isolation: isolate`, the parent creates a stacking context. All children's z-index values are relative to the parent, NOT the global document. This prevents local conflicts from affecting global stacking.

### 3. DOM Order Tiebreakers

When two elements have the SAME z-index, browser uses **DOM order** (later in HTML = on top).

```css
/* Both at toolbar level, but different contexts */
.edit-toolbar {
  position: fixed;
  z-index: var(--ds-z-index-toolbar);  /* 100 */
}

.tab-bar {
  position: relative;
  z-index: var(--ds-z-index-toolbar);  /* 100 */
}
/* If both 100, whichever comes later in HTML wins */
```

---

## Common Mistakes & Fixes

### Mistake 1: Hardcoding values

```css
/* ❌ Bad */
.ds-comment-form {
  z-index: 3000;
}

/* ✅ Good */
.ds-comment-form {
  z-index: var(--ds-z-index-modal);
}
```

### Mistake 2: Magic calc() formulas

```css
/* ❌ Unclear intent */
.tab-bar {
  z-index: calc(var(--ds-z-index-overlay) + 100);  /* why +100? */
}

/* ✅ Clear semantic */
.tab-bar {
  z-index: var(--ds-z-index-toolbar);  /* toolbar, not dynamic */
}
```

### Mistake 3: Missing z-index on positioned element with `isolation`

```css
/* ❌ Bug: .ds-asset-drawer root has NO z-index */
.ds-asset-drawer {
  position: fixed;
  isolation: isolate;  /* creates stacking context */
  /* NO z-index here! defaults to auto → DOM order wins */
}

.ds-asset-drawer-panel {
  position: absolute;
  z-index: 2000;  /* this is LOCAL, doesn't help root */
}

/* tab-bar at z-index: 1100 will appear ABOVE this drawer! */

/* ✅ Fixed: add z-index to root */
.ds-asset-drawer {
  position: fixed;
  z-index: var(--ds-z-index-drawer);  /* NOW 2000 globally */
  isolation: isolate;  /* children can use local 1, 2, 3 */
}
```

### Mistake 4: Using `!important` when not needed

```css
/* ❌ Unnecessary: */
.tab-bar {
  z-index: 1100 !important;  /* why force? conflicts elsewhere */
}

/* ✅ Only when fighting third-party CSS: */
.monaco-editor .contentWidgets {
  z-index: var(--ds-z-index-max) !important;  /* Monaco adds !important internally */
}
```

### Mistake 5: Drawer appearing below tab-bar

```css
/* ❌ Result: tab-bar visually on top */
.ds-asset-drawer {
  position: fixed;
  /* NO z-index — defaults to auto */
}

.tab-bar-container {
  z-index: 1100;  /* wins by DOM order */
}

/* ✅ Fixed */
.ds-asset-drawer {
  z-index: var(--ds-z-index-drawer);  /* 2000 > 100 (toolbar) */
}

.tab-bar-container {
  z-index: var(--ds-z-index-toolbar);  /* 100 */
}
```

---

## Implementation Checklist

When adding a new UI element that needs z-index:

- [ ] Is it positioned (`position: fixed`, `absolute`, `relative`, `sticky`)?
- [ ] Does it appear across multiple UI surfaces (global scope) OR only within a parent container (local scope)?
  - **Global:** Use `var(--ds-z-index-{layer})`
  - **Local:** If parent has `isolation: isolate`, use small int (1–10)
- [ ] Which semantic layer does it belong to? (toolbar, modal, popover, etc.)
- [ ] Does the root container (if it has children) have an explicit `z-index`?
- [ ] If using `isolation: isolate`, are child z-index values local (1–10) not global (1000+)?
- [ ] Run `npm run lint` — 0 errors, 0 warnings
- [ ] Visually test in context — does it stack correctly with neighbors?

---

## Debugging Z-Index Issues

### Issue: Element appears below something it should be above

**Diagnosis checklist:**

1. **Check z-index value:**
   ```bash
   # Find the rule
   grep -n "z-index" element.css
   
   # Check computed value in DevTools
   # (DevTools → Inspect → Styles tab → z-index)
   ```

2. **Check stacking context:**
   ```css
   /* Is parent creating a stacking context? */
   position: relative;  /* creates stacking context */
   opacity: 0.5;        /* creates stacking context (< 1) */
   transform: scale(1); /* creates stacking context */
   isolation: isolate;  /* creates stacking context */
   ```

3. **Check positioning:**
   - Element must be **positioned** (`position: fixed/absolute/relative/sticky`) to respect z-index
   - `position: static` (default) ignores z-index

4. **Check token value:**
   ```bash
   # Verify token value is what you expect
   grep "ds-z-index-modal" renderer/css/design-system/tokens.css
   # Should output: --ds-z-index-modal: 3000;
   ```

5. **Check `!important` conflicts:**
   ```bash
   # Search for !important on z-index in same file
   grep -n "z-index.*!important" element.css
   ```

### Issue: Element covered by something below it

**Likely cause:** Parent container has low z-index or no z-index.

```css
/* ❌ Child at 4000 doesn't help if parent is at 100 */
.parent {
  position: relative;
  z-index: 100;
}

.child {
  position: absolute;
  z-index: 4000;  /* still constrained by parent's 100! */
}

/* ✅ Parent must be at appropriate level */
.parent {
  position: fixed;
  z-index: var(--ds-z-index-popover);  /* 4000 */
}

.child {
  position: absolute;
  z-index: 1;  /* local within parent's context */
}
```

---

## Migration from Old System

If you find old z-index code:

| Old Value | New Token | Reasoning |
|-----------|-----------|-----------|
| 100000 | `--ds-z-index-max` | Emergency override for topmost |
| 9999, 10000 | `--ds-z-index-max` | Same intent — max layer |
| 3000 | `--ds-z-index-modal` | Modal/dialog intent |
| 2000, 2100 | `--ds-z-index-modal` or `--ds-z-index-drawer` | Depending on element type |
| 1300, 1200, 1100, 1000 | `--ds-z-index-overlay` | Overlay/dimming layer |
| 100 | `--ds-z-index-toolbar` | Toolbar, sticky header |
| 5, 10, 20, 1 | Keep as-is if local within isolated context | Small local ordering values |

---

## Files That Define/Use Tokens

| File | Purpose |
|------|---------|
| `renderer/css/design-system/tokens.css:275-295` | CSS token definitions |
| `renderer/js/services/design-token-provider.js:200-209` | JS token provider (runtime override) |
| `renderer/css/design-system/atoms/tooltip.css` | Tooltip — uses `--ds-z-index-max` |
| `renderer/css/design-system/organisms/tab-bar.css` | Tab bar — uses `--ds-z-index-toolbar` |
| `renderer/css/design-system/organisms/asset-panel.css` | Asset drawer — uses `--ds-z-index-drawer` with `isolation: isolate` |
| `renderer/css/design-system/organisms/search-palette.css` | Search palette — uses `--ds-z-index-max` |
| `renderer/js/components/organisms/comment-form-component.js` | Comment form — uses JS `setProperty('z-index', 'var(...)')` |

---

## References

- **Memory Rule:** `feedback_z_index_system.md`
- **Implementation Plan:** `ImplementPlan/z-index-system-revamp-2026-05-17.md`
- **Related Concepts:**
  - CSS Stacking Context: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context
  - `isolation` property: https://developer.mozilla.org/en-US/docs/Web/CSS/isolation

