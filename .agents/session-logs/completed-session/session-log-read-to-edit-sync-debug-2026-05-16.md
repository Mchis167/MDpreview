# [Read-to-Edit Sync Debug] Session Log — 2026-05-16

## 🔗 Liên kết (Links)
- **Task gốc**: [Broken Image Handling & Contextual Edit]
- **File liên quan chính**:
  - [markdown-viewer-component.js](file:///Users/mchisdo/MDpreview/renderer/js/components/organisms/markdown-viewer-component.js)
  - [change-action-view-bar.js](file:///Users/mchisdo/MDpreview/renderer/js/components/organisms/change-action-view-bar.js)
  - [monaco-sync-service.js](file:///Users/mchisdo/MDpreview/renderer/js/services/monaco-sync-service.js)

---

## 📝 Tổng quan (Overview)
Mục tiêu: Triển khai "Right-click to Edit" trong Read View — khi right-click vào nội dung/ảnh, switch sang Edit mode và scroll + đặt cursor đúng dòng Markdown tương ứng.

Các tính năng liên quan cần không bị hỏng:
- **Bôi đen → shortcut Edit**: đang hoạt động đúng (baseline)
- **Bôi đen → context menu Edit**: đang fail (đã fix)
- **Right-click element → Edit this section**: đang fail (đã fix)

---

## ✅ Đã hoàn thành

- [04:00] Triển khai broken image placeholder (`div.ds-broken-image-placeholder` + `data-line`)
- [04:05] Thêm "Edit this section" vào context menu của MarkdownViewer
- [04:08] `_switchToMode` gán `AppState.lastSyncContext = { line }` trước khi trigger mode switch
- [04:09] `MarkdownEditor.activate()` gọi `syncCursor` khi phát hiện `lastSyncContext`
- [Session này] **Tìm ra root cause thật sự và fix thành công** (xem chi tiết bên dưới)

---

## ⚠️ Quyết định & Phát hiện quan trọng

### Root Cause thật sự: `lastSyncContext` bị ghi đè **3 lần** trong cùng 1 call chain

Dùng DIAG loggers, phát hiện rằng vấn đề **không phải race condition rAF** mà là context bị ghi đè theo thứ tự:

```
1. _switchToMode('edit', {line:25})
   → AppState.lastSyncContext = {line:25}              ✅ đúng

2. updateUI() → syncData = captureReadViewSyncData()
   → syncData = {srcStart:58, line:5}                  ← auto-capture viewport center (SAI)

3. _proceedUpdateUI() line 252 (CŨ):
   → AppState.lastSyncContext = syncData               ← GHI ĐÈ lần 1

4. viewerComp.setState({mode:'edit'})
   → setState() line 72: _captureSyncContext()         ← GHI ĐÈ lần 2!
   → AppState.lastSyncContext = captureReadViewSyncData()

5. activate() đọc lastSyncContext = {srcStart:58}      ← SAI
   → xóa lastSyncContext = null

6. focusWithContext(syncData) = {srcStart:58}          ← SAI lần 3
```

**Tại sao shortcut (Case 2) hoạt động đúng:**
- Không có `_switchToMode` set context trước → `lastSyncContext = null` ban đầu
- `syncData = captureReadViewSyncData()` = **bôi đen selection** (vì selection còn active lúc shortcut) → đây chính là context đúng
- Không có gì bị ghi đè vì `syncData` IS the correct context

### Fix áp dụng (2 file, 2 thay đổi — ĐÃ CONFIRM WORK ✅)

**Fix 1 — `markdown-viewer-component.js:309` — `_captureSyncContext()`:**
```js
// Trước:
if (window.SyncService) {
  window.AppState.lastSyncContext = SyncService.captureReadViewSyncData();
}
// Sau:
if (window.SyncService && !window.AppState.lastSyncContext) {
  window.AppState.lastSyncContext = SyncService.captureReadViewSyncData();
}
```
Không auto-capture nếu đã có explicit context từ `_switchToMode`.

**Fix 2 — `change-action-view-bar.js:249` — `_proceedUpdateUI` edit branch:**
```js
// Resolve effective context TRƯỚC setState() → tránh bị _captureSyncContext() ghi đè
// Dùng local variable _activeCtx xuyên suốt → tránh bị ảnh hưởng khi activate() xóa AppState.lastSyncContext
const _activeCtx = AppState.lastSyncContext || syncData;
if (_activeCtx) AppState.lastSyncContext = _activeCtx;

viewerComp.setState({ mode: 'edit', file: AppState.currentFile });
await this.loadRawContent();
if (typeof EditorModule !== 'undefined' && _activeCtx) {
  EditorModule.focusWithContext({ ..._activeCtx, _fileKey: ... });
}
```

### Các fix đã thử nhưng sai hướng (đừng lặp lại)
- **Di chuyển syncCursor vào trong rAF-B**: Sai — phá hỏng bôi đen shortcut vì thay đổi timing blur/focus Monaco
- **Nested rAF wrapper (3 frame)**: Sai — root cause không phải timing rAF
- **Fix 3 ban đầu trong `_proceedUpdateUI` mà không fix `_captureSyncContext`**: Không đủ — `setState()` vẫn gọi `_captureSyncContext()` và ghi đè sau

---

## 🐛 Vấn đề đã gặp & cách giải quyết

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|------------|-----------|
| Context sai khi right-click / bôi đen + CTX | `_captureSyncContext()` được gọi trong `setState()` SAU khi `_proceedUpdateUI` đã set đúng | Guard `!AppState.lastSyncContext` trong `_captureSyncContext()` + resolve `_activeCtx` local trước `setState()` |
| Các fix rAF làm hỏng shortcut path | Shortcut path dùng `srcStart` (Stage 0) — thứ tự blur/focus khác | Không thay đổi rAF order, fix ở layer data thay vì layer timing |
| `focusWithContext` dùng context sai sau khi `activate()` xóa `lastSyncContext` | `activate()` clear `AppState.lastSyncContext` trước khi `focusWithContext` chạy | Dùng local variable `_activeCtx` thay vì đọc lại `AppState.lastSyncContext` |

---

## 🔄 Trạng thái cuối session

**TASK ĐÃ HOÀN THÀNH ✅**

Tất cả 3 case đã hoạt động đúng:
- Case 1: Bôi đen + context menu → Edit → jump đúng vị trí ✅
- Case 2: Bôi đen + shortcut → Edit → jump đúng vị trí ✅ (baseline, không bị phá)
- Case 3: Right-click element → "Edit this section" → jump đúng dòng ✅
- **Cải tiến mới**: Fix triệt để nhảy dòng trong khối nhiều ảnh liên tiếp (Granular Inline Metadata) ✅

**Files đã thay đổi (cần commit):**
- `renderer/js/components/organisms/markdown-viewer-component.js` — guard trong `_captureSyncContext()`
- `renderer/js/components/organisms/change-action-view-bar.js` — `_activeCtx` local variable pattern
- `server/routes/render.js` — gắn `data-line` cho từng thành phần inline (precised jump)

---

### 🚀 Cập nhật bổ sung: Granular Inline Metadata

**Vấn đề:** Khi có nhiều ảnh (hoặc link) nằm trong cùng một paragraph, chuột phải vào bất kỳ thành phần nào cũng nhảy về dòng của ảnh đầu tiên do metadata chỉ được gắn ở cấp Block/Paragraph.

**Giải pháp:**
Gắn `data-line` cho **từng thẻ con** bên trong `renderInlineTokens`.
- Sử dụng running counter `currentLine` trong renderer để tính toán số dòng chính xác cho mỗi token dựa trên char offset trong `originalSource`.
- Điều này giúp lệnh `closest('[data-line]')` trong JS đạt độ chính xác tới từng từ/ảnh.

**Bước tiếp theo**: `/changelog` + `/github` để commit và release nếu muốn.
