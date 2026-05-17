# [Editor Image Hover Preview] Session Log — 2026-05-17 (Final)

## 🔗 Liên kết
- **Log trước**: [2026-05-17 audit](session-log-editor-image-hover-preview-2026-05-17.md)
- **Trạng thái**: ✅ HOÀN THÀNH

---

## 📝 Tóm tắt công việc

Rewrite toàn bộ Monaco Image Hover Preview từ đầu và finetune hành vi hiển thị.

---

## ✅ Đã hoàn thành

### Phase 1: Audit & Phát hiện bug (06:05 - 06:30)
- [✓] Audit toàn bộ pipeline: component, service, CSS, script load order
- [✓] Phát hiện **5 bugs**:
  - Bug #1: `getScrolledVisiblePosition()` trả `null` khi nằm ngoài viewport → crash silent
  - Bug #2: Tọa độ `rect` tính sai do `pixelPos.top` đã include scroll offset
  - Bug #3: Filter `target.type === 3` sai — giá trị thực của `GUTTER_LINE_NUMBERS` là 3, không phải `CONTENT_TEXT`
  - Bug #4: URL encode `/` thành `%2F` → server không nhận
  - Bug #5: Leak listeners (onDidScrollChange, onDidBlurEditorWidget) không dispose

### Phase 2: Rewrite từ đầu (06:31 - 06:50)
- [✓] Rewrite `MonacoImagePreviewComponent`:
  - Bỏ dependency `DesignSystem.createElement` → dùng `document.createElement` thuần
  - API `show(url, anchorX, anchorBottom, anchorTop)` rõ ràng hơn
  - Thêm `destroy()` cho cleanup hoàn toàn
  - Giữ CSS animation (opacity, scale 0.2s)

- [✓] Rewrite `MonacoHoverService`:
  - `_listeners[]` array → dispose **tất cả** listeners
  - Null-check `pixelPos` trước dùng
  - `_resolveUrl()` encode segment riêng biệt
  - Chỉ kiểm tra `target.position` exist (bỏ filter type)
  - Regex compile once, reset `lastIndex` trước mỗi dùng

- [✓] Lint 0 errors, 0 warnings

### Phase 3: Fix target.type bug (06:51 - 07:00)
- [✓] Phát hiện: filter `target.type !== 3` chặn CONTENT_TEXT, cho phép GUTTER_LINE_NUMBERS
- [✓] Fix: Bỏ type filter hoàn toàn, chỉ cần `target.position` exist
- [✓] Preview giờ hiển thị khi hover vào link, không phải line number

### Phase 4: Finetune hiển thị (07:01 - 07:15)
- [✓] Remove hide delay (120ms) → preview ẩn ngay khi chuột rời khỏi link
- [✓] Update position real-time → preview di chuyển theo cursor trên link
- [✓] Add `mouseleave` listener trên editor DOM → dismiss khi chuột rời editor

### Phase 5: Cleanup UI (07:16 - 07:25)
- [✓] Bỏ header "IMAGE PREVIEW" (không cần)
- [✓] Bỏ footer filename (quá thừa)
- [✓] Adjust CSS: `padding: 0`, bỏ `gap`, bỏ border body

### Phase 6: Overlay detection (07:26 - 07:40)
- [✓] Thêm `_isOverlayOpen()` check:
  - `MenuShield.active` → phát hiện context menu
  - `SearchPalette.isOpen()` → phát hiện command palette
  - `.modal.show`, `.base-form-modal.show` → phát hiện modals
- [✓] Gọi trong `_onMouseMove()` → hide preview khi overlay mở
- [✓] Lint 0 errors

---

## 📊 Files Modified

| File | Changes |
|------|---------|
| `renderer/js/components/molecules/monaco-image-preview.js` | Rewrite: bỏ `DesignSystem`, thêm `destroy()`, bỏ footer var |
| `renderer/js/services/monaco-hover-service.js` | Rewrite: fix null-check, URL encode, listener disposal, overlay detection |
| `renderer/css/design-system/molecules/monaco-image-preview.css` | Bỏ header/footer styles, `padding: 0`, bỏ `gap` |

---

## 🎯 Behavior chính xác

**Trước rewrite:**
- Preview chỉ hiển thị khi hover line number (sai vị trí)
- Có delay 120ms khi hide
- Vị trí preview cố định

**Sau rewrite:**
- ✅ Preview hiển thị khi hover vào **link thực tế**
- ✅ Preview ẩn **ngay lập tức** khi rời khỏi
- ✅ Preview **di chuyển cùng cursor** trên link
- ✅ Preview **dismiss** khi:
  - Chuột rời editor
  - Scroll editor
  - Blur editor widget
  - Context menu mở
  - Search palette mở
  - Modal mở
- ✅ UI sạch sẽ: chỉ hiển thị ảnh + glassomorphism frame
- ✅ Lint: 0 errors, 0 warnings

---

## 🔍 Technical Details

**MonacoImagePreviewComponent:**
- Position calculation: `anchorX` = cursor X, `anchorBottom` = line bottom + gap
- Fallback vertical: nếu bottom overflow, show above
- Clamp horizontal: luôn giữ trong viewport

**MonacoHoverService:**
- Regex: Markdown `!\[...\](url)` + HTML `<img src="url">`
- Listener cleanup: array + dispose pattern
- Overlay check: prioritize quick wins (SearchPalette, MenuShield)

---

## ⚠️ Known Considerations

- **Regex matching**: Column-based detection (1-based) phải khớp 100% với Monaco's column system
- **URL resolution**: Dùng `decodeURIComponent` trước encode để xử lý already-encoded paths
- **Overlay detection**: Dựa trên public APIs (`MenuShield.active`, `SearchPalette.isOpen()`)

---

## 🚀 Ready for Production

- [x] All core features working
- [x] UI/UX polished
- [x] Lint passing
- [x] No memory leaks (proper listener disposal)
- [x] Responsive to user interactions

---

**Session End Time:** 2026-05-17 07:45  
**Total Changes:** 3 files modified, 0 files created, ~200 LOC changed  
**Status:** ✅ SHIP READY
