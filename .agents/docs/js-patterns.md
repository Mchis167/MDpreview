# JavaScript Patterns

> Đọc trước khi tạo mới hoặc sửa JS module.

---

## IIFE Module Pattern (Bắt buộc)

```js
const MyModule = (() => {
  'use strict';

  // Private state
  let _state = null;

  // Private helpers — prefix _
  function _doSomething(val) {
    return val;
  }

  // Public API
  return {
    init(options) {
      _state = options;
    },
    getData() {
      return _state;
    }
  };
})();

window.MyModule = MyModule;   // Explicit export — bắt buộc
```

### ❌ Sai
```js
// SAI: không có IIFE — leak global
function init() {}
const state = {};

// SAI: không export
const MyModule = (() => { ... })();
// (quên window.MyModule = MyModule)

// SAI: dùng var
var count = 0;
```

---

## Module Categories & Paths

| Type | Path | Export | Load order |
|------|------|--------|------------|
| Component | `js/components/[level]/[name].js` | `window.[Name]Component` | 2nd |
| Service | `js/services/[name]-service.js` | `window.[Name]Service` | 3rd |
| Module | `js/modules/[name].js` | `window.[Name]Module` | 4th |
| Utility | `js/utils/[name].js` | `window.[Name]Util` | 3rd |
| Core | `js/core/[name].js` | `window.[Name]` | 1st |

**Load order trong index.html:** Core → Atoms → Molecules → Organisms → Services/Utils → Modules → Boot

---

## Rules

- `const`/`let` only — không `var`
- `===` only — không `==`
- `console.warn` / `console.error` only — không `console.log`
- Private prefix `_`: `_state`, `_handleClick`, `_cache`
- State dùng chung → `AppState` (không duplicate)
- Không tạo global variable ngoài `window.*` exports

---

## DOM Manipulation

```js
// ✅ Đúng — toggle class
el.classList.add('is-active');
el.classList.toggle('is-visible', condition);
el.classList.remove('is-loading');

// ✅ Đúng — inline style CHỈ cho dynamic pixel values
el.style.left = `${x}px`;
el.style.top = `${y}px`;

// ❌ Sai — static style qua JS
el.style.display = 'flex';
el.style.color = '#fff';
el.style.opacity = '0';
el.style.padding = '16px';
// → Thay bằng CSS class + classList
```

---

## Event Listener Patterns

### `dragend` — luôn dùng `window`-level listener

`dragend` fires ngay cả khi element gốc bị xóa hoặc thao tác bị hủy (ESC). Nếu cleanup chỉ gắn trên element, UI có thể bị "kẹt" (sticky state).

```js
// ✅ Reliable cleanup
window.addEventListener('dragend', _cleanupDragState);

// ❌ Có thể miss nếu element bị xóa trước khi dragend fire
draggableEl.addEventListener('dragend', _cleanupDragState);
```

### Guard drag khi Modal/Palette đang mở

```js
function _handleDragStart(e) {
  if (AppState.isModalOpen || AppState.isPaletteOpen) {
    e.preventDefault();
    return;
  }
  // ...
}
```

---

## Async Safety

```js
// Bắt buộc _destroyed flag trong async coroutine
async function run() {
  _destroyed = false;
  await someAsync();
  if (_destroyed) return;   // guard sau mỗi await
  bindListeners();
}

function destroy() {
  _destroyed = true;
  // cleanup...
}
```

---

## Component API (Gotchas)

| Component | ❌ Sai | ✅ Đúng |
|-----------|--------|---------|
| `SegmentedControlComponent` | `.create()` như DOM Node | `.create().el` |
| `ButtonComponent` | `.loading = true` | `.setLoading(true)` |
