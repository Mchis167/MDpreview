# [Scroll Sync First-Load Fix] Session Log — 2026-05-16

## 🔗 Liên kết (Links)
- **Files chính**:
  - [monaco-sync-service.js](file:///Users/mchisdo/MDpreview/renderer/js/services/monaco-sync-service.js)
  - [monaco-service.js](file:///Users/mchisdo/MDpreview/renderer/js/services/monaco-service.js)
  - [markdown-viewer-component.js](file:///Users/mchisdo/MDpreview/renderer/js/components/organisms/markdown-viewer-component.js)
  - [scroll.js](file:///Users/mchisdo/MDpreview/renderer/js/utils/scroll.js)

---

## 📝 Tổng quan (Overview)

Khi switch Read → Edit mode **lần đầu tiên** sau khi load file, cursor đúng vị trí nhưng scrollbar Monaco không cuộn tới dòng đó. Lần thứ 2 trở đi thì đúng.

---

## ✅ Đã hoàn thành

- [Session này] Debug qua 5 vòng với ConsoleLogger để tìm root cause
- [Session này] Xác nhận `setValue()` không gây scroll thay đổi (scrollBefore=scrollAfter=0)
- [Session này] Thêm `[ScrollSpy] onDidScrollChange` để bắt tất cả Monaco scroll events
- [Session này] **Tìm và fix root cause**: `setSelection()` kích hoạt Monaco smooth scroll animation chạy async qua nhiều RAF frames, override `revealPositionInCenter`
- [Session này] Fix: thêm `ScrollType.Immediate` (=1) vào `revealPositionInCenter`
- [Session này] Dọn sạch tất cả debug logs (ScrollRestore, setValue, ScrollSpy, SyncCursor)
- [Session này] ✅ TASK HOÀN THÀNH — 23:59 2026-05-16

---

## ⚠️ Quyết định & Phát hiện quan trọng

### Root Cause: Monaco `setSelection()` + Smooth Scroll Animation

**Sequence thực tế khi Call 1 (activate) chạy:**

```
[ScrollSpy] 535 → 650 → 678 → 1842 → 2041   ← tất cả từ setSelection smooth scroll
[SyncCursor:S0] scrollAfter=535 (Call 1 capture sai lúc animation đang chạy)
[SyncCursor:S0] scrollBefore=2041 (Call 2 thấy animation đã kết thúc tại 2041)
[SyncCursor:S0] scrollAfter=2041 (Call 2's revealPositionInCenter là no-op vì Monaco cho rằng position đã visible)
```

**Tại sao `setSelection` gây scroll sai?**
- Khi `context.isRealSelection=true`, code gọi `monacoService.setSelection({start, end})` thay vì `setCursorPosition`
- Monaco's `setSelection` internally kích hoạt `revealRange(selectionEnd)` với smooth scroll
- Smooth scroll chạy qua nhiều RAF frames (535 → 650 → 678 → 1842 → 2041)
- `revealPositionInCenter(startPos)` của chúng ta fire TRƯỚC khi animation kết thúc → bị override

**Tại sao lần 2 trở đi đúng?**
- Monaco layout đã ổn định, `revealPositionInCenterIfOutsideViewport` (trước khi fix) hoặc scroll animation không còn conflict

### Fix Áp Dụng (ĐÃ CONFIRM WORK ✅)

**File: `monaco-sync-service.js` Stage 0, line ~52:**
```js
// Trước:
editor.revealPositionInCenter(startPos);
// Sau:
editor.revealPositionInCenter(startPos, 1); // ScrollType.Immediate = 1
```

**File: `monaco-service.js` `setCursorPosition()`:**
```js
// Trước:
_editor.revealPositionInCenter(pos);
// Sau:
_editor.revealPositionInCenter(pos, 1); // ScrollType.Immediate = 1
```

`ScrollType.Immediate` (giá trị `1`) **cancel toàn bộ queued smooth scroll animations** của Monaco và snap đồng bộ đến position. Không còn animation nào chạy async và override được.

### Các Fix Trước Đó (Context Đầy Đủ)

Fix này là phần cuối của chuỗi debug dài. Các fix trước:

1. **Skip `ScrollModule.restore()` khi có sync context** (`markdown-viewer-component.js`) — đúng nhưng không đủ
2. **Disconnect `_scrollObserver` trước syncCursor** — observer đã không tồn tại, không phải root cause
3. **`revealPositionInCenter` thay `revealPositionInCenterIfOutsideViewport`** — fix subsequent loads, không fix first load

---

## 🐛 Vấn đề đã gặp & cách giải quyết

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|------------|-----------|
| First-load scroll sai dù subsequent đúng | Monaco smooth scroll từ `setSelection` chạy async, override | `ScrollType.Immediate` để cancel animations |
| `setValue()` nghi ngờ gây scroll | Không — `scrollBefore=scrollAfter=0` | Loại trừ bằng debug log |
| `ScrollRestore` nghi ngờ gây scroll | Chỉ fire từ `loadFile` (app init), không fire trong mode switch | Loại trừ bằng `caller` debug |
| Call 2 (`focusWithContext`) luôn là no-op | Monaco tính position đã visible sau animation kết thúc | Fix Call 1 đủ để cả 2 đúng |

---

## 🔄 Trạng thái cuối session

✅ TASK HOÀN THÀNH — 23:59 2026-05-16

**Files đã thay đổi:**
- `renderer/js/services/monaco-sync-service.js` — `revealPositionInCenter(startPos, 1)`
- `renderer/js/services/monaco-service.js` — `revealPositionInCenter(pos, 1)` trong `setCursorPosition`
- `renderer/js/components/organisms/markdown-viewer-component.js` — skip restore + disconnect observer (fixes từ trước)
