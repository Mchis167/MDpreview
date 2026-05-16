---
trigger: always_on
---

# MDpreview — AI Rules & Architecture Guide

**Single source of truth** for AI agents. Reference: [ARCHITECTURE.md](../../ARCHITECTURE.md), [Workflows README](../workflows/README.md)

---

## 🎯 Agent Workflow (5 Steps)

1. **Research** — Check GitHub project: `gh project item-list 3 --owner Mchis167 --format json`
2. **Plan** — Create implementation_plan artifact using `/plan` workflow → STOP
3. **Wait** — Do NOT proceed without user approval ("proceed", "approve", or feedback)
4. **Execute** — Use `/smart-edit` workflow with surgical edits
5. **Verify & Document** — Test, update `/changelog`, run `npm run lint`

**Anti-patterns:**
- ❌ Auto-proceed after plan (wait for approval)
- ❌ Guessing CSS tokens: Always check `tokens.css` first
- ❌ Leave task "In progress" after code changes (move to "In review")
- ❌ Auto-update CHANGELOG (only when explicitly requested)
- ❌ Bypass linting gates
- ❌ Hardcode colors/spacing in CSS
- ❌ Create global variables in JS

---

## 🏗️ Project Architecture

```
Electron App (MDpreview)
├── main.js           ← Electron main process
├── server.js         ← Express server (file API, socket.io)
└── renderer/         ← UI (Vanilla JS + CSS)
    ├── index.html    ← Single entry point (no fragments)
    ├── css/
    │   ├── design-system.css  ← Component imports
    │   └── design-system/
    │       ├── tokens.css     ← 3-tier tokens
    │       ├── atoms/         ← Atomic components
    │       ├── molecules/     ← Molecule components
    │       └── organisms/     ← Organism components
    └── js/
        ├── core/       ← app.js, electron-bridge.js
        ├── components/ ← atoms, molecules, organisms (IIFE modules)
        ├── services/   ← Business logic (IIFE modules)
        ├── modules/    ← Feature controllers (IIFE modules)
        └── utils/      ← Pure functions (IIFE modules)
```

---

## 📐 CSS: 3-Tier Token System

| Tier | Purpose | Format | Example |
|------|---------|--------|---------|
| **1: Primitives** | Raw values | `--ds-primitive-*` | `--ds-primitive-orange: #ffbf48` |
| **2: Alpha Palette** | Opacity variants | `--ds-*-a[10-90]` | `--ds-white-a30: rgba(255,255,255,0.30)` |
| **3: Semantic** | Purpose-named | `--ds-[category]-*` | `--ds-accent: var(--ds-primitive-orange)` |

### CSS Component Pattern

```css
.ds-button {
  --_bg: var(--ds-bg-base);      /* Local variable for variants */
  --_color: var(--ds-text-primary);
  
  display: flex;
  background: var(--_bg);        /* Use tokens only, never hardcode */
  color: var(--_color);
  transition: all var(--ds-transition-smooth);
}

.ds-button.ds-button--primary {
  --_bg: var(--ds-accent);       /* Variant: override only what changes */
  --_color: var(--ds-text-on-accent);
}
```

### CSS Rules (Enforced)
- ✅ Always use tokens: `var(--ds-...)`
- ✅ **Mandatory**: Check `renderer/css/design-system/tokens.css` before writing any CSS to ensure correct token usage (No guessing).
- ✅ Use local variables for variants: `--_varname`
- ✅ Semantic naming: `--ds-[category]-[value]-[variant]`
- ✅ Run `npm run lint:css` (0 errors mandatory)
- ❌ No hardcoded colors/spacing
- ❌ No CSS in styles.css (use `@import` only)

---

## 🔌 JavaScript: IIFE Module System

### 5 Module Categories

