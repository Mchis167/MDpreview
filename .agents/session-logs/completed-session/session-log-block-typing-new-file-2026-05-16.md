# [Block Typing — New Empty File] Session Log — 2026-05-16

## 🔗 Liên kết (Links)
- **Log trước**: [session-log-editor-block-typing-debug-2026-05-15.md](completed-session/session-log-editor-block-typing-debug-2026-05-15.md)
- **Trạng thái**: ✅ HOÀN THÀNH

## 📝 Tổng quan (Overview)
Bug block typing xuất hiện trở lại với biểu hiện mới: chỉ xảy ra với **file mới tạo (rỗng)** khi chuyển sang edit mode. File có content hoạt động bình thường. Paste unblock được typing.

---

## 🔁 Pattern Tái Hiện

| Kịch bản | Kết quả |
|---|---|
| Load app → tạo file mới → edit → type | ❌ Blocked |
| File có content → edit → type | ✅ Works |
| File rỗng bị block → paste nội dung | ✅ Unblocked |
| File rỗng bị block → switch window & back | ✅ Unblocked |
| File rỗng bị block → mở file khác → quay lại | ❌ Still blocked |

---

## 🔍 Hành trình Chẩn Đoán

### Checkpoint 1 — Fix A + Fix B (session trước, không đủ)
- Fix A: Force `setValue()` trong `setOriginalContent()` → không fix
- Fix B: Guard trong `loadRawContent()` → không fix

### Checkpoint 2 — Xác nhận `input` event không fire
Spy tại textarea level: `[textarea-input]` và `[textarea-beforeinput]` không bao giờ xuất hiện dù `onKeyDown` Monaco vẫn fire bình thường.

### Checkpoint 3 — Loại trừ EditContext
`textarea.editContext` → `"null"` (browser support nhưng không attach). EditContext loại trừ.

### Checkpoint 4 — Window-level spy (smoking gun)
Chuyển spy lên `window` capture level (trước mọi handler của Monaco):
- **`[window-beforeinput]` không bao giờ fire** ← kết luận dứt khoát
- Browser thực sự không generate `beforeinput` — không phải Monaco chặn
- Xác nhận: vấn đề ở tầng browser/OS text input routing, không phải Monaco handler

### Checkpoint 5 — setTimeout delay test
- Thay `requestAnimationFrame` → `setTimeout(fn, 0)`: bug còn
- Thay → `setTimeout(fn, 150)`: **bug fix!**
- Xác nhận: timing issue với browser text input re-registration

---

## 🧠 Root Cause (Đã Xác Định)

**Browser deregisters the textarea from its text input routing** sau nhiều lần `setValue('')` được gọi liên tiếp trong quá trình init.

Cơ chế:
1. Monaco mount + nhiều `setValue('')` calls (model version lên đến 4)
2. Mỗi `setValue('')` có thể trigger Monaco's IME session end → gửi "blur" signal xuống OS text input manager
3. OS deregisters textarea khỏi text input pipeline
4. `editor.focus()` được gọi ngay trong `requestAnimationFrame` → DOM focus OK, nhưng OS registration vẫn chưa hoàn tất
5. User type → `keydown` fire (DOM event, không cần OS registration) → nhưng `beforeinput`/`input` không fire (cần OS registration)
6. Monaco's `_onType()` không bao giờ được trigger → model không thay đổi

**Tại sao paste works**: Clipboard API không đi qua OS text input pipeline.  
**Tại sao window blur+focus works**: OS refocus window → re-registers text input target đúng cách.  
**Tại sao file có content works**: `focusWithContext` gọi `editor.setPosition()` → Monaco internally calls `_textarea.setSelectionRange()` → browser re-engages text input pipeline.

---

## ✅ Fix Cuối Cùng

**File**: `renderer/js/components/organisms/markdown-viewer-component.js`

Thêm `setTimeout(..., 150)` với guard `getValue() === ''` trong `activate()`:

```js
// Warm up browser text input pipeline for empty models.
// After multiple setValue('') calls, Chrome deregisters the textarea from its
// text input routing — keydown fires but beforeinput/input never fire.
// A delayed blur→focus cycle re-registers it. Guard on empty model only:
// non-empty files use focusWithContext for cursor sync, and blur() would
// clobber the cursor position set by that path.
if (!this._destroyed) {
  setTimeout(() => {
    if (!this._destroyed && MonacoService.isInitialized()) {
      MonacoService.layout();
      const _inst = MonacoService.getInstance();
      if ((_inst?.getModel()?.getValue() ?? 'x') === '') {
        const _textarea = _inst?.getDomNode()?.querySelector('textarea');
        if (_textarea) _textarea.blur();
        MonacoService.focus();
      }
    }
  }, 150);
}
```

**Tại sao guard `getValue() === ''` quan trọng**:
- Empty model: blur+focus runs → typing fixed ✅
- Non-empty model (có cursor sync từ `focusWithContext`): blur+focus bị skip → cursor position không bị clobber ✅

---

## ⚠️ Conflict Đã Giải Quyết

Ban đầu `setTimeout(150)` phá hỏng cursor sync (bôi đen/ctx menu → Edit → jump vị trí). Nguyên nhân: `_textarea.blur()` fire **sau** khi `focusWithContext` đã set cursor position xong. Guard `getValue() === ''` giải quyết hoàn toàn conflict này.

---

## 📋 Files Đã Thay Đổi

| File | Thay đổi |
|---|---|
| `renderer/js/components/organisms/markdown-viewer-component.js` | Thêm `setTimeout(150)` với empty-model guard; xóa BugLogger debug code |
| `renderer/js/modules/editor.js` | Xóa BugLogger debug code; đơn giản lại `setOriginalContent()`, `bind()`, `onKeyDown` listener |

**Fix A và Fix B (từ session trước) được giữ lại** vì không gây hại:
- Fix A (`editor.js`): `setOriginalContent()` luôn gọi `setValue()` — không thay đổi
- Fix B (`change-action-view-bar.js`): Guard trong `loadRawContent()` — giảm số lần setValue không cần thiết, không thay đổi

---

## 🔄 Trạng thái cuối session

**TASK ĐÃ HOÀN THÀNH ✅**

- File mới rỗng → edit → type: ✅ works
- File có content → bôi đen/ctx menu → edit → jump cursor: ✅ không bị phá
- Tất cả BugLogger debug code đã được xóa
