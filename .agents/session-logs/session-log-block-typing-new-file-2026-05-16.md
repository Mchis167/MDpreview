# [Block Typing — New Empty File] Session Log — 2026-05-16

## 🔗 Liên kết (Links)
- **Log trước**: [session-log-editor-block-typing-debug-2026-05-15.md](completed-session/session-log-editor-block-typing-debug-2026-05-15.md)
- **Log kế tiếp**: (Đang tiếp tục)

## 📝 Tổng quan (Overview)
Bug block typing xuất hiện trở lại với biểu hiện mới, khác với lần trước.
Lần này bug chỉ xảy ra với **file mới tạo (rỗng)** khi chuyển sang edit mode.

## 🔁 Pattern Tái Hiện (Stable Repro)

| Kịch bản | Kết quả |
|---|---|
| Load app → tạo file mới → edit → type | ❌ Blocked |
| File có content → edit → type | ✅ Works |
| File rỗng bị block → paste nội dung | ✅ Unblocked |
| File rỗng bị block → switch window & back | ✅ Unblocked |
| File rỗng bị block → mở file khác → quay lại | ❌ Still blocked |

**Điểm khác biệt với bug cũ**: Bug cũ xảy ra khi switching giữa nhiều tabs nhanh. Bug mới này xảy ra **ngay lần đầu tiên** mở file mới rỗng.

---

## 🔍 Phân tích & Logging

### BugLogger được thêm vào:
- `editor.js` → `bind()`, `setOriginalContent()`, `onContentChange listener`
- `markdown-viewer-component.js` → `activate()` rAF sequence

### Log Pattern (file rỗng — bug):
```
[setOriginalContent] called {textLen:0} ← from markdown-viewer-component.js:1222
[setOriginalContent] → calling setValue()
[setOriginalContent] → setValue() returned   (NO onContentChange here)

[setOriginalContent] called {textLen:0} ← from change-action-view-bar.js:263
[setOriginalContent] → calling setValue()
[setOriginalContent] → setValue() returned   (NO onContentChange)

[bind] START {fileId:'untitled.md', isNewFile:true, _originalContent:'""'}
[bind] SYNC CHECK {_originalContent:'""', editorValue:'""'}
[bind] → _originalContent empty, taking from Monaco
[bind] attaching listeners

[setOriginalContent] called {textLen:0} ← from markdown-viewer-component.js:1242
[setOriginalContent] → calling setValue()
[onContentChange] FIRED   ← listener attached → fires

[activate] scheduling rAF focus
[activate] rAF fired {_destroyed:undefined, isInitialized:true}
[activate] blur→focus {textareaFound:true, hasDocumentFocus:true}
[activate] focus() called                     ← FOCUS ESTABLISHED

[setOriginalContent] called {textLen:0} ← from change-action-view-bar.js:183  ← ⚠️ THỦ PHẠM
[setOriginalContent] → calling setValue()
[onContentChange] FIRED                       ← TextAreaHandler bị RESET sau focus
[setOriginalContent] → setValue() returned
```
**Sau đó: gõ phím → không có onContentChange FIRED nào!**

### Log Pattern (file có content — works):
- Tương tự nhưng lần thứ 4 là `setValue('44 chars')` → setValue(non-empty) sau focus → WORKS
- `onContentChange` vẫn fire khi user gõ ✅

---

## 🧠 Root Cause

**`setValue('')` gọi trên Monaco đang focused với model đã rỗng → TextAreaHandler desync.**

Timeline:
1. `activate()` rAF → `blur()` → `focus()` → `_focused = true`, TextAreaState synced ✓
2. 5ms sau: `_proceedUpdateUI()` → `loadRawContent()` → `setOriginalContent('')` → `setValue('')`
3. Monaco fires `onDidChangeContent` cho no-op change ('' → '')
4. `TextAreaHandler._onModelChanged()` chạy → reset `_textAreaState` cho empty model
5. Sau reset: textarea DOM và `_textAreaState` desync theo một cách đặc biệt với empty model
6. User gõ → `onKeyDown` fires (DOM level) ✅ nhưng `onDidChangeContent` silent ❌

**Tại sao `setValue('content')` sau focus WORKS**: Là actual change ('' → 'content') → TextAreaHandler sync đúng.
**Tại sao `setValue('')` sau focus FAILS**: No-op change → Monaco fire event nhưng TextAreaHandler reset sai cho empty model.

**Caller của lần thứ 4:**
- `change-action-view-bar.js:183` → `_proceedUpdateUI()` → `loadRawContent()` → `EditorModule.setOriginalContent(content)`

---

## 🔧 Fixes Đã Thử

### Fix A — Force `setValue()` cho mọi `setOriginalContent()` call (Option 1) ✅ APPLIED, ❌ INSUFFICIENT
**File:** `editor.js:setOriginalContent()`

Bỏ guard `getValue() !== text` → luôn gọi `setValue()`. TextAreaHandler được warm up khi init, nhưng lần thứ 4 vẫn xảy ra và reset TextAreaHandler sau focus.

### Fix B — Guard trong `loadRawContent()` ✅ APPLIED, 🔄 TESTING
**File:** `change-action-view-bar.js:loadRawContent()`

Skip `setOriginalContent()` call nếu Monaco đã có cùng content:
```js
if (!MonacoService.isInitialized() || MonacoService.getValue() !== content) {
  EditorModule.setOriginalContent(content);
}
```

**Kỳ vọng**: Lần thứ 4 không còn gọi `setValue('')` sau focus. Tuy nhiên, `activate() focus()` vẫn bị stuck → cần investigate thêm.

---

## ⚠️ Trạng thái Hiện Tại

- Fix B đã apply nhưng **vẫn còn bị stuck sau focus()**
- Log dừng tại: `[activate] focus() called` — không có onContentChange nào khi gõ sau đó
- Cần điều tra: liệu focus() có thực sự establish đúng không, hay có event nào khác làm desync

## 📋 Next Steps
1. Log thêm sau `focus()`: kiểm tra `_focused` state của Monaco internal
2. Xem xét dùng `editor.trigger('', 'type', {text: ''})` để force TextAreaHandler sync
3. Hoặc: dispatch `window.focus` event để trigger Monaco's `WindowInteractionService`
4. Investigate nếu `experimentalEditContextEnabled: false` cần thêm workaround cho Electron
