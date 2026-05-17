# Monaco Editor Guide

> Đọc trước khi sửa: `monaco-service.js`, `markdown-viewer-component.js`

---

## 5 Quy tắc Cứng

### 1. `dispose()` phải synchronous
Không dùng `requestAnimationFrame` hay bất kỳ async wrapper nào quanh `dispose()`.

**Tại sao:** Nếu old editor dispose chạy sau khi new editor đã focused → Monaco global focus registry bị xáo trộn → "Focus Ghost" bug (typing block hoàn toàn).

### 2. `MarkdownEditor` tồn tại trong 'read' mode là CỐ Ý
Đừng "tối ưu" bằng cách xóa editor instance khi không visible.

**Tại sao:** Architecture cần cả 2 instance (read + edit) để mode switch nhanh mà không cần remount.

### 3. Sau dispose→create cycle: `blur()` TRƯỚC `focus()`
```js
editor.blur();   // TRƯỚC
editor.focus();  // SAU
```
**Tại sao:** Monaco auto-focus textarea khi mount. Plain `focus()` là no-op → `TextAreaHandler` không sync → `onDidChangeContent` im lặng dù `onKeyDown` fires.

### 4. `_destroyed` flag bắt buộc trong mọi async coroutine
```js
async function activate() {
  _destroyed = false;
  await loadContent();
  if (_destroyed) return;   // guard sau mỗi await
  bindListeners(editor);
}
```
**Tại sao:** `activate().run()` là async. Nếu `render()` được gọi trong khi `run()` đang await, stale coroutine sẽ rebind listeners của new editor với state sai.

### 5. Empty model cần warm-up text input pipeline
**Triệu chứng:** `keydown` fires nhưng `beforeinput`/`input` hoàn toàn im lặng sau nhiều `setValue('')`.

**Tại sao:** Chrome deregisters textarea khỏi OS text input routing sau nhiều empty setValue calls.

**Fix** (đã implement tại `markdown-viewer-component.js activate()`):
```js
if (editor.getValue() === '') {
  setTimeout(() => {
    editor.blur();
    editor.focus();
  }, 150);
}
// QUAN TRỌNG: guard getValue() === '' — KHÔNG chạy cho non-empty model
// vì sẽ clobber cursor position từ focusWithContext
```

---

## High-Risk Files

| File | Session Log | Nguy hiểm vì |
|------|-------------|-------------|
| `monaco-service.js` | `session-log-editor-block-typing-debug` | dispose() timing, global focus registry |
| `markdown-viewer-component.js` | `session-log-editor-block-typing-debug` | MarkdownEditor lifecycle, async activate() |
| `change-action-view-bar.js` | `session-log-draft-switch-bug` | _isSyncing lock, 3 dirty checks |
| `modules/editor.js` | `session-log-block-typing-new-file-2026-05-16` | _originalContent sync, silent save param |
| `core/app.js` | `session-log-draft-management-fix` | loadFile dirty check, triple coordination |

---

## Draft System Invariants

1. **Draft đi đôi với Tab** — Không tạo draft standalone. `DraftModule.pruneOrphans()` sẽ xóa tự động.
2. **`_isSyncing` DROP (không queue)** — Calls trong 400ms lock window bị drop hoàn toàn, không retry.
3. **Triple dirty check độc lập** — `loadFile`, `onModeChange`, `updateUI` là 3 entry points riêng. Risk double-modal nếu 2 fire cùng lúc.

---

## Scroll Sync

Dùng `revealPositionInCenter(pos, 1)` (ScrollType.Immediate) sau `setSelection` để cancel smooth scroll animation.

```js
editor.setSelection(range);
editor.revealPositionInCenter({ lineNumber, column }, 1);  // 1 = Immediate
```

---

## Language Providers & Completion

### `registerCompletionItemProvider` — gọi trong `init()`, không phải `mount()`

```js
// ✅ Đúng — global, one-time
function init() {
  _registerLanguageProviders();
}

// ❌ Sai — stacks providers mỗi lần remount → widget position sai
function mount(container) {
  monaco.languages.registerCompletionItemProvider('markdown', { ... });
}
```

### `fixedOverflowWidgets: false` khi layout có `backdrop-filter`

`backdrop-filter` tạo stacking context mới → `position: fixed` tính sai gốc tọa độ → completion widget hiện xa cursor.

```js
// Nếu parent container có backdrop-filter:
const editor = monaco.editor.create(container, {
  fixedOverflowWidgets: false,  // ← bắt buộc
});
```

---

## Drag & Drop trong Monaco

Monaco Service đăng ký `dragover`/`drop` với **`capture: true`** — intercept toàn bộ drag events trước khi bubble. Listeners thêm vào container bên ngoài sẽ không bao giờ fire.

**Rule:** Fix drag-drop phải nằm bên trong `monaco-service.js` hoặc `AttachmentService.handleDrop()` — không thể fix từ ngoài.
