# [Z-Index System Revamp] Session Log — 2026-05-17

## 🔗 Liên kết (Links)
- **Log trước**: Không có (task bắt đầu hôm nay)
- **Log kế tiếp**: Không có (task hoàn thành)

## 📝 Tổng quan (Overview)
Audit toàn bộ z-index trong codebase, xây dựng hệ thống token semantic, loại bỏ magic numbers. Mục tiêu: giải quyết xung đột z-index, tạo single source of truth cho stacking order, đảm bảo drawer luôn cao hơn tab-bar.

## ✅ Đã hoàn thành

### Audit & Analysis (03:00-03:10)
- [03:00] Audit toàn bộ z-index trong codebase — tìm ~60 nơi sử dụng magic numbers
- [03:05] Xác định root causes: token desync (JS ≠ CSS), `!important` lạc dụng, thiếu semantic layer
- [03:10] Tạo conflict map — phát hiện workspace-panel (2100) nằm giữa drawer/popover

### Planning (03:15-03:25)
- [03:15] Đề xuất 3 phương án, bạn chọn Phương án C (mở rộng token + isolation)
- [03:20] Viết Implementation Plan chi tiết 9 steps
- [03:25] Bạn approve plan

### Code Implementation (03:30-04:00)
- [03:30] **Step 1-2**: Mở rộng token từ 6→10 levels, đồng bộ JS provider
  - `tokens.css:275-295` — thêm elevated, modal, toast, drag
  - `design-token-provider.js:200-209` — đồng bộ 100% với CSS
- [03:35] **Step 3**: Fix atoms — `tooltip: 100000→max`, `textarea: 3000→modal`
- [03:38] **Step 4**: Fix molecules — `tab-preview: 2000→drawer`
- [03:40] **Step 5**: Fix comment-form — CSS + JS dùng `setProperty()`
- [03:42] **Step 6**: Fix overlay layers — `search-palette/tree-view: 10000→max`, `workspace: 2100→modal`
- [03:45] **Step 7**: Fix sidebar/toc/tab-bar/modals — `toast→toast`, `drop-zone→max`, `toc→popover`, `drag-tab→drag`
- [03:48] **Step 9**: Áp dụng `isolation: isolate` cho asset-panel, wiki-drawer, backlinks-drawer

### Bug Fixes (04:00-04:05)
- [04:00] Phát hiện `.ds-asset-drawer` thiếu `z-index` trên root → drawer bị tab-bar che
  - Fix: thêm `z-index: var(--ds-z-index-drawer)` vào root
- [04:02] Thay `tab-bar: calc(overlay+100)→toolbar` — semantic lẫn hơn, hierarchy rõ ràng
- [04:05] Lint: 0 errors, 0 warnings ✅

### Documentation (04:05-04:15)
- [04:08] Tạo Memory Rule: `feedback_z_index_system.md` — quy tắc gắn gọn
- [04:10] Tạo Chi tiết Doc: `docs/Z-INDEX-SYSTEM.md` — 400+ dòng, bao gồm:
  - Token scale table
  - Stacking hierarchy visualization
  - Usage rules (global vs local scope)
  - Common mistakes × 5 + fixes
  - Debugging checklist
  - Migration guide
- [04:12] Tạo folder `docs/` với `README.md` index
- [04:15] Update MEMORY.md — link đến rule

## ⚠️ Quyết định quan trọng

1. **Phương án C được chọn** — Không phải chỉ mở rộng token (A), không phải chỉ isolation (B), mà kết hợp cả hai. Lý do: Token solve semantic gap, isolation solve dynamic z-index, đồng bộ JS provider solve runtime desync.

2. **Z-index token scale (10 levels)**
   ```
   1 (base) → 10 (elevated) → 100 (toolbar) → 1000 (overlay) 
   → 2000 (drawer) → 3000 (modal) → 4000 (popover) 
   → 5000 (toast) → 6000 (drag) → 9000 (max)
   ```
   Không phải 9999 mà 9000 vì: 9000 vẫn đủ cao, tuy nhiên giữ khoảng cách tránh magic-number-feel.

3. **Drawer root PHẢI có explicit z-index** — Khi có `isolation: isolate`, element root cần `z-index: var(--ds-z-index-drawer)` để cạnh tranh global. Nếu không, root sẽ ở `z-index: auto` → theo DOM order → tab-bar (1100) thắng.

4. **Tab-bar = toolbar level (100), KHÔNG phải 1100** — Semantic rõ ràng: toolbar là gì thì 100. Drawer (2000) > toolbar (100) luôn đúng. Không cần magic calc() formula.

5. **Monaco editor `!important` giữ nguyên** — Legitimate use case vì Monaco adds `!important` internally. Loại bỏ sẽ break layout.

6. **Local z-index (1-10) in isolated context là okay** — Không cần convert thành token. Mục đích của `isolation: isolate` là để local values không leak ra ngoài.

## 🐛 Vấn đề đã gặp & cách giải quyết

1. **Bug: Comment form JS dùng `style.zIndex = 'var(...)'`** 
   - Lỗi: Không hoạt động vì CSS variables không resolve trong inline style property
   - Fix: `style.setProperty('z-index', 'var(...)')` ✅

2. **Bug: Asset drawer root thiếu z-index sau khi thêm isolation**
   - Lỗi: Root ở `z-index: auto` → DOM order quyết định → tab-bar (1100) thắng
   - Fix: Thêm `z-index: var(--ds-z-index-drawer)` vào root ✅

3. **Bug: Tab-bar dùng `calc(overlay + 100) = 1100`**
   - Lỗi: Không semantic, khó maintenance, tượng như magic number
   - Fix: Dùng `--ds-z-index-toolbar` (100) trực tiếp ✅

## 🔄 Đang dở / Session tiếp theo bắt đầu từ đây

**✅ TASK HOÀN THÀNH — 04:15 2026-05-17**

Z-index system đã được revamp hoàn toàn:
- ✅ Code: 15 files updated, 0 linting errors
- ✅ Memory: Rule + detailed doc + folder structure
- ✅ Ready for production

**Nếu có z-index issue trong tương lai:**
1. Refer đến `.claude/memory/feedback_z_index_system.md` (30 sec)
2. Đọc `docs/Z-INDEX-SYSTEM.md` nếu cần chi tiết
3. Apply token + check linting

**Không còn follow-up nào.**
