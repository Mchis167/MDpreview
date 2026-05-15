# [Editor Block Typing Debug] Session Log — 2026-05-15

## 🔗 Liên kết (Links)
- **Log trước**: [session-log-draft-management-fix-2026-05-15.md](file:///Users/mchisdo/MDpreview/.agents/session-logs/session-log-draft-management-fix-2026-05-15.md)
- **Log kế tiếp**: (Đang tiếp tục)

## 📝 Tổng quan (Overview)
Điều tra lỗi nghiêm trọng khiến Monaco Editor bị mất khả năng nhận nhập liệu (Block Typing) sau các thao tác chuyển đổi Draft nhanh. Lỗi này không xuất hiện thường xuyên nhưng lặp lại khi có sự kết hợp giữa: **Reload App -> Thao tác Tab (Xóa/Tạo) -> Sync từ Server**.

Mục tiêu là xác định tại sao Editor vẫn có focus, vẫn nhận phím (`onKeyDown`) nhưng Model không cập nhật nội dung.

## 🕒 Trình tự Trace & Kết quả Diagnostic (Phiên 1)
Dựa trên 17 điểm diagnostic đã cài đặt, chúng ta đã xác định được Timeline gây lỗi:

1.  **Giai đoạn Hủy (Old Instance):**
    - `MarkdownViewer.render` gọi `editorComp.destroy()`.
    - `MonacoService.dispose()` được gọi, đặt lệnh `editor.dispose()` vào `requestAnimationFrame` (delay ~16ms).
    - **Lỗ hổng:** Biến toàn cục `_editor` và `_model` bị set về `null` ngay lập tức nhưng instance thực tế vẫn "sống" trong DOM.

2.  **Giai đoạn Khởi tạo (New Instance):**
    - Ngay trong cùng frame đó, `new MarkdownEditor()` được tạo và gọi `MonacoService.mount()`.
    - `mount()` gán `_editor` và `_model` mới.
    - **Xung đột:** `requestAnimationFrame` của bước 1 thực thi, có thể gây ra việc dọn dẹp nhầm hoặc làm loạn reference nếu code logic không kiểm tra ID của mount.

3.  **Giai đoạn Gắn Listener (Binding):**
    - `EditorModule.bind()` chạy. Diagnostic cho thấy `_changeListener` và `_keyListener` **đã được attached**.
    - **Hiện tượng lạ:** `onKeyDown` fire (Log `[DIAG-EVENT]`) nhưng `onDidChangeContent` im lặng.
    - **Kết luận:** Listener đang nghe trên một Model "mồ côi" (Model của instance cũ đã bị gỡ khỏi DOM nhưng chưa bị hủy hoàn toàn, hoặc ngược lại).

4.  **Giai đoạn Sync Guard (Toolbar UI):**
    - `ChangeActionViewBar.updateUI` sử dụng `setTimeout(400)` để reset `_isSyncing`.
    - Trong 400ms này, bất kỳ lệnh `updateUI` nào khác đều bị **Early Exit**. Điều này khiến trạng thái Mode của AppState và UI thực tế dễ bị lệch pha.

---

## 🔍 Phân tích Sâu (Phiên 2 — 2026-05-16)

### Clue mới quan trọng
**Sau khi bị block, nếu chuyển sang window khác rồi quay lại → typing hoạt động bình thường.**

Đây là dấu hiệu rõ ràng của **Monaco internal focus desync**, không phải model mismatch.

### Cơ chế gây lỗi chính xác

```
render() được gọi:
1. dispose() → editorToDispose.setModel(null) [sync]
               → rAF: editorToDispose.dispose() [DELAY ~16ms]

2. mount.innerHTML = '' → Monaco textarea BỊ XÓA khỏi DOM
   (browser có thể không fire 'blur' event đúng cách trên detached element)

3. New editor mounted → focus() → new textarea.focus()
   → Monaco sets internal _focused = true ✓

4. [~16ms sau] rAF fires → editorToDispose.dispose()
   → Monaco's GLOBAL editor registry cập nhật
   → Side effect: global focus tracking bị clear/reset
   → New editor's _focused = false ✗

Kết quả:
- textarea có DOM focus → onKeyDown fires ✓ (DOM event, không bị gate)
- Monaco nghĩ _focused=false → không xử lý input → onDidChangeContent silent ✗
```

**"Switch window và back" fix** vì:
- blur → window focus event → browser fires proper focus event trên textarea
- Monaco's `onFocus` handler chạy lại → `_focused = true` ✓

### 3 Root Causes đã xác định

#### Root Cause 1 (CRITICAL): `requestAnimationFrame` trong `dispose()`
**File:** `renderer/js/services/monaco-service.js:395`

Old editor `dispose()` chạy AFTER new editor đã được focus. Monaco's global focus registry của old editor can conflict với new editor's focus state, khiến `_focused = false` trên new editor.

#### Root Cause 2: Stale `activate().run()` coroutine
**File:** `renderer/js/components/organisms/markdown-viewer-component.js:1177`

`activate()` sử dụng fire-and-forget `run()`. Nếu `render()` được gọi khi old `run()` đang await `_mountPromise`, old `run()` sẽ tiếp tục chạy sau `destroy()` và gọi `EditorModule.bind()` lần thứ hai — unbind listeners của new editor và re-bind với state sai.

#### Root Cause 3: `_isSyncing` DROP thay vì QUEUE
**File:** `renderer/js/components/organisms/change-action-view-bar.js:127`

Nếu `updateUI('edit')` bị gọi trong 400ms lock window, call bị **DROP hoàn toàn** (không queue). AppState có thể nói mode='edit' nhưng editor chưa bao giờ được activate đúng cách.

---

## ✅ Fixes Đã Apply

### Fix A — `_destroyed` guard trong `activate()` ✅ APPLIED
**File:** `renderer/js/components/organisms/markdown-viewer-component.js`

```js
// destroy() — thêm flag
destroy() {
  this._destroyed = true;  // ← NEW
  if (EditorModule) EditorModule.unbind();
  MonacoService.dispose();
}

// activate().run() — 3 guard points
const run = async () => {
  if (this._mountPromise) await this._mountPromise;
  if (this._destroyed) { return; }  // ← GUARD 1: sau await mount
  
  if (EditorModule) {
    EditorModule.bind();
    // ...
  }
  
  if (this._destroyed) return;  // ← GUARD 2: sau bind
  
  MonacoService.layout();
  // ... scroll restore ...
  
  if (!this._destroyed) {  // ← GUARD 3: trước focus
    MonacoService.focus();
  }
};
```

### Fix B — Synchronous `dispose()` ✅ APPLIED
**File:** `renderer/js/services/monaco-service.js`

```js
// BEFORE (gây lỗi):
requestAnimationFrame(() => {
  editorToDispose.dispose();
});

// AFTER (fixed):
// Synchronous — Monaco global registry cleared BEFORE new editor mounts
try {
  editorToDispose.dispose();
} catch (e) {
  if (e && e.message !== 'Canceled' && e.name !== 'Canceled') {
    console.warn('[MonacoService] Dispose error:', e);
  }
}
```

---

## ⚠️ Quyết định kiến trúc & Kỹ thuật

### Đã implement:
- **Synchronous dispose:** Loại bỏ `requestAnimationFrame`. Dùng `try/catch` để nuốt lỗi "Canceled". Listener `unhandledrejection` vẫn còn để catch delayed async errors từ Monaco internals.
- **`_destroyed` flag:** Instance guard đơn giản, không cần cancellation token phức tạp.

### Chưa implement (Fix C):
- **Task Queue cho `_isSyncing`:** Thay vì DROP call trong 400ms lock, lưu pending call và execute sau. Đây là improvement nhưng không phải root cause của typing block.

---

## 🐛 Bug đặc thù: "The Focus Ghost"
- **Triệu chứng:** Gõ chữ không hiện (onDidChangeContent silent), typing indicator hoạt động (onKeyDown fires). Sau khi switch window → quay lại: gõ bình thường.
- **Nguyên nhân tầng sâu:** Monaco's global focus registry bị xáo trộn khi old editor `dispose()` chạy (qua rAF ~16ms) AFTER new editor đã được focused. Monaco's `_focused` internal flag bị reset về `false` trên new editor.
- **Khác với "Ghost Model" (phiên 1):** "Ghost Model" là listener trên wrong model. "Focus Ghost" là Monaco không nhận input vì `_focused=false` dù textarea có DOM focus.

---

## 🔍 Phân tích Sâu (Phiên 3 — 2026-05-16)

### Clue mới quyết định (từ user test)

User xác nhận pattern cụ thể:

| Kịch bản | Typing |
|---|---|
| Reload → Draft 1 (empty) → type | ✅ Works |
| Draft 1 (có content) → tạo Draft 2 (empty) | ❌ Blocked |
| Draft 2 blocked → quay về Draft 1 | ✅ Works |
| Draft 1 → chuyển sang Draft 2 lại | ❌ Still blocked |
| Reload tại Draft 2 | ✅ Works |
| Draft 1/2 (có content) bất kỳ lúc nào | ✅ Works |

**Kết luận**: Bug chỉ xảy ra khi chuyển từ tab có content sang **empty draft**. Fresh reload ở empty draft luôn works.

### Root Cause 4 (NEW): Monaco `TextAreaHandler` không được warm up cho empty content

Sau fix B (synchronous dispose), timeline cho empty draft:

```
1. [SYNC] render():
   → dispose() old editor
   → new MarkdownEditor({ content: '' }) → mount() starts [ASYNC]
   → activate() → run() suspends at await _mountPromise

2. [SYNC] _proceedUpdateUI() tiếp tục:
   → loadRawContent() [SYNC cho draft — getDraftContent() = '']
   → returns IMMEDIATELY (no network, no delay)

3. [MICROTASK] mount() completes → _mountPromise resolves
4. [MICROTASK] run() resumes → bind() → setOriginalContent('') → focus()
```

**Điểm khác biệt với content tab**:
- Content tab: `loadRawContent()` có `await fetch(...)` (50-200ms). Trong thời gian đó, `run()` chạy xong, `focus()` được gọi. Sau đó `setOriginalContent(text)` → `model.setValue(text)` → `onDidChangeContent` fires → Monaco **warms up TextAreaHandler**.
- Empty draft: `loadRawContent()` sync, không có delay. **Không bao giờ có `model.setValue(text)` với non-empty content** → Monaco's `TextAreaHandler._textAreaState` không được sync → `onKeyDown` fires (DOM level) nhưng `onDidChangeContent` silent.

**Tại sao reload works**: Fresh page load, không có previous editor → Monaco khởi tạo từ đầu, `TextAreaHandler` sạch.

**Tại sao switch window → back works**: Window `focus` event → Monaco's `WindowInteractionService.onFocus()` → re-syncs `TextAreaState`.

---

## ✅ Fixes Đã Apply

### Fix A — `_destroyed` guard trong `activate()` ✅ APPLIED
*(xem phiên trước)*

### Fix B — Synchronous `dispose()` ✅ APPLIED
*(xem phiên trước)*

### Fix C — `requestAnimationFrame` trước `focus()` ✅ APPLIED (2026-05-16)
**File:** `renderer/js/components/organisms/markdown-viewer-component.js:1225`

```js
// BEFORE:
if (!this._destroyed) {
    MonacoService.focus();
    console.warn(`[DIAG][MarkdownEditor.activate] COMPLETE — MonacoService.focus() called`);
}

// AFTER:
if (!this._destroyed) {
    // rAF gives Monaco 1 layout frame to settle after dispose→create cycle.
    // Empty drafts have no model.setValue() call to warm up TextAreaHandler.
    requestAnimationFrame(() => {
        if (!this._destroyed && MonacoService.isInitialized()) {
            MonacoService.focus();
            console.warn(`[DIAG][MarkdownEditor.activate] COMPLETE — MonacoService.focus() called (rAF)`);
        }
    });
}
```

**Lint**: 0 errors, 0 warnings ✅
**Status**: **Chưa xác nhận** — cần user test.

---

---

## 🔬 Điều tra Song Song: "Draft Updated" bất thường (Phiên 3 — 2026-05-16)

### Phát hiện mới từ user
Khi chuyển tab giữa các draft, xuất hiện toast "Draft updated" dù user không thực hiện thao tác lưu thủ công. Đây là hiện tượng bất thường và có thể liên quan đến bug typing block.

### DIAG loggers đã cài (2026-05-16)

| Logger | File | Điểm cài |
|---|---|---|
| `[DIAG][EditorModule.save] CALLED` + caller stack | `editor.js:save()` | Entry point, với `new Error().stack` |
| `[DIAG][EditorModule.save] VALUES` | `editor.js:save()` | content.len vs originalContent.len |
| `[DIAG][loadFile] dirty-check` | `app.js:loadFile()` | Trước dirty check, log isDirty + values |
| `[DIAG][onModeChange] dirty-check` | `app.js:onModeChange()` | Trước dirty check |
| `[DIAG][updateUI] dirty-check` | `change-action-view-bar.js` | Trước dirty check |

### Kết quả phân tích log đầu tiên (Draft 1 only)

Log capture được Draft 1 creation + typing — sequence **hoàn toàn sạch**:
- `onModeChange dirty-check → isDirty=false` ✓
- `updateUI GUARD SET` → proceed ✓
- `mount` → `activate` → `bind` → tất cả listeners attached ✓
- `focus() called (rAF)` ✓
- User types: `onKeyDown` + `onContentChange` đều fire ✓ → **Draft 1 typing works với Fix C**

**Side observation**: `_isSyncing=undefined` trong 3 lần đầu gọi `updateUI`. Field chưa được khởi tạo tường minh trong constructor (`this._isSyncing = false` bị thiếu). Không gây bug hiện tại nhưng là code smell.

### Còn thiếu để trace "Draft updated"
Cần log từ kịch bản: **Draft 1 (có content) → Tạo Draft 2 (empty) → Switch về Draft 1**.

Dòng cần tìm trong log tiếp theo:
```
[DIAG][EditorModule.save] CALLED | targetFile="..." | caller=...
[DIAG][loadFile] dirty-check | isDirty=true | ...
```

Field `caller=` trong `[DIAG][EditorModule.save]` sẽ xác định đích xác hàm nào trigger save bất thường.

---

## 🔄 Trạng thái hiện tại (sau Phiên 3)
- Fix A + Fix B + Fix C đã apply, lint sạch.
- Fix C confirmed không break Draft 1 (typing works).
- **Chưa xác nhận** Fix C fix được Draft 2 empty typing block.
- **Bug mới phát hiện**: "Draft updated" toast xuất hiện bất thường khi switch tab — chưa xác định root cause, đang chờ log từ kịch bản đầy đủ.

---

## 🔍 Phân tích Sâu (Phiên 4 — 2026-05-16)

### Log Draft 2 — Smoking gun

Từ file `ConsoleLogger/DraftBug`, sequence đầy đủ Draft 1 → Draft 2:

```
Line 1433: EditorModule.save() caller=onModeChange:231   ← auto-save Draft 1 khi switch
Line 1445: onContentChange isDirty=false
           ← từ setOriginalContent('') → model.setValue('') trên OLD editor (Draft 1)
           ← TextAreaHandler của Draft 1 được warm up tại đây, KHÔNG phải Draft 2

Line 1518: MonacoService.mount mountID=2 | hasExistingEditor=false
Line 1560: EditorModule.bind (Draft 2) ← listeners attached OK
Line 1672: focus() called (rAF+layout) ← Fix C+D đã gọi
Line 1689: GUARD RESET (400ms)

Line 1701+: onKeyDown fires ✓
            onContentChange SILENT ✗ ← typing block
```

### Root Cause 5 (FINAL): Monaco auto-focus + no-op `focus()`

Monaco **auto-focuses textarea ngay khi mount** (`editor.create()` tự gọi `textarea.focus()` nội bộ). Vì vậy khi `activate().run()` gọi `MonacoService.focus()` → `textarea.focus()` trong rAF:

- **Textarea đã có DOM focus** → browser bỏ qua lệnh `focus()` → **không fire `focus` DOM event**
- `TextAreaHandler._onFocus()` không được gọi → `_setAndWriteTextAreaState()` không chạy
- Monaco's `_textAreaState` không được sync
- User gõ phím: Monaco nhận `keydown` (DOM level → `onKeyDown` fire ✓), nhưng `input` event được xử lý dựa trên diff giữa `_textAreaState` (stale) và textarea hiện tại → diff = 0 → không có TypeOperation → model không thay đổi → `onContentChange` SILENT ✗

**Tại sao Draft 1 (mountID=1) works:**
- Đây là lần đầu tiên editor được mount — browser context chưa có element nào focused trong Monaco
- `focus()` thực sự fire event → TextAreaHandler sync

**Tại sao "switch window → back" fix:**
- Browser force-fires `focus` event trên textarea **dù nó đã focused** — đây là browser behavior đặc biệt khi window regain focus

**Tại sao Fix C (layout + single rAF) không fix:**
- `layout()` không trigger TextAreaHandler sync
- `textarea.focus()` là no-op vì textarea already focused

**Tại sao Fix E (window.dispatchEvent FocusEvent) không fix:**
- Monaco listen `window focus` event ở runtime khác hoặc với listener type khác — synthetic `FocusEvent` không trigger đúng handler

### "Draft updated" toast — nguyên nhân

Là **expected behavior**: khi switch từ Draft 1 (isDirty=true) sang Draft 2, `onModeChange` tại `app.js:231` gọi `EditorModule.save()` auto-save Draft 1 trước khi switch. Toast "draft saved/updated" xuất hiện là từ save này — **không phải bug**.

---

## ✅ Fix F — blur + focus ✅ CONFIRMED FIXED

**File:** `renderer/js/components/organisms/markdown-viewer-component.js`

```js
// BEFORE (Fix C — insufficient):
requestAnimationFrame(() => {
  if (!this._destroyed && MonacoService.isInitialized()) {
    MonacoService.layout();
    MonacoService.focus(); // no-op if textarea already focused
  }
});

// AFTER (Fix F — WORKS):
requestAnimationFrame(() => {
  if (!this._destroyed && MonacoService.isInitialized()) {
    MonacoService.layout();
    // Blur first to ensure focus event fires even if textarea is already focused.
    // After dispose→create cycle Monaco auto-focuses the new textarea during mount,
    // so a plain focus() is a no-op (no DOM event → TextAreaHandler never syncs).
    const _domNode = MonacoService.getInstance()?.getDomNode();
    const _textarea = _domNode?.querySelector('textarea');
    if (_textarea) _textarea.blur();
    MonacoService.focus();
  }
});
```

**Test confirmed:** Draft 1 (type) → Draft 2 (empty) → gõ ngay: `onKeyDown` + `onContentChange` đều fire ✓

---

## 🧹 Cleanup: DIAG Loggers đã xóa

Tất cả console.warn `[DIAG]` đã được xóa khỏi:
- `renderer/js/modules/editor.js` — 8 loggers
- `renderer/js/core/app.js` — 5 loggers
- `renderer/js/components/organisms/change-action-view-bar.js` — 5 loggers
- `renderer/js/components/organisms/markdown-viewer-component.js` — 4 loggers
- `renderer/js/services/monaco-service.js` — 4 loggers

Lint: 0 errors, 0 warnings ✅

---

## ✅ Tổng kết toàn bộ Bug "The Focus Ghost"

| Fix | File | Vấn đề giải quyết | Status |
|-----|------|-------------------|--------|
| Fix A | markdown-viewer-component.js | `_destroyed` guard ngăn stale `run()` coroutine | ✅ Applied |
| Fix B | monaco-service.js | Synchronous dispose thay vì requestAnimationFrame | ✅ Applied |
| Fix C | markdown-viewer-component.js | rAF trước focus() để Monaco settle | ✅ Applied (không đủ) |
| Fix F | markdown-viewer-component.js | blur() trước focus() để force TextAreaHandler sync | ✅ Applied + CONFIRMED |

## 🔄 Session tiếp theo bắt đầu từ đây
- **Bug đã FIX HOÀN TOÀN** — không còn việc cần làm cho typing block
- **"Draft updated" toast** — đã xác nhận là expected behavior (auto-save khi switch tab), không phải bug
- **Side fix đã bỏ** — `this._isSyncing = false` trong constructor không cần thiết vì DIAG loggers đã xóa và `undefined` treated as falsy