| Type | Path | Export | Example |
|------|------|--------|---------|
| **Components** | `renderer/js/components/[level]/[name].js` | `window.[Name]Component` | `IconActionButton` |
| **Services** | `renderer/js/services/[name]-service.js` | `window.[Name]Service` | `FileService` |
| **Modules** | `renderer/js/modules/[name].js` | `window.[Name]Module` | `TabsModule` |
| **Utilities** | `renderer/js/utils/[name].js` | `window.[Name]Util` | `ZoomUtil` |
| **Core** | `renderer/js/core/[name].js` | `window.[Name]` | `AppState` |

### IIFE Pattern (Mandatory)

```javascript
const ModuleName = (() => {
  'use strict';
  let _state = {};
  function _helper() { /* ... */ }
  return { init() { /* ... */ } };
})();
window.ModuleName = ModuleName;  // Explicit export
```

### Script Pipeline (Correct Load Order)
```
Core (app.js)
  ↓
Atoms → Molecules → Organisms
  ↓
Services → Utilities
  ↓
Modules → Boot sequence
```

### JS Rules (Enforced)
- ✅ IIFE pattern mandatory
- ✅ Explicit `window.*` exports
- ✅ Private functions prefix `_`: `function _helper() {}`
- ✅ `const`/`let` only (no `var`)
- ✅ Strict equality: `===` (never `==`)
- ✅ `console.warn`/`console.error` only (no `console.log`)
- ✅ Run `npm run lint:js` (0 errors mandatory)
- ❌ No global state outside IIFE
- ❌ No duplicated state (use `AppState`)

---

## 📚 Workflows

Full registry: [command-router.md](../command-router.md) | [workflows/README.md](../workflows/README.md)

| Flow | Commands |
|------|---------|
| **Bug fix** | `/discuss` → `/smart-edit` → `/linting-gates` → `/changelog` |
| **New feature** | `/discuss` → `/plan` → `/atomic-gen` → `/smart-edit` → `/linting-gates` → `/changelog` |
| **Release** | `/changelog` → `/linting-gates` → `/github` |
| **Refactor** | `/discuss` → `/plan` → `/refactor-to-atomic` → `/linting-gates` |

---

## ✅ Feature Checklist

**New component** (`/atomic-gen`): CSS file (tokens only) → JS file (IIFE) → register in design-system.css + index.html + app.js → `npm run lint` → `/changelog`

**New module** (`/module-creation`): IIFE + `window.*` export → register in index.html (correct order) + app.js → `npm run lint` → `/changelog`

**Bug fix** (`/smart-edit`): surgical edit → `npm run lint` → `/console-test` if interactive → `/changelog`

---

## 🛡️ Linting Gates (Zero-Error Policy)

### CSS Linting (`npm run lint:css`)
**Enforced rules:**
- `color-no-invalid-hex` — Valid hex only
- `no-duplicate-selectors` — No duplication
- `length-zero-no-unit` — Use `0` not `0px`
- `function-calc-no-unspaced-operator` — Space in `calc()`
- `import-notation` — Use string form `@import "..."`

### JavaScript Linting (`npm run lint:js`)
**Enforced rules:**
- `no-unused-vars` — Prefix unused with `_` (e.g., `_unused`, `_err`)
- `no-undef` — Variables must be defined
- `eqeqeq` — Use `===` never `==`
- `no-console` — Only `warn`/`error` allowed
- `no-var` — Use `const`/`let` only

---


## ⚠️ Known Gotchas & Architecture Decisions

> Kiến thức này không suy ra được từ code — được trích xuất từ session logs sau khi debug thực tế. Đọc trước khi sửa các file liên quan.

### Component API Pitfalls

| Component | Sai phổ biến | Đúng |
|-----------|-------------|------|
| `SegmentedControlComponent` | Dùng kết quả `.create()` như DOM Node | Phải dùng `.create().el` |
| `ButtonComponent` | Set `.loading = true` | Phải dùng `.setLoading(true)` |

### Monaco Editor — 5 Quy tắc Cứng

