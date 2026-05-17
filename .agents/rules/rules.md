---
trigger: always_on
---

# MDpreview — AI Rules & Architecture Guide

Reference: [ARCHITECTURE.md](../../ARCHITECTURE.md) | [Workflows README](../workflows/README.md)

---

## 🎯 Agent Workflow

**Default (chat / small task):**
1. Phân tích → trả lời hoặc đề xuất
2. **STOP — chờ user cho phép trước khi edit bất kỳ file nào**
3. Khi được cho phép → `/smart-edit` → lint

**Complex / new feature** (khi user dùng `/plan`):
1. Tạo implementation plan → STOP, chờ approval
2. Khi approved → Execute → lint → done

**Anti-patterns:**
- ❌ Tự edit code khi chưa được phép
- ❌ Viết code trong chat khi không được yêu cầu — nếu cần đề xuất, tóm tắt phương án bằng lời, không viết full code
- ❌ Tự tạo plan (chỉ plan khi dùng `/plan`)
- ❌ Guess CSS tokens — luôn check `tokens.css` trước
- ❌ Auto-update CHANGELOG (chỉ khi được yêu cầu)
- ❌ Bypass linting gates
- ❌ Hardcode colors/spacing trong CSS
- ❌ Global variables trong JS

---

## 🏗️ Architecture

```
renderer/
├── css/design-system/
│   ├── tokens.css       ← 3-tier tokens (check trước khi viết CSS)
│   ├── atoms/molecules/organisms/
└── js/
    ├── core/            ← app.js, electron-bridge.js
    ├── components/      ← IIFE: window.[Name]Component
    ├── services/        ← IIFE: window.[Name]Service
    ├── modules/         ← IIFE: window.[Name]Module
    └── utils/           ← IIFE: window.[Name]Util
```

**Script load order:** Core → Atoms → Molecules → Organisms → Services → Utilities → Modules → Boot

---

## ⚡ Pre-Code Checklist (bắt buộc trước khi viết code)

| Task | Làm trước |
|------|-----------|
| Viết/sửa CSS | Mở `tokens.css` xác nhận token → đọc [css-patterns.md](../docs/css-patterns.md) |
| Có z-index | Đọc [z-index-system.md](../docs/z-index-system.md), chọn token từ decision tree |
| Dùng icon | Check `design-system-icons.js` trước — nếu chưa có thì thêm vào cả 2 file |
| Tạo/sửa JS module | Đọc [js-patterns.md](../docs/js-patterns.md) |
| Sửa high-risk file | Đọc session log tương ứng + [monaco-guide.md](../docs/monaco-guide.md) |
| Debug bug | Đọc [debug-guide.md](../docs/debug-guide.md), đặt log trước khi fix |

---

## 📐 CSS Rules

> **Trước khi viết CSS: đọc [css-patterns.md](../docs/css-patterns.md)**

**Naming:** `.ds-[component]` → `.ds-[component]-[element]` → `.ds-[component]--[modifier]` → `.is-[state]`

- ✅ Prefix `ds-` cho mọi class design system
- ✅ Check `tokens.css` trước — không guess token
- ✅ Local vars cho variants: `--_varname`
- ❌ Không dùng prefix khác (`md-`, `app-`, `ui-`...)
- ❌ Không hardcode màu, spacing, transition, shadow, z-index
- ❌ Không dùng BEM `__` (double underscore)
- ❌ Không CSS trong `styles.css` (chỉ `@import`)
- Run: `npm run lint:css` (0 errors)

---

## 🎨 Icon System

**Nguồn duy nhất:** `renderer/js/components/design-system-icons.js` (được sync sang `cf-publish-worker/public/design-system-icons.js` khi build)

- ✅ Dùng `DesignSystem.getIcon('icon-name')` để render icon
- ✅ Nếu icon chưa có → thêm SVG vào **cả 2 file** trên rồi dùng
- ❌ Không tự vẽ SVG inline trong CSS hoặc JS
- ❌ Không hardcode `<svg>` trực tiếp trong component HTML
- ❌ Không dùng icon từ nguồn khác ngoài registry

---

