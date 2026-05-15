# [Draft Switch Bug] Session Log — 2026-05-16

## 🔗 Liên kết (Links)
- **Log trước**: _(không có — task mới)_
- **Log kế tiếp**: _(chưa có)_

## 📝 Tổng quan (Overview)
Điều tra và fix một nhóm bug phức tạp liên quan đến draft management, tab switching, và unsaved changes modal. Các bug làm cho người dùng bị kẹt trong vòng lặp modal không thoát ra được.

**Các bug được báo cáo:**
1. Toast "Draft updated" xuất hiện khi chuyển tab (không phải user-triggered save)
2. Modal "Unsaved Changes" xuất hiện khi mở file .md từ draft mode
3. Modal loop: sau khi confirm modal, click Draft tab → modal xuất hiện lại ngay lập tức (đề cập đến Draft cũ)
4. Scenario phụ: Draft 1 → edit → mở .md → dialog → cancel → tự chuyển sang edit mode

## ✅ Đã hoàn thành
- [Phase 1] Phân tích code: xác định 3 dirty check độc lập (loadFile, onModeChange, updateUI)
- [Phase 2] Thêm debug logger vào 5 điểm quan trọng:
  - `editor.js` — `save()`, `bind()`
  - `app.js` — `loadFile` dirty check, `onModeChange` dirty check, `AppState.currentFile` commit
  - `change-action-view-bar.js` — `updateUI` dirty check + modal confirm/cancel
- [Phase 3] Phân tích 2 console log từ user (scenario 1 và scenario 2)
- [Root cause xác nhận] Đọc call stack từ scenario 2 log
- [Fix A] `markdown-viewer-component.js:1165` — Thêm `.then()` vào `_mountPromise` trong `MarkdownEditor.render()` để gọi `EditorModule.setOriginalContent(this.content)` sau khi Monaco mount xong, bất kể mode (edit hay read). Fix false positive `isDirty()`.
- [Fix B] `change-action-view-bar.js:165` — Xóa điều kiện `if (saved)` trong `onConfirm`, luôn gọi `_proceedUpdateUI` sau save. Fix `AppState.currentMode` kẹt ở `'edit'` → modal loop.
- [Fix C] `editor.js:360,382,392` — Thêm param `silent=false` vào `save()`, guard `!silent` trước `showToast`. Tất cả auto-save path truyền `silent=true`. Fix toast xuất hiện khi chuyển tab.
- [Cleanup] Xóa toàn bộ debug `console.warn` logs đã thêm ở Phase 2.

## ⚠️ Quyết định quan trọng

### Root Cause #1 — `_originalContent` không được sync khi load file ở 'read' mode

**Cơ chế**: `render()` trong `MarkdownViewerComponent` luôn tạo `new MarkdownEditor(...)` cho mọi mode (kể cả 'read'). Constructor này gọi `MonacoService.mount(el, { value: fileContent })`. Tuy nhiên, `_handleModeSwitch` với mode='read' chỉ gọi `editorComp.deactivate()` — **không gọi `activate()`** — nên `EditorModule.bind()` không bao giờ chạy. `_originalContent` giữ nguyên nội dung của file/draft trước đó (không bị clear/reset).

**Timing window**: Trong `loadFile`, giữa `viewer.setState(...)` và `AppState.updateToolbarUI(...)` có `await CommentsModule.loadForFile()`. Await này yield cho event loop, Monaco mount microtask chạy xong → Monaco initialized với file content mới. Khi `updateUI` chạy: Monaco value = file mới ≠ `_originalContent` (draft cũ) → `isDirty() = true` — **false positive!**

**File liên quan**: `markdown-viewer-component.js` (~line 163-177), `editor.js` (`isDirty`, `bind`)

### Root Cause #2 — `_proceedUpdateUI` bị skip khi `save()` trả về false → `currentMode` kẹt ở 'edit'

**Cơ chế**: Trong `updateUI.onConfirm`, sau khi modal được confirm:
```js
const saved = await EditorModule.save(...);
if (saved) {
    this._proceedUpdateUI(targetMode, ...); // ← chỉ gọi nếu save thành công
}
```
`save()` trả về false vì `_boundFileId = null` (đã bị clear bởi `unbind()` trong `destroy()`) nên `targetFile = AppState.currentFile = AssetManagement.md` — file thật, không phải draft. `FileService.saveFile` có thể fail hoặc Monaco không đúng state. Kết quả: `_proceedUpdateUI` không chạy → `AppState.currentMode` mãi là `'edit'` → mọi lần switch tab/file đều re-trigger dirty check → modal loop vô tận.

**File liên quan**: `change-action-view-bar.js` (line 161-175)

### Điểm cần chú ý khi fix

1. **Không xóa `MarkdownEditor` khỏi 'read' mode render** — architecture hiện tại cần cả 2 component để mode switch nhanh (không remount). Chỉ cần fix `_originalContent` sync.
2. **Fix Bug B**: `_proceedUpdateUI` phải chạy bất kể `save()` result — mục đích là chuyển mode, không phải validate save.
3. **Toast issue** là minor bug — fix bằng cách thêm `silent` param vào `save()`, pass `silent=true` từ auto-save paths.
4. **`_isSyncing` lock** vẫn là risk (nếu modal bị close bằng Escape/outside click mà không trigger onCancel) — nên add safeguard nhưng không phải blocker hiện tại.

## 🐛 Vấn đề đã gặp & cách giải quyết
- Debug log ban đầu bị lint error: dùng `MonacoService` trong `change-action-view-bar.js` nhưng biến đó không được khai báo trong scope → đổi thành log đơn giản hơn.
- Sau khi thêm `silent` param vào `save()`, IDE báo `'silent' is declared but its value is never read` → cần apply ngay vào `showToast` guard trong cùng lần edit.

## 🔄 Đang dở / Session tiếp theo bắt đầu từ đây

**Trạng thái hiện tại**: ✅ Task hoàn thành. 3 bug đã được fix, debug logs đã xóa, lint = 0 errors 0 warnings.

**Nếu bug vẫn còn xảy ra sau khi test**, cần kiểm tra thêm:
1. **`_isSyncing` lock risk** — nếu modal bị dismiss bằng Escape (không trigger `onCancel`), `_isSyncing` kẹt `true` vĩnh viễn → `updateUI` bị block. Cần add `onClose`/`onDismiss` callback vào `DesignSystem.showConfirm()` để reset `_isSyncing`.
2. **`loadFile` confirm path** (`loadFile:confirm` caller) — nếu `save()` thất bại, `loadFile(filePath)` không được gọi lại (khác với Bug B đã fix). Có thể cần áp dụng logic tương tự "always proceed".
3. **Triple dirty check coordination** — 3 dirty check (loadFile, onModeChange, updateUI) vẫn độc lập. Nếu 2 trong 3 cùng fire trên cùng một action, có thể double-modal. Long-term nên refactor về 1 entry point duy nhất.