1. **`dispose()` phải synchronous** — Không dùng `requestAnimationFrame`. Nếu old editor dispose chạy sau khi new editor đã focused, Monaco global focus registry bị xáo trộn → "The Focus Ghost" bug (typing block).
2. **`MarkdownEditor` tồn tại trong 'read' mode là CỐ Ý** — Architecture cần cả 2 instance để mode switch nhanh (không remount). Đừng "tối ưu" xóa nó.
3. **Sau dispose→create cycle: `blur()` TRƯỚC `focus()`** — Monaco auto-focus textarea khi mount, nên plain `focus()` là no-op → `TextAreaHandler` không sync → `onDidChangeContent` silent dù `onKeyDown` fires.
4. **`_destroyed` flag bắt buộc trong mọi async coroutine** — `activate().run()` là async; nếu `render()` được gọi trong khi `run()` đang await, stale coroutine sẽ `bind()` lại listeners của new editor với state sai.
5. **Empty model cần warm-up text input pipeline** — Sau nhiều `setValue('')` calls, Chrome deregisters textarea khỏi OS text input routing: `keydown` fires nhưng `beforeinput`/`input` hoàn toàn im lặng. Fix: `setTimeout(blur→focus, 150)` với guard `getValue() === ''` (KHÔNG chạy cho non-empty model — sẽ clobber cursor position từ `focusWithContext`). Đã implement tại `markdown-viewer-component.js activate()`. Xem: `session-log-block-typing-new-file-2026-05-16.md`

### Draft System Invariants

1. **"Draft đi đôi với Tab"** — Draft không có tab tương ứng = orphan, bị `DraftModule.pruneOrphans()` xóa tự động. Không tạo draft standalone.
2. **`_isSyncing` DROP (không queue)** — `ChangeActionViewBar.updateUI()` trong 400ms lock window bị DROP hoàn toàn (không retry). `AppState.currentMode` có thể lệch với UI nếu call bị drop. Long-term nên refactor thành queue.
3. **Triple dirty check là độc lập** — `loadFile`, `onModeChange`, `updateUI` là 3 dirty check riêng biệt. Risk double-modal nếu 2 cùng fire trên 1 action. Chưa được refactor về 1 entry point.

---

## 🔴 High-Risk Files (đọc session logs trước khi sửa)

Các file này có race condition, async lifecycle, hoặc kiến trúc đặc thù. Đọc session log tương ứng trước khi đề xuất thay đổi.

| File | Session Log liên quan | Vì sao nguy hiểm |
|------|-----------------------|-----------------|
| `renderer/js/services/monaco-service.js` | `session-log-editor-block-typing-debug` | dispose() timing, global focus registry |
| `renderer/js/components/organisms/markdown-viewer-component.js` | `session-log-editor-block-typing-debug` | MarkdownEditor lifecycle, async activate() |
| `renderer/js/components/organisms/change-action-view-bar.js` | `session-log-draft-switch-bug`, `session-log-editor-block-typing-debug` | _isSyncing lock, 3 dirty checks |
| `renderer/js/modules/editor.js` | `session-log-draft-switch-bug`, `session-log-block-typing-new-file-2026-05-16` | _originalContent sync, silent save param |
| `renderer/js/core/app.js` | `session-log-draft-management-fix` | loadFile dirty check, triple coordination |

---

## 🔬 DIAG Debug Pattern (khi bug phức tạp)

Dùng khi bug không thể reproduce bằng code reading — cần trace runtime behavior.

```
1. Cài logger tại 5-6 điểm quan trọng:
   console.warn('[DIAG][Module.method] label', { key: value });

2. Để trace caller của unexpected call:
   console.warn('[DIAG] caller:', new Error().stack.split('\n')[2]);

3. Yêu cầu user reproduce và paste log vào chat.

4. Phân tích call stack từ log → xác định root cause.

5. Fix → verify với user → CLEANUP BẮT BUỘC:
   Xóa TẤT CẢ console.warn [DIAG] trước khi chạy lint.
   (npm run lint:js sẽ fail nếu còn console.warn không phải error path)
```