## 🔌 JavaScript Rules

> **Trước khi viết JS module: đọc [js-patterns.md](../docs/js-patterns.md)**

- ✅ IIFE pattern + `window.*` export bắt buộc
- ✅ `const`/`let`, `===`, `console.warn`/`error` only
- ✅ Private prefix `_`
- ❌ Không inline style tĩnh trong JS (dùng classList)
- ❌ Inline style `el.style.*` chỉ cho dynamic pixel values (top/left/width)
- ❌ No global state outside IIFE, no duplicated state (use `AppState`)
- Run: `npm run lint:js` (0 errors)

---

## 📚 Workflows

| Flow | Commands |
|------|---------|
| **Bug fix** | chat → `/smart-edit` → `/linting-gates` |
| **New feature** | `/discuss` → `/plan` → `/atomic-gen` → `/smart-edit` → `/linting-gates` → `/changelog` |
| **Refactor** | `/plan` → `/refactor-to-atomic` → `/linting-gates` |
| **Release** | `/changelog` → `/linting-gates` |

---

## ⚠️ Known Gotchas

> Chi tiết đầy đủ: [monaco-guide.md](../docs/monaco-guide.md) | [debug-guide.md](../docs/debug-guide.md)

### Component API

| Component | ❌ Sai | ✅ Đúng |
|-----------|--------|---------|
| `SegmentedControlComponent` | `.create()` như DOM Node | `.create().el` |
| `ButtonComponent` | `.loading = true` | `.setLoading(true)` |

### Monaco — Tóm tắt (đọc [monaco-guide.md](../docs/monaco-guide.md) trước khi sửa)
- `dispose()` synchronous — không wrap bằng `requestAnimationFrame`
- `MarkdownEditor` tồn tại trong 'read' mode là **cố ý** — không xóa
- Sau dispose→create: `blur()` TRƯỚC `focus()`
- `_destroyed` flag bắt buộc trong mọi async coroutine
- Empty model cần `setTimeout(blur→focus, 150)` với guard `getValue() === ''`

### Mirror Post-Processing Pipeline

Bất kỳ client-side DOM post-processor nào (VD: `MockupImageModule`, `CarouselModule`) **phải được replicate ở 4 nơi**:

| Context | File | Vị trí |
|---------|------|--------|
| Live preview | `markdown-viewer-component.js` | `render()` và `update()` |
| Project map | `project-map.js` | RAF block sau innerHTML |
| Tab preview | `tab-preview.js` | `_showPreview()` |
| Published page | `cf-publish-worker/src/shell.js` | inline init script |

**Thứ tự bắt buộc:** MockupImageModule → CarouselModule → CodeBlockModule

> Nếu thêm post-processor mới mà thiếu 1 trong 4 nơi → mirror hiển thị sai, scroll indicator lệch, published page broken.

### High-Risk Files
`monaco-service.js` · `markdown-viewer-component.js` · `change-action-view-bar.js` · `modules/editor.js` · `core/app.js`

→ Đọc session log tương ứng trong `.agents/session-logs/` trước khi sửa.

---

## 🔬 Debug

> Chi tiết: [debug-guide.md](../docs/debug-guide.md)

- **Hypothesis → Confirm → Fix** — không fix dựa trên guess, đặt log để xác nhận trước
- **DIAG:** `console.warn('[DIAG]...')` — xóa TẤT CẢ trước lint
- **Events không fire:** spy `window` (capture) trước, element sau

---

## 🎓 Core Principles

1. **Wait for permission** — Không tự edit khi chưa được phép
2. **Context-Aware** — Check session-logs trước khi sửa high-risk files
3. **Quality Gates** — `npm run lint` = 0 errors mandatory
4. **Minimal Diffs** — Surgical edits only

---

**Docs:** [css-patterns.md](../docs/css-patterns.md) | [js-patterns.md](../docs/js-patterns.md) | [debug-guide.md](../docs/debug-guide.md) | [monaco-guide.md](../docs/monaco-guide.md) | [z-index-system.md](../docs/z-index-system.md)

**Version:** 2.5 | **Updated:** 2026-05-18