> ⚠️ Không commit code khi còn [DIAG] loggers. Lint sẽ báo `no-console` violation.

---

## 🌐 Browser Event Debugging — Layer Checklist

Dùng khi DOM event (`input`, `beforeinput`, `click`...) không fire dù điều kiện tưởng đúng.

### Nguyên tắc #1: Spy tại window TRƯỚC, element SAU
```js
// SAI — element-level spy có thể bị chặn bởi handler đăng ký trước
textarea.addEventListener('beforeinput', spy, true);

// ĐÚNG — window capture chạy trước MỌI handler khác
window.addEventListener('beforeinput', (e) => {
  if (e.target !== textarea) return;
  console.warn('[SPY] beforeinput fired', { data: e.data, defaultPrevented: e.defaultPrevented });
}, true);
```

Nếu `window`-level spy KHÔNG thấy event → vấn đề ở tầng browser/OS, không phải JS handler.  
Nếu `window`-level spy THẤY event nhưng element-level không thấy → có handler gọi `stopImmediatePropagation()`.

### Nguyên tắc #2: Checklist loại trừ theo tầng (từ ngoài vào trong)

| Tầng | Kiểm tra | Cách verify |
|------|----------|-------------|
| **OS / Chromium** | Browser có generate event không | Window-level spy |
| **DOM state** | `readOnly`, `disabled`, `editContext` | Log trực tiếp sau focus() |
| **Event prevention** | `e.defaultPrevented` trên keydown | Bubble-end spy (phase: false) |
| **JS handler** | Handler gọi `preventDefault()` / `stopImmediatePropagation()` | Window-level spy vs element-level spy |
| **App logic** | Monaco internal state (`_isDoingComposition`) | Truy cập internal API nếu path đúng |

### Nguyên tắc #3: `defaultPrevented: false` trên keydown ≠ event sẽ fire
`keydown.preventDefault()` chặn `beforeinput`. Nhưng `defaultPrevented: false` chỉ confirm keydown không bị prevent — không đảm bảo `beforeinput` sẽ fire (vẫn có thể bị chặn bởi browser-level routing như EditContext hoặc OS deregistration).

### Nguyên tắc #4: Loại trừ nhanh các nguyên nhân phổ biến
```js
// Sau editor.focus(), log ngay:
const ta = editor.getDomNode().querySelector('textarea');
console.warn('[CHECK]', {
  activeElement: document.activeElement?.tagName,   // phải là TEXTAREA
  readOnly: ta?.readOnly,                            // phải false
  disabled: ta?.disabled,                           // phải false
  editContext: ('editContext' in ta) ? String(ta.editContext) : 'unsupported',
  value: JSON.stringify(ta?.value).slice(0, 20)
});
```

---

## 🔗 References & Quick Links

| File | Purpose |
|------|---------|
| [ARCHITECTURE.md](../../ARCHITECTURE.md) | Complete system documentation |
| [Workflows README](../workflows/README.md) | All 13 workflows explained |
| [.stylelintrc.json](../../.stylelintrc.json) | CSS linting rules (documented) |
| [eslint.config.mjs](../../eslint.config.mjs) | JS linting rules (documented) |
| [package.json](../../package.json) | npm scripts: `lint`, `lint:css`, `lint:js` |

---

## 🎓 4 Core Principles

1. **Context-Aware** — Check `.agents/session-logs/` before touching high-risk files
2. **Analysis-First** — `/discuss` → `/plan` → wait approval → `/smart-edit`
3. **Quality Gates** — `npm run lint` = 0 errors + 0 warnings, mandatory
4. **Minimal Diffs** — Surgical edits only, no cleanup/reformat

---

**Last Updated:** 2026-05-16 | **Version:** 2.3 | **Status:** Current ✅
